import { BigNumber } from "./bignumber";


export class BitcoinBigNumber extends BigNumber {
  // Instance method to convert the value to Satoshi (for Bitcoin)
  toSatoshi(): BigNumber {
    return BigNumber.mul(this._value, BigInt("100000000"));
  }

  // Instance method to convert the value to Bitcoin (from Satoshi)
  toBitcoin(): BigNumber {
    return BigNumber.div(this._value, BigInt("100000000"));
  }
}
