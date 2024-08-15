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


// pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/utils/Pausable.sol";
// import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
// import "./FeeManager.sol";



// contract SwapRouter is ReentrancyGuard, Ownable, Pausable {
//     using SafeERC20 for IERC20;

//     ISwapRouter public immutable uniswapRouter;
//     address public immutable WETH9;
//     FeeManager public feeManager;

//     event SwapCompleted(address indexed user, uint256 amountIn, uint256 amountOut, uint256 fee);
//     event TokensRescued(address indexed token, uint256 amount);
//     event ETHRescued(uint256 amount);
//     event Debug(uint256 amountIn, uint256 amountOutMin, uint256 amountAfterFee, uint256 fee);


//     constructor(
//         address _uniswapRouter,
//         address _WETH9,
//         address _feeManager
//     ) Ownable(msg.sender) {
//         require(_uniswapRouter != address(0), "Invalid Uniswap router");
//         require(_WETH9 != address(0), "Invalid WETH9 address");
//         require(_feeManager != address(0), "Invalid FeeManager address");

//         uniswapRouter = ISwapRouter(_uniswapRouter);
//         WETH9 = _WETH9;
//         feeManager = FeeManager(_feeManager);
//     }

//     receive() external payable whenNotPaused {
//         require(msg.value > 0, "Must send ETH");
//     }

//     function swapExactETHForTokensWithFee(
//         address tokenOut,
//         uint256 amountOutMin,
//         address to,
//         uint256 deadline,
//         uint256 feeBasisPoints
//     ) external payable nonReentrant whenNotPaused {
//         require(msg.value > 0, "Must send ETH");
//         require(deadline >= block.timestamp, "Transaction too old");

//         uint256 fee = feeManager.calculateAndDistributeFee{value: msg.value}(msg.value, feeBasisPoints);
//         uint256 amountAfterFee = msg.value - fee;

//         emit Debug(msg.value, amountOutMin, amountAfterFee, fee); // Debug event

//         ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
//             tokenIn: WETH9,
//             tokenOut: tokenOut,
//             fee: 3000,
//             recipient: to,
//             deadline: deadline,
//             amountIn: amountAfterFee,
//             amountOutMinimum: amountOutMin,
//             sqrtPriceLimitX96: 0
//         });

//         uint256 amountOut = uniswapRouter.exactInputSingle{value: amountAfterFee}(params);

//         emit SwapCompleted(msg.sender, msg.value, amountOut, fee);
//     }

//     function swapExactTokensForTokensWithFee(
//         address tokenIn,
//         uint256 amountIn,
//         address tokenOut,
//         uint256 amountOutMin,
//         address to,
//         uint256 deadline,
//         uint256 feeBasisPoints
//     ) external nonReentrant whenNotPaused {
//         require(amountIn > 0, "Amount must be greater than 0");
//         require(deadline >= block.timestamp, "Transaction too old");

//         uint256 fee = feeManager.calculateFee(amountIn, feeBasisPoints);
//         uint256 amountAfterFee = amountIn - fee;

//         IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
//         IERC20(tokenIn).safeIncreaseAllowance(address(uniswapRouter), amountAfterFee);

//         ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
//             tokenIn: tokenIn,
//             tokenOut: tokenOut,
//             fee: 3000,
//             recipient: to,
//             deadline: deadline,
//             amountIn: amountAfterFee,
//             amountOutMinimum: amountOutMin,
//             sqrtPriceLimitX96: 0
//         });

//         uint256 amountOut = uniswapRouter.exactInputSingle(params);

//         // Transfer fee to fee recipient via FeeManager
//         IERC20(tokenIn).safeTransfer(address(feeManager), fee);

//         emit SwapCompleted(msg.sender, amountIn, amountOut, fee);
//     }

//     function rescueTokens(address token, uint256 amount) external onlyOwner whenNotPaused {
//         IERC20(token).safeTransfer(owner(), amount);
//         emit TokensRescued(token, amount);
//     }

//     function rescueETH(uint256 amount) external onlyOwner whenNotPaused {
//         require(address(this).balance >= amount, "Insufficient ETH balance");
//         payable(owner()).transfer(amount);
//         emit ETHRescued(amount);
//     }

//     function pause() external onlyOwner {
//         _pause();
//     }

//     function unpause() external onlyOwner {
//         _unpause();
//     }
// }



// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/utils/Pausable.sol";
// import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

// contract SwapRouter is ReentrancyGuard, Ownable, Pausable {
//     using SafeERC20 for IERC20;

//     ISwapRouter public immutable uniswapRouter;
//     address public immutable WETH9;
//     address public feeRecipient;
//     uint256 public accumulatedFees;

//     uint256 public feeBasisPoints;
//     uint256 public constant FEE_PRECISION = 1e6; // 1 millionth of a percent
//     uint256 public constant MAX_FEE_BASIS_POINTS = 1000000; // Maximum fee (100% in millionths)

