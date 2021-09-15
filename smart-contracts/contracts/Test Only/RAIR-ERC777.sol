// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7; 
import "@openzeppelin/contracts/token/ERC777/ERC777.sol";
import "hardhat/console.sol";

contract RAIR777 is ERC777 {
    constructor(uint256 initialSupply, address[] memory _defaultOperators )
        ERC777("RAIR Test", "RAIRTee", _defaultOperators)
    {
        _mint(msg.sender, initialSupply, "", "");
    }

    receive() external payable {}
}