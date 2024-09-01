// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Mock TimelockController for testing
contract MockTimelockController {
    uint256 public delay;

    constructor(uint256 minDelay, address[] memory, address[] memory, address) {
        delay = minDelay;
    }

    function getMinDelay() public view returns (uint256) {
        return delay;
    }
}
