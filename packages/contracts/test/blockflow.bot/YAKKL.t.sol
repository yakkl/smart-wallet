// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../../src/blockflow.bot/YAKKL.sol";
import "../../src/FeeManager.sol";

contract YAKKLTest is Test {
    YAKKL public yakkl;
    FeeManager public feeManager;
    address public owner;
    address public user1;
    address public user2;

    uint256 private constant INITIAL_SUPPLY = 500_000_000 * 10**18;
    uint256 private constant MAX_SUPPLY = 1_000_000_000 * 10**18;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        feeManager = new FeeManager(owner);
        yakkl = new YAKKL(owner, address(feeManager));
    }

    function testInitialSupply() public view {
        assertEq(yakkl.totalSupply(), INITIAL_SUPPLY);
        assertEq(yakkl.balanceOf(owner), INITIAL_SUPPLY);
    }

    function testMint() public {
        uint256 amountToMint = 1_000_000 * 10**18;
        yakkl.mint(user1, amountToMint);
        assertEq(yakkl.balanceOf(user1), amountToMint);
        assertEq(yakkl.totalSupply(), INITIAL_SUPPLY + amountToMint);
    }

    function testMintExceedsMaxSupply() public {
        uint256 amountToMint = MAX_SUPPLY;
        vm.expectRevert("Exceeds max supply");
        yakkl.mint(user1, amountToMint);
    }

    function testBurn() public {
        uint256 amountToBurn = 1_000_000 * 10**18;
        yakkl.burn(amountToBurn);
        assertEq(yakkl.balanceOf(owner), INITIAL_SUPPLY - amountToBurn);
        assertEq(yakkl.totalSupply(), INITIAL_SUPPLY - amountToBurn);
        assertEq(yakkl.totalBurned(), amountToBurn);
    }

    function testBurnFrom() public {
        uint256 amountToBurn = 1_000_000 * 10**18;
        yakkl.approve(user1, amountToBurn);
        vm.prank(user1);
        yakkl.burnFrom(owner, amountToBurn);
        assertEq(yakkl.balanceOf(owner), INITIAL_SUPPLY - amountToBurn);
        assertEq(yakkl.totalSupply(), INITIAL_SUPPLY - amountToBurn);
        assertEq(yakkl.totalBurned(), amountToBurn);
    }

    function testBlacklist() public {
        address[] memory accounts = new address[](1);
        accounts[0] = user1;
        bool[] memory statuses = new bool[](1);
        statuses[0] = true;
        yakkl.updateBlacklist(accounts, statuses);
        assertTrue(yakkl.isBlacklisted(user1));
    }

    function testUnBlacklist() public {
        address[] memory accounts = new address[](1);
        accounts[0] = user1;
        bool[] memory statuses = new bool[](1);
        statuses[0] = true;
        yakkl.updateBlacklist(accounts, statuses);
        assertTrue(yakkl.isBlacklisted(user1));
        
        statuses[0] = false;
        yakkl.updateBlacklist(accounts, statuses);
        assertFalse(yakkl.isBlacklisted(user1));
    }

    function testTransferToBlacklisted() public {
        address[] memory accounts = new address[](1);
        accounts[0] = user1;
        bool[] memory statuses = new bool[](1);
        statuses[0] = true;
        yakkl.updateBlacklist(accounts, statuses);
        vm.expectRevert("Address is blacklisted");
        yakkl.transfer(user1, 1000);
    }

    function testTransferFromBlacklisted() public {
        yakkl.transfer(user1, 1000);
        address[] memory accounts = new address[](1);
        accounts[0] = user1;
        bool[] memory statuses = new bool[](1);
        statuses[0] = true;
        yakkl.updateBlacklist(accounts, statuses);
        vm.prank(user1);
        vm.expectRevert("Address is blacklisted");
        yakkl.transfer(user2, 500);
    }

    function testPause() public {
        yakkl.pause();
        assertTrue(yakkl.paused());
        
        vm.expectRevert("Pausable: paused");
        yakkl.transfer(user1, 1000);
    }

    function testUnpause() public {
        yakkl.pause();
        yakkl.unpause();
        assertFalse(yakkl.paused());
        yakkl.transfer(user1, 1000);
        assertEq(yakkl.balanceOf(user1), 1000);
    }

    function testSetFeeRates() public {
        uint256[] memory lowerBounds = new uint256[](2);
        uint256[] memory upperBounds = new uint256[](2);
        uint256[] memory rates = new uint256[](2);

        lowerBounds[0] = 0;
        upperBounds[0] = 1000 * 10**18;
        rates[0] = 100; // 1%

        lowerBounds[1] = 1000 * 10**18;
        upperBounds[1] = type(uint256).max;
        rates[1] = 50; // 0.5%

        yakkl.setFeeRates(lowerBounds, upperBounds, rates);

        assertEq(yakkl.getFeeRate(500 * 10**18), 100);
        assertEq(yakkl.getFeeRate(1500 * 10**18), 50);
    }

    function testVesting() public {
        uint256 vestingAmount = 1_000_000 * 10**18;
        uint256 vestingDuration = 365 days;
        uint256 cliffDuration = 30 days;

        yakkl.setVestingSchedule(user1, vestingAmount, vestingDuration, cliffDuration);

        (uint256 totalAmount, uint256 releasedAmount, uint256 vestedAmount, uint256 claimableAmount, , , ) = yakkl.getVestingInfo(user1);

        assertEq(totalAmount, vestingAmount);
        assertEq(releasedAmount, 0);
        assertEq(vestedAmount, 0);
        assertEq(claimableAmount, 0);

        // Fast forward to after cliff period
        vm.warp(block.timestamp + cliffDuration + 1);

        (, , vestedAmount, claimableAmount, , , ) = yakkl.getVestingInfo(user1);
        assertGt(vestedAmount, 0);
        assertGt(claimableAmount, 0);

        // Claim vested tokens
        vm.prank(user1);
        yakkl.claimVestedTokens();

        (, releasedAmount, , , , , ) = yakkl.getVestingInfo(user1);
        assertGt(releasedAmount, 0);
    }
}
