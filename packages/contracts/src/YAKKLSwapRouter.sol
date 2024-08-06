// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "forge-std/console.sol";

interface IUniswapV2Router02 {
    function WETH() external pure returns (address);
    
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
    
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

contract YAKKLSwapRouter is Ownable {
    IUniswapV2Router02 public uniswapRouter;
    address public feeCollector;
    uint256 public feePercentage;  // Fee in basis points (e.g., 87 = 0.87%)
    uint256 public accumulatedFees;

    event Swapped(address indexed user, address[] path, uint256 amountIn, uint256 amountOut);
    event FeeUpdated(uint256 newFeePercentage);
    event FeeCollectorUpdated(address newFeeCollector);
    event FeesWithdrawn(uint256 amount);

    constructor(address _uniswapRouter, address _feeCollector, uint256 _feePercentage) Ownable(msg.sender) {
        require(_uniswapRouter != address(0), "Invalid Uniswap router address");
        require(_feeCollector != address(0), "Invalid fee collector address");
        require(_feePercentage <= 1000, "Fee percentage too high");
        
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        feeCollector = _feeCollector;
        feePercentage = _feePercentage;

        console.log("YAKKLSwapRouter initialized");
        console.log("Uniswap router:", _uniswapRouter);
        console.log("Fee collector:", _feeCollector);
        console.log("Fee percentage:", _feePercentage);
    }

    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid fee collector address");
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(_feeCollector);

        console.log("Fee collector updated:", _feeCollector);
    }

    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee too high"); // Max 10% fee
        feePercentage = _feePercentage;
        emit FeeUpdated(_feePercentage);

        console.log("Fee percentage updated:", _feePercentage);
    }

    function swap(
        address[] calldata path,
        uint256 amountIn,
        uint256 amountOutMinimum,
        address recipient,
        uint256 deadline
    ) external payable {
        console.log("Swap function called");
        console.log("Path length:", path.length);
        console.log("First token in path:", path[0]);
        console.log("Last token in path:", path[path.length - 1]);
        console.log("Amount In:", amountIn);
        console.log("Amount Out Minimum:", amountOutMinimum);
        console.log("Recipient:", recipient);
        console.log("Deadline:", deadline);
        console.log("ETH sent:", msg.value);
        console.log("Contract ETH balance before swap:", address(this).balance);

        require(path.length >= 2, "Invalid path");
        require(amountIn > 1000, "Amount too small");
        require(recipient != address(0), "Invalid recipient");
        require(deadline > block.timestamp, "UniswapV2Router: EXPIRED");

        uint256 feeAmount = (amountIn * feePercentage) / 10000;
        uint256 amountInAfterFee = amountIn - feeAmount;

        uint256[] memory amounts;

        if (path[0] == uniswapRouter.WETH()) {
            require(msg.value == amountIn, "Insufficient ETH sent");
            require(address(this).balance >= amountIn, "Insufficient contract ETH balance");
            
            try uniswapRouter.swapExactETHForTokens{value: amountInAfterFee}(
                amountOutMinimum,
                path,
                recipient,
                deadline
            ) returns (uint256[] memory _amounts) {
                amounts = _amounts;
                uint256 actualFeeAmount = address(this).balance;
                accumulatedFees += actualFeeAmount;
            } catch {
                console.log("ETH to Token swap failed");
                revert("ETH to Token swap failed");
            }
        } else {
            require(IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn), "Token transfer failed");
            require(IERC20(path[0]).approve(address(uniswapRouter), amountInAfterFee), "Token approval failed");

            if (path[path.length - 1] == uniswapRouter.WETH()) {
                try uniswapRouter.swapExactTokensForETH(
                    amountInAfterFee,
                    amountOutMinimum,
                    path,
                    recipient,
                    deadline
                ) returns (uint256[] memory _amounts) {
                    amounts = _amounts;
                } catch {
                    console.log("Token to ETH swap failed");
                    revert("Token to ETH swap failed");
                }
            } else {
                try uniswapRouter.swapExactTokensForTokens(
                    amountInAfterFee,
                    amountOutMinimum,
                    path,
                    recipient,
                    deadline
                ) returns (uint256[] memory _amounts) {
                    amounts = _amounts;
                } catch {
                    console.log("Token to Token swap failed");
                    revert("Token to Token swap failed");
                }
            }

            require(IERC20(path[0]).transfer(feeCollector, feeAmount), "Fee transfer failed");
        }

        emit Swapped(msg.sender, path, amountIn, amounts[amounts.length - 1]);

        console.log("Swap completed");
        console.log("Amount Out:", amounts[amounts.length - 1]);
        console.log("Contract ETH balance after swap:", address(this).balance);
        console.log("Accumulated fees:", accumulatedFees);
    }

    function withdrawAccumulatedFees() external onlyOwner {
        console.log("Withdrawing accumulated fees");
        console.log("Accumulated fees before withdrawal:", accumulatedFees);
        console.log("Contract ETH balance before withdrawal:", address(this).balance);
        console.log("Owner address:", owner());

        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");
        require(address(this).balance >= amount, "Insufficient contract balance for fee withdrawal");
        
        accumulatedFees = 0;
        (bool success, ) = payable(owner()).call{value: amount}("");
        if (!success) {
            accumulatedFees = amount; // Restore the accumulated fees if transfer fails
            console.log("ETH transfer to owner failed");
            revert("ETH transfer to owner failed");
        }
        
        emit FeesWithdrawn(amount);

        console.log("Fees withdrawn successfully");
        console.log("Amount withdrawn:", amount);
        console.log("Contract ETH balance after withdrawal:", address(this).balance);
    }

    function rescueTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Token rescue failed");
    }

    function rescueETH(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient ETH balance");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "ETH rescue failed");
    }

    receive() external payable {}
}
