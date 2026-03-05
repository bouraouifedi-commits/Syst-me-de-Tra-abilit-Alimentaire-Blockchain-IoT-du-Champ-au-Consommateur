// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ChahiaTraceability {
    // Roles (V1)
    enum Role { NONE, PRODUCER, PROCESSOR, TRANSPORTER, DISTRIBUTOR, ORACLE }

    // Lot lifecycle statuses
    enum Status { CREATED, PROCESSED, IN_TRANSIT, DELIVERED, FOR_SALE, SOLD }

    struct TraceEvent {
        uint256 timestamp;
        address actor;
        Status status;
        string note;     // ex: "Abattage + emballage"
        string ipfsCid;  // CID d'un certificat ("" si vide)
    }

    struct Lot {
        string lotId;
        string productName;
        address owner;          // acteur actuellement responsable
        Status status;          // statut actuel
        string[] documents;     // liste des CIDs IPFS
        TraceEvent[] history;   // historique complet
        bool exists;
    }



    // ---- IoT telemetry (Temp/Humidity) ----
    struct SensorReading {
        uint256 timestamp;   // unix seconds
        int16 tempX10;       // temperature * 10
        uint16 humX10;       // humidity * 10
        bytes32 dataHash;    // keccak256 hash of off-chain JSON (Mongo/ThingSpeak snapshot)
    }

    // lotId => telemetry readings
    mapping(string => SensorReading[]) private telemetryByLot;

    event TelemetryAdded(
        string indexed lotId,
        uint256 timestamp,
        int16 tempX10,
        uint16 humX10,
        bytes32 dataHash,
        address indexed actor
    );

    // role by address
    mapping(address => Role) public roles;

    // lots storage
    mapping(string => Lot) private lots;

    // Explorer events
    event RoleGranted(address indexed user, Role role);
    event LotCreated(string indexed lotId, string productName, address indexed owner);
    event LotUpdated(string indexed lotId, Status status, address indexed actor, string note, string ipfsCid);
    event DocumentAdded(string indexed lotId, string ipfsCid, address indexed actor);

    modifier onlyRole(Role r) {
        require(roles[msg.sender] == r, "Not authorized");
        _;
    }

    modifier lotExists(string memory lotId) {
        require(lots[lotId].exists, "Lot not found");
        _;
    }

    constructor() {
        // Simple admin V1: deployer is PRODUCER
        roles[msg.sender] = Role.PRODUCER;
        emit RoleGranted(msg.sender, Role.PRODUCER);
    }

    // Admin simple (V1)
    function grantRole(address user, Role role) external onlyRole(Role.PRODUCER) {
        require(user != address(0), "Bad user");
        roles[user] = role;
        emit RoleGranted(user, role);
    }

    // ---- Core ----

    // 1) Create a lot (Producer)
    function createLot(
        string calldata lotId,
        string calldata productName,
        string calldata note
    )
        external
        onlyRole(Role.PRODUCER)
    {
        require(bytes(lotId).length > 0, "Empty lotId");
        require(bytes(productName).length > 0, "Empty productName");
        require(!lots[lotId].exists, "Lot already exists");

        Lot storage L = lots[lotId];
        L.lotId = lotId;
        L.productName = productName;
        L.owner = msg.sender;
        L.status = Status.CREATED;
        L.exists = true;

        L.history.push(TraceEvent(block.timestamp, msg.sender, Status.CREATED, note, ""));

        emit LotCreated(lotId, productName, msg.sender);
        emit LotUpdated(lotId, Status.CREATED, msg.sender, note, "");
    }

    // 2) Add IPFS document CID (Owner or any registered role)
    function addDocument(
        string calldata lotId,
        string calldata cid
    )
        external
        lotExists(lotId)
    {
        require(bytes(cid).length > 0, "Empty CID");
        require(
            msg.sender == lots[lotId].owner || roles[msg.sender] != Role.NONE,
            "Not allowed"
        );

        lots[lotId].documents.push(cid);
        emit DocumentAdded(lotId, cid, msg.sender);
    }

    // 3) Update status (with simple V1 rules + enforced progression)
    function updateStatus(
        string calldata lotId,
        Status newStatus,
        string calldata note,
        string calldata cid
    )
        external
        lotExists(lotId)
    {
        Lot storage L = lots[lotId];

        // Enforce logical forward progression: newStatus must be next step (or same step if you want)
        require(uint8(newStatus) == uint8(L.status) + 1, "Invalid transition");

        // Role rules by target status
        if (newStatus == Status.PROCESSED) require(roles[msg.sender] == Role.PROCESSOR, "Need PROCESSOR");
        if (newStatus == Status.IN_TRANSIT) require(roles[msg.sender] == Role.TRANSPORTER, "Need TRANSPORTER");
        if (newStatus == Status.DELIVERED || newStatus == Status.FOR_SALE || newStatus == Status.SOLD)
            require(roles[msg.sender] == Role.DISTRIBUTOR, "Need DISTRIBUTOR");

        // Update status and current responsible owner
        L.status = newStatus;
        L.owner = msg.sender;

        // Store history event
        L.history.push(TraceEvent(block.timestamp, msg.sender, newStatus, note, cid));
        emit LotUpdated(lotId, newStatus, msg.sender, note, cid);

        // If CID provided, also store it
        if (bytes(cid).length > 0) {
            L.documents.push(cid);
            emit DocumentAdded(lotId, cid, msg.sender);
        }
    }


    // ---- Telemetry write (Oracle) ----
    function addTelemetry(
        string calldata lotId,
        uint256 timestamp,
        int16 tempX10,
        uint16 humX10,
        bytes32 dataHash
    )
        external
        onlyRole(Role.ORACLE)
        lotExists(lotId)
    {
        telemetryByLot[lotId].push(SensorReading(timestamp, tempX10, humX10, dataHash));
        emit TelemetryAdded(lotId, timestamp, tempX10, humX10, dataHash, msg.sender);
    }

    // ---- Telemetry read ----
    function getTelemetryLength(string calldata lotId)
        external
        view
        lotExists(lotId)
        returns (uint256)
    {
        return telemetryByLot[lotId].length;
    }

    function getTelemetryByIndex(string calldata lotId, uint256 index)
        external
        view
        lotExists(lotId)
        returns (uint256 timestamp, int16 tempX10, uint16 humX10, bytes32 dataHash)
    {
        require(index < telemetryByLot[lotId].length, "Telemetry index out of range");
        SensorReading storage r = telemetryByLot[lotId][index];
        return (r.timestamp, r.tempX10, r.humX10, r.dataHash);
    }

    function getLatestTelemetry(string calldata lotId)
        external
        view
        lotExists(lotId)
        returns (bool exists, uint256 timestamp, int16 tempX10, uint16 humX10, bytes32 dataHash)
    {
        uint256 n = telemetryByLot[lotId].length;
        if (n == 0) return (false, 0, 0, 0, bytes32(0));
        SensorReading storage r = telemetryByLot[lotId][n - 1];
        return (true, r.timestamp, r.tempX10, r.humX10, r.dataHash);
    }

    // ---- Read helpers ----

    function getLot(
        string calldata lotId
    )
        external
        view
        lotExists(lotId)
        returns (string memory, string memory, address, Status, uint256, uint256)
    {
        Lot storage L = lots[lotId];
        return (L.lotId, L.productName, L.owner, L.status, L.documents.length, L.history.length);
    }

    function getDocumentsLength(string calldata lotId)
        external
        view
        lotExists(lotId)
        returns (uint256)
    {
        return lots[lotId].documents.length;
    }

    function getHistoryLength(string calldata lotId)
        external
        view
        lotExists(lotId)
        returns (uint256)
    {
        return lots[lotId].history.length;
    }

    function getDocument(
        string calldata lotId,
        uint256 index
    )
        external
        view
        lotExists(lotId)
        returns (string memory)
    {
        require(index < lots[lotId].documents.length, "Doc index out of range");
        return lots[lotId].documents[index];
    }

    function getHistoryEvent(
        string calldata lotId,
        uint256 index
    )
        external
        view
        lotExists(lotId)
        returns (uint256, address, Status, string memory, string memory)
    {
        require(index < lots[lotId].history.length, "History index out of range");
        TraceEvent storage e = lots[lotId].history[index];
        return (e.timestamp, e.actor, e.status, e.note, e.ipfsCid);
    }
}
