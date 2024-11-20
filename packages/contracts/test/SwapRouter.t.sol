// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/SwapRouter.sol";
import "../src/FeeManager.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

contract SwapRouterTest is Test {
    SwapRouter public swapRouter;
    FeeManager public feeManager;
    address public constant UNISWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address public feeRecipient = address(0x123);
    uint256 public feeBasisPoints = 875; // 0.875% - .00875 decimal format

    function setUp() public {
        vm.createSelectFork(vm.envString("ETH_RPC_URL"));

        feeManager = new FeeManager(feeRecipient);
        swapRouter = new SwapRouter(
            UNISWAP_ROUTER,
            WETH9,
            address(feeManager),
            address(0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6), // Quoter address - mainnet or forked mainnet
            address(0x1F98431c8aD98523631AE4a59f267346ea31F984)  // Factory address - mainnet or forked mainnet 
        );

        // Reset balances before each test
        vm.deal(address(this), 0);
        vm.deal(address(swapRouter), 0);
        deal(DAI, address(this), 0);
        deal(DAI, address(swapRouter), 0);
        deal(USDC, address(this), 0);
        deal(USDC, address(swapRouter), 0);

        // Now set up the initial balances
        vm.deal(address(this), 1000 ether);
        vm.deal(address(swapRouter), 1000 ether);
        deal(DAI, address(this), 1000000 * 1e18);
        deal(DAI, address(swapRouter), 1000000 * 1e18);
        deal(USDC, address(this), 1000000 * 1e6);
        deal(USDC, address(swapRouter), 1000000 * 1e6);

        // Approve SwapRouter to spend tokens
        IERC20(DAI).approve(address(swapRouter), type(uint256).max);
        IERC20(USDC).approve(address(swapRouter), type(uint256).max);

        // Mock Uniswap router responses
        vm.mockCall(
            UNISWAP_ROUTER,
            abi.encodeWithSelector(ISwapRouter.exactInputSingle.selector),
            abi.encode(100000) // Mock return value for amountOut
        );
    }

    function testInitialState() public view {
        assertEq(address(swapRouter.uniswapRouter()), UNISWAP_ROUTER);
        assertEq(swapRouter.WETH9(), WETH9);
        assertEq(feeManager.feeRecipient(), feeRecipient);
    }

    function testSetFeeRecipient() public {
        address newFeeRecipient = address(0x456);
        vm.prank(feeManager.owner());
        feeManager.setFeeRecipient(newFeeRecipient);
        assertEq(feeManager.feeRecipient(), newFeeRecipient);
    }

    function testSwapExactETHForTokens() public {
        uint256 swapAmount = 1 ether;
        vm.deal(address(this), swapAmount);

        uint256 daiBalanceBefore = IERC20(DAI).balanceOf(address(this));
        uint256 feeRecipientDaiBalanceBefore = IERC20(DAI).balanceOf(feeRecipient);

        swapRouter.swapExactETHForTokens{value: swapAmount}(
            DAI,
            0,
            address(this),
            block.timestamp + 300,
            feeBasisPoints,
            3000
        );

        uint256 daiBalanceAfter = IERC20(DAI).balanceOf(address(this));
        uint256 daiReceived = daiBalanceAfter - daiBalanceBefore;
        uint256 feeRecipientDaiBalanceAfter = IERC20(DAI).balanceOf(feeRecipient);
        uint256 feeCollected = feeRecipientDaiBalanceAfter - feeRecipientDaiBalanceBefore;

        assertEq(address(this).balance, 0, "All ETH should be spent");
        assertGt(feeCollected, 0, "Fee should have been collected");
        assertGt(daiReceived, 0, "Should have received DAI");
        
        // Check that the mocked amount (100000) minus fee was received
        uint256 expectedAmountReceived = 100000 - feeManager.calculateFee(100000, feeBasisPoints);
        assertEq(daiReceived, expectedAmountReceived, "Should have received correct amount of DAI");
    }

function testSwapExactTokensForTokens() public {
    uint256 swapAmount = 500000 * 1e18; // 500,000 DAI
    deal(DAI, address(this), swapAmount);

    IERC20(DAI).approve(address(swapRouter), type(uint256).max);

    uint256 usdcBalanceBefore = IERC20(USDC).balanceOf(address(this));
    uint256 feeRecipientBalanceBefore = IERC20(USDC).balanceOf(feeRecipient);

    swapRouter.swapExactTokensForTokens(
        DAI,
        swapAmount,
        USDC,
        0,
        address(this),
        block.timestamp + 300,
        feeBasisPoints,
        3000
    );

    uint256 usdcBalanceAfter = IERC20(USDC).balanceOf(address(this));
    uint256 usdcReceived = usdcBalanceAfter - usdcBalanceBefore;
    uint256 feeRecipientBalanceAfter = IERC20(USDC).balanceOf(feeRecipient);
    uint256 feeCollected = feeRecipientBalanceAfter - feeRecipientBalanceBefore;

    assertGt(usdcReceived, 0, "Should have received USDC");
    assertEq(IERC20(DAI).balanceOf(address(this)), 0, "All DAI should be spent");
    assertGt(feeCollected, 0, "Fee recipient should have received USDC");

    // Check that the mocked amount (100000) minus fee was received
    uint256 expectedAmountReceived = 100000 - feeManager.calculateFee(100000, feeBasisPoints);
    assertEq(usdcReceived, expectedAmountReceived, "Should have received correct amount of USDC");
}

    function testFailSwapWithInsufficientBalance() public {
        uint256 swapAmount = 10 ether;
        vm.deal(address(this), 1 ether); // Not enough ETH

        vm.expectRevert("Must send ETH");
        swapRouter.swapExactETHForTokens{value: swapAmount}(
            DAI,
            0,
            address(this),
            block.timestamp + 300,
            feeBasisPoints,
            3000
        );
    }

    function testSwapWithExpiredDeadline() public {
        uint256 swapAmount = 1 ether;
        vm.deal(address(this), swapAmount);

        // Set the block timestamp to a future value
        vm.warp(block.timestamp + 1 hours);

        vm.expectRevert("Transaction too old");
        swapRouter.swapExactETHForTokens{value: swapAmount}(
            DAI,
            0,
            address(this),
            block.timestamp - 1, // expired deadline
            feeBasisPoints,
            3000
        );
    }

    function testRescueETH() public {
    uint256 amount = 1 ether;
    
    // Send ETH to the FeeManager contract
    vm.deal(address(feeManager), amount);

    address owner = feeManager.owner();
    uint256 ownerBalanceBefore = owner.balance;
    uint256 contractBalanceBefore = address(feeManager).balance;

    assertEq(contractBalanceBefore, amount, "Contract should have received ETH");

    vm.prank(owner);
    feeManager.rescueETH(amount);

    uint256 ownerBalanceAfter = owner.balance;
    uint256 contractBalanceAfter = address(feeManager).balance;

    assertEq(ownerBalanceAfter - ownerBalanceBefore, amount, "Owner should receive rescued ETH");
    assertEq(contractBalanceAfter, 0, "Contract balance should be zero after rescue");
}

    function testWithdrawAccumulatedFees() public {
    uint256 swapAmount = 1 ether;
    vm.deal(address(this), swapAmount);

    uint256 feeRecipientBalanceBefore = IERC20(DAI).balanceOf(feeRecipient);

    swapRouter.swapExactETHForTokens{value: swapAmount}(
        DAI,
        0,
        address(this),
        block.timestamp + 300,
        feeBasisPoints,
        3000
    );

    uint256 feeRecipientBalanceAfter = IERC20(DAI).balanceOf(feeRecipient);
    uint256 feeCollected = feeRecipientBalanceAfter - feeRecipientBalanceBefore;

    assertGt(feeCollected, 0, "Should have accumulated fees");
}
    receive() external payable {}
}

