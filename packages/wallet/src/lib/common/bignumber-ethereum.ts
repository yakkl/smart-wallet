// EthereumBigNumber.ts
import { BigNumber, CurrencyCode, type BigNumberish } from "./bignumber";

export class EthereumBigNumber extends BigNumber {
  // Instance methods
  toWei(): EthereumBigNumber {
    let ethValue: bigint;

    if (typeof this._value === 'number' || (typeof this._value === 'string' && this._value.includes('.'))) {
      const valueString = this._value.toString();
      const [integerPart, fractionalPartRaw = ''] = valueString.split('.');
      const fractionalPart = fractionalPartRaw.padEnd(18, '0').slice(0, 18); // Wei has 18 decimals
      ethValue = BigInt(integerPart + fractionalPart);
    } else {
      ethValue = EthereumBigNumber.toBigInt(this._value) ?? BigInt(0);
    }

    return new EthereumBigNumber(ethValue);
  }

  toGwei(): EthereumBigNumber {
    let ethValue: bigint;

    if (typeof this._value === 'number' || (typeof this._value === 'string' && this._value.includes('.'))) {
      const valueString = this._value.toString();
      const [integerPart, fractionalPartRaw = ''] = valueString.split('.');
      const fractionalPart = fractionalPartRaw.padEnd(9, '0').slice(0, 9); // Gwei has 9 decimals
      ethValue = BigInt(integerPart + fractionalPart);
    } else {
      ethValue = EthereumBigNumber.toBigInt(this._value) ?? BigInt(0);
    }

    return new EthereumBigNumber(ethValue);
  }

  toEther(): EthereumBigNumber {
    const weiValue = EthereumBigNumber.toBigInt(this._value) ?? BigInt(0);
    return new EthereumBigNumber(weiValue / BigInt("1000000000000000000"));
  }

  toEtherString(): string {
    const weiValue = EthereumBigNumber.toBigInt(this._value) ?? BigInt(0);
    const etherValue = weiValue / BigInt("1000000000000000000");
    const remainder = weiValue % BigInt("1000000000000000000");

    // Construct the fractional part as a string
    const fractionalPart = remainder.toString().padStart(18, '0').slice(0, 18);

    // Combine the integer part and fractional part
    const etherString = `${etherValue}.${fractionalPart}`;
    return etherString;
  }

  static from(value: BigNumberish): EthereumBigNumber {
    if (typeof value === 'string' && /^0x[0-9a-fA-F]+$/.test(value)) {
      return new EthereumBigNumber(BigInt(value));
    }
    if (value && typeof value === 'object' && '_hex' in value && '_isBigNumber' in value) {
      return new EthereumBigNumber(BigInt(value._hex));
    }
    return new EthereumBigNumber(BigNumber.toBigInt(value));
  }

  static fromWei(value: BigNumberish): EthereumBigNumber {
    const weiValue = EthereumBigNumber.from(value);
    const ethValue = weiValue.div(BigInt("1000000000000000000"));
    return new EthereumBigNumber(ethValue.toString());
  }

  static fromGwei(value: BigNumberish): EthereumBigNumber {
    const gweiValue = EthereumBigNumber.from(value);
    const ethValue = gweiValue.div(BigInt("1000000000"));
    return new EthereumBigNumber(ethValue.toString());
  }

  // Method to convert ether (in decimal, int) to wei
  static fromEther(value: BigNumberish): EthereumBigNumber {
    if (value === null || value === undefined) {
      throw new Error("Value cannot be null or undefined");
    }
  
    let etherString: string;
  
    if (typeof value === 'number' || typeof value === 'string') {
      etherString = value.toString();
    } else if (typeof value === 'bigint') {
      etherString = value.toString();
    } else if (value instanceof BigNumber) {
      etherString = value.toString();
    } else if (typeof value === 'object' && '_hex' in value && '_isBigNumber' in value) {
      etherString = BigInt(value._hex).toString();
    } else {
      throw new Error("Unsupported type for BigNumberish value");
    }
  
    // Ensure the string representation has a decimal point
    if (!etherString.includes(".")) {
      etherString += ".0";
    }
  
    // Split the string into the integer and fractional parts
    const [integerPart, fractionalPart] = etherString.split(".");
    // Normalize the fractional part to have exactly 18 digits, representing wei's precision
    const fractionalPartPadded = (fractionalPart + "0".repeat(18)).slice(0, 18);
    // Combine and convert to BigInt
    const weiValue = BigInt(integerPart + fractionalPartPadded);
  
    return new EthereumBigNumber(weiValue);
  }

