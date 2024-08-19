/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/contracts/ContractManager.ts

import type { Wallet } from '$plugins/Wallet';
import type { ContractFunction } from '$lib/common/interfaces';
import { Contract } from './Contract';
import { Interface } from 'ethers';

export class ContractManager {
  private wallet: Wallet;

  constructor(wallet: Wallet) {
    this.wallet = wallet;
  }

  async verifyContract(address: string): Promise<boolean> {
    return await this.wallet.getBlockchain().isSmartContract(address);
  }

  getContractFunctions(abi: string): ContractFunction[] {
    const parsedABI = JSON.parse(abi);
    return parsedABI
      .filter((item: any) => item.type === 'function')
      .map((func: any) => ({
        name: func.name,
        inputs: func.inputs.map((input: any) => ({
          name: input.name,
          type: input.type
        })),
        stateMutability: func.stateMutability
      }));
  }

  async callContractFunction(
    contractAddress: string,
    abi: string,
    functionName: string,
    args: any[]
  ): Promise<any> {
    const provider = this.wallet.getProvider();
    if (!provider) {
      throw new Error('Provider not available');
    }
    const contract = new Contract(contractAddress, new Interface(abi), provider);
    const signer = await this.wallet.setSigner(null); // Assuming this method returns a signer
    const contractWithSigner = contract.connect(signer);

    try {
      const result = await contractWithSigner.callFunction(functionName, args);
      return result;
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw error;
    }
  }
}
