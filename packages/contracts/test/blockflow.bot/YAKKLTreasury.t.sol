// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/blockflow.bot/YAKKLTreasury.sol";
import "../../src/blockflow.bot/YAKKL.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

contract YAKKLTreasuryTest is Test {
    YAKKLTreasury public treasury;
    YAKKL public yakklToken;
    ISwapRouter public swapRouter;
    address public owner;
    address public user1;
    address public user2;

    event LiquidityAdded(address indexed pool, uint256 tokenAmount, uint256 ethAmount);

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        // Deploy YAKKL token
        yakklToken = new YAKKL(owner, address(0));

        // Mock SwapRouter
        swapRouter = ISwapRouter(address(0x3));

        // Deploy YAKKLTreasury
        treasury = new YAKKLTreasury(
            IERC20(address(yakklToken)),
            payable(owner),
            swapRouter,
            address(0x4), // WETH address
            50, // liquidityPercentage
            50  // treasuryPercentage
        );

        // Set up roles
        treasury.grantRole(treasury.TREASURER_ROLE(), owner);
        treasury.grantRole(treasury.FEE_MANAGER_ROLE(), owner);

        // Fund the treasury with some YAKKL tokens
        yakklToken.transfer(address(treasury), 1000000 * 10**18);
    }

    function testCalculateFee() view public {
        uint256 amount = 1000 * 10**18;
        uint256 feeRate = 100; // 0.01%
        uint256 expectedFee = 100 * 10**15; // 0.01% of 1000 tokens
        assertEq(treasury.calculateFee(amount, feeRate), expectedFee);
    }

    function testDistributeFees() public {
        uint256 feeAmount = 1000 * 10**18;
        uint256 initialBalance = yakklToken.balanceOf(owner);
        
        treasury.distributeFees(feeAmount);

        uint256 expectedLiquidityAmount = feeAmount * treasury.liquidityPercentage() / 100;
        assertEq(yakklToken.balanceOf(owner), initialBalance + expectedLiquidityAmount);
    }

    function testAddLiquidity() public {
        uint256 tokenAmount = 1000 * 10**18;
        uint256 ethAmount = 1 ether;
        uint24 poolFee = 3000; // 0.3%
        address pool = address(0x7); // Mock pool address

        yakklToken.approve(address(treasury), tokenAmount);
        emit LiquidityAdded(pool, tokenAmount, ethAmount);
        vm.expectEmit(true, false, false, true);
        
        treasury.addLiquidity(tokenAmount, ethAmount, poolFee, pool);
    }

    function testAddApprovedPool() public {
        address pool = address(0x7);
        
        assertFalse(treasury.approvedPools(pool));
        
        treasury.addApprovedPool(pool);
        
        assertTrue(treasury.approvedPools(pool));
    }

    function testRemoveApprovedPool() public {
        address pool = address(0x7);
        
        treasury.addApprovedPool(pool);
        assertTrue(treasury.approvedPools(pool));
        
        treasury.removeApprovedPool(pool);
        assertFalse(treasury.approvedPools(pool));
    }

    function testAddLiquidityUnapprovedPool() public {
        uint256 tokenAmount = 1000 * 10**18;
        uint256 ethAmount = 1 ether;
        uint24 poolFee = 3000; // 0.3%
        address pool = address(0x7);

        yakklToken.approve(address(treasury), tokenAmount);
        
        vm.expectRevert("Pool not approved");
        treasury.addLiquidity(tokenAmount, ethAmount, poolFee, pool);
    }
    function testSetFeeRecipient() public {
        address newFeeRecipient = address(0x5);
        
        treasury.setFeeRecipient(newFeeRecipient);
        
        assertEq(treasury.feeRecipient(), newFeeRecipient);
    }

    function testSetSwapRouter() public {
        address newSwapRouter = address(0x6);
        
        treasury.setSwapRouter(ISwapRouter(newSwapRouter));
        
        assertEq(address(treasury.swapRouter()), newSwapRouter);
    }

    function testWithdrawToken() public {
        uint256 amount = 100 * 10**18;
        uint256 initialBalance = yakklToken.balanceOf(user1);
        
        treasury.withdrawToken(IERC20(address(yakklToken)), user1, amount);
        
        assertEq(yakklToken.balanceOf(user1), initialBalance + amount);
    }

    function testWithdrawETH() public {
        uint256 amount = 1 ether;
        payable(address(treasury)).transfer(amount);
        uint256 initialBalance = user1.balance;
        
        treasury.withdrawETH(payable(user1), amount);
        
        assertEq(user1.balance, initialBalance + amount);
    }

    function testPause() public {
        treasury.pause();
        assertTrue(treasury.paused());
    }

    function testUnpause() public {
        treasury.pause();
        treasury.unpause();
        assertFalse(treasury.paused());
    }

    function testUnauthorizedWithdraw() public {
        vm.prank(user1);
        vm.expectRevert("AccessControl: account 0x0000000000000000000000000000000000000001 is missing role 0x3496bfc4c0edac0a3a62e59f24a67d4bd39f4724c54b07f92811d2aea6c202cd");
        treasury.withdrawETH(payable(user1), 1 ether);
    }

    receive() external payable {}
}
