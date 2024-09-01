// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "./CustomTimelockControl.sol";

contract YAKKLGovernor is Governor, GovernorSettings, GovernorVotes, GovernorCountingSimple, GovernorVotesQuorumFraction, CustomTimelockControl {
    constructor(
        ERC20Votes _token,
        address timelock
    )
        Governor("YAKKLGovernor")
        GovernorSettings(1 /* 1 block */, 45818 /* 1 week */, 0)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // Set quorum to 4%
        CustomTimelockControl(timelock)
    {}

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

//     function _executeOperations(
//     address[] memory targets,
//     uint256[] memory values,
//     bytes[] memory calldatas,
//     bytes32 descriptionHash
// ) internal {
//     // Assume proposalId is derived from the parameters or available from a different logic
//     uint256 proposalId = keccak256(abi.encode(targets, values, calldatas, descriptionHash));// logic to generate or retrieve proposalId
//     super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
// }

    function _executeOperations(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal {
        bytes32 proposalId = keccak256(abi.encode(targets, values, calldatas, descriptionHash));
        customExecute(proposalId);
    }

    function _queueOperations(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal returns (bytes32) {
        return customQueue(targets, values, calldatas, descriptionHash);
    }

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId) public view override(Governor) returns (ProposalState) {
        if (isQueued(bytes32(proposalId))) {
            return ProposalState.Queued;
        }
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable override(Governor) returns (uint256) {
        uint256 proposalId = uint256(keccak256(abi.encode(targets, values, calldatas, descriptionHash)));
        _executeOperations(targets, values, calldatas, descriptionHash);
        return proposalId;
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor) returns (uint256) {
        bytes32 proposalId = keccak256(abi.encode(targets, values, calldatas, descriptionHash));
        customCancel(proposalId);
        return uint256(proposalId);  // Assuming proposalId can be converted or you return the correct type
    }



    function _executor() internal view override returns (address) {
        return address(this);
    }
}