//     event SwapCompleted(address indexed user, uint256 amountIn, uint256 amountOut, uint256 fee);
//     event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
//     event FeeBasisPointsUpdated(uint256 oldFeeBasisPoints, uint256 newFeeBasisPoints);
//     event FeesWithdrawn(uint256 amount);
//     event TokensRescued(address indexed token, uint256 amount);
//     event ETHRescued(uint256 amount);

//     constructor(
//         address _uniswapRouter,
//         address _WETH9,
//         address _feeRecipient,
//         uint256 _feeBasisPoints
//     ) Ownable(msg.sender) {
//         require(_uniswapRouter != address(0), "Invalid Uniswap router");
//         require(_WETH9 != address(0), "Invalid WETH9 address");
//         require(_feeRecipient != address(0), "Invalid fee recipient");
//         require(_feeBasisPoints <= MAX_FEE_BASIS_POINTS, "Fee basis points exceed maximum allowed");

//         uniswapRouter = ISwapRouter(_uniswapRouter);
//         WETH9 = _WETH9;
//         feeRecipient = _feeRecipient;
//         feeBasisPoints = _feeBasisPoints;
//     }

//     receive() external payable whenNotPaused {
//         require(msg.value > 0, "Must send ETH");
//     }

//     function setFeeRecipient(address _feeRecipient) external onlyOwner whenNotPaused {
//         require(_feeRecipient != address(0), "Invalid fee recipient");
//         emit FeeRecipientUpdated(feeRecipient, _feeRecipient);
//         feeRecipient = _feeRecipient;
//     }

//     function setFeeBasisPoints(uint256 _feeBasisPoints) external onlyOwner whenNotPaused {
//         require(_feeBasisPoints <= MAX_FEE_BASIS_POINTS, "Fee basis points exceed maximum allowed");
//         emit FeeBasisPointsUpdated(feeBasisPoints, _feeBasisPoints);
//         feeBasisPoints = _feeBasisPoints;
//     }

//     function swapExactETHForTokensWithFee(
//         address tokenOut,
//         uint256 amountOutMin,
//         address to,
//         uint256 deadline
//     ) external payable nonReentrant whenNotPaused {
//         require(msg.value > 0, "Must send ETH");
//         require(deadline >= block.timestamp, "Transaction too old");

//         uint256 fee = (msg.value * feeBasisPoints) / FEE_PRECISION;
//         uint256 amountAfterFee = msg.value - fee;

//         accumulatedFees += fee;

//         ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
//             tokenIn: WETH9,
//             tokenOut: tokenOut,
//             fee: 3000,
//             recipient: to,
//             deadline: deadline,
//             amountIn: amountAfterFee,
//             amountOutMinimum: amountOutMin,
//             sqrtPriceLimitX96: 0
//         });

//         uint256 amountOut = uniswapRouter.exactInputSingle{value: amountAfterFee}(params);

//         emit SwapCompleted(msg.sender, msg.value, amountOut, fee);
//     }

//     function swapExactTokensForTokensWithFee(
//         address tokenIn,
//         uint256 amountIn,
//         address tokenOut,
//         uint256 amountOutMin,
//         address to,
//         uint256 deadline
//     ) external nonReentrant whenNotPaused {
//         require(amountIn > 0, "Amount must be greater than 0");
//         require(deadline >= block.timestamp, "Transaction too old");

//         uint256 fee = (amountIn * feeBasisPoints) / FEE_PRECISION;
//         uint256 amountAfterFee = amountIn - fee;

//         IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
//         IERC20(tokenIn).safeIncreaseAllowance(address(uniswapRouter), amountAfterFee);

//         ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
//             tokenIn: tokenIn,
//             tokenOut: tokenOut,
//             fee: 3000,
//             recipient: to,
//             deadline: deadline,
//             amountIn: amountAfterFee,
//             amountOutMinimum: amountOutMin,
//             sqrtPriceLimitX96: 0
//         });

//         uint256 amountOut = uniswapRouter.exactInputSingle(params);

//         // Transfer fee to fee recipient
//         IERC20(tokenIn).safeTransfer(feeRecipient, fee);

//         emit SwapCompleted(msg.sender, amountIn, amountOut, fee);
//     }

//     function withdrawAccumulatedFees() external onlyOwner whenNotPaused {
//         uint256 amount = accumulatedFees;
//         require(amount > 0, "No fees to withdraw");
//         accumulatedFees = 0;
//         (bool success, ) = payable(owner()).call{value: amount}("");
//         require(success, "ETH transfer failed");
//         emit FeesWithdrawn(amount);
//     }

//     function rescueTokens(address token, uint256 amount) external onlyOwner whenNotPaused {
//         IERC20(token).safeTransfer(owner(), amount);
//         emit TokensRescued(token, amount);
//     }

//     function rescueETH(uint256 amount) external onlyOwner whenNotPaused {
//         require(address(this).balance >= amount, "Insufficient ETH balance");
//         (bool success, ) = payable(owner()).call{value: amount}("");
//         require(success, "ETH rescue failed");
//         emit ETHRescued(amount);
//     }

//     function pause() external onlyOwner {
//         _pause();
//     }

//     function unpause() external onlyOwner {
//         _unpause();
//     }
// }


























// pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

