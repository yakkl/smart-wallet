// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../../src/blockflow.bot/YAKKL.sol";
import "../../src/FeeManager.sol";

contract YAKKLIntegrationTest is Test {
    YAKKL public yakkl;
    FeeManager public feeManager;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
    console.log("Setting up YAKKL Integration test...");
    owner = address(this);
    user1 = address(0x1);
    user2 = address(0x2);
    
    console.log("Deploying FeeManager...");
    feeManager = new FeeManager(owner);
    
    console.log("Deploying YAKKL...");
    yakkl = new YAKKL(owner, address(feeManager));
    
    console.log("Funding test accounts...");
    vm.deal(user1, 100 ether);
    vm.deal(user2, 100 ether);

    console.log("Initial supply:", yakkl.totalSupply());
    
    console.log("Granting MINTER_ROLE to owner...");
    yakkl.grantRole(yakkl.MINTER_ROLE(), owner);
    
    console.log("Minting tokens to owner...");
    yakkl.mint(owner, 10_000_000 * 10**18);
    
    console.log("Transferring tokens to user1...");
    yakkl.transfer(user1, 1_000_000 * 10**18);
    
    console.log("Transferring tokens to user2...");
    yakkl.transfer(user2, 1_000_000 * 10**18);
    
    console.log("YAKKL Integration test setup complete.");
}

    function testTransferOnFork() public {
        uint256 initialBalance = yakkl.balanceOf(user1);
        uint256 transferAmount = 1000 * 10**18;

        vm.prank(user1);
        yakkl.transfer(user2, transferAmount);

        uint256 feeRate = yakkl.getFeeRate(transferAmount);
        uint256 fee = (transferAmount * feeRate) / 10000; // Assuming fee is in basis points
        uint256 expectedReceivedAmount = transferAmount - fee;

        assertEq(yakkl.balanceOf(user2), 1_000_000 * 10**18 + expectedReceivedAmount, "Incorrect recipient balance");
        assertEq(yakkl.balanceOf(user1), initialBalance - transferAmount, "Incorrect sender balance");
    }

    function testInteractionWithOtherContracts() public {
        // Here you could interact with other contracts on the forked mainnet
        // For example, swapping YAKKL tokens on Uniswap
        // This is a placeholder for future implementation
    }
}
