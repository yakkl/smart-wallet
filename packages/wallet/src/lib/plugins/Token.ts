// Token.ts
import type { BigNumberish, SwapToken, TransactionResponse } from '$lib/common';
import type { AbstractContract } from '$plugins/Contract';
import type { Blockchain } from '$plugins/Blockchain';
import type { Provider } from '$plugins/Provider';

export interface IToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  isNative: boolean;
  logoURI: string;
  description: string;
  chainId: number;
  blockchain: Blockchain;
  provider: Provider;
  privateKey?: string;
  getContract(): Promise<AbstractContract | null>;
  getBalance(userAddress: string): Promise<BigNumberish>;
  transfer(toAddress: string, amount: BigNumberish): Promise<TransactionResponse>;
}

export abstract class Token implements IToken {
  readonly address: string;
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
  readonly logoURI: string;
  readonly description: string;
  readonly chainId: number;
  readonly isNative: boolean;
  readonly blockchain: Blockchain;
  readonly provider: Provider;
  readonly privateKey?: string;

  constructor(
    address: string,
    name: string,
    symbol: string,
    decimals: number,
    logoURI: string,
    description: string,
    chainId: number,
    isNative: boolean,
    blockchain: Blockchain,
    provider: Provider,
    privateKey?: string
  ) {
    this.address = address;
    this.name = name;
    this.symbol = symbol;
    this.decimals = decimals;
    this.logoURI = logoURI;
    this.description = description;
    this.chainId = chainId;
    this.isNative = isNative;
    this.blockchain = blockchain;
    this.provider = provider;
    this.privateKey = privateKey;
  }

  abstract getContract(): Promise<AbstractContract | null>;
  abstract getBalance(userAddress: string): Promise<BigNumberish>;
  abstract transfer(toAddress: string, amount: BigNumberish): Promise<TransactionResponse>;

  toJSON(): object {
    return {
      address: this.address,
      name: this.name,
      symbol: this.symbol,
      decimals: this.decimals,
      logoURI: this.logoURI,
      description: this.description,
      chainId: this.chainId,
      isNative: this.isNative
    };
  }

  // New static method to create a Token from a SwapToken
  static fromSwapToken(
    swapToken: SwapToken, 
    blockchain: Blockchain, 
    provider: Provider, 
    privateKey?: string
  ): Token {
    // This is a factory method that returns a concrete implementation of Token
    // You'll need to create a concrete class that extends Token, let's call it ConcreteToken
    return new ConcreteToken(
      swapToken.address,
      swapToken.name,
      swapToken.symbol,
      swapToken.decimals,
      swapToken.logoURI || '', // Use an empty string if logoURI is undefined
      swapToken.description || `${ swapToken.name } token`, // Use an empty string if description is undefined
      swapToken.chainId,
      swapToken.isNative || false, // Use false if isNative is undefined
      blockchain,
      provider,
      privateKey
    );
  }
  
}


// Concrete implementation of Token
class ConcreteToken extends Token {
  async getContract(): Promise<AbstractContract | null> {
    // Implement contract creation logic here
    // For example:
    return this.blockchain.createContract(this.address, [
      'function balanceOf(address account) view returns (uint256)',
      'function transfer(address to, uint256 amount) returns (bool)'
    ]);
  }

  async getBalance(userAddress: string): Promise<BigNumberish> {
    const contract = await this.getContract();
    if (!contract) return 0n; // Return 0 if contract is null
    return contract.call('balanceOf', userAddress);
  }

  async transfer(toAddress: string, amount: BigNumberish): Promise<TransactionResponse> {
    const contract = await this.getContract();
    if (!contract) throw new Error('Invalid contract');
    return contract.sendTransaction('transfer', toAddress, amount);
  }
}











// // Token.ts
// import type { BigNumberish, TransactionResponse } from '$lib/common';
// import type { AbstractContract } from '$plugins/Contract';

// export abstract class Token {
//   readonly address: string;
//   readonly name: string;
//   readonly symbol: string;
//   readonly decimals: number;
//   readonly logoURI: string;
//   readonly description: string;
//   readonly chainId: number;
//   readonly isNative: boolean;

//   constructor(
//     address: string,
//     name: string,
//     symbol: string,
//     decimals: number,
//     logoURI: string,
//     description: string,
//     chainId: number,
//     isNative: boolean
//   ) {
//     this.address = address;
//     this.name = name;
//     this.symbol = symbol;
//     this.decimals = decimals;
//     this.logoURI = logoURI;
//     this.description = description;
//     this.chainId = chainId;
//     this.isNative = isNative;
//   }

//   abstract getContract(): AbstractContract;
//   abstract getBalance(userAddress: string): Promise<BigNumberish>;
//   abstract transfer(toAddress: string, amount: BigNumberish): Promise<TransactionResponse>;

//   toJSON(): object {
//     return {
//       address: this.address,
//       name: this.name,
//       symbol: this.symbol,
//       decimals: this.decimals,
//       logoURI: this.logoURI,
//       description: this.description,
//       chainId: this.chainId
//     };
//   }
// }
