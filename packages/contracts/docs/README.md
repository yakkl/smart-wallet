### Understanding Fee Representation in the Solidity FeeManager Contract

#### Understanding Basis Points

**Basis Points**: A basis point is one-hundredth of a percent (0.01%).

**Conversion**: To convert a percentage to basis points, multiply by 100.

**Calculation**:
- **Given Fee**: 0.00875%
- **Convert to Basis Points**:

$$
0.00875\% \times 100 = 0.875 \text{ basis points}
$$

However, basis points are typically expressed as whole numbers, and Solidity works with whole numbers for integer types like `uint256`. Therefore, 0.875 basis points cannot be directly represented as a whole number.

#### Accurate Representation in Solidity

To accurately represent 0.00875% using basis points:

1. **Multiply by 10,000** to get the fee as a proportion:

$$
\text{Fee proportion} = \frac{0.00875}{100} = 0.0000875
$$

This fraction is already very small, and working with such small fractions in Solidity may not be practical because of Solidity's integer math. Therefore, you would either:

- **Use an approximation**: Round 0.875 basis points to the nearest whole number, which is 1 basis point. This will give you a fee of 0.01%, slightly higher than 0.00875%.

- **Scale up the fee calculation**: If precise fractional percentages are needed, you could scale your fee calculations by a larger factor (e.g., working in millionths), but this would involve more complex calculations.

### Custom Precision for Fees

#### Step 1: Define a Custom Precision

Instead of using basis points (which are 1/10,000th), you can define a custom unit that allows for higher precision, such as 1/1,000,000th (millionths).

- **Custom Precision**: Let’s define a precision factor where 1 unit equals 0.000001%. This gives us the flexibility to represent much smaller percentages.

#### Step 2: Calculate the Fee Using the Custom Precision

// TODO: REVIEW THIS SECTION since changes were made to the contract

Given the fee of 0.875%, let's express this in terms of the custom precision:

$$
0.875\% = 0.00875 \times 10,000 \text{ basis points} = 87.5 \text{ basis points}
$$

But to avoid fractional values, we instead express it as:

$$
0.875\% = 875 \text{ (in millionths of a percent)}
$$

### Representing Different Fee Percentages

#### 0% Fee
- **Representation**: `feeBasisPoints = 0`
- **Explanation**: When `feeBasisPoints` is 0, no fee will be deducted from the transaction. The entire amount will be used for the swap.

#### 1% Fee
- **Representation**: `feeBasisPoints = 10,000`
- **Explanation**: Since the fee is calculated in millionths of a percent, 10,000 basis points represent 1%. For example, if you send 1 ETH, a fee of 0.01 ETH will be deducted.

#### 10% Fee
- **Representation**: `feeBasisPoints = 100,000`
- **Explanation**: 100,000 basis points represent 10%. For example, if you send 1 ETH, a fee of 0.1 ETH will be deducted.

#### 50% Fee
- **Representation**: `feeBasisPoints = 500,000`
- **Explanation**: 500,000 basis points represent 50%. For example, if you send 1 ETH, a fee of 0.5 ETH will be deducted.

### Formula for Fee Percentage

The fee percentage is calculated using the formula:

$$
\text{Fee Percentage} = \frac{\text{feeBasisPoints}}{FEE\_PRECISION} \times 100
$$

Where \( FEE\_PRECISION = 1e6 \) (which is 1,000,000 in this case).

### Calculations

#### For 50 Basis Points

$$
\text{Fee Percentage} = \frac{50}{1,000,000} \times 100 = 0.005\%
$$

- **Interpretation**: A 50 basis points value represents a fee of 0.005%.

#### For 100 Basis Points

$$
\text{Fee Percentage} = \frac{100}{1,000,000} \times 100 = 0.01\%
$$

- **Interpretation**: A 100 basis points value represents a fee of 0.01%.

### Summary

- **875 basis points** represent 0.00875%.
- **50 basis points** represent 0.005%.
- **100 basis points** represent 0.01%.


