// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/blockflow.bot/YAKKLStaking.sol";
import "../../src/blockflow.bot/YAKKL.sol";
import "../../src/FeeManager.sol";

contract YAKKLStakingTest is Test {
    YAKKLStaking public staking;
    YAKKL public yakkl;
    FeeManager public feeManager;
    address public owner;
    address public user1;
    address public user2;

    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18;
    uint256 public constant REWARD_RATE = 100 * 10**18; // 100 tokens per second
    uint256 public constant MIN_STAKE_AMOUNT = 100 * 10**18;
    uint256 public constant MIN_STAKE_DURATION = 1 days;
    uint256 public constant DEFAULT_STAKE_DURATION = 30 days;

    function setUp() public {
        console.log("Setting up YAKKL Staking test...");
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        console.log("Deploying FeeManager...");
        feeManager = new FeeManager(owner);
        
        console.log("Deploying YAKKL...");
        yakkl = new YAKKL(owner, address(feeManager));
        
        console.log("Granting MINTER_ROLE to owner...");
        yakkl.grantRole(yakkl.MINTER_ROLE(), owner);
        
        console.log("Minting initial supply...");
        yakkl.mint(owner, INITIAL_SUPPLY);

        console.log("Deploying YAKKLStaking...");
        staking = new YAKKLStaking(
            address(yakkl),
            address(yakkl),
            REWARD_RATE,
            MIN_STAKE_AMOUNT,
            MIN_STAKE_DURATION,
            DEFAULT_STAKE_DURATION
        );

        console.log("Approving staking contract...");
        yakkl.approve(address(staking), type(uint256).max);
        
        console.log("Transferring tokens to user1...");
        yakkl.transfer(user1, INITIAL_SUPPLY / 2);
        
        console.log("Transferring tokens to user2...");
        yakkl.transfer(user2, INITIAL_SUPPLY / 2);

        console.log("Approving staking contract for user1...");
        vm.prank(user1);
        yakkl.approve(address(staking), type(uint256).max);
        
        console.log("Approving staking contract for user2...");
        vm.prank(user2);
        yakkl.approve(address(staking), type(uint256).max);

        console.log("Funding staking contract with rewards...");
        yakkl.transfer(address(staking), INITIAL_SUPPLY / 10);

        console.log("YAKKL Staking test setup complete.");
    }

    function testStake() public {
        uint256 stakeAmount = 1000 * 10**18;
        uint256 stakeDuration = 60 days;

        vm.prank(user1);
        staking.stake(stakeAmount, stakeDuration);

        assertEq(staking.totalSupply(), stakeAmount);
        assertEq(staking.getTotalStakedAmount(user1), stakeAmount);

        YAKKLStaking.StakeInfo[] memory userStakes = staking.getUserStakes(user1);
        assertEq(userStakes.length, 1);
        assertEq(userStakes[0].amount, stakeAmount);
        assertEq(userStakes[0].endTime, block.timestamp + stakeDuration * 1 days);
    }

    function testWithdraw() public {
        uint256 stakeAmount = 1000 * 10**18;
        uint256 stakeDuration = 60 days;

        vm.prank(user1);
        staking.stake(stakeAmount, stakeDuration);

        vm.warp(block.timestamp + stakeDuration * 1 days + 1);

        vm.prank(user1);
        staking.withdraw(0);

        assertEq(staking.totalSupply(), 0);
        assertEq(staking.getTotalStakedAmount(user1), 0);
        assertApproxEqAbs(yakkl.balanceOf(user1), INITIAL_SUPPLY / 2, 1e18);
    }

    function testEarnRewards() public {
        uint256 stakeAmount = 1000 * 10**18;
        uint256 stakeDuration = 60 days;

        vm.prank(user1);
        staking.stake(stakeAmount, stakeDuration);

        vm.warp(block.timestamp + 1 days);

        uint256 earned = staking.earned(user1);
        assertGt(earned, 0);

        vm.prank(user1);
        staking.getReward();

        assertGt(yakkl.balanceOf(user1), (INITIAL_SUPPLY / 2) - stakeAmount);
    }

    function testGetUpcomingMaturities() public {
        uint256 stakeAmount = 1000 * 10**18;
        uint256 stakeDuration1 = 30 days;
        uint256 stakeDuration2 = 60 days;

        vm.startPrank(user1);
        staking.stake(stakeAmount, stakeDuration1);
        staking.stake(stakeAmount, stakeDuration2);
        vm.stopPrank();

        vm.warp(block.timestamp + 45 days);

        (address[] memory users, uint256[] memory amounts, uint256[] memory maturityDates) = staking.getUpcomingMaturities(30);

        assertEq(users.length, 1);
        assertEq(amounts.length, 1);
        assertEq(maturityDates.length, 1);
        assertEq(users[0], user1);
        assertEq(amounts[0], stakeAmount);
    }

    function testSetParameters() public {
        uint256 newMinStakeAmount = 200 * 10**18;
        uint256 newMinStakeDuration = 2 days;
        uint256 newDefaultStakeDuration = 45 days;

        staking.setParameters(newMinStakeAmount, newMinStakeDuration, newDefaultStakeDuration);

        // (uint256 _rewardRate, uint256 _minStakeAmount, uint256 _minStakeDuration, uint256 _defaultStakeDuration, , , ) = staking.getAllParameters();
        (uint256 _minStakeAmount, uint256 _minStakeDuration, uint256 _defaultStakeDuration) = staking.getParameters();

        assertEq(_minStakeAmount, newMinStakeAmount);
        assertEq(_minStakeDuration, newMinStakeDuration);
        assertEq(_defaultStakeDuration, newDefaultStakeDuration);
    }
}








// function testSetParameters() public {
//         uint256 newMinStakeAmount = 200 * 10**18;
//         uint256 newMinStakeDuration = 2 days;
//         uint256 newDefaultStakeDuration = 45 days;

//         staking.setParameters(newMinStakeAmount, newMinStakeDuration, newDefaultStakeDuration);

//         (uint256 _rewardRate, uint256 _minStakeAmount, uint256 _minStakeDuration, uint256 _defaultStakeDuration, , , ) = staking.getAllParameters();

//         assertEq(_minStakeAmount, newMinStakeAmount);
//         assertEq(_minStakeDuration, newMinStakeDuration);
//         assertEq(_defaultStakeDuration, newDefaultStakeDuration);
//     }
