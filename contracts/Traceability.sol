// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Traceability {

    string public productName;
    address public owner;

    constructor(string memory _productName) {
        productName = _productName;
        owner = msg.sender;
    }

    function updateProduct(string memory _newName) public {
        require(msg.sender == owner, "Not owner");
        productName = _newName;
    }
}
