// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/SwapRouter.sol";

contract DeploySwapRouter is Script {
    function run() external {
        // Start the broadcast
        vm.startBroadcast();

        // Deploy the contract with constructor parameters
        // SwapRouter swapRouter = new SwapRouter(
        //     0xE592427A0AEce92De3Edee1F18E0157C05861564, // Uniswap Router address - predefined
        //     0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6, // WETH9 address - predefined
        //     0xeF9BdACbf5Cd84BC66ccAb2dC0C8bf22e221CB34, // Fee recipient address - yours
        //     875                                     // Fee basis points (e.g., 0.875%)
        // );

        // Stop the broadcast
        vm.stopBroadcast();
    }
}
