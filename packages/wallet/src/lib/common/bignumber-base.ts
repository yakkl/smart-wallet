import { BigNumber } from "./bignumber";

export class BaseBigNumber extends BigNumber {
  // Instance method to convert the value to Gwei (for Base)
  toGweiBase(): BigNumber {
    return BigNumber.mul(this._value, BigInt("1000000000"));
  }

  // Instance method to convert the value to Wei (for Base)
  toWeiBase(): BigNumber {
    return BigNumber.mul(this._value, BigInt("1000000000000000000"));
  }
}

