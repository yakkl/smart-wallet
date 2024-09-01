// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "@src/blockflow.bot/MockTimelockController.sol";
import "@src/blockflow.bot/MockERC20Votes.sol";
import "@src/blockflow.bot/YAKKLGovernor.sol";
import "@src/blockflow.bot/YAKKL.sol"; // Assuming YAKKL implements ERC20Votes

contract YAKKLGovernorTest is Test {
    YAKKLGovernor public governor;
    MockERC20Votes public token;
    MockTimelockController public timelock;

    // ... rest of the contract

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        // Deploy mock token
        token = new MockERC20Votes("Mock YAKKL", "mYKL");
        
        // Deploy MockTimelockController
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = owner;
        executors[0] = owner;
        timelock = new MockTimelockController(2 days, proposers, executors, owner);

        // Deploy YAKKLGovernor
        governor = new YAKKLGovernor(token, address(timelock));

        // Setup initial token distribution
        token.transfer(user1, 100 * 10**18);
        token.transfer(user2, 100 * 10**18);

        vm.prank(user1);
        token.delegate(user1);

        vm.prank(user2);
        token.delegate(user2);
    }

    function testInitialSetup() public {
        assertEq(address(governor.token()), address(token));
        assertEq(governor.timelock(), address(timelock));
        assertEq(governor.votingDelay(), 1);
        assertEq(governor.votingPeriod(), 45818);
        assertEq(governor.proposalThreshold(), 0);
        assertEq(governor.quorumNumerator(), 4);
    }

    function testPropose() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("transfer(address,uint256)", user1, 10 * 10**18);

        vm.prank(user1);
        uint256 proposalId = governor.propose(targets, values, calldatas, "Proposal #1");

        assertEq(uint(governor.state(proposalId)), uint(IGovernor.ProposalState.Pending));
    }

    function testVote() public {
        // Create a proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("transfer(address,uint256)", user1, 10 * 10**18);

        vm.prank(user1);
        uint256 proposalId = governor.propose(targets, values, calldatas, "Proposal #1");

        vm.roll(block.number + governor.votingDelay() + 1);

        vm.prank(user1);
        governor.castVote(proposalId, 1);

        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governor.proposalVotes(proposalId);
        assertEq(forVotes, 100 * 10**18);
        assertEq(againstVotes, 0);
        assertEq(abstainVotes, 0);
    }

    function testExecuteProposal() public {
        // Create a proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("transfer(address,uint256)", user1, 10 * 10**18);

        vm.prank(user1);
        uint256 proposalId = governor.propose(targets, values, calldatas, "Proposal #1");

        vm.roll(block.number + governor.votingDelay() + 1);

        vm.prank(user1);
        governor.castVote(proposalId, 1);

        vm.prank(user2);
        governor.castVote(proposalId, 1);

        vm.roll(block.number + governor.votingPeriod() + 1);

        bytes32 descriptionHash = keccak256(bytes("Proposal #1"));
        governor.queue(targets, values, calldatas, descriptionHash);

        vm.warp(block.timestamp + timelock.getMinDelay() + 1);

        uint256 initialBalance = token.balanceOf(user1);
        governor.execute(targets, values, calldatas, descriptionHash);

        assertEq(token.balanceOf(user1), initialBalance + 10 * 10**18);
        assertEq(uint(governor.state(proposalId)), uint(IGovernor.ProposalState.Executed));
    }

    function testQuorumReached() public {
        // Create a proposal
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("transfer(address,uint256)", user1, 10 * 10**18);

        vm.prank(user1);
        uint256 proposalId = governor.propose(targets, values, calldatas, "Proposal #1");

        vm.roll(block.number + governor.votingDelay() + 1);

        vm.prank(user1);
        governor.castVote(proposalId, 1);

        vm.prank(user2);
        governor.castVote(proposalId, 1);

        vm.roll(block.number + governor.votingPeriod() + 1);

        uint256 quorum = governor.quorum(block.number - 1);
        (,uint256 forVotes,) = governor.proposalVotes(proposalId);
        assertTrue(forVotes >= quorum, "Quorum not reached");
    }
}

