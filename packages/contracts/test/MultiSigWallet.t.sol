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
    event TransactionFailed(bytes32 indexed proposalId, address indexed to, uint256 value, bytes data);
    event EthReceived(address indexed sender, uint256 amount);

    function setUp() public {
        uint256 privateKey = uint256(keccak256(abi.encodePacked("owner1234")));
        owner1 = vm.addr(privateKey);
        owner2 = address(0x2);
        owner3 = address(0x3);
        address owner4 = 0xCe9A87013DB006Dde79E7382bf48D45bF891e90D;

        // Ensure all owners are unique
        require(owner1 != owner2 && owner1 != owner3 && owner1 != owner4 &&
                owner2 != owner3 && owner2 != owner4 &&
                owner3 != owner4, "Duplicate owners");

        owners = new address[](4);
        owners[0] = owner1;
        owners[1] = owner2;
        owners[2] = owner3;
        owners[3] = owner4;

        console.log("owner1:", owner1);
        console.log("owner2:", owner2);
        console.log("owner3:", owner3);
        console.log("owner4:", owner4);

        requiredConfirmations = 2;
        timelockDuration = 1 days;

        wallet = new MultiSigWallet(owners, requiredConfirmations, timelockDuration);

        wallet.grantRole(wallet.PROPOSER_ROLE(), owner1);
        wallet.grantRole(wallet.PROPOSER_ROLE(), owner2);
        wallet.grantRole(wallet.PROPOSER_ROLE(), owner3);
        wallet.grantRole(wallet.PROPOSER_ROLE(), owner4);

        vm.deal(address(wallet), 10 ether);
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
    address payable to = payable(address(0x1234));
    uint256 value = 1 ether;
    bytes memory data = ""; // Empty data for a simple ETH transfer

    vm.prank(owner1);
    bytes32 proposalId = wallet.proposeTransaction(to, value, data);

    vm.prank(owner2);
    wallet.confirmProposal(proposalId);

    vm.warp(block.timestamp + timelockDuration + 1);

    uint256 initialBalance = address(to).balance;

    vm.expectEmit(true, true, true, true);
    emit TransactionExecuted(proposalId, to, value, data);

    vm.prank(owner3);
    wallet.confirmProposal(proposalId);

    (,,,bool executed) = wallet.getTransactionInfo(proposalId);
    assertTrue(executed);
    assertEq(address(to).balance, initialBalance + value);
}

    function testFailedTransaction() public {
        address to = address(0x4);
        uint256 value = 1 ether;
        bytes memory data = abi.encodeWithSignature("nonExistentFunction()");

        vm.prank(owner1);
        bytes32 proposalId = wallet.proposeTransaction(to, value, data);

        vm.prank(owner1);
        wallet.confirmProposal(proposalId);

        vm.warp(block.timestamp + timelockDuration + 1);

        vm.expectEmit(true, true, true, true);
        emit TransactionFailed(proposalId, to, value, data);

        vm.expectRevert("MultiSigWallet: Transaction failed");
        vm.prank(owner2);
        wallet.confirmProposal(proposalId);

        (,,,bool executed) = wallet.getTransactionInfo(proposalId);
        assertFalse(executed);
        assertEq(address(to).balance, 0);
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
        address payable recipient = payable(address(0x6));
        
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

        vm.deal(sender, amount); // Ensure the sender has enough ETH
        vm.prank(sender);
        (bool success,) = address(wallet).call{value: amount}("");
        require(success, "ETH transfer failed");

        assertEq(address(wallet).balance, 11 ether); // 10 ether from setup + 1 ether received
    }

    function testProposeTransactionWithSignature() public {
    address to = address(0x1234);
    uint256 value = 1 ether;
    bytes memory data = "";
    bytes32 proposalId = keccak256(abi.encodePacked(to, value, data));

    address signer = owner1;
    uint256 privateKey = uint256(keccak256(abi.encodePacked("owner1_different_seed")));

    console.log("Signer:", signer);
    console.log("Private Key:", privateKey);
    
    assertTrue(wallet.hasRole(wallet.PROPOSER_ROLE(), signer));

    bytes32 domainSeparator = wallet.DOMAIN_SEPARATOR();
    uint256 nonce = wallet.nonces(signer);
    
    bytes32 structHash = keccak256(abi.encode(
        keccak256("Proposal(bytes32 proposalId,address to,uint256 value,bytes data,uint256 nonce)"),
        proposalId,
        to,
        value,
        keccak256(data),
        nonce
    ));

    bytes32 hash = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));

    console.log("Hash to sign:", uint256(hash));

    (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, hash);

    console.log("v:", v);
    console.log("r:", uint256(r));
    console.log("s:", uint256(s));

    vm.prank(signer);
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
