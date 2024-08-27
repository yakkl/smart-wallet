// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/FeeManager.sol";

contract DeployFeeManager is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address feeRecipient = 0xef9BDacbf5cD84bc66ccAb2dc0c8BF22e221cB34; // Replace with actual fee recipient
        FeeManager feeManager = new FeeManager(feeRecipient);

        console.log("FeeManager deployed at:", address(feeManager));

        vm.stopBroadcast();
    }
}
