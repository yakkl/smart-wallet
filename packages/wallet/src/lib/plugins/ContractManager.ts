/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/contracts/ContractManager.ts

import type { AbstractBlockchain } from './Blockchain';


export class ContractManager {
  private blockchain: AbstractBlockchain<any>;

  constructor(blockchain: AbstractBlockchain<any>) {
    this.blockchain = blockchain;
  }

  async callContractFunction(
    contractAddress: string,
    abi: any[],
    functionName: string,
    ...args: any[]
  ): Promise<any> {
    const contract = this.blockchain.createContract(contractAddress, abi);
    return await contract.call(functionName, ...args);
  }

  // Add methods for estimateGas, populateTransaction, etc.
}
