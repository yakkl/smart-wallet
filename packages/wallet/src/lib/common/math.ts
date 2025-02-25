/* eslint-disable @typescript-eslint/no-unused-vars */

// Some math functions are from the following source:
// ethers.js - under MIT license

import { makeError } from '$lib/common/errors';
import { addHexPrefix, hexlify, isBytesLike, stripHexPrefix } from '$lib/common/misc';
import type { BytesLike, } from '$lib/common/types';
import { BigNumber, type BigNumberish, type Numeric } from '$lib/common/bignumber';
import { log } from '$lib/plugins/Logger';

// TODO: Some of the things in this file are not used in the project. Remove them if they are not needed or out of date.

const Nibbles = "0123456789abcdef";
const BN_0 = BigInt(0);
const BN_1 = BigInt(1);
const maxValue = BigInt(2) ** BigInt(256) - BigInt(1);

export function convertBasisPointsToDecimal( basisPoints: number ): number {
  try {
    if ( basisPoints < 1 ) { // All calculations are done in basis points so we need to check if the value is less than 1 (1 - return of this)
      return basisPoints;
    }
    return basisPoints / 10000;
  } catch ( error ) {
    log.error(`convertBasisPointsToDecimal: ${error}`);
    return 0;
  }
}

/**
 * Converts a hex string to a BigInt
 *
 * @param {string} inputHex - A number represented as a hex string
 * @returns {bigint} A BigInt
 */
function hexToBigNumberish(inputHex: string): bigint {
  return BigInt(stripHexPrefix(inputHex));
}

/**
 * Used to multiply a BigInt by a fraction
 *
 * @param {BigNumberish} targetBN - The number to multiply by a fraction
 * @param {BigNumberish} numerator - The numerator of the fraction multiplier
 * @param {BigNumberish} denominator - The denominator of the fraction multiplier
 * @returns {bigint} The product of the multiplication
 */
function bigNumberishMultiplyByFraction(targetBN: BigNumberish, numerator: BigNumberish, denominator: BigNumberish): bigint {
  try {
    const tarBN = getBigInt(targetBN);
    const numBN = getBigInt(numerator);
    const denomBN = getBigInt(denominator);
    return (tarBN * numBN) / denomBN;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw makeError(error.message, "NUMERIC_FAULT", {
        fault: "overflow",
        operation: "bigNumberishMultiplyByFraction",
        value: targetBN,
      });
    } else {
      throw error;
    }
  }
}

/**
 * Converts a BigInt to a hex string with a '0x' prefix
 *
 * @param {BigNumberish} inputBn - The BigNumberish to convert to a hex string
 * @returns {string} A '0x' prefixed hex string
 */
function bigNumberishToHex(inputBn: BigNumberish): string {
  if (inputBn === null) {
    throw new Error("value cannot be null");
  }
  return addHexPrefix(inputBn.toString(16));
}

/**
 * Converts a value to a BigInt
 *
 * @param {BigNumberish} value - The value to convert
 * @param {string} [name] - Optional name of the value for error messages
 * @returns {bigint} The converted BigInt
 * @throws {Error} Throws an error if the value is invalid
 */
export function getBigInt(value: BigNumberish, name?: string): bigint {
  try {
    if (value === null) {
      throw new Error("value cannot be null");
    }

    switch (typeof value) {
      case "bigint":
        return value;
      case "number":
        if (!Number.isInteger(value)) {
          throw new Error("underflow");
        }
        if (value < -maxValue || value > maxValue) {
          throw new Error("overflow");
        }
        return BigInt(value);
      case "string":
        if (value === "") {
          throw new Error("empty string");
        }
        if (value[0] === "-" && value[1] !== "-") {
          return -BigInt(value.substring(1));
        }
        if (value === "0" || value === "0.0" || value === "0.00") {
          return 0n;
        }
        return BigInt(value);
      default:
        throw new Error("invalid BigNumberish value");
    }
  } catch (error: unknown) {
    log.error(`getBigInt: ${error}`);
    if (error instanceof Error) {
      throw makeError(error.message, "INVALID_ARGUMENT", {
        argument: name || "value",
        value: value,
      });
    } else {
      throw error;
    }
  }
}

/**
 * Converts a value to an unsigned BigInt
 *
 * @param {BigNumberish} value - The value to convert
 * @param {string} [name] - Optional name of the value for error messages
 * @returns {bigint} The converted unsigned BigInt
 * @throws {Error} Throws an error if the value is invalid or negative
 */
