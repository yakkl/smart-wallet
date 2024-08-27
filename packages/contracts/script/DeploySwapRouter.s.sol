// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/SwapRouter.sol";
import "../src/FeeManager.sol";

contract DeploySwapRouter is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy FeeManager first
        address feeRecipient = 0xef9BDacbf5cD84bc66ccAb2dc0c8BF22e221cB34; // Replace with actual fee recipient. The default one, shown here, is also the test owner
        FeeManager feeManager = new FeeManager(feeRecipient);

        // Deploy SwapRouter
        SwapRouter swapRouter = new SwapRouter(
            0xE592427A0AEce92De3Edee1F18E0157C05861564, // Uniswap Router address
            0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6, // WETH9 address
            address(feeManager), // FeeManager address
            0x61fFE014bA17989E743c5F6cB21bF9697530B21e, // Quoter address
            0x1F98431c8aD98523631AE4a59f267346ea31F984  // Factory address
        );

        console.log("FeeManager deployed at:", address(feeManager));
        console.log("SwapRouter deployed at:", address(swapRouter));

        vm.stopBroadcast();
    }
}
