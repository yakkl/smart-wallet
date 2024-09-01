// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MultiSigWallet.sol";

contract MultiSigWalletTest is Test {
    MultiSigWallet wallet;
    address[] owners;
    address owner1;
    address owner2;
    address owner3;
    uint256 requiredConfirmations;
    uint256 timelockDuration;

    event TransactionExecuted(bytes32 indexed proposalId, address indexed to, uint256 value, bytes data);
    event BatchTransactionExecuted(bytes32 indexed proposalId);
    event TransactionCancelled(bytes32 indexed proposalId);
    event EthReceived(address indexed sender, uint256 amount);

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

        wallet = new MultiSigWallet(owners, requiredConfirmations, timelockDuration);

        vm.deal(address(wallet), 10 ether); // Fund the wallet with some ETH for testing
    }

    function testProposeTransaction() public {
        address to = address(0x4);
        uint256 value = 1 ether;
        bytes memory data = "";

        vm.prank(owner1);
        bytes32 proposalId = wallet.proposeTransaction(to, value, data);

        (address proposedTo, uint256 proposedValue, bytes memory proposedData, bool executed) = wallet.getTransactionInfo(proposalId);
        
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
        bytes32 proposalId = wallet.proposeBatchTransactions(to, value, data);

        assertEq(wallet.getBatchTransactionCount(proposalId), 2);
    }

    function testConfirmAndExecuteTransaction() public {
        address to = address(0x4);
        uint256 value = 1 ether;
        bytes memory data = "";

        vm.prank(owner1);
        bytes32 proposalId = wallet.proposeTransaction(to, value, data);

        vm.prank(owner1);
        wallet.confirmProposal(proposalId);

        vm.warp(block.timestamp + timelockDuration + 1);

        vm.expectEmit(true, true, true, true);
        emit TransactionExecuted(proposalId, to, value, data);

        // The last confirmation should trigger the execution
        vm.prank(owner2);
        wallet.confirmProposal(proposalId);

        (,,,bool executed) = wallet.getTransactionInfo(proposalId);
        assertTrue(executed);
        assertEq(address(to).balance, value);
    }

    function testCancelTransaction() public {
        address to = address(0x4);
        uint256 value = 1 ether;
        bytes memory data = "";

        vm.prank(owner1);
        bytes32 proposalId = wallet.proposeTransaction(to, value, data);

        vm.prank(owner1);
        wallet.cancelTransaction(proposalId);

        (address proposedTo,,, bool executed) = wallet.getTransactionInfo(proposalId);
        assertEq(proposedTo, address(0));
        assertFalse(executed);
    }

    function testWithdraw() public {
        uint256 amount = 1 ether;
        address payable recipient = payable(address(0x5));
        
        uint256 initialBalance = address(wallet).balance;

        vm.prank(owner1);
        wallet.withdraw(recipient, amount);

        assertEq(recipient.balance, amount);
        assertEq(address(wallet).balance, initialBalance - amount);
    }

    function testReceiveEth() public {
        uint256 amount = 1 ether;
        address sender = address(0x6);

        vm.expectEmit(true, true, false, true);
        emit EthReceived(sender, amount);

        vm.prank(sender);
        (bool success,) = address(wallet).call{value: amount}("");
        require(success, "ETH transfer failed");

        assertEq(address(wallet).balance, 11 ether); // 10 ether from setup + 1 ether received
    }

    function testProposeTransactionWithSignature() public {
        address to = address(0x4);
        uint256 value = 1 ether;
        bytes memory data = "";
        bytes32 proposalId = keccak256(abi.encodePacked(to, value, data));

        // Create a signature (this is a simplified version, in reality you'd use proper signing)
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(1, keccak256(abi.encodePacked(proposalId, to, value, data)));

        vm.prank(owner1);
        bytes32 returnedProposalId = wallet.proposeTransactionWithSignature(proposalId, to, value, data, v, r, s);

        assertEq(returnedProposalId, proposalId);

        (address proposedTo, uint256 proposedValue, bytes memory proposedData, bool executed) = wallet.getTransactionInfo(proposalId);
        
        assertEq(proposedTo, to);
        assertEq(proposedValue, value);
        assertEq(proposedData, data);
        assertFalse(executed);
    }

    receive() external payable {}
}
