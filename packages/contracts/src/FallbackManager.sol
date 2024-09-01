// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";

contract FallbackManager is Initializable {
    event FallbackChanged(address indexed handler);

    address public fallbackHandler;

    function __FallbackManager_init() internal initializer {}

    function setFallbackHandler(address handler) public virtual {
        fallbackHandler = handler;
        emit FallbackChanged(handler);
    }

    fallback() external payable {
        if (fallbackHandler != address(0)) {
            (bool success, ) = fallbackHandler.delegatecall(msg.data);
            require(success, "Fallback handler failed");
        }
    }

    receive() external payable {}
}
