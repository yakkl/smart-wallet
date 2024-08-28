/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AbstractBlockchain } from './Blockchain';
import type { AbstractContract } from './Contract';
import type { BaseTransaction, BigNumberish, TransactionRequest, TransactionResponse } from '$lib/common';

export class ContractManager<T extends BaseTransaction> {
  private blockchain: AbstractBlockchain<T>;

  constructor(blockchain: AbstractBlockchain<T>) {
    this.blockchain = blockchain;
  }

  createContract(address: string, abi: any[]): AbstractContract {
    return this.blockchain.createContract(address, abi);
  }

  async callContractFunction(
    contract: AbstractContract,
    functionName: string,
    ...args: any[]
  ): Promise<any> {
    return await contract.call(functionName, ...args);
  }

  async estimateGas(
    contract: AbstractContract,
    functionName: string,
    ...args: any[]
  ): Promise<BigNumberish> {
    return await contract.estimateGas(functionName, ...args);
  }

  async sendTransaction(
    contract: AbstractContract,
    functionName: string,
    ...args: any[]
  ): Promise<TransactionResponse> {
    return await contract.sendTransaction(functionName, ...args);
  }

  async populateTransaction(
    contract: AbstractContract,
    functionName: string,
    ...args: any[]
  ): Promise<TransactionRequest> {
    return await contract.populateTransaction(functionName, ...args);
  }
}
