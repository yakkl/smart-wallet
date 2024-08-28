/* eslint-disable @typescript-eslint/no-explicit-any */
import { AbstractContract } from '$plugins/Contract';
import type { BigNumberish, TransactionRequest, TransactionResponse } from '$lib/common';
import type { Provider } from '$plugins/Provider';
import type { Signer } from '$plugins/Signer';
import { ethers } from 'ethers';
import { EthersConverter } from '$plugins/utilities/EthersConverter';

export class EthereumContract extends AbstractContract {
  private contract: ethers.Contract;

  constructor(address: string, abi: any[], providerOrSigner: Provider | Signer) {
    super(address, abi, providerOrSigner);
    this.contract = new ethers.Contract(address, abi, providerOrSigner as any);
  }

  async call(functionName: string, ...args: any[]): Promise<any> {
    return await this.contract[functionName](...args);
  }

  async estimateGas(functionName: string, ...args: any[]): Promise<BigNumberish> {
    const estimation = await this.contract[functionName].estimateGas(...args);
    return BigInt(estimation.toString());
  }

  async populateTransaction(functionName: string, ...args: any[]): Promise<TransactionRequest> {
    const tx = await this.contract[functionName].populateTransaction(...args);
    return EthersConverter.ethersTransactionRequestToTransactionRequest(tx);
  }

  async sendTransaction(functionName: string, ...args: any[]): Promise<TransactionResponse> {
    const tx = await this.contract[functionName](...args);
    return EthersConverter.ethersTransactionResponseToTransactionResponse(tx);
  }

  on(eventName: string, listener: (...args: any[]) => void): void {
    this.contract.on(eventName, listener);
  }

  off(eventName: string, listener: (...args: any[]) => void): void {
    this.contract.off(eventName, listener);
  }

  once(eventName: string, listener: (...args: any[]) => void): void {
    this.contract.once(eventName, listener);
  }

  getFunctions(): Record<string, (...args: any[]) => Promise<any>> {
    const functions: Record<string, (...args: any[]) => Promise<any>> = {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [name, _] of Object.entries(this.contract.functions)) {
      functions[name] = (...args: any[]) => this.call(name, ...args);
    }
    return functions;
  }
  
  getEvents(): string[] {
    return Object.keys(this.contract.interface.fragments)
      .filter(key => this.contract.interface.getEvent(key) !== null);
  }
}












// // src/lib/contracts/EthereumContract.ts
// import { ethers } from 'ethers';
// import { AbstractContract } from '$plugins/Contract';
// import type { BigNumberish, TransactionRequest } from '$lib/common';
// import type { Provider } from '$plugins/Provider';
// import type { Signer } from '$plugins/Signer';

// export class EthereumContract extends AbstractContract {
//   private ethersContract: ethers.Contract;
//   [key: string]: any;

//   constructor(address: string, abi: any[], signerOrProvider: Provider | Signer) {
//     super(address, abi, signerOrProvider);
//     this.ethersContract = new ethers.Contract(address, abi, signerOrProvider as any);

//     // Create proxies for all contract functions
//     const functions = this.getFunctions();
//     for (const [name, func] of Object.entries(functions)) {
//       if (!(name in this)) {
//         (this as any)[name] = func;
//       }
//     }
//   }

//   get address(): string {
//     return this.ethersContract.target as string;
//   }

//   get abi(): readonly any[] {
//     return this.ethersContract.interface.fragments;
//   }

//   async call(functionName: string, ...args: any[]): Promise<any> {
//     return await this.ethersContract[functionName](...args);
//   }

//   async estimateGas(functionName: string, ...args: any[]): Promise<BigNumberish> {
//     const tx = await this.ethersContract[functionName].estimateGas(...args);
//     return BigInt(tx.toString());
//   }

//   async populateTransaction(functionName: string, ...args: any[]): Promise<TransactionRequest> {
//     const tx = await this.ethersContract[functionName].populateTransaction(...args);
//     return this.ethersTransactionToTransactionRequest(tx);
//   }

//   getFunctions(): Record<string, (...args: any[]) => Promise<any>> {
//     const functions: Record<string, (...args: any[]) => Promise<any>> = {};
//     for (const [name, func] of Object.entries(this.ethersContract.functions)) {
//       functions[name] = (...args: any[]) => (func as any)(...args);
//     }
//     return functions;
//   }

//   // May want to look deeper into ether to non-ether conversion
//   private ethersTransactionToTransactionRequest(tx: ethers.TransactionRequest): TransactionRequest {
//     return {
//       to: tx.to as string,
//       from: tx.from as string,
//       nonce: tx.nonce as number,
//       gasLimit: tx.gasLimit ? BigInt(tx.gasLimit.toString()) : undefined,
//       gasPrice: tx.gasPrice ? BigInt(tx.gasPrice.toString()) : undefined,
//       data: tx.data as string,
//       value: tx.value ? BigInt(tx.value.toString()) : null, // Changed to null
//       chainId: tx.chainId as number,
//     };
//   }

// }

