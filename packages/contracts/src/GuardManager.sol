// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";

interface IGuard {
    function checkTransaction(
        address to,
        uint256 value,
        bytes memory data,
        bytes32 txHash
    ) external;
    
    function checkAfterExecution(bytes32 txHash, bool success) external;
}

contract GuardManager is Initializable {
    event GuardChanged(address indexed guard);

    IGuard public guard;

    function __GuardManager_init() internal initializer {}

    function setGuard(IGuard _guard) public virtual {
        guard = _guard;
        emit GuardChanged(address(_guard));
    }

    function _beforeExecution(
        bytes32 txHash,
        address to,
        uint256 value,
        bytes memory data
    ) internal virtual {
        if (address(guard) != address(0)) {
            guard.checkTransaction(to, value, data, txHash);
        }
    }

    function _afterExecution(bytes32 txHash, bool success) internal virtual {
        if (address(guard) != address(0)) {
            guard.checkAfterExecution(txHash, success);
        }
    }
}