// contract YAKKLSwapRouter is ReentrancyGuard, Ownable {
//     using SafeERC20 for IERC20;

//     ISwapRouter public immutable uniswapRouter;
//     address public immutable WETH9;
//     address public feeRecipient;
//     uint256 public feeBasisPoints;
//     uint256 public constant MAX_FEE_BASIS_POINTS = 1000; // 10%
//     uint256 public accumulatedFees;

//     event SwapCompleted(address indexed user, uint256 amountIn, uint256 amountOut, uint256 fee);
//     event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
//     event FeeBasisPointsUpdated(uint256 oldFeeBasisPoints, uint256 newFeeBasisPoints);
//     event FeesWithdrawn(uint256 amount);
//     event TokensRescued(address indexed token, uint256 amount);
//     event ETHRescued(uint256 amount);

//     constructor(address _uniswapRouter, address _WETH9, address _feeRecipient, uint256 _feeBasisPoints)
//         Ownable(msg.sender)
//     {
//         require(_uniswapRouter != address(0), "Invalid Uniswap router");
//         require(_WETH9 != address(0), "Invalid WETH9 address");
//         require(_feeRecipient != address(0), "Invalid fee recipient");
//         require(_feeBasisPoints <= MAX_FEE_BASIS_POINTS, "Fee too high");

//         uniswapRouter = ISwapRouter(_uniswapRouter);
//         WETH9 = _WETH9;
//         feeRecipient = _feeRecipient;
//         feeBasisPoints = _feeBasisPoints;
//     }

//     receive() external payable {}

//     function setFeeRecipient(address _feeRecipient) external onlyOwner {
//         require(_feeRecipient != address(0), "Invalid fee recipient");
//         emit FeeRecipientUpdated(feeRecipient, _feeRecipient);
//         feeRecipient = _feeRecipient;
//     }

//     function setFeeBasisPoints(uint256 _feeBasisPoints) external onlyOwner {
//         require(_feeBasisPoints <= MAX_FEE_BASIS_POINTS, "Fee too high");
//         emit FeeBasisPointsUpdated(feeBasisPoints, _feeBasisPoints);
//         feeBasisPoints = _feeBasisPoints;
//     }

//     function swapExactETHForTokensWithFee(address tokenOut, uint256 amountOutMin, address to, uint256 deadline) 
//         external 
//         payable 
//         nonReentrant 
//     {
//         require(msg.value > 0, "Must send ETH");
//         require(deadline >= block.timestamp, "Transaction too old");
        
//         uint256 fee = (msg.value * feeBasisPoints) / 10000;
//         uint256 amountAfterFee = msg.value - fee;
        
//         accumulatedFees += fee;

//         ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
//             tokenIn: WETH9,
//             tokenOut: tokenOut,
//             fee: 3000,
//             recipient: to,
//             deadline: deadline,
//             amountIn: amountAfterFee,
//             amountOutMinimum: amountOutMin,
//             sqrtPriceLimitX96: 0
//         });

//         uint256 amountOut = uniswapRouter.exactInputSingle{value: amountAfterFee}(params);

//         emit SwapCompleted(msg.sender, msg.value, amountOut, fee);
//     }

//     function swapExactTokensForTokensWithFee(address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOutMin, address to, uint256 deadline) 
//         external 
//         nonReentrant 
//     {
//         require(amountIn > 0, "Amount must be greater than 0");
//         require(deadline >= block.timestamp, "Transaction too old");
        
//         uint256 fee = (amountIn * feeBasisPoints) / 10000;
//         uint256 amountAfterFee = amountIn - fee;

//         IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
//         IERC20(tokenIn).safeIncreaseAllowance(address(uniswapRouter), amountAfterFee);

//         ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
//             tokenIn: tokenIn,
//             tokenOut: tokenOut,
//             fee: 3000,
//             recipient: to,
//             deadline: deadline,
//             amountIn: amountAfterFee,
//             amountOutMinimum: amountOutMin,
//             sqrtPriceLimitX96: 0
//         });

//         uint256 amountOut = uniswapRouter.exactInputSingle(params);

//         // Transfer fee to fee recipient
//         IERC20(tokenIn).safeTransfer(feeRecipient, fee);

//         emit SwapCompleted(msg.sender, amountIn, amountOut, fee);
//     }

//     function withdrawAccumulatedFees() external onlyOwner {
//         uint256 amount = accumulatedFees;
//         require(amount > 0, "No fees to withdraw");
//         accumulatedFees = 0;
//         (bool success, ) = payable(owner()).call{value: amount}("");
//         require(success, "ETH transfer failed");
//         emit FeesWithdrawn(amount);
//     }

//     function rescueTokens(address token, uint256 amount) external onlyOwner {
//         IERC20(token).safeTransfer(owner(), amount);
//         emit TokensRescued(token, amount);
//     }

//     function rescueETH(uint256 amount) external onlyOwner {
//         require(address(this).balance >= amount, "Insufficient ETH balance");
//         (bool success, ) = payable(owner()).call{value: amount}("");
//         require(success, "ETH rescue failed");
//         emit ETHRescued(amount);
//     }
// }
