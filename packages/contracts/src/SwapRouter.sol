// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "./IFeeManager.sol";
import "forge-std/console.sol";

contract SwapRouter is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    ISwapRouter public immutable uniswapRouter;
    address public immutable WETH9;
    IFeeManager public feeManager;

    event SwapCompleted(address indexed user, uint256 amountIn, uint256 amountOut, uint256 fee);
    event TokensRescued(address indexed token, uint256 amount);
    event ETHRescued(uint256 amount);
    event FeeAdjusted(uint256 adjustedFee);
    event SwapRouterDeployed(address indexed contractAddress, address indexed owner);

    constructor(
        address _uniswapRouter,
        address _WETH9,
        address _feeManager
    ) Ownable(msg.sender) {
        require(_uniswapRouter != address(0), "Invalid Uniswap router");
        require(_WETH9 != address(0), "Invalid WETH9 address");
        require(_feeManager != address(0), "Invalid FeeManager address");

        uniswapRouter = ISwapRouter(_uniswapRouter);
        WETH9 = _WETH9;
        feeManager = IFeeManager(_feeManager);
        emit SwapRouterDeployed(address(this), msg.sender);
    }

    receive() external payable whenNotPaused {
        require(msg.value > 0, "Must send ETH");
    }

    function swapExactETHForTokensWithFee(
        address tokenOut,
        uint256 amountOutMin,
        address to,
        uint256 deadline,
        uint256 feeBasisPoints
    ) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Must send ETH");
        require(deadline >= block.timestamp, "Transaction too old");

        console.log("Swapping ETH for tokens with fee");
        console.log("ETH amount:", msg.value);

        // Perform the swap first
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: WETH9,
            tokenOut: tokenOut,
            fee: 3000,
            recipient: address(this),
            deadline: deadline,
            amountIn: msg.value,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = uniswapRouter.exactInputSingle{value: msg.value}(params);

        console.log("Received tokens:", amountOut);

        // Calculate the fee based on the final amount received
        uint256 fee = feeManager.calculateFee(amountOut, feeBasisPoints);
        uint256 amountAfterFee = amountOut - fee;

        console.log("Fee amount:", fee);
        console.log("Amount after fee:", amountAfterFee);

        if (amountAfterFee < amountOutMin) {
            revert("Insufficient output amount");
        }

        // Transfer the fee to the feeManager
        IERC20(tokenOut).safeTransfer(address(feeManager), fee);

        // Transfer the remaining tokens to the recipient
        IERC20(tokenOut).safeTransfer(to, amountAfterFee);

        // Distribute the fee
        feeManager.distributeFee(tokenOut);

        emit SwapCompleted(msg.sender, msg.value, amountAfterFee, fee);
    }

    function swapExactTokensForTokensWithFee(
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 amountOutMin,
        address to,
        uint256 deadline,
        uint256 feeBasisPoints
    ) external nonReentrant whenNotPaused {
        require(amountIn > 0, "Amount must be greater than 0");
        require(deadline >= block.timestamp, "Transaction too old");

        console.log("Swapping tokens for tokens with fee");
        console.log("Token input amount:", amountIn);

        // Perform the swap first
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).safeIncreaseAllowance(address(uniswapRouter), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: 3000,
            recipient: address(this),
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = uniswapRouter.exactInputSingle(params);

        console.log("Received tokens:", amountOut);

        // Calculate the fee based on the final amount received
        uint256 fee = feeManager.calculateFee(amountOut, feeBasisPoints);
        uint256 amountAfterFee = amountOut - fee;

        console.log("Fee amount:", fee);
        console.log("Amount after fee:", amountAfterFee);

        if (amountAfterFee < amountOutMin) {
            revert("Insufficient output amount");
        }

        // Transfer the fee to the feeManager
        IERC20(tokenOut).safeTransfer(address(feeManager), fee);

        // Transfer the remaining tokens to the recipient
        IERC20(tokenOut).safeTransfer(to, amountAfterFee);

        // Distribute the fee
        feeManager.distributeFee(tokenOut);

        emit SwapCompleted(msg.sender, amountIn, amountAfterFee, fee);
    }

    function rescueTokens(address token, uint256 amount) external onlyOwner whenNotPaused {
        IERC20(token).safeTransfer(owner(), amount);
        emit TokensRescued(token, amount);
    }

    function rescueETH(uint256 amount) external onlyOwner whenNotPaused {
        require(address(this).balance >= amount, "Insufficient ETH balance");
        payable(owner()).transfer(amount);
        emit ETHRescued(amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}