  static toWei(value: BigNumberish): EthereumBigNumber {
    let ethValue: bigint;
  
    if (typeof value === 'number' || (typeof value === 'string' && value.includes('.'))) {
      const valueString = value.toString();
      const [integerPart, fractionalPartRaw = ''] = valueString.split('.');
      const fractionalPart = fractionalPartRaw.padEnd(18, '0').slice(0, 18); // Wei has 18 decimals
      ethValue = BigInt(integerPart + fractionalPart);
    } else {
      ethValue = EthereumBigNumber.toBigInt(value) ?? BigInt(0);
    }
  
    return new EthereumBigNumber(ethValue);
  }
  
  static toGwei(value: BigNumberish): EthereumBigNumber {
    // Convert the value to a BigInt
    let ethValue: bigint;

    // If the value is a number or a string that represents a float, handle it
    if (typeof value === 'number' || (typeof value === 'string' && value.includes('.'))) {
      // Convert the value to a string if it is a number
      const valueString = value.toString();

      // Split the value into integer and fractional parts
      const [integerPart, fractionalPartRaw = ''] = valueString.split('.');

      // Truncate or pad the fractional part to 9 digits (to convert Gwei to Wei)
      const fractionalPart = fractionalPartRaw.padEnd(9, '0').slice(0, 9);

      // Combine the parts and convert to BigInt
      ethValue = BigInt(integerPart + fractionalPart);
    } else {
      // Convert directly to BigInt if no fractional part
      ethValue = EthereumBigNumber.toBigInt(value) ?? BigInt(0);
    }

    // Return as a new BigNumber instance
    return new EthereumBigNumber(ethValue);
  }

  static toEther(value: BigNumberish): EthereumBigNumber {
    const weiValue = EthereumBigNumber.from(value).toBigInt() ?? BigInt(0);
    return new EthereumBigNumber(weiValue / BigInt("1000000000000000000"));
  }

  static toEtherString(value: BigNumberish): string {
    const weiValue = EthereumBigNumber.from(value).toBigInt() ?? BigInt(0);
    const etherValue = weiValue / BigInt("1000000000000000000");
    const remainder = weiValue % BigInt("1000000000000000000");

    // Construct the fractional part as a string
    const fractionalPart = remainder.toString().padStart(18, '0').slice(0, 18);

    // Combine the integer part and fractional part
    const etherString = `${etherValue}.${fractionalPart}`;
    return etherString;
  }

  static toFiat(value: BigNumberish, price: number): number {
    const etherValue = parseFloat(EthereumBigNumber.toEtherString(value));
    if (isNaN(etherValue)) {
      throw new Error("Invalid BigNumberish value");
    }
    return etherValue * price;
  }

  static toFormattedFiat(value: BigNumberish, price: number, currencyCode: CurrencyCode, locale: string = ""): string {
    const fiatValue = EthereumBigNumber.toFiat(value, price);
    const formatter = new Intl.NumberFormat(locale || undefined, {
      style: 'currency',
      currency: currencyCode
    });
    return formatter.format(fiatValue);
  }

  static toHex(value: BigNumberish): string {
    const bigintValue = BigNumber.toBigInt(value);
    if (bigintValue === null) {
      throw new Error("Invalid BigNumberish value");
    }
    let hexString = bigintValue.toString(16);
    if (hexString.length % 2 !== 0) {
      hexString = '0' + hexString;
    }
    return '0x' + hexString;
  }
}



// Example usage
// Using instance methods
// const ethValueInstance = new EthereumBigNumber(1);
// console.log('To Wei (Instance):', ethValueInstance.toWei().toBigInt());
// console.log('To Gwei (Instance):', ethValueInstance.toGwei().toBigInt());

