// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CustomTimelockControl {
    struct Proposal {
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        bytes32 descriptionHash;
        uint256 eta;
        bool executed;
        bool canceled;
    }

    uint256 public constant MINIMUM_DELAY = 1 days;
    uint256 public constant MAXIMUM_DELAY = 30 days;
    uint256 public constant GRACE_PERIOD = 14 days;

    mapping(bytes32 => Proposal) public proposals;
    address public governance;

    modifier onlyCustomGovernance() {
        require(msg.sender == governance, "CustomTimelockControl: caller is not governance");
        _;
    }

    constructor(address _governance) {
        governance = _governance;
    }

    function customQueue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public onlyCustomGovernance returns (bytes32) {
        require(targets.length == values.length && targets.length == calldatas.length, "CustomTimelockControl: invalid proposal length");

        bytes32 proposalId = keccak256(abi.encode(targets, values, calldatas, descriptionHash));
        require(proposals[proposalId].eta == 0, "CustomTimelockControl: proposal already exists");

        uint256 eta = block.timestamp + MINIMUM_DELAY;
        proposals[proposalId] = Proposal({
            targets: targets,
            values: values,
            calldatas: calldatas,
            descriptionHash: descriptionHash,
            eta: eta,
            executed: false,
            canceled: false
        });

        return proposalId;
    }

    function customExecute(bytes32 proposalId) public payable onlyCustomGovernance {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.eta != 0, "CustomTimelockControl: proposal does not exist");
        require(block.timestamp >= proposal.eta, "CustomTimelockControl: proposal still timelocked");
        require(block.timestamp <= proposal.eta + GRACE_PERIOD, "CustomTimelockControl: proposal expired");
        require(!proposal.executed, "CustomTimelockControl: proposal already executed");

        proposal.executed = true;

        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{value: proposal.values[i]}(proposal.calldatas[i]);
            require(success, "CustomTimelockControl: transaction execution reverted");
        }
    }

    function customCancel(bytes32 proposalId) public onlyCustomGovernance {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.eta != 0, "CustomTimelockControl: proposal does not exist");
        require(!proposal.executed, "CustomTimelockControl: proposal already executed");

        proposal.canceled = true;
    }

    function isQueued(bytes32 proposalId) public view returns (bool) {
        return proposals[proposalId].eta != 0 && !proposals[proposalId].executed && !proposals[proposalId].canceled;
    }
}
