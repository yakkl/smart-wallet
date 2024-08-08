// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

contract YAKKLSwapRouter is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    ISwapRouter public immutable uniswapRouter;
    address public immutable WETH9;
    address public feeRecipient;
    uint256 public feeBasisPoints;
    uint256 public constant MAX_FEE_BASIS_POINTS = 1000; // 10%
    uint256 public accumulatedFees;

    event SwapCompleted(address indexed user, uint256 amountIn, uint256 amountOut, uint256 fee);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event FeeBasisPointsUpdated(uint256 oldFeeBasisPoints, uint256 newFeeBasisPoints);
    event FeesWithdrawn(uint256 amount);
    event TokensRescued(address indexed token, uint256 amount);
    event ETHRescued(uint256 amount);

    constructor(address _uniswapRouter, address _WETH9, address _feeRecipient, uint256 _feeBasisPoints)
        Ownable(msg.sender)
    {
        require(_uniswapRouter != address(0), "Invalid Uniswap router");
        require(_WETH9 != address(0), "Invalid WETH9 address");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_feeBasisPoints <= MAX_FEE_BASIS_POINTS, "Fee too high");

        uniswapRouter = ISwapRouter(_uniswapRouter);
        WETH9 = _WETH9;
        feeRecipient = _feeRecipient;
        feeBasisPoints = _feeBasisPoints;
    }

    receive() external payable {}

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        emit FeeRecipientUpdated(feeRecipient, _feeRecipient);
        feeRecipient = _feeRecipient;
    }

    function setFeeBasisPoints(uint256 _feeBasisPoints) external onlyOwner {
        require(_feeBasisPoints <= MAX_FEE_BASIS_POINTS, "Fee too high");
        emit FeeBasisPointsUpdated(feeBasisPoints, _feeBasisPoints);
        feeBasisPoints = _feeBasisPoints;
    }

    function swapExactETHForTokensWithFee(address tokenOut, uint256 amountOutMin, address to, uint256 deadline) 
        external 
        payable 
        nonReentrant 
    {
        require(msg.value > 0, "Must send ETH");
        require(deadline >= block.timestamp, "Transaction too old");
        
        uint256 fee = (msg.value * feeBasisPoints) / 10000;
        uint256 amountAfterFee = msg.value - fee;
        
        accumulatedFees += fee;

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: WETH9,
            tokenOut: tokenOut,
            fee: 3000,
            recipient: to,
            deadline: deadline,
            amountIn: amountAfterFee,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = uniswapRouter.exactInputSingle{value: amountAfterFee}(params);

        emit SwapCompleted(msg.sender, msg.value, amountOut, fee);
    }

    function swapExactTokensForTokensWithFee(address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOutMin, address to, uint256 deadline) 
        external 
        nonReentrant 
    {
        require(amountIn > 0, "Amount must be greater than 0");
        require(deadline >= block.timestamp, "Transaction too old");
        
        uint256 fee = (amountIn * feeBasisPoints) / 10000;
        uint256 amountAfterFee = amountIn - fee;

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).safeIncreaseAllowance(address(uniswapRouter), amountAfterFee);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: 3000,
            recipient: to,
            deadline: deadline,
            amountIn: amountAfterFee,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = uniswapRouter.exactInputSingle(params);

        // Transfer fee to fee recipient
        IERC20(tokenIn).safeTransfer(feeRecipient, fee);

        emit SwapCompleted(msg.sender, amountIn, amountOut, fee);
    }

    function withdrawAccumulatedFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");
        accumulatedFees = 0;
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "ETH transfer failed");
        emit FeesWithdrawn(amount);
    }

    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
        emit TokensRescued(token, amount);
    }

    function rescueETH(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient ETH balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "ETH rescue failed");
        emit ETHRescued(amount);
    }
}