export function getUint(value: BigNumberish, name?: string): bigint {
  try {
    const result = getBigInt(value, name);
    if (result < BN_0) {
      throw new Error("unsigned value cannot be negative");
    }
    return result;
  } catch (error: unknown) {
    log.error(`getUint: ${error}`);
    if (error instanceof Error) {
      throw makeError(error.message, "NUMERIC_FAULT", {
        fault: "overflow",
        operation: "getUint",
        value: value,
      });
    } else {
      throw error;
    }
  }
}

/**
 * Converts a BigNumberish or Uint8Array to a BigInt
 *
 * @param {BigNumberish | Uint8Array} value - The value to convert
 * @returns {bigint} The converted BigInt
 */
export function toBigInt(value: BigNumberish | Uint8Array, decimals?: number): bigint {
  if (value instanceof Uint8Array) {
    let result = "0x0";
    for (const v of value) {
      result += Nibbles[v >> 4];
      result += Nibbles[v & 0x0f];
    }
    return BigInt(result);
  }

  if (typeof value === 'number') {
    if (decimals !== undefined) return numberToBigInt(value, decimals);
    // debug_log("Decimals must be specified for a number input.");
  }

  if (typeof value === 'string') {
    if (decimals !== undefined) return stringToBigInt(value, decimals);
    //debug_log("Decimals must be specified for a string input.");
  }

  return getBigInt(value);
}

export function stringToBigInt(value: string, decimals: number = 18): bigint {
  if (!value || isNaN(Number(value))) {
    // log.debug(`Invalid input: "${value}" is not a valid number string.`);
    return 0n;
  }

  // Split into integer and fractional parts
  const [integerPart, fractionalPart = ""] = value.split(".");

  // Ensure fractional part doesn't exceed the specified decimals
  const paddedFractional = fractionalPart.padEnd(decimals, "0").slice(0, decimals);

  // Combine integer and fractional parts
  const combined = integerPart + paddedFractional;

  return BigInt(combined);
}

export function numberToBigInt(value: number, decimals: number = 18): bigint {
  if (isNaN(value) || decimals < 0) {
    // log.debug('Invalid input: amount must be a number, and decimals must be non-negative');
    return 0n;
  }
  const scale = Math.pow(10, decimals); // Scale factor
  const scaledValue = Math.round(value * scale); // Scale and round
  return BigInt(scaledValue);
}

// Safe conversion to bigint with comprehensive type handling
export function safeConvertToBigInt( value: BigNumberish | null | undefined ): bigint | undefined {
  try {
    // Handle null or undefined
    if ( value === null || value === undefined ) return undefined;

    // Check if value is already a bigint
    if ( typeof value === 'bigint' ) return value;

    // Handle BigNumber type
    if ( value instanceof BigNumber ) {
      return BigInt( value.toString() );
    }

    // Handle object with _hex property (ethers BigNumber-like)
    if ( typeof value === 'object' && value !== null && '_hex' in value ) {
      return BigInt( ( value as { _hex: string; } )._hex );
    }

    // Try to convert using existing toBigInt
    return toBigInt( value );
  } catch (error: unknown ) {
    log.error(`safeConvertToBigInt: ${error}`);
    return 0n;
  }
}

/**
 * Converts a BigNumberish value to a number
 *
 * @param {BigNumberish} value - The value to convert
 * @param {string} [name] - Optional name of the value for error messages
 * @returns {number} The converted number
 * @throws {Error} Throws an error if the value is invalid
 */
export function getNumber(value: BigNumberish, name?: string): number {
  try {
    switch (typeof value) {
      case "bigint":
        if (value < -maxValue || value > maxValue) {
          throw new Error("overflow");
        }
        return Number(value);
      case "number":
        if (!Number.isInteger(value)) {
          throw new Error("underflow");
        }
        if (value < -maxValue || value > maxValue) {
          throw new Error("overflow");
        }
        return value;
      case "string":
        if (value === "") {
          throw new Error("empty string");
        }
        return getNumber(BigInt(value), name);
      default:
        throw new Error("invalid numeric value");
    }
  } catch (error: unknown) {
    log.error(`getNumber: ${error}`);
    if (error instanceof Error) {
      throw makeError(error.message, "INVALID_ARGUMENT", {
        argument: name || "value",
        value: value,
      });
    } else {
      throw error;
    }
  }
}

