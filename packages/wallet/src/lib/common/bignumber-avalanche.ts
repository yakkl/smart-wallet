import { BigNumber } from "./bignumber";

export class AvalancheBigNumber extends BigNumber {
  // Instance method to convert the value to Gwei (for Avalanche)
  toGweiAvalanche(): BigNumber {
    return BigNumber.mul(this._value, BigInt("1000000000"));
  }

  // Instance method to convert the value to Wei (for Avalanche)
  toWeiAvalanche(): BigNumber {
    return BigNumber.mul(this._value, BigInt("1000000000000000000"));
  }
}

