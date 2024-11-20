// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./BaseMultiOwner.sol";
import "forge-std/console.sol";


contract MultiOwner is BaseMultiOwner, AccessControl, Pausable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 private constant PROPOSAL_TYPEHASH = keccak256("Proposal(bytes32 proposalId,address proposer,bytes data,uint256 nonce)");

    uint256 private _requiredConfirmations;
    uint256 private _timelockDuration;
    uint256 private constant MAX_TIMELOCK_DURATION = 30 days;
    uint256 public proposalExpirationTime = 7 days;

    struct Proposal {
        bytes32 id;
        address proposer;
        bool executed;
        bool overridden;
        uint256 confirmations;
        uint256 overrides;
        uint256 createdAt;
        bytes data;
        mapping(address => bool) confirmedBy;
        mapping(address => bool) overriddenBy;
    }

    mapping(bytes32 => Proposal) private _proposals;
    uint256 private _proposalCounter;

    event ProposalCreated(bytes32 indexed proposalId, address indexed proposer, bytes data);
    event ProposalConfirmed(bytes32 indexed proposalId, address indexed confirmer);
    event ProposalExecuted(bytes32 indexed proposalId);
    event ProposalOverridden(bytes32 indexed proposalId, address indexed overrider);
    event ProposalExpired(bytes32 indexed proposalId);
    event RequiredConfirmationsChanged(uint256 oldValue, uint256 newValue);
    event TimelockDurationChanged(uint256 oldValue, uint256 newValue);
    event ProposalExpirationTimeChanged(uint256 oldValue, uint256 newValue);

    constructor(
        address[] memory owners,
        uint256 requiredConfirmations,
        uint256 timelockDuration
    ) 
        BaseMultiOwner(owners) 
        EIP712("MultiOwner", "1")
    {
        require(
            requiredConfirmations > 0 && requiredConfirmations <= owners.length,
            "MultiOwner: Invalid number of required confirmations"
        );
        require(timelockDuration <= MAX_TIMELOCK_DURATION, "MultiOwner: Timelock duration too long");
        _requiredConfirmations = requiredConfirmations;
        _timelockDuration = timelockDuration;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(PROPOSER_ROLE, msg.sender);

        for (uint256 i = 0; i < owners.length; i++) {
            _grantRole(PROPOSER_ROLE, owners[i]);
        }
    }

    modifier onlyProposer() {
        require(hasRole(PROPOSER_ROLE, msg.sender), "MultiOwner: caller is not a proposer");
        _;
    }

    function proposeAction(bytes memory data) public onlyProposer whenNotPaused returns (bytes32) {
        bytes32 proposalId = keccak256(abi.encodePacked(msg.sender, _proposalCounter, block.timestamp));
        Proposal storage proposal = _proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.data = data;
        proposal.createdAt = block.timestamp;
        _proposalCounter++;
        emit ProposalCreated(proposalId, msg.sender, data);
        return proposalId;
    }

    function proposeActionWithSignature(
        bytes32 proposalId,
        bytes memory data,  // Changed from calldata to memory
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public whenNotPaused returns (bytes32) {
        address signer = _verifyProposalSignature(proposalId, data, v, r, s);
        require(hasRole(PROPOSER_ROLE, signer), "MultiOwner: signer is not a proposer");

        Proposal storage proposal = _proposals[proposalId];
        require(proposal.id == bytes32(0), "MultiOwner: proposal already exists");

        proposal.id = proposalId;
        proposal.proposer = signer;
        proposal.data = data;
        proposal.createdAt = block.timestamp;
        _proposalCounter++;

        emit ProposalCreated(proposalId, signer, data);
        return proposalId;
    }

    function _verifyProposalSignature(
        bytes32 proposalId,
        bytes memory data,  // Changed from calldata to memory
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view returns (address) {
        bytes32 structHash = keccak256(abi.encode(
            PROPOSAL_TYPEHASH,
            proposalId,
            msg.sender,
            keccak256(data),
            _proposalCounter
        ));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, v, r, s);
        return signer;
    }

    function confirmProposal(bytes32 proposalId) public onlyOwner whenNotPaused {
        Proposal storage proposal = _proposals[proposalId];
        require(!proposal.executed, "MultiOwner: Proposal already executed");
        require(!proposal.overridden, "MultiOwner: Proposal has been overridden");
        require(!proposal.confirmedBy[msg.sender], "MultiOwner: Proposal already confirmed by this owner");
        require(block.timestamp <= proposal.createdAt + proposalExpirationTime, "MultiOwner: Proposal has expired");

        proposal.confirmedBy[msg.sender] = true;
        proposal.confirmations++;
        emit ProposalConfirmed(proposalId, msg.sender);

        if (proposal.confirmations >= _requiredConfirmations && block.timestamp >= proposal.createdAt + _timelockDuration) {
            executeProposal(proposalId);
        }
    }

    function overrideProposal(bytes32 proposalId) public onlyOwner whenNotPaused {
        Proposal storage proposal = _proposals[proposalId];
        require(!proposal.executed, "MultiOwner: Proposal already executed");
        require(!proposal.overriddenBy[msg.sender], "MultiOwner: Proposal already overridden by this owner");
        require(block.timestamp <= proposal.createdAt + proposalExpirationTime, "MultiOwner: Proposal has expired");

        proposal.overriddenBy[msg.sender] = true;
        proposal.overrides++;
        emit ProposalOverridden(proposalId, msg.sender);

        if (proposal.overrides > getOwnerCount() / 2) {
            proposal.overridden = true;
        }
    }

    function executeProposal(bytes32 proposalId) internal virtual nonReentrant whenNotPaused {
        Proposal storage proposal = _proposals[proposalId];
        require(!proposal.executed, "MultiOwner: Proposal already executed");
        require(!proposal.overridden, "MultiOwner: Proposal has been overridden");
        require(proposal.confirmations >= _requiredConfirmations, "MultiOwner: Not enough confirmations");
        require(block.timestamp >= proposal.createdAt + _timelockDuration, "MultiOwner: Timelock period not passed");
        require(block.timestamp <= proposal.createdAt + proposalExpirationTime, "MultiOwner: Proposal has expired");

        proposal.executed = true;
        emit ProposalExecuted(proposalId);
        // Execute proposal data
        
        (bool success, ) = address(this).call(proposal.data);

        require(success, "MultiOwner: Proposal execution failed");
    }

    function setRequiredConfirmations(uint256 newRequiredConfirmations) public onlyOwner {
        require(newRequiredConfirmations > 0 && newRequiredConfirmations <= getOwnerCount(), "MultiOwner: Invalid number of required confirmations");
        uint256 oldValue = _requiredConfirmations;
        _requiredConfirmations = newRequiredConfirmations;
        emit RequiredConfirmationsChanged(oldValue, newRequiredConfirmations);
    }

    function setTimelockDuration(uint256 newTimelockDuration) public onlyOwner {
        require(newTimelockDuration <= MAX_TIMELOCK_DURATION, "MultiOwner: Timelock duration too long");
        uint256 oldValue = _timelockDuration;
        _timelockDuration = newTimelockDuration;
        emit TimelockDurationChanged(oldValue, newTimelockDuration);
    }

    function setProposalExpirationTime(uint256 newExpirationTime) public onlyOwner {
        require(newExpirationTime > _timelockDuration, "MultiOwner: Expiration time must be greater than timelock duration");
        uint256 oldValue = proposalExpirationTime;
        proposalExpirationTime = newExpirationTime;
        emit ProposalExpirationTimeChanged(oldValue, newExpirationTime);
    }

// Add this function to MultiOwner.sol
    function getProposalData(bytes32 proposalId) public view returns (bytes memory) {
        return _proposals[proposalId].data;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function getProposalInfo(bytes32 proposalId) public view returns (
        address proposer,
        bool executed,
        bool overridden,
        uint256 confirmations,
        uint256 overrides,
        uint256 createdAt
    ) {
        Proposal storage proposal = _proposals[proposalId];
        return (
            proposal.proposer,
            proposal.executed,
            proposal.overridden,
            proposal.confirmations,
            proposal.overrides,
            proposal.createdAt
        );
    }

    function getRequiredConfirmations() public view returns (uint256) {
        return _requiredConfirmations;
    }

    function getTimelockDuration() public view returns (uint256) {
        return _timelockDuration;
    }

}
