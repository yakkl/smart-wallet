// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MultiOwner.sol";

contract MultiSigWallet is MultiOwner {
    event TransactionExecuted(bytes32 indexed proposalId, address indexed to, uint256 value, bytes data);
    event BatchTransactionExecuted(bytes32 indexed proposalId);
    event TransactionCancelled(bytes32 indexed proposalId);
    event EthReceived(address indexed sender, uint256 amount);

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
    }

    mapping(bytes32 => Transaction) private _transactions;
    mapping(bytes32 => Transaction[]) private _batchTransactions;

    constructor(
        address[] memory owners,
        uint256 requiredConfirmations,
        uint256 timelockDuration
    ) MultiOwner(owners, requiredConfirmations, timelockDuration) {}

    function proposeTransaction(address to, uint256 value, bytes calldata data) public onlyProposer whenNotPaused returns (bytes32) {
        bytes32 proposalId = proposeAction(abi.encode(to, value, data, false)); // false indicates it's not a batch transaction
        _transactions[proposalId] = Transaction(to, value, data, false);
        return proposalId;
    }

    function proposeBatchTransactions(
        address[] calldata to,
        uint256[] calldata value,
        bytes[] calldata data
    ) public onlyProposer whenNotPaused returns (bytes32) {
        require(to.length == value.length && to.length == data.length, "MultiSigWallet: Invalid batch parameters");
        bytes32 proposalId = proposeAction(abi.encode(to, value, data, true)); // true indicates it's a batch transaction
        
        for (uint i = 0; i < to.length; i++) {
            _batchTransactions[proposalId].push(Transaction(to[i], value[i], data[i], false));
        }
        return proposalId;
    }

    function proposeTransactionWithSignature(
        bytes32 proposalId,
        address to,
        uint256 value,
        bytes calldata data,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public whenNotPaused returns (bytes32) {
        bytes memory encodedData = abi.encode(to, value, data, false);
        bytes32 returnedProposalId = proposeActionWithSignature(proposalId, encodedData, v, r, s);
        _transactions[returnedProposalId] = Transaction(to, value, data, false);
        return returnedProposalId;
    }

    function proposeBatchTransactionsWithSignature(
        bytes32 proposalId,
        address[] calldata to,
        uint256[] calldata value,
        bytes[] calldata data,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public whenNotPaused returns (bytes32) {
        require(to.length == value.length && to.length == data.length, "MultiSigWallet: Invalid batch parameters");
        bytes memory encodedData = abi.encode(to, value, data, true);
        bytes32 returnedProposalId = proposeActionWithSignature(proposalId, encodedData, v, r, s);
        
        for (uint i = 0; i < to.length; i++) {
            _batchTransactions[returnedProposalId].push(Transaction(to[i], value[i], data[i], false));
        }
        return returnedProposalId;
    }
    function cancelTransaction(bytes32 proposalId) public onlyProposer whenNotPaused {
        require(!_transactions[proposalId].executed, "MultiSigWallet: Transaction already executed");
        delete _transactions[proposalId];
        delete _batchTransactions[proposalId];
        emit TransactionCancelled(proposalId);
    }

    function executeProposal(bytes32 proposalId) internal override {
      super.executeProposal(proposalId);

      (address[] memory to, , , bool isBatch) = abi.decode(
          getProposalData(proposalId),
          (address[], uint256[], bytes[], bool)
      );

      if (isBatch) {
          for (uint i = 0; i < to.length; i++) {
              Transaction storage txn = _batchTransactions[proposalId][i];
              require(!txn.executed, "MultiSigWallet: Transaction already executed");

              (bool success, ) = txn.to.call{value: txn.value}(txn.data);
              require(success, "MultiSigWallet: Transaction failed");

              txn.executed = true;
          }
          emit BatchTransactionExecuted(proposalId);
      } else {
          Transaction storage txn = _transactions[proposalId];
          require(!txn.executed, "MultiSigWallet: Transaction already executed");

          (bool success, ) = txn.to.call{value: txn.value}(txn.data);
          require(success, "MultiSigWallet: Transaction failed");

          txn.executed = true;
          emit TransactionExecuted(proposalId, txn.to, txn.value, txn.data);
      }
    }

    function getTransactionInfo(bytes32 proposalId) public view returns (
        address to,
        uint256 value,
        bytes memory data,
        bool executed
    ) {
        Transaction storage txn = _transactions[proposalId];
        return (txn.to, txn.value, txn.data, txn.executed);
    }

    function getBatchTransactionInfo(bytes32 proposalId, uint256 index) public view returns (
        address to,
        uint256 value,
        bytes memory data,
        bool executed
    ) {
        require(index < _batchTransactions[proposalId].length, "MultiSigWallet: Invalid batch transaction index");
        Transaction storage txn = _batchTransactions[proposalId][index];
        return (txn.to, txn.value, txn.data, txn.executed);
    }

    function getBatchTransactionCount(bytes32 proposalId) public view returns (uint256) {
        return _batchTransactions[proposalId].length;
    }

    receive() external payable {
        emit EthReceived(msg.sender, msg.value);
    }

    function withdraw(address payable recipient, uint256 amount) public onlyOwner {
        require(address(this).balance >= amount, "MultiSigWallet: Insufficient balance");
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "MultiSigWallet: Transfer failed");
    }
}
