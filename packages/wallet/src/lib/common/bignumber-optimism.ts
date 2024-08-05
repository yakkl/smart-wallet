import { BigNumber } from "./bignumber";

export class OptimismBigNumber extends BigNumber {
  // Instance method to convert the value to Gwei (for Optimism)
  toGweiOptimism(): BigNumber {
    return BigNumber.mul(this._value, BigInt("1000000000"));
  }

  // Instance method to convert the value to Wei (for Optimism)
  toWeiOptimism(): BigNumber {
    return BigNumber.mul(this._value, BigInt("1000000000000000000"));
  }
}

