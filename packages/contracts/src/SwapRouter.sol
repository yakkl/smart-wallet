// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "./IFeeManager.sol";
import "forge-std/console.sol";

interface IQuoter {
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    ) external returns (uint256 amountOut);
}

contract SwapRouter is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    ISwapRouter public immutable uniswapRouter;
    address public immutable WETH9;
    IFeeManager public feeManager;
    IQuoter public immutable quoter;
    IUniswapV3Factory public immutable factory;

    event SwapStarted(address tokenOut, uint256 amountIn);
    event SwapCompleted(address indexed user, address tokenOut, uint256 amountIn, uint256 amountOut, uint256 fee);
    event TokensRescued(address indexed token, uint256 amount);
    event ETHRescued(uint256 amount);
    event FeeAdjusted(uint256 adjustedFee);
    event SwapRouterDeployed(address indexed contractAddress, address indexed owner);
    event LogMessage(string message, address indexed addr, uint24 fee, uint256 amount);
    event LogQuoteResult(string message, uint256 amount);
    event LogUint(string message, uint256 value);
    event LogError(string message, string reason);
    event LogBytes(string message, bytes data);


    constructor(
        address _uniswapRouter,
        address _WETH9,
        address _feeManager,
        address _quoter,
        address _factory
    ) Ownable() {
        require(_uniswapRouter != address(0), "Invalid Uniswap router");
        require(_WETH9 != address(0), "Invalid WETH9 address");
        require(_feeManager != address(0), "Invalid FeeManager address");

        uniswapRouter = ISwapRouter(_uniswapRouter);
        WETH9 = _WETH9;
        feeManager = IFeeManager(_feeManager);
        quoter = IQuoter(_quoter);
        factory = IUniswapV3Factory(_factory);

        emit SwapRouterDeployed(address(this), msg.sender);
    }

    receive() external payable whenNotPaused {
        require(msg.value > 0, "Must send ETH");
    }

    function swapExactETHForTokens(
        address tokenOut,
        uint256 amountOutMin,
        address to,
        uint256 deadline,
        uint256 feeBasisPoints,
        uint24 poolFee
    ) external payable nonReentrant whenNotPaused {
        emit SwapStarted(tokenOut, msg.value);

        require(msg.value > 0, "Must send ETH");
        require(deadline >= block.timestamp, "Transaction too old");

        console.log("SwapExactETHForTokens called");
        console.log("msg.value:", msg.value);
        console.log("tokenOut:", tokenOut);
        console.log("amountOutMin:", amountOutMin);
        console.log("to:", to);
        console.log("deadline:", deadline);
        console.log("feeBasisPoints:", feeBasisPoints);
        console.log("poolFee:", poolFee);

        uint256 expectedAmountOut = getAmountOut(WETH9, tokenOut, poolFee, msg.value);
        console.log("Expected amount out:", expectedAmountOut);

        uint24 feePool = poolFee;
        if (feePool != 100 && feePool != 500 && feePool != 3000 && feePool != 10000) {
            feePool = 3000;
        }

        // Perform the swap
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: WETH9,
            tokenOut: tokenOut,
            fee: feePool,
            recipient: address(this),
            deadline: deadline,
            amountIn: msg.value,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        console.log("Performing swap with params:");
        console.log("feePool:", feePool);
        console.log("Performing swap with params.tokenIn:", params.tokenIn);
        console.log("Performing swap with params.tokenOut:", params.tokenOut);
        console.log("Performing swap with params.fee:", params.fee);
        console.log("Performing swap with params.recipient:", params.recipient);
        console.log("Performing swap with params.deadline:", params.deadline);
        console.log("Performing swap with params.amountIn:", params.amountIn);

        uint256 amountOut = uniswapRouter.exactInputSingle{value: msg.value}(params);

        console.log("Received tokens:", amountOut);

        // Calculate the fee based on the final amount received
        uint256 fee = feeBasisPoints > 0 ? feeManager.calculateFee(amountOut, feeBasisPoints) : 0;
        uint256 amountAfterFee = amountOut - fee;

        require(amountAfterFee >= amountOutMin, "Insufficient output amount");

        console.log("Fee amount:", fee);
        console.log("Amount after fee:", amountAfterFee);

        // Transfer the fee to the feeManager
        if (fee > 0) {
            IERC20(tokenOut).safeTransfer(address(feeManager), fee);
            feeManager.distributeFee(tokenOut);
        }

        // Transfer the remaining tokens to the recipient
        IERC20(tokenOut).safeTransfer(to, amountAfterFee);

        emit SwapCompleted(msg.sender, tokenOut, msg.value, amountAfterFee, fee);
    }

    function swapExactTokensForTokens(
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 amountOutMin,
        address to,
        uint256 deadline,
        uint256 feeBasisPoints,
        uint24 poolFee
    ) external nonReentrant whenNotPaused {
        emit SwapStarted(tokenOut, amountIn);

        require(amountIn > 0, "Must send tokens");
        require(deadline >= block.timestamp, "Transaction too old");

        console.log("SwapExactTokensForTokens called");
        console.log("tokenIn:", tokenIn);
        console.log("amountIn:", amountIn);
        console.log("tokenOut:", tokenOut);
        console.log("amountOutMin:", amountOutMin);
        console.log("to:", to);
        console.log("deadline:", deadline);
        console.log("feeBasisPoints:", feeBasisPoints);
        console.log("poolFee:", poolFee);

        uint256 expectedAmountOut = getAmountOut(tokenIn, tokenOut, poolFee, amountIn);
        console.log("Expected amount out:", expectedAmountOut);

        uint24 feePool = poolFee;
        if (feePool != 100 && feePool != 500 && feePool != 3000 && feePool != 10000) {
            feePool = 3000;
        }

        // Transfer tokens to this contract
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve Uniswap router to spend tokens
        IERC20(tokenIn).approve(address(uniswapRouter), amountIn);

        // Perform the swap
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: feePool,
            recipient: address(this),
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        console.log("Performing swap with params:");
        console.log("feePool:", feePool);
        console.log("Performing swap with params.tokenIn:", params.tokenIn);
        console.log("Performing swap with params.tokenOut:", params.tokenOut);
        console.log("Performing swap with params.fee:", params.fee);
        console.log("Performing swap with params.recipient:", params.recipient);
        console.log("Performing swap with params.deadline:", params.deadline);
        console.log("Performing swap with params.amountIn:", params.amountIn);

        uint256 amountOut = uniswapRouter.exactInputSingle(params);

        console.log("Received tokens:", amountOut);

        // Calculate the fee based on the final amount received
        uint256 fee = feeBasisPoints > 0 ? feeManager.calculateFee(amountOut, feeBasisPoints) : 0;
        uint256 amountAfterFee = amountOut - fee;

        require(amountAfterFee >= amountOutMin, "Insufficient output amount");

        console.log("Fee amount:", fee);
        console.log("Amount after fee:", amountAfterFee);

        // Transfer the fee to the feeManager
        if (fee > 0) {
            IERC20(tokenOut).safeTransfer(address(feeManager), fee);
            feeManager.distributeFee(tokenOut);
        }

        // Transfer the remaining tokens to the recipient
        IERC20(tokenOut).safeTransfer(to, amountAfterFee);

        emit SwapCompleted(msg.sender, tokenOut, amountIn, amountAfterFee, fee);
    }

