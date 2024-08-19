// src/lib/services/TokenService.ts
import type { Blockchain } from '$plugins/Blockchain';
import { ERC20_ABI } from '../ERC20Interface';
import type { BigNumberish } from '$lib/common';


// NOTE: This is only a simple example of a TokenService. It is not meant to be used in production!!

export class TokenService {
  private blockchain: Blockchain;

  constructor(blockchain: Blockchain) {
    this.blockchain = blockchain;
  }

  async getTokenInfo(tokenAddress: string) {
    const contract = this.blockchain.createContract(tokenAddress, ERC20_ABI);
    
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.call('name'),
      contract.call('symbol'),
      contract.call('decimals'),
      contract.call('totalSupply')
    ]);

    return { name, symbol, decimals, totalSupply };
  }

  async getBalance(tokenAddress: string, userAddress: string): Promise<BigNumberish> {
    const contract = this.blockchain.createContract(tokenAddress, ERC20_ABI);
    return await contract.call('balanceOf', userAddress);
  }

  async transfer(tokenAddress: string, toAddress: string, amount: BigNumberish) {
    const contract = this.blockchain.createContract(tokenAddress, ERC20_ABI);
    
    // Estimate gas
    const gasEstimate = await contract.estimateGas('transfer', toAddress, amount);

    // Populate transaction
    const tx = await contract.populateTransaction('transfer', toAddress, amount);

    // Add gas estimate to transaction
    tx.gasLimit = gasEstimate;

    // Send transaction
    return await this.blockchain.sendTransaction(tx);
  }
}
