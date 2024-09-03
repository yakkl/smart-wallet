// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "forge-std/console.sol";

contract FeeManager is Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant FEE_PRECISION = 1e6; // 1 millionth of a percent
    address public feeRecipient;

    event FeeCalculated(uint256 feeAmount);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event FeeDistributed(address indexed token, uint256 amount);
    event FeeManagerDeployed(address indexed contractAddress, address indexed owner);

    constructor(address _feeRecipient) Ownable() {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
        emit FeeManagerDeployed(address(this), msg.sender);
    }

    receive() external payable {}

    // Anyone can call this function to see the fee recipient 
    function getFeeRecipient() external view returns (address) {
        return feeRecipient;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(oldRecipient, _feeRecipient);
        console.log("Fee recipient updated from %s to %s", oldRecipient, _feeRecipient);
    }

    function calculateFee(uint256 amount, uint256 feeBasisPoints) public pure returns (uint256) {
        require(feeBasisPoints <= FEE_PRECISION, "Fee basis points exceed maximum allowed");
        
        console.log("amount: %d, feeBasisPoints: %d", amount, feeBasisPoints);

        return (amount * feeBasisPoints) / FEE_PRECISION;
    }

    function distributeFee(address token) external {
        console.log("Distributing fee for token:", token);
        uint256 amount;
        if (token == address(0)) {
            // Distribute ETH
            console.log("Distributing ETH");
            amount = address(this).balance;
            if (amount > 0) {
                (bool success, ) = feeRecipient.call{value: amount}("");
                require(success, "ETH fee distribution failed");
            }
        } else {
            // Distribute ERC20 tokens
            console.log("Distributing ERC20");
            amount = IERC20(token).balanceOf(address(this));
            console.log("amount: %d", amount);
            console.log("feeRecipient: %s", feeRecipient);
            console.log("this: %s", address(this));
            if (amount > 0) {
                IERC20(token).safeTransfer(feeRecipient, amount);
            }
        }
        if (amount > 0) {
            emit FeeDistributed(token, amount);
        }
    }

    function getCollectedFees(address token) external view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        } else {
            return IERC20(token).balanceOf(address(this));
        }
    }
    function rescueETH(uint256 amount) external onlyOwner {
        uint256 contractBalance = address(this).balance;
        require(contractBalance >= amount, "Insufficient balance to rescue");
        payable(owner()).transfer(amount);    
    }

    function rescueERC20(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