// Using static methods
// console.log('To Wei (Static):', EthereumBigNumber.toWei(1n).toBigInt());
// console.log('To Gwei (Static):', EthereumBigNumber.toGwei(1n).toBigInt());
// console.log('From (Static):', EthereumBigNumber.from(20n).toBigInt());


//----------------------------
// import { BigNumber, CurrencyCode, type BigNumberish } from "./bignumber";

// export class EthereumBigNumber extends BigNumber {
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

// Instance method to convert from Wei to the current unit (Ethereum)
//   fromWei(value: BigNumberish): EthereumBigNumber {
//     const weiValue = BigNumber.from(value);
//     const ethValue = weiValue.div(BigInt("1000000000000000000"));
//     return new EthereumBigNumber(ethValue.toString());
//   }

// Instance method to convert from Gwei to the current unit (Ethereum)
//   fromGwei(value: BigNumberish): EthereumBigNumber {
//     const gweiValue = BigNumber.from(value);
//     const ethValue = gweiValue.div(BigInt("1000000000"));
//     return new EthereumBigNumber(ethValue.toString());
//   }

// Instance method to convert from Ether to the current unit (Ethereum)
//   fromEther(value: BigNumberish): EthereumBigNumber {
//     return new EthereumBigNumber(value);
//   }

// Instance method to convert the current value to fiat
//   toFiat(price: number): number {
//     const etherValue = this.toEther().toNumber();
//     if (etherValue === null) {
//       throw new Error("Invalid BigNumberish value");
//     }
//     return etherValue * price;
//   }

// Instance method to convert the current value to formatted fiat
//   toFormattedFiat(price: number, currencyCode: CurrencyCode, locale: string = ""): string {
//     const fiatValue = this.toFiat(price);
//     const formatter = new Intl.NumberFormat(locale || undefined, {
//       style: 'currency',
//       currency: currencyCode
//     });
//     return formatter.format(fiatValue);
//   }

// Instance method to convert the value to a hex string (Ethereum specific) of 0x0 for single digit values
//   toHex(): string {
//     const bigintValue = this.toBigInt();
//     if (bigintValue === null) {
//       return '';
//     }
//     let hexString = bigintValue.toString(16);
//     if (hexString.length % 2 !== 0) {
//       hexString = '0' + hexString;
//     }
//     return '0x' + hexString;
//   }
// }

// Examples of use...
// Create an EthereumBigNumber instance
// const ethValue = new EthereumBigNumber(1);

// Convert to Wei
// const weiValue = ethValue.toWei();
// console.log('To Wei:', weiValue.toBigInt()); // Output: 1000000000000000000n

// Convert to Gwei
// const gweiValue = ethValue.toGwei();
// console.log('To Gwei:', gweiValue.toBigInt()); // Output: 1000000000n

// Convert to Ether
// const etherValue = ethValue.toEther();
// console.log('To Ether:', etherValue.toBigInt()); // Output: 1n

// Convert from Wei
// const fromWeiValue = ethValue.fromWei('1000000000000000000');
// console.log('From Wei:', fromWeiValue.toBigInt()); // Output: 1n

// Convert from Gwei
// const fromGweiValue = ethValue.fromGwei('1000000000');
// console.log('From Gwei:', fromGweiValue.toBigInt()); // Output: 1n

// Convert from Ether
// const fromEtherValue = ethValue.fromEther(1);
// console.log('From Ether:', fromEtherValue.toBigInt()); // Output: 1n

// Convert to fiat using the EthereumBigNumber class
// const ethFiatValue = ethValue.toFiat(2000); // Assuming price is 2000 USD per Ether
// console.log('Ether Fiat Value:', ethFiatValue); // Output: 2000

// Convert to formatted fiat using the EthereumBigNumber class
// const ethFormattedFiatValue = ethValue.toFormattedFiat(2000, CurrencyCode.USD, 'en-US');
// console.log('Ether Formatted Fiat Value:', ethFormattedFiatValue); // Output: $2,000.00

