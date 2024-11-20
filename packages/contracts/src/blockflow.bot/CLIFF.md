## Cliff for Vesting Schedules

The cliff in a vesting schedule refers to a period of time at the beginning of the vesting term during which no tokens are released or become available. Here's a more detailed explanation:

1. Purpose of a Cliff:

- It's often used to ensure that team members, advisors, or investors remain committed to the project for a minimum period before receiving any tokens.
- It helps align long-term interests and prevents immediate sell-offs.


2. How it Works:

- During the cliff period, no tokens are vested or claimable.
- Once the cliff period ends, a portion of tokens becomes immediately available (often a larger initial chunk), and then regular vesting continues.


3. Example: Let's say you have a 4-year vesting schedule with a 1-year cliff:

- Total vesting period: 4 years
- Cliff period: 1 year
- Total tokens: 48,000

Here's what happens:

- Year 0-1: No tokens are vested or claimable.
- At exactly 1 year: 12,000 tokens (25%) become immediately available.
- Years 1-4: The remaining 36,000 tokens vest gradually, typically monthly or quarterly.


4. In Code: When implementing vesting with a cliff, you would typically:

- Store the start time of the vesting schedule
- Check if the current time is past the cliff period before allowing any claims
- Calculate vested amounts based on time elapsed since the start, but only after the cliff has passed


Here's a simplified example of how this might look in code:

```solidity
function claimVestedTokens() public {
    VestingSchedule storage schedule = vestingSchedules[msg.sender];
    require(block.timestamp >= schedule.startTime + schedule.cliffDuration, "Cliff period not over");

    uint256 elapsedTime = block.timestamp - schedule.startTime;
    uint256 vestedAmount;
    if (elapsedTime >= schedule.duration) {
        vestedAmount = schedule.totalAmount;
    } else {
        vestedAmount = (schedule.totalAmount * elapsedTime) / schedule.duration;
    }

    uint256 claimableAmount = vestedAmount - schedule.releasedAmount;
    // ... rest of the claiming logic
}
```

In this function, the first require statement ensures that the cliff period has passed before allowing any tokens to be claimed. This implements the "waiting period" that the cliff represents.
The cliff is an important mechanism in token vesting that helps projects maintain stability and alignment with key stakeholders during the crucial early stages of development and growth.
