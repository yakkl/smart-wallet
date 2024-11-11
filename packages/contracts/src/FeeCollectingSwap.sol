// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FeeCollectingSwap {
    ISwapRouter public swapRouter;
    address public feeAccount;
    uint256 public platformFeeBps;

    constructor(ISwapRouter _swapRouter, address _feeAccount, uint256 _platformFeeBps) {
        swapRouter = _swapRouter;
        feeAccount = _feeAccount;
        platformFeeBps = _platformFeeBps;
    }

    function swapAndCollectFee(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint24 poolFee,
        uint256 deadline
    ) external {
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).approve(address(swapRouter), amountIn);

        // Perform the swap
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: poolFee,
            recipient: address(this), // Receive tokens in contract
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = swapRouter.exactInputSingle(params);

        // Calculate the platform fee in the buy token
        uint256 feeAmount = (amountOut * platformFeeBps) / 10000;

        // Transfer fee to fee account
        IERC20(tokenOut).transfer(feeAccount, feeAmount);

        // Transfer the remaining tokens to the user
        IERC20(tokenOut).transfer(msg.sender, amountOut - feeAmount);
    }
}