function getQuote(
    address tokenIn,
    address tokenOut,
    uint24 fee,
    uint256 amountIn
) public returns (uint256 amountOut, uint256 priceImpact) {
    emit LogMessage("getQuote called", tokenIn, fee, amountIn);

    try quoter.quoteExactInputSingle(tokenIn, tokenOut, fee, amountIn, 0) returns (uint256 quoteAmountOut) {
        emit LogQuoteResult("Quoter result", quoteAmountOut);

        address poolAddress = factory.getPool(tokenIn, tokenOut, fee);
        if (poolAddress == address(0)) {
            emit LogError("Pool does not exist", "");
            return (0, 10000);
        }
        emit LogMessage("Pool found", poolAddress, 0, 0);

        try IUniswapV3Pool(poolAddress).slot0() returns (
            uint160 sqrtPriceX96,
            int24 /*tick*/,
            uint16 /*observationIndex*/,
            uint16 /*observationCardinality*/,
            uint16 /*observationCardinalityNext*/,
            uint8 /*feeProtocol*/,
            bool /*unlocked*/
        ) {
            emit LogUint("sqrtPriceX96", sqrtPriceX96);

            uint256 price;
            unchecked {
                price = uint256(sqrtPriceX96) * uint256(sqrtPriceX96) * 1e18 >> 192;
            }
            emit LogUint("Calculated price", price);

            if (quoteAmountOut > 0 && price > 0) {
                uint256 idealRate = (amountIn * 1e18) / quoteAmountOut;
                if (price > idealRate) {
                    priceImpact = ((price - idealRate) * 10000) / price;
                } else {
                    priceImpact = 0;
                }
            } else {
                priceImpact = 10000; // 100% price impact if no output or zero price
            }

            emit LogQuoteResult("Final result", quoteAmountOut);
            emit LogUint("Price impact", priceImpact);

            return (quoteAmountOut, priceImpact);
        } catch Error(string memory reason) {
            emit LogError("Error in slot0", reason);
            return (quoteAmountOut, 10000);
        } catch (bytes memory) {
            emit LogError("Low-level error in slot0", "");
            return (quoteAmountOut, 10000);
        }
    } catch Error(string memory reason) {
        emit LogError("Quoter error", reason);
        return (0, 10000);
    } catch (bytes memory) {
        emit LogError("Low-level quoter error", "");
        return (0, 10000);
    }
}

    function getETHQuote(
        address tokenOut,
        uint24 fee,
        uint256 amountIn
    ) external returns (uint256 amountOut, uint256 priceImpact) {
        emit LogMessage("getETHQuote called", tokenOut, fee, amountIn);
        return getQuote(WETH9, tokenOut, fee, amountIn);
    }

    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn
    ) public returns (uint256) {
        return quoter.quoteExactInputSingle(
            tokenIn,
            tokenOut,
            fee,
            amountIn,
            0
        );
    }

    function getUniswapRouterAddress() public view returns (address) {
        return address(uniswapRouter);
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