/**
 * Converts a BigNumberish or Uint8Array to a number
 *
 * @param {BigNumberish | Uint8Array} value - The value to convert
 * @returns {number} The converted number
 */
export function toNumber(value: BigNumberish | Uint8Array): number {
  return getNumber(toBigInt(value));
}

/**
 * Converts a BigNumberish value to a Big Endian hex string, optionally padded to a specified width
 *
 * @param {BigNumberish} _value - The value to convert
 * @param {Numeric} [_width] - Optional width to pad the hex string
 * @returns {string} The converted hex string
 * @throws {Error} Throws an error if the value exceeds the specified width
 */
export function toBeHex(_value: BigNumberish, _width?: Numeric): string {
  try {
    const value = getUint(_value, "value");

    let result = value.toString(16);

    if (_width == null) {
      // Ensure the value is of even length
      if (result.length % 2) {
        result = "0" + result;
      }
    } else {
      const width = getNumber(_width, "width");
      if (width * 2 < result.length) {
        throw new Error(`value exceeds width (${width} bytes)`);
      }

      // Pad the value to the required width
      while (result.length < width * 2) {
        result = "0" + result;
      }
    }

    return "0x" + result;
  } catch (error: unknown) {
    if (error instanceof Error) {
      log.error(`toBeHex: ${error}`);
      throw makeError(error.message, "NUMERIC_FAULT", {
        operation: "toBeHex",
        fault: "overflow",
        value: _value,
      });
    } else {
      throw error;
    }
  }
}

/**
 * Converts a BigNumberish value to a Big Endian Uint8Array
 *
 * @param {BigNumberish} _value - The value to convert
 * @returns {Uint8Array} The converted Uint8Array
 */
export function toBeArray(_value: BigNumberish): Uint8Array {
  const value = getUint(_value, "value");

  if (value === BN_0) { return new Uint8Array([ ]); }

  let hex = value.toString(16);
  if (hex.length % 2) { hex = "0" + hex; }

  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < result.length; i++) {
    const offset = i * 2;
    result[i] = parseInt(hex.substring(offset, offset + 2), 16);
  }

  return result;
}

/**
 * Returns a hex string for a value safe to use as a quantity
 *
 * @param {BytesLike | BigNumberish} value - The value to convert
 * @returns {string} The converted quantity hex string
 */
export function toQuantity(value: BytesLike | BigNumberish): string {
  let result = hexlify(isBytesLike(value) ? value: toBeArray(value)).substring(2);
  while (result.startsWith("0")) { result = result.substring(1); }
  if (result === "") { result = "0"; }
  return "0x" + result;
}


export function multiplyNumeric(x: Numeric, y: Numeric): bigint {
  // Ensure both value and price are bigint for multiplication
  const valueBigInt = typeof x === 'bigint' ? x : BigInt(x);
  const priceBigInt = typeof y === 'bigint' ? y : BigInt(y);

  // Perform the multiplication
  const newValue: bigint = valueBigInt * priceBigInt;

  return newValue;
}

export {
  hexToBigNumberish,
  bigNumberishMultiplyByFraction,
  addHexPrefix,
  bigNumberishToHex,
};






// NOTE: Use 'number' for price related calculations. Use 'bigint' for value related to large decimals such as eth wei or smart contract values.

// There is another library that has a similar class but it is not used in this project (BN.js) or (ethers)
// Implement the BigNumber class with static methods
// class BigNumber implements IBigNumberHandler {
//   private _value: BigNumberish;

//   constructor(value: BigNumberish = null) {
//     this._value = value;
//   }

// Getter for value
//   get value(): BigNumberish {
//     return this._value;
//   }

// Setter for value
//   set value(newValue: BigNumberish) {
//     this._value = newValue;
//   }

// Method to convert the value to a number
//   toNumber(): number | null {
//     if (this._value === null) {
//       return null;
//     }

//     if (typeof this._value === 'string' || typeof this._value === 'number') {
//       return Number(this._value);
//     }

//     if (typeof this._value === 'bigint') {
//       return Number(this._value);
//     }

//     return null;
//   }

// Method to convert the value to a bigint
//   toBigInt(): bigint | null {
//     if (this._value === null) {
//       return null;
//     }

//     if (typeof this._value === 'string') {
//       return BigInt(this._value);
//     }

//     if (typeof this._value === 'number') {
//       return BigInt(this._value);
//     }

//     if (typeof this._value === 'bigint') {
//       return this._value;
//     }

//     return null;
//   }

