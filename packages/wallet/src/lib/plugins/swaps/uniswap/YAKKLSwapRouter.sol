// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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

    event Swapped(address indexed user, address[] path, uint256 amountIn, uint256 amountOut);
    event FeeUpdated(uint256 newFeePercentage);
    event FeeCollectorUpdated(address newFeeCollector);

    constructor(address _uniswapRouter, address _feeCollector, uint256 _feePercentage) {
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        feeCollector = _feeCollector;
        feePercentage = _feePercentage;
    }

    function setFeeCollector(address _feeCollector) external onlyOwner {
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(_feeCollector);
    }

    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee too high"); // Max 10% fee
        feePercentage = _feePercentage;
        emit FeeUpdated(_feePercentage);
    }

    function swap(
        address[] calldata path,
        uint256 amountIn,
        uint256 amountOutMinimum,
        address recipient,
        uint256 deadline
    ) external payable {
        require(path.length >= 2, "Invalid path");

        uint256 feeAmount = (amountIn * feePercentage) / 10000;
        uint256 amountInAfterFee = amountIn - feeAmount;

        uint256[] memory amounts;

        if (path[0] == uniswapRouter.WETH()) {
            require(msg.value == amountIn, "Incorrect ETH amount");
            amounts = uniswapRouter.swapExactETHForTokens{value: amountInAfterFee}(
                amountOutMinimum,
                path,
                recipient,
                deadline
            );
            // Send fee to collector
            payable(feeCollector).transfer(feeAmount);
        } else {
            IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
            IERC20(path[0]).transfer(feeCollector, feeAmount);
            IERC20(path[0]).approve(address(uniswapRouter), amountInAfterFee);

            if (path[path.length - 1] == uniswapRouter.WETH()) {
                amounts = uniswapRouter.swapExactTokensForETH(
                    amountInAfterFee,
                    amountOutMinimum,
                    path,
                    recipient,
                    deadline
                );
            } else {
                amounts = uniswapRouter.swapExactTokensForTokens(
                    amountInAfterFee,
                    amountOutMinimum,
                    path,
                    recipient,
                    deadline
                );
            }
        }

        emit Swapped(msg.sender, path, amountIn, amounts[amounts.length - 1]);
    }

    // Function to rescue tokens sent to this contract by mistake
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    // Function to rescue ETH sent to this contract by mistake
    function rescueETH(uint256 amount) external onlyOwner {
        payable(owner()).transfer(amount);
    }

    // Function to receive ETH
    receive() external payable {}
}
