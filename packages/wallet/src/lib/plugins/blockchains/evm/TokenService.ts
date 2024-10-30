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

  async getTokenInfo( tokenAddress: string ) {
    try {
      const contract = this.getTokenContract( tokenAddress );
    
      console.log( 'getTokenInfo - contract', contract );

      const [ name, symbol, decimals, totalSupply ] = await Promise.all( [
        contract?.call( 'name' ),
        contract?.call( 'symbol' ),
        contract?.call( 'decimals' ),
        contract?.call( 'totalSupply' )
      ] );

      return { name, symbol, decimals, totalSupply };
    } catch ( error ) {
      console.log( 'Contract - getTokenInfo - error', error );
      return { name: '', symbol: '', decimals: 0, totalSupply: 0n };
    }
  }

  async getBalance(tokenAddress: string, userAddress: string): Promise<bigint> {
    try {
      const contract = this.getTokenContract(tokenAddress);
      return await contract?.call('balanceOf', userAddress); // This checks the contract to see if it has the given userAddress registered and if it has a balance
    } catch (error) {
      console.log('Contract - getBalance - error', error);
      return 0n;
    }
  }

  async transfer( tokenAddress: string, toAddress: string, amount: BigNumberish ): Promise<TransactionResponse> {
    try {
      const contract = this.getTokenContract( tokenAddress );
    
      const gasEstimate = await contract?.estimateGas( 'transfer', toAddress, amount );
      const tx = await contract?.populateTransaction( 'transfer', toAddress, amount );
      tx!.gasLimit = gasEstimate;

      return await this.blockchain!.sendTransaction( tx! );
    }
    catch ( error ) {
      console.log( 'Contract - transfer - error', error );
      throw new Error(`Error transferring tokens: ${error}`);
    }
  }
}