// Instance method to convert the value to a string
//   toString(): string {
//     const bigintValue = this.toBigInt();
//     if (bigintValue === null) {
//       return '';
//     }
//     return bigintValue.toString();
//   }

// Instance method to convert the value to a hex string
//   toHex(): string {
//     const bigintValue = this.toBigInt();
//     if (bigintValue === null) {
//       return '';
//     }
//     return '0x' + bigintValue.toString(16);
//   }

// Instance method to convert the value to Wei (for Ethereum)
//   toWei(): BigNumber {
//     return BigNumber.mul(this._value, BigInt("1000000000000000000"));
//   }

  // Instance method to convert the value to Gwei (for Ethereum)
//   toGwei(): BigNumber {
//     return BigNumber.mul(this._value, BigInt("1000000000"));
//   }

  // Instance method to convert the value to Ether (from Wei for Ethereum)
//   toEther(): BigNumber {
//     return BigNumber.div(this._value, BigInt("1000000000000000000"));
//   }

  // Instance method to convert the value to Satoshi (for Bitcoin)
//   toSatoshi(): BigNumber {
//     return BigNumber.mul(this._value, BigInt("100000000"));
//   }

  // Instance method to convert the value to Bitcoin (from Satoshi)
//   toBitcoin(): BigNumber {
//     return BigNumber.div(this._value, BigInt("100000000"));
//   }

   // Instance method to convert the value to Lamport (for Solana)
//    toLamport(): BigNumber {
//     return BigNumber.mul(this._value, BigInt("1000000000"));
//   }

  // Instance method to convert the value to SOL (from Lamport for Solana)
//   toSOL(): BigNumber {
//     return BigNumber.div(this._value, BigInt("1000000000"));
//   }

  // Instance method to convert the value to Gwei (for Optimism)
//   toGweiOptimism(): BigNumber {
//     return BigNumber.mul(this._value, BigInt("1000000000"));
//   }

  // Instance method to convert the value to Wei (for Optimism)
//   toWeiOptimism(): BigNumber {
//     return BigNumber.mul(this._value, BigInt("1000000000000000000"));
//   }

  // Instance method to convert the value to Gwei (for Polygon)
//   toGweiPolygon(): BigNumber {
//     return BigNumber.mul(this._value, BigInt("1000000000"));
//   }

  // Instance method to convert the value to Wei (for Polygon)
//   toWeiPolygon(): BigNumber {
//     return BigNumber.mul(this._value, BigInt("1000000000000000000"));
//   }

  // Instance method to convert the value to Gwei (for Avalanche)
//   toGweiAvalanche(): BigNumber {
//     return BigNumber.mul(this._value, BigInt("1000000000"));
//   }

  // Instance method to convert the value to Wei (for Avalanche)
//   toWeiAvalanche(): BigNumber {
//     return BigNumber.mul(this._value, BigInt("1000000000000000000"));
//   }

  // Instance method to convert the value to Gwei (for Base)
//   toGweiBase(): BigNumber {
//     return BigNumber.mul(this._value, BigInt("1000000000"));
//   }

  // Instance method to convert the value to Wei (for Base)
//   toWeiBase(): BigNumber {
//     return BigNumber.mul(this._value, BigInt("1000000000000000000"));
//   }

  // Method to set the value
//   fromValue(value: BigNumberish): void {
//     this._value = value;
//   }

  // Instance method to get the maximum of the current value and another BigNumberish value
//   max(other: BigNumberish): BigNumber {
//     return BigNumber.max(this._value, other);
//   }

  // Instance method to get the minimum of the current value and another BigNumberish value
//   min(other: BigNumberish): BigNumber {
//     return BigNumber.min(this._value, other);
//   }

  // Instance method to add another BigNumberish value to the current value
//   add(other: BigNumberish): BigNumber {
//     return BigNumber.add(this._value, other);
//   }

  // Instance method to subtract another BigNumberish value from the current value
//   sub(other: BigNumberish): BigNumber {
//     return BigNumber.sub(this._value, other);
//   }

  // Instance method to divide the current value by another BigNumberish value
//   div(other: BigNumberish): BigNumber {
//     return BigNumber.div(this._value, other);
//   }

  // Instance method to multiply the current value by another BigNumberish value
//   mul(other: BigNumberish): BigNumber {
//     return BigNumber.mul(this._value, other);
//   }

  // Instance method to calculate the modulus of the current value by another BigNumberish value
