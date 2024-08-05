import { BigNumber } from "./bignumber";

export class PolygonBigNumber extends BigNumber {
  // Instance method to convert the value to Gwei (for Polygon)
  toGweiPolygon(): BigNumber {
    return BigNumber.mul(this._value, BigInt("1000000000"));
  }

  // Instance method to convert the value to Wei (for Polygon)
  toWeiPolygon(): BigNumber {
    return BigNumber.mul(this._value, BigInt("1000000000000000000"));
  }
}

