export const CONTRACT_ADDRESS = "0x684F5462a6c97C0f3673D939Ff2Aac699073b2E8";

export const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "lotId", "type": "string" },
      { "internalType": "string", "name": "productName", "type": "string" },
      { "internalType": "string", "name": "note", "type": "string" }
    ],
    "name": "createLot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "lotId", "type": "string" }],
    "name": "getLot",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" },
      { "internalType": "string", "name": "", "type": "string" },
      { "internalType": "address", "name": "", "type": "address" },
      { "internalType": "uint8", "name": "", "type": "uint8" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "lotId", "type": "string" },
      { "internalType": "string", "name": "cid", "type": "string" }
    ],
    "name": "addDocument",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