//   mod(other: BigNumberish): BigNumber {
//     return BigNumber.mod(this._value, other);
//   }

  // Static method to create a BigNumber instance
//   static from(value: BigNumberish): BigNumber {
//     return new BigNumber(value);
//   }

  // Static method to convert a BigNumberish to a number
//   static toNumber(value: BigNumberish): number | null {
//     if (value === null) {
//       return null;
//     }

//     if (typeof value === 'string' || typeof value === 'number') {
//       return Number(value);
//     }

//     if (typeof value === 'bigint') {
//       return Number(value);
//     }

//     return null;
//   }

  // Static method to convert a BigNumberish to a bigint
//   static toBigInt(value: BigNumberish): bigint | null {
//     if (value === null) {
//       return null;
//     }

//     if (typeof value === 'string') {
//       return BigInt(value);
//     }

//     if (typeof value === 'number') {
//       return BigInt(value);
//     }

//     if (typeof value === 'bigint') {
//       return value;
//     }

//     return null;
//   }

  // Static method to get the maximum of two BigNumberish values
//   static max(value1: BigNumberish, value2: BigNumberish): BigNumber {
//     const bigint1 = BigNumber.toBigInt(value1);
//     const bigint2 = BigNumber.toBigInt(value2);

//     if (bigint1 === null || bigint2 === null) {
//       throw new Error("Invalid BigNumberish value");
//     }

//     return new BigNumber(bigint1 > bigint2 ? bigint1 : bigint2);
//   }

  // Static method to get the minimum of two BigNumberish values
//   static min(value1: BigNumberish, value2: BigNumberish): BigNumber {
//     const bigint1 = BigNumber.toBigInt(value1);
//     const bigint2 = BigNumber.toBigInt(value2);

//     if (bigint1 === null || bigint2 === null) {
//       throw new Error("Invalid BigNumberish value");
//     }

//     return new BigNumber(bigint1 < bigint2 ? bigint1 : bigint2);
//   }

  // Static method to add two BigNumberish values
//   static add(value1: BigNumberish, value2: BigNumberish): BigNumber {
//     const bigint1 = BigNumber.toBigInt(value1);
//     const bigint2 = BigNumber.toBigInt(value2);

//     if (bigint1 === null || bigint2 === null) {
//       throw new Error("Invalid BigNumberish value");
//     }

//     return new BigNumber(bigint1 + bigint2);
//   }

  // Static method to subtract one BigNumberish value from another
//   static sub(value1: BigNumberish, value2: BigNumberish): BigNumber {
//     const bigint1 = BigNumber.toBigInt(value1);
//     const bigint2 = BigNumber.toBigInt(value2);

//     if (bigint1 === null || bigint2 === null) {
//       throw new Error("Invalid BigNumberish value");
//     }

//     return new BigNumber(bigint1 - bigint2);
//   }

  // Static method to divide one BigNumberish value by another
//   static div(value1: BigNumberish, value2: BigNumberish): BigNumber {
//     const bigint1 = BigNumber.toBigInt(value1);
//     const bigint2 = BigNumber.toBigInt(value2);

//     if (bigint1 === null || bigint2 === null || bigint2 === BigInt(0)) {
//       throw new Error("Invalid BigNumberish value or division by zero");
//     }

//     return new BigNumber(bigint1 / bigint2);
//   }

  // Static method to multiply two BigNumberish values
//   static mul(value1: BigNumberish, value2: BigNumberish): BigNumber {
//     const bigint1 = BigNumber.toBigInt(value1);
//     const bigint2 = BigNumber.toBigInt(value2);

//     if (bigint1 === null || bigint2 === null) {
//       throw new Error("Invalid BigNumberish value");
//     }

//     return new BigNumber(bigint1 * bigint2);
//   }

  // Static method to calculate the modulus of one BigNumberish value by another
//   static mod(value1: BigNumberish, value2: BigNumberish): BigNumber {
//     const bigint1 = BigNumber.toBigInt(value1);
//     const bigint2 = BigNumber.toBigInt(value2);

//     if (bigint1 === null || bigint2 === null || bigint2 === BigInt(0)) {
//       throw new Error("Invalid BigNumberish value or modulus by zero");
//     }

//     return new BigNumber(bigint1 % bigint2);
//   }

  // Static method to convert BigNumberish value to hex string
