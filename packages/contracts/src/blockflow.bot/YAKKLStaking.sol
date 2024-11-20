// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./YAKKL.sol";
import "./YAKKLTreasury.sol";

contract YAKKLStaking is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    YAKKL public stakingToken;
    IERC20 public rewardsToken;
    YAKKLTreasury public yakklTreasury;

    uint256 public constant REWARD_PRECISION = 1e18;
    uint256 public constant SECONDS_PER_DAY = 86400;

    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    uint256 public minStakeAmount;
    uint256 public minStakeDuration;
    uint256 public defaultStakeDuration;

    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        bool active;
    }

    mapping(address => StakeInfo[]) public userStakes;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public totalStaked;

    uint256 public totalSupply;

    event Staked(address indexed user, uint256 amount, uint256 duration);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardAdded(uint256 reward);
    event ParametersUpdated(uint256 minStakeAmount, uint256 minStakeDuration, uint256 defaultStakeDuration);

    constructor(
        address _stakingToken,
        address _rewardsToken,
        address _yakklTreasury,
        uint256 _rewardRate,
        uint256 _minStakeAmount,
        uint256 _minStakeDuration,
        uint256 _defaultStakeDuration
    ) {
        stakingToken = YAKKL(_stakingToken);
        rewardsToken = IERC20(_rewardsToken);
        yakklTreasury = YAKKLTreasury(payable(_yakklTreasury));
        rewardRate = _rewardRate;
        minStakeAmount = _minStakeAmount;
        minStakeDuration = _minStakeDuration;
        defaultStakeDuration = _defaultStakeDuration;
    }

    function stake(uint256 amount, uint256 duration) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(amount >= minStakeAmount, "Stake amount too low");
        require(duration >= minStakeDuration, "Stake duration too short");
        
        if (duration == 0) {
            duration = defaultStakeDuration;
        }

        totalSupply += amount;
        totalStaked[msg.sender] += amount;
        
        userStakes[msg.sender].push(StakeInfo({
            amount: amount,
            startTime: block.timestamp,
            endTime: block.timestamp + (duration * SECONDS_PER_DAY),
            active: true
        }));

        stakingToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount, duration);
    }

    function withdraw(uint256 stakeIndex) external nonReentrant updateReward(msg.sender) {
        require(stakeIndex < userStakes[msg.sender].length, "Invalid stake index");
        StakeInfo storage stakeInfo = userStakes[msg.sender][stakeIndex];
        require(stakeInfo.active, "Stake already withdrawn");
        require(block.timestamp >= stakeInfo.endTime, "Stake not mature");

        uint256 amount = stakeInfo.amount;
        stakeInfo.active = false;
        totalSupply -= amount;
        totalStaked[msg.sender] -= amount;

        stakingToken.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function getReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardsToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + (((block.timestamp - lastUpdateTime) * rewardRate * REWARD_PRECISION) / totalSupply);
    }

    function earned(address account) public view returns (uint256) {
        return ((totalStaked[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / REWARD_PRECISION) + rewards[account];
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function setParameters(
        uint256 _minStakeAmount,
        uint256 _minStakeDuration,
        uint256 _defaultStakeDuration
    ) external onlyOwner {
        minStakeAmount = _minStakeAmount;
        minStakeDuration = _minStakeDuration;
        defaultStakeDuration = _defaultStakeDuration;
        emit ParametersUpdated(_minStakeAmount, _minStakeDuration, _defaultStakeDuration);
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
        emit RewardAdded(_rewardRate);
    }

    function addReward(uint256 amount) external onlyOwner {
        rewardsToken.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardAdded(amount);
    }

    function getUserStakes(address user) external view returns (StakeInfo[] memory) {
        return userStakes[user];
    }

    function getUpcomingMaturities(uint256 daysAhead) external view returns (
        address[] memory users,
        uint256[] memory amounts,
        uint256[] memory maturityDates
    ) {
        uint256 totalMaturities = 0;
        uint256 endTimestamp = block.timestamp + (daysAhead * SECONDS_PER_DAY);

        for (uint256 i = 0; i < userStakes[msg.sender].length; i++) {
            if (userStakes[msg.sender][i].active && userStakes[msg.sender][i].endTime <= endTimestamp) {
                totalMaturities++;
            }
        }

        users = new address[](totalMaturities);
        amounts = new uint256[](totalMaturities);
        maturityDates = new uint256[](totalMaturities);

        uint256 index = 0;
        for (uint256 i = 0; i < userStakes[msg.sender].length; i++) {
            if (userStakes[msg.sender][i].active && userStakes[msg.sender][i].endTime <= endTimestamp) {
                users[index] = msg.sender;
                amounts[index] = userStakes[msg.sender][i].amount;
                maturityDates[index] = userStakes[msg.sender][i].endTime;
                index++;
            }
        }

        return (users, amounts, maturityDates);
    }

    function getTotalStakedAmount(address user) external view returns (uint256) {
        return totalStaked[user];
    }

    function getContractBalance() external view returns (uint256, uint256) {
        return (
            stakingToken.balanceOf(address(this)),
            rewardsToken.balanceOf(address(this))
        );
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = stakingToken.balanceOf(address(this));
        stakingToken.transfer(owner(), balance);
    }

    function setYAKKLTreasury(address _yakklTreasury) external onlyOwner {
        yakklTreasury = YAKKLTreasury(payable(_yakklTreasury));
    }

    function distributeFees() external onlyOwner {
        uint256 balance = stakingToken.balanceOf(address(this));
        uint256 fee = yakklTreasury.calculateFee(balance, 1000); // 0.1% fee
        stakingToken.approve(address(yakklTreasury), fee);
        yakklTreasury.distributeFees(fee);
    }
}
