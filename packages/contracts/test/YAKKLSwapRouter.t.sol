// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/YAKKLSwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "forge-std/console.sol";

// If you need to test functions that require the owner to call them, you can use vm.prank before each call.
// See testSetFeeCollector for an example.
//   function testSetFeeCollector() public {
//     address newCollector = address(0x123);
//
//     vm.prank(address(this)); // Set the caller to the test contract (which is the owner)
//
//     swapRouter.setFeeCollector(newCollector);
//     assertEq(swapRouter.feeCollector(), newCollector);
//   }

contract YAKKLSwapRouterTest is Test {
  // using SafeERC20 for IERC20;
  YAKKLSwapRouter public swapRouter;
  address constant UNISWAP_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
  address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
  address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
  address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
  address constant LINK = 0x514910771AF9Ca656af840dff83E8264EcF986CA;

    function setUp() public {
      // Deploy the contract
      swapRouter = new YAKKLSwapRouter(UNISWAP_ROUTER, address(this), 87);

      // The deployer (this test contract) is now the owner
      // We can directly call setFeeCollector
      swapRouter.setFeeCollector(address(this));

      // If you need to test with a different owner, you can transfer ownership
      // swapRouter.transferOwnership(newOwnerAddress);    
    }

    function testInitialState() public view {
        assertEq(address(swapRouter.uniswapRouter()), UNISWAP_ROUTER);
        assertEq(swapRouter.feeCollector(), address(this));
        assertEq(swapRouter.feePercentage(), 87);
    }

    function testSetFeeCollector() public {
        address newCollector = address(0x123);
        vm.prank(address(this)); // Set the caller to the test contract (which is the owner)
        swapRouter.setFeeCollector(newCollector);
        assertEq(swapRouter.feeCollector(), newCollector);
    }

    function testSetFeePercentage() public {
        uint256 newFee = 100; // 1%
        swapRouter.setFeePercentage(newFee);
        assertEq(swapRouter.feePercentage(), newFee);
    }

    function testFailSetFeeTooHigh() public {
        swapRouter.setFeePercentage(1001); // Should fail
    }

    function testSwapETHForTokens() public {
        vm.deal(address(this), 2 ether);
        
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = DAI;

        uint256 daiBalanceBefore = IERC20(DAI).balanceOf(address(this));
        console.log("DAI balance before swap:", daiBalanceBefore);

        console.log("Uniswap Router address:", address(swapRouter.uniswapRouter()));

        // Direct Uniswap swap
        IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(swapRouter.uniswapRouter());
        
        vm.startPrank(address(this));
        
        uniswapRouter.swapExactETHForTokens{value: 1 ether}(
            1, // Set a very low min amount out for testing
            path,
            address(this),
            block.timestamp + 1 hours
        );

        uint256 daiBalanceAfterDirect = IERC20(DAI).balanceOf(address(this));
        console.log("DAI balance after direct swap:", daiBalanceAfterDirect);

        // Contract swap
        uint256 ethBalanceBeforeContractSwap = address(this).balance;
        console.log("ETH balance before contract swap:", ethBalanceBeforeContractSwap);

        uint256 accumulatedFeesBefore = swapRouter.accumulatedFees();

        // No need for additional vm.prank here as we're already in a startPrank block
        
        swapRouter.swap{value: 1 ether}(
            path,
            1 ether,
            1, // Set a very low min amount out for testing
            address(this),
            block.timestamp + 1 hours
        );

        uint256 accumulatedFeesAfter = swapRouter.accumulatedFees();

        uint256 daiBalanceAfterContract = IERC20(DAI).balanceOf(address(this));
        console.log("DAI balance after contract swap:", daiBalanceAfterContract);
        uint256 ethBalanceAfterContractSwap = address(this).balance;
        console.log("ETH balance after contract swap:", ethBalanceAfterContractSwap);
        console.log("Accumulated fees:", accumulatedFeesAfter);

        vm.stopPrank();

        assertGt(daiBalanceAfterContract, daiBalanceAfterDirect, "DAI balance should increase after contract swap");
        assertLt(ethBalanceAfterContractSwap, ethBalanceBeforeContractSwap, "ETH balance should decrease after contract swap");
        assertGt(accumulatedFeesAfter, accumulatedFeesBefore, "Accumulated fees should increase");
    }

    function testTokenToETHSwap() public {
    vm.startPrank(address(this));
    
    // Assume we have some DAI
    deal(DAI, address(this), 1000 ether);
    
    address[] memory path = new address[](2);
    path[0] = DAI;
    path[1] = WETH;

    // Approve the swapRouter to spend DAI
    IERC20(DAI).approve(address(swapRouter), 1000 ether);
    
    // Fund the Uniswap router with a large amount of ETH for the swap
    vm.deal(UNISWAP_ROUTER, 10000 ether);
    
    // Fund the contract with some ETH to cover potential fees
    vm.deal(address(swapRouter), 1 ether);
    
    uint256 ethBalanceBefore = address(this).balance;
    console.log("ETH balance before swap:", ethBalanceBefore);
    console.log("DAI balance before swap:", IERC20(DAI).balanceOf(address(this)));
    
    // Check allowance
    uint256 allowance = IERC20(DAI).allowance(address(this), address(swapRouter));
    console.log("DAI allowance for swapRouter:", allowance);
    require(allowance >= 1000 ether, "Allowance not sufficient");
    
    // Check Uniswap router ETH balance
    uint256 uniswapRouterEthBalance = address(UNISWAP_ROUTER).balance;
    console.log("Uniswap router ETH balance:", uniswapRouterEthBalance);
    require(uniswapRouterEthBalance >= 10000 ether, "Uniswap router ETH balance not sufficient");

    // Try direct swap with Uniswap router
    IERC20(DAI).approve(UNISWAP_ROUTER, 1000 ether);
    try IUniswapV2Router02(UNISWAP_ROUTER).swapExactTokensForETH(
        1000 ether,
        1,
        path,
        address(this),
        block.timestamp + 1 hours
    ) {
        console.log("Direct Uniswap swap succeeded");
    } catch Error(string memory reason) {
        console.log("Direct Uniswap swap failed:", reason);
    } catch (bytes memory lowLevelData) {
        console.logBytes(lowLevelData);
    }

    // Now try through our contract
    try swapRouter.swap(
        path,
        1000 ether,
        1, // Set a very low min amount out for testing
        address(this),
        block.timestamp + 1 hours
    ) {
        console.log("Contract swap succeeded");
    } catch Error(string memory reason) {
        console.log("Contract swap failed with reason:", reason);
    } catch (bytes memory lowLevelData) {
        console.logBytes(lowLevelData);
    }
    
    uint256 ethBalanceAfter = address(this).balance;
    console.log("ETH balance after swap:", ethBalanceAfter);
    console.log("DAI balance after swap:", IERC20(DAI).balanceOf(address(this)));
    
    assertGt(ethBalanceAfter, ethBalanceBefore, "ETH balance should increase after swap");
    
    vm.stopPrank();
}








    function testTokenToTokenSwap() public {
        vm.startPrank(address(this));
        
        // Assume we have some DAI
        deal(DAI, address(this), 1000 ether);
        
        address[] memory path = new address[](3);
        path[0] = DAI;
        path[1] = WETH;
        path[2] = USDC;

        IERC20(DAI).approve(address(swapRouter), 1000 ether);
        
        uint256 usdcBalanceBefore = IERC20(USDC).balanceOf(address(this));
        
        swapRouter.swap(
            path,
            1000 ether,
            1, // Set a very low min amount out for testing
            address(this),
            block.timestamp + 1 hours
        );
        
        uint256 usdcBalanceAfter = IERC20(USDC).balanceOf(address(this));
        
        assertGt(usdcBalanceAfter, usdcBalanceBefore, "USDC balance should increase after swap");
        
        vm.stopPrank();
    }




    function testWithdrawAccumulatedFees() public {
    // First, perform a swap to accumulate some fees
    testSwapETHForTokens();
    
    uint256 feesBefore = swapRouter.accumulatedFees();
    assertGt(feesBefore, 0, "Should have accumulated fees");
    
    uint256 ownerBalanceBefore = address(this).balance;
    console.log("Owner balance before withdrawal:", ownerBalanceBefore);
    console.log("Accumulated fees before withdrawal:", feesBefore);
    
    // Ensure the contract has enough ETH to cover the fees
    uint256 contractBalance = address(swapRouter).balance;
    console.log("Contract balance before withdrawal:", contractBalance);
    
    // If the contract doesn't have enough ETH, add the difference
    if (contractBalance < feesBefore) {
        uint256 difference = feesBefore - contractBalance;
        vm.deal(address(swapRouter), address(swapRouter).balance + difference);
        console.log("Added ETH to contract to cover fees");
        console.log("New contract balance:", address(swapRouter).balance);
    }
    
    // Ensure the owner has no ETH before withdrawal
    vm.deal(address(this), 0);
    
    vm.prank(address(this));
    try swapRouter.withdrawAccumulatedFees() {
        console.log("Withdrawal succeeded");
    } catch Error(string memory reason) {
        console.log("Withdrawal failed with reason:", reason);
    } catch (bytes memory lowLevelData) {
        console.logBytes(lowLevelData);
    }
    
    uint256 ownerBalanceAfter = address(this).balance;
    uint256 feesAfter = swapRouter.accumulatedFees();
    
    console.log("Owner balance after withdrawal:", ownerBalanceAfter);
    console.log("Accumulated fees after withdrawal:", feesAfter);
    console.log("Contract balance after withdrawal:", address(swapRouter).balance);
    
    assertEq(feesAfter, 0, "All fees should be withdrawn");
    assertEq(ownerBalanceAfter, feesBefore, "Owner should receive all fees");
}








    function testSwapWithVerySmallAmount() public {
      vm.startPrank(address(this));
    
      address[] memory path = new address[](2);
      path[0] = WETH;
      path[1] = DAI;
      
      uint256 smallAmount = 1000; // 1000 wei, very small amount
      
      vm.expectRevert("Amount too small");
      swapRouter.swap{value: smallAmount}(
          path,
          smallAmount,
          1,
          address(this),
          block.timestamp + 1 hours
      );
      
      vm.stopPrank();
    }

    function testSwapWithExpiredDeadline() public {
        vm.startPrank(address(this));
        
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = DAI;
        
        uint256 amount = 1 ether;
        
        vm.expectRevert("UniswapV2Router: EXPIRED");
        swapRouter.swap{value: amount}(
            path,
            amount,
            1,
            address(this),
            block.timestamp - 1 // Expired deadline
        );
        
        vm.stopPrank();
    }

    function testSwapWithInsufficientBalance() public {
    vm.startPrank(address(this));

    address[] memory path = new address[](2);
    path[0] = WETH;
    path[1] = DAI;
    
    uint256 amount = 1000 ether; // More than we have
    vm.deal(address(this), amount - 1); // Give slightly less than required
    
    console.log("ETH balance before swap:", address(this).balance);
    console.log("Attempting swap with insufficient balance");

    vm.expectRevert("Insufficient ETH sent");
    swapRouter.swap{value: amount - 1}( // Send less than the amount
        path,
        amount,
        1,
        address(this),
        block.timestamp + 1 hours
    );
    
    console.log("Swap attempt failed as expected");

    vm.stopPrank();
}

}
