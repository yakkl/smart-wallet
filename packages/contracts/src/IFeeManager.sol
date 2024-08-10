// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IFeeManager {
    function calculateFee(uint256 amount, uint256 feeBasisPoints) external pure returns (uint256);
    function distributeFee(address token) external;
}
