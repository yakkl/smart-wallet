import type { AbstractBlockchain } from '$plugins/Blockchain';
import type { BaseTransaction, BigNumberish, TransactionResponse } from '$lib/common';
import { AbstractContract } from '$plugins/Contract';
import { ABIs } from '$lib/plugins/contracts/evm/constants-evm';

export class TokenService<T extends BaseTransaction> {
  private blockchain: AbstractBlockchain<T> | null = null;

  constructor(blockchain: AbstractBlockchain<T> | null = null) {
    this.blockchain = blockchain;
  }

  private getTokenContract(tokenAddress: string): AbstractContract | null{
    return this.blockchain ? this.blockchain.createContract(tokenAddress, ABIs.ERC20) : null;
  }

  async getTokenInfo(tokenAddress: string) {
    const contract = this.getTokenContract(tokenAddress);
    
    console.log('getTokenInfo - contract', contract);

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract?.call('name'),
      contract?.call('symbol'),
      contract?.call('decimals'),
      contract?.call('totalSupply')
    ]);

    return { name, symbol, decimals, totalSupply };
  }

  async getBalance(tokenAddress: string, userAddress: string): Promise<BigNumberish> {
    try {
      console.log('tokenAddress, user', tokenAddress, userAddress);

      const contract = this.getTokenContract(tokenAddress);
      console.log('contract', contract);
  
      return await contract?.call('balanceOf', userAddress);        
    } catch (error) {
      console.log('Contract - getBalance - error', error);
      return 0n;
    }
  }

  async transfer(tokenAddress: string, toAddress: string, amount: BigNumberish): Promise<TransactionResponse> {
    const contract = this.getTokenContract(tokenAddress);
    
    const gasEstimate = await contract?.estimateGas('transfer', toAddress, amount);
    const tx = await contract?.populateTransaction('transfer', toAddress, amount);
    tx!.gasLimit = gasEstimate;

    return await this.blockchain!.sendTransaction(tx!);
  }
}
