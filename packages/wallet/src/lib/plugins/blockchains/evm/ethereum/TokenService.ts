import type { AbstractBlockchain } from '$plugins/Blockchain';
import type { BaseTransaction, BigNumberish, TransactionResponse } from '$lib/common';
import { AbstractContract } from '$plugins/Contract';
import { ABIs } from '$lib/plugins/contracts/evm/constants-evm';

export class TokenService<T extends BaseTransaction> {
  private blockchain: AbstractBlockchain<T>;

  constructor(blockchain: AbstractBlockchain<T>) {
    this.blockchain = blockchain;
  }

  private getTokenContract(tokenAddress: string): AbstractContract {
    return this.blockchain.createContract(tokenAddress, ABIs.ERC20);
  }

  async getTokenInfo(tokenAddress: string) {
    const contract = this.getTokenContract(tokenAddress);
    
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.call('name'),
      contract.call('symbol'),
      contract.call('decimals'),
      contract.call('totalSupply')
    ]);

    return { name, symbol, decimals, totalSupply };
  }

  async getBalance(tokenAddress: string, userAddress: string): Promise<BigNumberish> {
    const contract = this.getTokenContract(tokenAddress);
    return await contract.call('balanceOf', userAddress);
  }

  async transfer(tokenAddress: string, toAddress: string, amount: BigNumberish): Promise<TransactionResponse> {
    const contract = this.getTokenContract(tokenAddress);
    
    const gasEstimate = await contract.estimateGas('transfer', toAddress, amount);
    const tx = await contract.populateTransaction('transfer', toAddress, amount);
    tx.gasLimit = gasEstimate;

    return await this.blockchain.sendTransaction(tx);
  }
}
