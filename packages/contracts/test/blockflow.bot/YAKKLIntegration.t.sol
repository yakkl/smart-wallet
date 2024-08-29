// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../../src/blockflow.bot/YAKKL.sol";

contract YAKKLIntegrationTest is Test {
    YAKKL public yakkl;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        // Deploy the contract
        yakkl = new YAKKL(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266); // First address of the Anvil test accounts - change to your liking
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        // Fund some accounts for testing
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    function testTransferOnFork() public {
        uint256 initialBalance = yakkl.balanceOf(owner);
        uint256 transferAmount = 1000 * 10**18;

        yakkl.transfer(user1, transferAmount);

        assertEq(yakkl.balanceOf(user1), transferAmount);
        assertEq(yakkl.balanceOf(owner), initialBalance - transferAmount);
    }

    function testInteractionWithOtherContracts() public {
        // Here you could interact with other contracts on the forked mainnet
        // For example, swapping YAKKL tokens on Uniswap
    }
}
