// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/blockflow.bot/CustomTimelockControl.sol";

contract CustomTimelockControlTest is Test {
    CustomTimelockControl timelock;

    function setUp() public {
        timelock = new CustomTimelockControl(address(this));
    }

    function testQueueOperation() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(this);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("exampleFunction()");

        bytes32 proposalId = timelock.customQueue(targets, values, calldatas, keccak256(bytes("Proposal #1")));

        assertTrue(timelock.isQueued(proposalId));
    }

    function testExecuteOperation() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = address(this);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("exampleFunction()");

        bytes32 proposalId = timelock.customQueue(targets, values, calldatas, keccak256(bytes("Proposal #1")));

        vm.warp(block.timestamp + timelock.MINIMUM_DELAY());
        timelock.customExecute(proposalId);

        assertFalse(timelock.isQueued(proposalId));
    }

    function testCancelOperation() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = address(this);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("exampleFunction()");

        bytes32 proposalId = timelock.customQueue(targets, values, calldatas, keccak256(bytes("Proposal #1")));
        timelock.customCancel(proposalId);

        assertFalse(timelock.isQueued(proposalId));
    }

    function exampleFunction() public {
        // Placeholder function for testing
    }
}
