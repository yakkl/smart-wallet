// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../../src/blockflow.bot/YAKKL.sol";
import "../../src/FeeManager.sol";

contract DeployYAKKL is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("LOCAL_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

       address defaultAdmin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // First address of the Anvil test accounts - change to your own address
        
        // Deploy FeeManager first
        FeeManager feeManager = new FeeManager(defaultAdmin);
        
        // Then deploy YAKKL with the FeeManager address
        YAKKL yakkl = new YAKKL(defaultAdmin, address(feeManager));

        // Use the deployed contract
        console.log("FeeManager deployed at:", address(feeManager));
        console.log("YAKKL deployed at:", address(yakkl));
        console.log("Initial supply:", yakkl.totalSupply());
        vm.stopBroadcast();
    }
}
