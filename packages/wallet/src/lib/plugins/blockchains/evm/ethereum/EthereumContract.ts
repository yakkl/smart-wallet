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

    // console.log('EthereumContract - constructor - address, abi, providerOrSigner', address, abi, providerOrSigner);
  }

  async call(functionName: string, ...args: any[]): Promise<any> {
    
    // console.log('EthereumContract - call - functionName, args', functionName, args);

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
