/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/contracts/Contract.ts

import type { Provider } from '$plugins/Provider';
import type { Signer } from '$plugins/Signer';
import { ethers } from 'ethers';

export class Contract {
  private ethersContract: ethers.Contract;

  constructor(address: string, abi: ethers.Interface, providerOrSigner: Provider | Signer) {
    // Create an ethers provider that wraps our custom Provider
    const ethersProvider = {
      send: async (method: string, params: any[]) => {
        return await (providerOrSigner as Provider).request(method, params);
      }
    };

    this.ethersContract = new ethers.Contract(address, abi, ethersProvider as any);
  }

  connect(signer: Signer): Contract {
    const ethersSignerWrapper = {
      signMessage: (message: string) => signer.signMessage(message),
      signTransaction: (transaction: ethers.TransactionRequest) => signer.signTransaction(transaction as any),
      sendTransaction: (transaction: ethers.TransactionRequest) => signer.sendTransaction(transaction as any),
    };

    const connectedContract = this.ethersContract.connect(ethersSignerWrapper as any);
    return new Contract(connectedContract.target as string, connectedContract.interface, signer);
  }

  async callFunction(functionName: string, args: any[]): Promise<any> {
    if (typeof this.ethersContract[functionName] !== 'function') {
      throw new Error(`Function ${functionName} does not exist on the contract`);
    }
    return await this.ethersContract[functionName](...args);
  }
}