//   static toHex(value: BigNumberish): string {
//     const bigintValue = BigNumber.toBigInt(value);
//     if (bigintValue === null) {
//       throw new Error("Invalid BigNumberish value");
//     }
//     return "0x" + bigintValue.toString(16);
//   }

  // Static method to create a BigNumber from a hex string
//   static fromHex(hex: string): BigNumber {
//     if (typeof hex !== "string" || !/^0x[0-9a-fA-F]+$/.test(hex)) {
//       throw new Error("Invalid hex string");
//     }
//     return new BigNumber(BigInt(hex));
//   }
// }


// Example usage
// let myValue: BigNumber = BigNumber.from(10n);
// console.log('Max', myValue.max(9n).toBigInt()); // Output: 10n
// console.log('Min', myValue.min(9).toBigInt());  // Output: 9n
// console.log('Max', myValue.max("9").toBigInt()); // Output: 10n

// let myValue2: BigNumber = BigNumber.from(20); // 20 is a number
// console.log('Value2', myValue2.toBigInt()); // Output: 20n

// let myValue3: number = 5;
// console.log('Max', BigNumber.max(50n, myValue3).toBigInt()); // Output: 50n

// Division example
// console.log('Div', myValue.div("5").toBigInt()); // Output: 2n
// console.log('Div', BigNumber.div(20n, "4").toBigInt()); // Output: 5n

// Multiplication example
// console.log('Mul', myValue.mul(3).toBigInt()); // Output: 30n
// console.log('Mul', BigNumber.mul(20n, "2").toBigInt()); // Output: 40n

// Modulus example
// console.log('Mod', myValue.mod(3).toBigInt()); // Output: 1n
// console.log('Mod', BigNumber.mod(20n, "6").toBigInt()); // Output: 2n

// Hex conversion example
// let hexValue: BigNumber = BigNumber.fromHex("0x1234");
// console.log('Hex to BigInt:', hexValue.toBigInt()); // Output: 4660n
// console.log('BigInt to Hex:', BigNumber.toHex(4660n)); // Output: "0x1234"

// Instance methods toString and toHex
// console.log('Value toString:', myValue.toString()); // Output: "10"
// console.log('Value toHex:', myValue.toHex()); // Output: "0xa"

// Ethereum conversions
// let etherValue: BigNumber = BigNumber.from("1");
// console.log('To Wei:', etherValue.toWei().toBigInt()); // Output: 1000000000000000000n
// console.log('To Gwei:', etherValue.toGwei().toBigInt()); // Output: 1000000000n
// console.log('To Ether:', etherValue.toWei().toEther().toBigInt()); // Output: 1n

// Bitcoin conversions
// let bitcoinValue: BigNumber = BigNumber.from("1");
// console.log('To Satoshi:', bitcoinValue.toSatoshi().toBigInt()); // Output: 100000000n
// console.log('To Bitcoin:', bitcoinValue.toSatoshi().toBitcoin().toBigInt()); // Output: 1n

// Solana conversions
// let solValue: BigNumber = BigNumber.from("1");
// console.log('To Lamport:', solValue.toLamport().toBigInt()); // Output: 1000000000n
// console.log('To SOL:', solValue.toLamport().toSOL().toBigInt()); // Output: 1n

// Optimism conversions
// let optimismValue: BigNumber = BigNumber.from("1");
// console.log('To Gwei Optimism:', optimismValue.toGweiOptimism().toBigInt()); // Output: 1000000000n
// console.log('To Wei Optimism:', optimismValue.toWeiOptimism().toBigInt()); // Output: 1000000000000000000n

// Polygon conversions
// let polygonValue: BigNumber = BigNumber.from("1");
// console.log('To Gwei Polygon:', polygonValue.toGweiPolygon().toBigInt()); // Output: 1000000000n
// console.log('To Wei Polygon:', polygonValue.toWeiPolygon().toBigInt()); // Output: 1000000000000000000n

// Avalanche conversions
// let avalancheValue: BigNumber = BigNumber.from("1");
// console.log('To Gwei Avalanche:', avalancheValue.toGweiAvalanche().toBigInt()); // Output: 1000000000n
// console.log('To Wei Avalanche:', avalancheValue.toWeiAvalanche().toBigInt()); // Output: 1000000000000000000n

// Base conversions
// let baseValue: BigNumber = BigNumber.from("1");
// console.log('To Gwei Base:', baseValue.toGweiBase().toBigInt()); // Output: 1000000000n
// console.log('To Wei Base:', baseValue.toWeiBase().toBigInt()); // Output: 1000000000000000000n

