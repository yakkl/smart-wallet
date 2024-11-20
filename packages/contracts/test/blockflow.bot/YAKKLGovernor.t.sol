// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/blockflow.bot/YAKKLGovernor.sol";
import "../../src/blockflow.bot/YAKKL.sol";
import "../../src/blockflow.bot/YAKKLTreasury.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

contract YAKKLGovernorTest is Test {
    YAKKLGovernor public governor;
    YAKKL public token;
    YAKKLTreasury public treasury;
    TimelockController public timelock;

    address public owner;
    address public user1;
    address public user2;

    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18;
    uint256 public constant VOTING_DELAY = 1;
    uint256 public constant VOTING_PERIOD = 50400;
    uint256 public constant PROPOSAL_THRESHOLD = 0;
    uint256 public constant QUORUM_PERCENTAGE = 4;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        ISwapRouter swapRouter = ISwapRouter(address(0x1234));
        address wethAddress = address(0x5678);
        uint256 liquidityPercentage = 50;
        uint256 treasuryPercentage = 50;

        // Deploy TimelockController
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = address(this);
        executors[0] = address(0); // Allow any address to execute
        timelock = new TimelockController(2 days, proposers, executors, owner);

        // Deploy YAKKLTreasury
        treasury = new YAKKLTreasury(
            IERC20(address(0)),
            payable(address(timelock)), // Set timelock as the fee recipient
            swapRouter,
            wethAddress,
            liquidityPercentage,
            treasuryPercentage
        );

        // Deploy YAKKL token
        token = new YAKKL(owner, address(treasury)); // Temporary address for treasury

        token.setYAKKLTreasury(address(treasury));

        // Deploy YAKKLGovernor
        governor = new YAKKLGovernor(ERC20Votes(address(token)), timelock);

        // Grant roles
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(governor));
        timelock.revokeRole(timelock.TIMELOCK_ADMIN_ROLE(), owner);

        // Distribute tokens
        token.transfer(user1, 100000 * 10**18);
        token.transfer(user2, 100000 * 10**18);

    }

    function testInitialSetup() view public {
        assertEq(address(governor.token()), address(token));
        assertEq(address(governor.timelock()), address(timelock));
        assertEq(governor.votingDelay(), VOTING_DELAY);
        assertEq(governor.votingPeriod(), VOTING_PERIOD);
        assertEq(governor.proposalThreshold(), PROPOSAL_THRESHOLD);
        assertEq(governor.quorumNumerator(), QUORUM_PERCENTAGE);
    }

    function testPropose() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("transfer(address,uint256)", user1, 1000 * 10**18);

        vm.prank(user1);
        uint256 proposalId = governor.propose(targets, values, calldatas, "Proposal #1: Transfer tokens to user1");

        assertEq(uint(governor.state(proposalId)), uint(IGovernor.ProposalState.Pending));
    }

    function testVote() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("transfer(address,uint256)", user1, 1000 * 10**18);

        vm.prank(user1);
        uint256 proposalId = governor.propose(targets, values, calldatas, "Proposal #1: Transfer tokens to user1");

        vm.roll(block.number + governor.votingDelay() + 1);

        vm.prank(user1);
        governor.castVote(proposalId, 1);

        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governor.proposalVotes(proposalId);
        assertEq(forVotes, 100000 * 10**18);
        assertEq(againstVotes, 0);
        assertEq(abstainVotes, 0);
    }

    function testExecuteProposal() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("transfer(address,uint256)", user2, 1000 * 10**18);

        vm.prank(user1);
        uint256 proposalId = governor.propose(targets, values, calldatas, "Proposal #1: Transfer tokens to user2");

        vm.roll(block.number + governor.votingDelay() + 1);

        vm.prank(user1);
        governor.castVote(proposalId, 1);

        vm.prank(user2);
        governor.castVote(proposalId, 1);

        vm.roll(block.number + governor.votingPeriod() + 1);

        bytes32 descriptionHash = keccak256(bytes("Proposal #1: Transfer tokens to user2"));
        governor.queue(targets, values, calldatas, descriptionHash);

        vm.warp(block.timestamp + timelock.getMinDelay() + 1);

        uint256 initialBalance = token.balanceOf(user2);
        governor.execute(targets, values, calldatas, descriptionHash);

        assertEq(token.balanceOf(user2), initialBalance + 1000 * 10**18);
        assertEq(uint(governor.state(proposalId)), uint(IGovernor.ProposalState.Executed));
    }

    function testQuorumReached() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = address(token);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("transfer(address,uint256)", user1, 1000 * 10**18);

        vm.prank(user1);
        uint256 proposalId = governor.propose(targets, values, calldatas, "Proposal #1: Transfer tokens to user1");

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
