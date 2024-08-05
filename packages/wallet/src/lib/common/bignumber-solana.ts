import { BigNumber } from "./bignumber";

export class SolanaBigNumber extends BigNumber {
  // Instance method to convert the value to Lamport (for Solana)
  toLamport(): BigNumber {
    return BigNumber.mul(this._value, BigInt("1000000000"));
  }

  // Instance method to convert the value to SOL (from Lamport for Solana)
  toSOL(): BigNumber {
    return BigNumber.div(this._value, BigInt("1000000000"));
  }
}
