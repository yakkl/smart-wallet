// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "forge-std/console.sol";

contract YAKKLTreasury is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    
    IERC20 public yakklToken;
    address public feeRecipient;
    address public immutable wethAddress;
    uint256 public liquidityPercentage;
    uint256 public treasuryPercentage;

    ISwapRouter public swapRouter;

    uint256 public constant FEE_PRECISION = 1e6; // 1 million, allowing for 4 decimal places of precision

    mapping(address => bool) public approvedPools;

    struct PoolInfo {
        uint256 totalLiquidity;
        uint256 lastAddedLiquidity;
        uint256 lastAddedTimestamp;
    }

    mapping(address => PoolInfo) public poolsInfo;

    event LiquidityAdded(address indexed pool, uint256 tokenAmount, uint256 ethAmount);
    event FeesDistributed(uint256 liquidityAmount, uint256 treasuryAmount);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event SwapRouterUpdated(address indexed oldRouter, address indexed newRouter);
    event TokenWithdrawn(address indexed token, address indexed recipient, uint256 amount);
    event TokenUpdated(address indexed token, address indexed recipient);
    event ETHWithdrawn(address indexed recipient, uint256 amount);
    event PoolApprovalUpdated(address indexed pool, bool approved);

    constructor(
        IERC20 _yakklToken,
        address _feeRecipient,
        ISwapRouter _swapRouter,
        address _wethAddress,
        uint256 _liquidityPercentage,
        uint256 _treasuryPercentage
    ) {
        require(_liquidityPercentage + _treasuryPercentage == 100, "Percentages must add up to 100");

        yakklToken = _yakklToken;
        feeRecipient = _feeRecipient;
        swapRouter = _swapRouter;
        wethAddress = _wethAddress;
        liquidityPercentage = _liquidityPercentage;
        treasuryPercentage = _treasuryPercentage;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURER_ROLE, msg.sender);
        _grantRole(FEE_MANAGER_ROLE, msg.sender);
    }

    function grantTreasurerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(TREASURER_ROLE, account);
    }

    function getToken() external view onlyRole(DEFAULT_ADMIN_ROLE) returns (address) {
        return address(yakklToken);
    }

    function setToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(token != address(0), "Invalid token address");
        address oldToken = address(yakklToken);
        yakklToken = IERC20(token);
        emit TokenUpdated(oldToken, token); // Emit old token address and new token address
    }

    function calculateFee(uint256 amount, uint256 feeRate) public pure returns (uint256) {
        require(feeRate <= FEE_PRECISION, "Fee rate exceeds maximum allowed");
        
        console.log("Amount: %s, Fee rate: %s", amount, feeRate);

        return (amount * feeRate) / FEE_PRECISION;
    }

    function distributeFees(uint256 amount) external nonReentrant onlyRole(TREASURER_ROLE) whenNotPaused {
        require(address(yakklToken) != address(0), "YAKKL token not set");
        require(feeRecipient != address(0), "Fee recipient not set");
        require(amount > 0, "Amount must be greater than 0");
        
        console.log("Address of this", address(this));
        console.log("Address of yakklToken", address(yakklToken));
        console.log("Balance of this", address(this).balance);
        console.log("FeeRecipient", feeRecipient);

        uint256 liquidityAmount = (amount * liquidityPercentage) / 100;
        uint256 treasuryAmount = amount - liquidityAmount; // Ensures no rounding errors

        console.log("Amount: %s, Liquidity percentage: %s, Treasury percentage: %s", amount, liquidityPercentage, treasuryPercentage);
        console.log("Distributing fees: %s to liquidity, %s to treasury", liquidityAmount, treasuryAmount);

        if (liquidityAmount > 0) {
            yakklToken.safeTransfer(feeRecipient, liquidityAmount);
        }
    
        // Treasury amount stays in this contract

        emit FeesDistributed(liquidityAmount, treasuryAmount);
    }

    function addLiquidity(uint256 tokenAmount, uint256 ethAmount, uint24 poolFee, address pool) external onlyRole(TREASURER_ROLE) whenNotPaused {
        require(approvedPools[pool], "Pool not approved");
        yakklToken.approve(address(swapRouter), tokenAmount);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: address(yakklToken),
            tokenOut: wethAddress,
            fee: poolFee,
            recipient: address(this),
            deadline: block.timestamp + 15,
            amountIn: tokenAmount,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = swapRouter.exactInputSingle{value: ethAmount}(params);

        poolsInfo[pool].totalLiquidity += tokenAmount;
        poolsInfo[pool].lastAddedLiquidity = tokenAmount;
        poolsInfo[pool].lastAddedTimestamp = block.timestamp;

        emit LiquidityAdded(pool, tokenAmount, amountOut);
    }

    function setFeeRecipient(address _feeRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(oldRecipient, _feeRecipient);
    }

    function setSwapRouter(ISwapRouter _swapRouter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit SwapRouterUpdated(address(swapRouter), address(_swapRouter));
        swapRouter = _swapRouter;
    }

    function addApprovedPool(address pool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        approvedPools[pool] = true;
        emit PoolApprovalUpdated(pool, true);
    }

    function removeApprovedPool(address pool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        approvedPools[pool] = false;
        emit PoolApprovalUpdated(pool, false);
    }

    function getPoolInfo(address pool) external view returns (PoolInfo memory) {
        return poolsInfo[pool];
    }

    function withdrawToken(IERC20 token, address recipient, uint256 amount) external onlyRole(TREASURER_ROLE) nonReentrant whenNotPaused {
        require(token.balanceOf(address(this)) >= amount, "Insufficient token balance");
        token.safeTransfer(recipient, amount);
        emit TokenWithdrawn(address(token), recipient, amount);
    }

    function withdrawETH(address payable recipient, uint256 amount) external onlyRole(TREASURER_ROLE) nonReentrant whenNotPaused {
        require(address(this).balance >= amount, "Insufficient ETH balance");
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "ETH transfer failed");
        emit ETHWithdrawn(recipient, amount);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    receive() external payable {}
}
