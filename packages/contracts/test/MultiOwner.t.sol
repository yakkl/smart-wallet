// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MultiOwner.sol";

contract MultiOwnerTest is Test {
    MultiOwner multiOwner;
    address[] initialOwners;
    address owner1;
    address owner2;
    address owner3;
    uint256 requiredConfirmations;
    uint256 timelockDuration;

    function setUp() public {
        owner1 = address(0x1);
        owner2 = address(0x2);
        owner3 = address(0x3);
        initialOwners = new address[](2);
        initialOwners[0] = owner1;
        initialOwners[1] = owner2;
        requiredConfirmations = 2;
        timelockDuration = 1 days;

        multiOwner = new MultiOwner(initialOwners, requiredConfirmations, timelockDuration);
        multiOwner.grantRole(multiOwner.PROPOSER_ROLE(), owner1);
    }

    function testInitialization() public view {
        assertTrue(multiOwner.isOwner(owner1));
        assertTrue(multiOwner.isOwner(owner2));
        assertFalse(multiOwner.isOwner(owner3));
        assertEq(multiOwner.getRequiredConfirmations(), requiredConfirmations);
        assertEq(multiOwner.getTimelockDuration(), timelockDuration);
    }

    function testProposeAction() public {
        bytes memory data = abi.encodeWithSignature("someFunction(uint256)", 123);

        vm.prank(owner1);
        bytes32 proposalId = multiOwner.proposeAction(data);

        assertTrue(proposalId != bytes32(0));
    }

    function testConfirmProposal() public {
        bytes memory data = abi.encodeWithSignature("someFunction(uint256)", 123);

        vm.prank(owner1);
        bytes32 proposalId = multiOwner.proposeAction(data);

        vm.prank(owner2);
        multiOwner.confirmProposal(proposalId);

        // You might need to add a getter function in your contract to check this
        // assertTrue(multiOwner.isProposalConfirmed(proposalId));
    }

    function testOverrideProposal() public {
        bytes memory data = abi.encodeWithSignature("someFunction(uint256)", 123);

        vm.prank(owner1);
        bytes32 proposalId = multiOwner.proposeAction(data);

        vm.prank(owner2);
        multiOwner.overrideProposal(proposalId);

        // You might need to add a getter function in your contract to check this
        // assertTrue(multiOwner.isProposalOverridden(proposalId));
    }

    function testChangeRequiredConfirmations() public {
        uint256 newRequiredConfirmations = 1;

        vm.prank(owner1);
        multiOwner.setRequiredConfirmations(newRequiredConfirmations);

        console.log("Required confirmations", multiOwner.getRequiredConfirmations());

        assertEq(multiOwner.getRequiredConfirmations(), newRequiredConfirmations);
    }

    function testChangeTimelockDuration() public {
        uint256 newTimelockDuration = 2 days;

        vm.prank(owner1);
        multiOwner.setTimelockDuration(newTimelockDuration);

        assertEq(multiOwner.getTimelockDuration(), newTimelockDuration);
    }

    function testAddOwner() public {
        vm.prank(owner1);
        multiOwner.addOwner(owner3);

        assertTrue(multiOwner.isOwner(owner3));
    }

    function testRemoveOwner() public {
        vm.prank(owner1);
        multiOwner.removeOwner(owner2);

        assertFalse(multiOwner.isOwner(owner2));
    }
}
