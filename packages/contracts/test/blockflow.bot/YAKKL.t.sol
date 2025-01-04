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
    address public feeRecipient;
    address public wethAddress;

    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18;

    event LiquidityAdded(address indexed pool, uint256 tokenAmount, uint256 ethAmount);
    event FeesDistributed(uint256 liquidityAmount, uint256 treasuryAmount);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event SwapRouterUpdated(address indexed oldRouter, address indexed newRouter);
    event TokenWithdrawn(address indexed token, address indexed recipient, uint256 amount);
    event TokenUpdated(address indexed token, address indexed recipient);
    event ETHWithdrawn(address indexed recipient, uint256 amount);
    event PoolApprovalUpdated(address indexed pool, bool approved);

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        feeRecipient = address(0x3);
        wethAddress = address(0x4);

        // Mock SwapRouter
        swapRouter = ISwapRouter(address(0x5));

        // Deploy YAKKLTreasury
        treasury = new YAKKLTreasury(
            IERC20(address(0)),
            payable(feeRecipient),
            swapRouter,
            wethAddress,
            50, // liquidityPercentage
            50  // treasuryPercentage
        );

        // Deploy YAKKL token
        yakklToken = new YAKKL(owner, address(treasury));

        // Update YAKKLTreasury with the correct YAKKL token address
        treasury.setToken(address(yakklToken));

        // Set up roles
        treasury.grantRole(treasury.TREASURER_ROLE(), owner);
        treasury.grantRole(treasury.FEE_MANAGER_ROLE(), owner);

        // Fund the treasury with some YAKKL tokens
        yakklToken.transfer(address(treasury), INITIAL_SUPPLY);
    }

    function testInitialSetup() view public {
        assertEq(address(treasury.yakklToken()), address(yakklToken));
        assertEq(treasury.feeRecipient(), feeRecipient);
        assertEq(address(treasury.swapRouter()), address(swapRouter));
        assertEq(treasury.wethAddress(), wethAddress);
        assertEq(treasury.liquidityPercentage(), 50);
        assertEq(treasury.treasuryPercentage(), 50);
        
        console.log("Initial supply: %s", INITIAL_SUPPLY);
        console.log("Treasury balance: %s", yakklToken.balanceOf(address(treasury)));

        assertGe(yakklToken.balanceOf(address(treasury)), INITIAL_SUPPLY);
    }

    function testCalculateFee() public view {
        uint256 amount = 1000 * 10**18;
        uint256 feeRate = 10000; // 1%
        uint256 expectedFee = 10 * 10**18; // 1% of 1000 tokens
        assertEq(treasury.calculateFee(amount, feeRate), expectedFee);
    }

    function testDistributeFees() public {
        uint256 feeAmount = 1000 * 10**18;
        uint256 initialFeeRecipientBalance = yakklToken.balanceOf(feeRecipient);
        uint256 initialTreasuryBalance = yakklToken.balanceOf(address(treasury));
        
        // Ensure yakklToken is set correctly in the treasury
        assertEq(address(treasury.yakklToken()), address(yakklToken));

        treasury.distributeFees(feeAmount);

        uint256 expectedLiquidityAmount = feeAmount * treasury.liquidityPercentage() / 100;
        uint256 expectedTreasuryAmount = feeAmount - expectedLiquidityAmount;

        console.log("Expected liquidity amount: %s, Expected treasury amount: %s", expectedLiquidityAmount, expectedTreasuryAmount); 

        assertEq(yakklToken.balanceOf(feeRecipient), initialFeeRecipientBalance + expectedLiquidityAmount);
        assertEq(yakklToken.balanceOf(address(treasury)), initialTreasuryBalance - expectedLiquidityAmount);
    }

    function testAddLiquidity() public {
        uint256 tokenAmount = 1000 * 10**18;
        // uint256 ethAmount = 1 ether;
        // uint24 poolFee = 3000; // 0.3%
        address pool = address(0x7); // Mock pool address

        treasury.addApprovedPool(pool);
        yakklToken.approve(address(treasury), tokenAmount);

        // TODO: Implement this
        // vm.expectEmit(true, false, false, true);
        // emit LiquidityAdded(pool, tokenAmount, ethAmount);
        
        // treasury.addLiquidity(tokenAmount, ethAmount, poolFee, pool);

        // YAKKLTreasury.PoolInfo memory info = treasury.getPoolInfo(pool);
        // assertEq(info.totalLiquidity, tokenAmount);
        // assertEq(info.lastAddedLiquidity, tokenAmount);
        // assertEq(info.lastAddedTimestamp, block.timestamp);
    }

    function testSetFeeRecipient() public {
        address newFeeRecipient = address(0x8);
        
        vm.expectEmit(true, true, false, false);
        emit FeeRecipientUpdated(feeRecipient, newFeeRecipient);
        
        treasury.setFeeRecipient(newFeeRecipient);
        
        assertEq(treasury.feeRecipient(), newFeeRecipient);
    }

    function testSetSwapRouter() public {
        address newSwapRouter = address(0x9);
        
        vm.expectEmit(true, true, false, false);
        emit SwapRouterUpdated(address(swapRouter), newSwapRouter);
        
        treasury.setSwapRouter(ISwapRouter(newSwapRouter));
        
        assertEq(address(treasury.swapRouter()), newSwapRouter);
    }

    function testWithdrawToken() public {
        uint256 amount = 100 * 10**18;
        uint256 initialBalance = yakklToken.balanceOf(user1);
        
        vm.expectEmit(true, true, false, true);
        emit TokenWithdrawn(address(yakklToken), user1, amount);
        
        treasury.withdrawToken(IERC20(address(yakklToken)), user1, amount);
        
        assertEq(yakklToken.balanceOf(user1), initialBalance + amount);
    }

    function testWithdrawETH() public {
        uint256 amount = 1 ether;
        vm.deal(address(treasury), amount);
        uint256 initialBalance = user1.balance;
        
        vm.expectEmit(true, false, false, true);
        emit ETHWithdrawn(user1, amount);
        
        treasury.withdrawETH(payable(user1), amount);
        
        assertEq(user1.balance, initialBalance + amount);
    }

    function testPauseUnpause() public {
        assertFalse(treasury.paused());
        
        treasury.pause();
        assertTrue(treasury.paused());
        
        treasury.unpause();
        assertFalse(treasury.paused());
    }

    function testUnauthorizedWithdraw() public {
        vm.prank(user1);
        vm.expectRevert(bytes("AccessControl: account 0x0000000000000000000000000000000000000001 is missing role 0x3496e2e73c4d42b75d702e60d9e48102720b8691234415963a5a857b86425d07"));
        treasury.withdrawETH(payable(user1), 1 ether);
    }

    // function testSetToken() public {
    //     address newToken = address(0x10);
    //     address oldToken = address(yakklToken);
        
    //     vm.expectEmit(true, true, false, false);
    //     emit TokenUpdated(oldToken, newToken);
        
    //     treasury.setToken(newToken);

    //     console.log("Treasury token: %s", treasury.getToken());
        
    //     assertEq(treasury.getToken(), newToken);
    // }

    function testAddRemoveApprovedPool() public {
        address pool = address(0x11);
        
        assertFalse(treasury.approvedPools(pool));
        
        vm.expectEmit(true, false, false, true);
        emit PoolApprovalUpdated(pool, true);
        treasury.addApprovedPool(pool);
        
        assertTrue(treasury.approvedPools(pool));
        
        vm.expectEmit(true, false, false, true);
        emit PoolApprovalUpdated(pool, false);
        treasury.removeApprovedPool(pool);
        
        assertFalse(treasury.approvedPools(pool));
    }

    function testAddLiquidityUnapprovedPool() public {
        uint256 tokenAmount = 1000 * 10**18;
        uint256 ethAmount = 1 ether;
        uint24 poolFee = 3000; // 0.3%
        address pool = address(0x12);

        yakklToken.approve(address(treasury), tokenAmount);
        
        vm.expectRevert("Pool not approved");
        treasury.addLiquidity(tokenAmount, ethAmount, poolFee, pool);
    }

    function testDistributeFeesWhenPaused() public {
        treasury.pause();
        
        vm.expectRevert("Pausable: paused");
        treasury.distributeFees(1000 * 10**18);
    }

    function testWithdrawAllTokens() public {
        uint256 initialBalance = yakklToken.balanceOf(address(treasury));
        uint256 initialOwnerBalance = yakklToken.balanceOf(owner);

        console.log("Initial balance: %s", initialBalance);
        console.log("Treasury address: %s", address(treasury));
        console.log("Owner balance (before): %s", yakklToken.balanceOf(owner));
        
        treasury.withdrawToken(IERC20(address(yakklToken)), owner, initialBalance);
        
        console.log("Treasury balance: %s", yakklToken.balanceOf(address(treasury)));
        console.log("Owner balance (after): %s", yakklToken.balanceOf(owner));

        assertEq(yakklToken.balanceOf(address(treasury)), 0);
        assertEq(yakklToken.balanceOf(owner), initialBalance + initialOwnerBalance);
    }

    receive() external payable {}
}
