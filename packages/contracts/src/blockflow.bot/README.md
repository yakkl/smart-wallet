## Vesting and Testing

Here are some common vesting scenarios and testing scenarios for both blacklist and whitelist functionalities.

### Vesting Scenarios:

1. Gradual Release (Linear Vesting):

- Total Amount: 1,000,000 tokens
- Duration: 4 years (48 months)
- Cliff: 1 year
- Release: 20,833.33 tokens per month after the cliff


2. Founder's Vesting:

- Total Amount: 10,000,000 tokens
- Duration: 4 years
- Cliff: 1 year
- Release: 25% after cliff, then 1/36 of remaining each month


3. Advisor's Vesting:

- Total Amount: 500,000 tokens
- Duration: 2 years
- Cliff: 6 months
- Release: 20,833.33 tokens per month after the cliff


4. Employee Stock Option Plan (ESOP):

- Total Amount: 100,000 tokens
- Duration: 4 years
- Cliff: 1 year
- Release: 25% after cliff, then 1/36 of remaining each month


5. Investor's Vesting:

- Total Amount: 5,000,000 tokens
- Duration: 3 years
- Cliff: None (starts immediately)
- Release: 1/36 of total amount each month


Here's how you can implement and test these scenarios:

```solidity
function testVestingScenarios() public {
    // Scenario 1: Gradual Release
    setVestingSchedule(address(0x1), 1_000_000 * 10**18, 4 years, 1 years);
    
    // Scenario 2: Founder's Vesting
    setVestingSchedule(address(0x2), 10_000_000 * 10**18, 4 years, 1 years);
    
    // Scenario 3: Advisor's Vesting
    setVestingSchedule(address(0x3), 500_000 * 10**18, 2 years, 180 days);
    
    // Scenario 4: ESOP
    setVestingSchedule(address(0x4), 100_000 * 10**18, 4 years, 1 years);
    
    // Scenario 5: Investor's Vesting
    setVestingSchedule(address(0x5), 5_000_000 * 10**18, 3 years, 0);

    // Fast forward time and test claiming
    // (This would be done in a test environment that allows time manipulation)
    // vm.warp(block.timestamp + 2 years);
    
    // Claim vested tokens for each scenario
    claimVestedTokens(address(0x1));
    claimVestedTokens(address(0x2));
    claimVestedTokens(address(0x3));
    claimVestedTokens(address(0x4));
    claimVestedTokens(address(0x5));
}
```

### Blacklist and Whitelist Testing Scenarios:

1. Blacklist Testing:

```solidity
function testBlacklist() public {
    address user1 = address(0x1);
    address user2 = address(0x2);

    // Mint some tokens to users
    mint(user1, 1000 * 10**18);
    mint(user2, 1000 * 10**18);

    // Perform a normal transfer
    vm.prank(user1);
    transfer(user2, 100 * 10**18);
    assert(balanceOf(user2) == 1100 * 10**18);

    // Blacklist user1
    address[] memory blacklistAddresses = new address[](1);
    blacklistAddresses[0] = user1;
    bool[] memory blacklistStatuses = new bool[](1);
    blacklistStatuses[0] = true;
    updateBlacklist(blacklistAddresses, blacklistStatuses);

    // Attempt transfer from blacklisted address (should fail)
    vm.prank(user1);
    vm.expectRevert("Address is blacklisted");
    transfer(user2, 100 * 10**18);

    // Attempt transfer to blacklisted address (should fail)
    vm.prank(user2);
    vm.expectRevert("Address is blacklisted");
    transfer(user1, 100 * 10**18);

    // Remove user1 from blacklist
    blacklistStatuses[0] = false;
    updateBlacklist(blacklistAddresses, blacklistStatuses);

    // Perform transfer after removing from blacklist (should succeed)
    vm.prank(user1);
    transfer(user2, 100 * 10**18);
    assert(balanceOf(user2) == 1200 * 10**18);
}
```

2. Whitelist Testing:

```solidity
function testWhitelist() public {
    address user1 = address(0x1);
    address user2 = address(0x2);
    address user3 = address(0x3);

    // Mint some tokens to users
    mint(user1, 1000 * 10**18);
    mint(user2, 1000 * 10**18);
    mint(user3, 1000 * 10**18);

    // Set a high transfer tax for testing
    setTransferTaxRate(2000); // 20% tax

    // Perform a normal transfer with tax
    uint256 initialBalance = balanceOf(user2);
    vm.prank(user1);
    transfer(user2, 100 * 10**18);
    assert(balanceOf(user2) == initialBalance + 80 * 10**18); // 20% tax applied

    // Whitelist user1
    address[] memory whitelistAddresses = new address[](1);
    whitelistAddresses[0] = user1;
    bool[] memory whitelistStatuses = new bool[](1);
    whitelistStatuses[0] = true;
    updateWhitelist(whitelistAddresses, whitelistStatuses);

    // Perform transfer from whitelisted address (should bypass tax)
    initialBalance = balanceOf(user2);
    vm.prank(user1);
    transfer(user2, 100 * 10**18);
    assert(balanceOf(user2) == initialBalance + 100 * 10**18); // No tax applied

    // Perform transfer to non-whitelisted address (should apply tax)
    initialBalance = balanceOf(user3);
    vm.prank(user2);
    transfer(user3, 100 * 10**18);
    assert(balanceOf(user3) == initialBalance + 80 * 10**18); // 20% tax applied

    // Whitelist user2
    whitelistAddresses[0] = user2;
    updateWhitelist(whitelistAddresses, whitelistStatuses);

    // Perform transfer between two whitelisted addresses (should bypass tax)
    initialBalance = balanceOf(user1);
    vm.prank(user2);
    transfer(user1, 100 * 10**18);
    assert(balanceOf(user1) == initialBalance + 100 * 10**18); // No tax applied
}
```

These test scenarios cover various aspects of vesting, blacklisting, and whitelisting. They demonstrate:

1. Setting up different vesting schedules
2. Blacklisting and unblacklisting addresses
3. Preventing transfers to/from blacklisted addresses
4. Whitelisting addresses
5. Bypassing transfer tax for whitelisted addresses
6. Applying transfer tax for non-whitelisted addresses

Remember to adapt these tests to your specific testing framework and environment. Also, ensure that you have the necessary permissions (roles) to execute these functions in your actual contract implementation.
