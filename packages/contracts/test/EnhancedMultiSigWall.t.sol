// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MultiSigWallet.sol";

contract MultiSigWalletTest is Test {
    MultiSigWallet multiSigWallet;
    address[] owners;
    address owner1;
    address owner2;
    address owner3;
    uint256 requiredConfirmations;
    uint256 timelockDuration;

    event TransactionExecuted(bytes32 indexed proposalId, address indexed to, uint256 value, bytes data);

    function setUp() public {
        owner1 = address(0x1);
        owner2 = address(0x2);
        owner3 = address(0x3);
        owners = new address[](3);
        owners[0] = owner1;
        owners[1] = owner2;
        owners[2] = owner3;
        requiredConfirmations = 2;
        timelockDuration = 1 days;

        multiSigWallet = new MultiSigWallet(owners, requiredConfirmations, timelockDuration);
    }

    function testProposeTransaction() public {
        address to = address(0x4);
        uint256 value = 1 ether;
        bytes memory data = "";

        vm.prank(owner1);
        bytes32 proposalId = multiSigWallet.proposeTransaction(to, value, data);

        (address proposedTo, uint256 proposedValue, bytes memory proposedData, bool executed) = multiSigWallet.getTransactionInfo(proposalId);
        
        assertEq(proposedTo, to);
        assertEq(proposedValue, value);
        assertEq(proposedData, data);
        assertFalse(executed);
    }

    function testProposeBatchTransactions() public {
        address[] memory to = new address[](2);
        to[0] = address(0x4);
        to[1] = address(0x5);
        uint256[] memory value = new uint256[](2);
        value[0] = 1 ether;
        value[1] = 0.5 ether;
        bytes[] memory data = new bytes[](2);
        data[0] = "";
        data[1] = "";

        vm.prank(owner1);
        bytes32 proposalId = multiSigWallet.proposeBatchTransactions(to, value, data);

        assertEq(multiSigWallet.getBatchTransactionCount(proposalId), 2);
    }

    function testExecuteTransaction() public {
    address payable to = payable(address(0x4));
    uint256 value = 1 ether;
    bytes memory data = "";

    // Fund the MultiSigWallet contract
    vm.deal(address(multiSigWallet), 2 ether);

    vm.prank(owner1);
    bytes32 proposalId = multiSigWallet.proposeTransaction(to, value, data);

    vm.prank(owner1);
    multiSigWallet.confirmProposal(proposalId);

    vm.warp(block.timestamp + timelockDuration + 1);

    vm.expectEmit(true, true, true, true);
    emit TransactionExecuted(proposalId, to, value, data);

    // The last confirmation should trigger the execution
    vm.prank(owner2);
    multiSigWallet.confirmProposal(proposalId);

    (,,,bool executed) = multiSigWallet.getTransactionInfo(proposalId);
    assertTrue(executed);
    assertEq(to.balance, value);
}

    function testCancelTransaction() public {
        address to = address(0x4);
        uint256 value = 1 ether;
        bytes memory data = "";

        vm.prank(owner1);
        bytes32 proposalId = multiSigWallet.proposeTransaction(to, value, data);

        vm.prank(owner1);
        multiSigWallet.cancelTransaction(proposalId);

        (address proposedTo,,, bool executed) = multiSigWallet.getTransactionInfo(proposalId);
        assertEq(proposedTo, address(0));
        assertFalse(executed);
    }

    function testWithdraw() public {
        uint256 amount = 1 ether;
        address payable recipient = payable(address(0x5));
        
        // Fund the contract
        vm.deal(address(multiSigWallet), amount);

        vm.prank(owner1);
        multiSigWallet.withdraw(recipient, amount);

        assertEq(recipient.balance, amount);
    }

    receive() external payable {}
}
