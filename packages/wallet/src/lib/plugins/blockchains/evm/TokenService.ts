import type { AbstractBlockchain } from '$plugins/Blockchain';
import { type BaseTransaction, type BigNumberish, type TokenData, type TransactionResponse } from '$lib/common';
import { AbstractContract } from '$plugins/Contract';
import { ABIs } from '$lib/plugins/contracts/evm/constants-evm';  // Only ERC20 ABI is used
import { updateTokenBalances } from '$lib/common/tokens';
import { log } from '$lib/plugins/Logger';

export class TokenService<T extends BaseTransaction> {
  private blockchain: AbstractBlockchain<T> | null = null;

  constructor(blockchain: AbstractBlockchain<T> | null = null) {
    this.blockchain = blockchain;
  }

  private getTokenContract( tokenAddress: string ): AbstractContract | null{
    if ( !tokenAddress ) return null; // Want a graceful way to handle this instead of throwing an error
    return this.blockchain ? this.blockchain.createContract( tokenAddress, ABIs.ERC20 ) : null; //, this.blockchain?.getProvider()?.getProviderEthers() || undefined) : null;
  }

  async getTokenInfo( tokenAddress: string ) {
    if ( !tokenAddress ) return { name: '', symbol: '', decimals: 0, totalSupply: 0n }; // Want a graceful way to handle this instead of throwing an error
    try {
      const contract = this.getTokenContract( tokenAddress );
      if ( !contract ) return { name: '', symbol: '', decimals: 0, totalSupply: 0n };

      const [ name, symbol, decimals, totalSupply ] = await Promise.all( [
        contract.call( 'name' ),
        contract.call( 'symbol' ),
        contract.call( 'decimals' ),
        contract.call( 'totalSupply' )
      ] );

      return { name, symbol, decimals, totalSupply };
    } catch ( error ) {
      log.error( 'Contract - getTokenInfo:', false, error );
      return { name: '', symbol: '', decimals: 0, totalSupply: 0n };
    }
  }

  async getBalance(tokenAddress: string, userAddress: string): Promise<bigint> {
    try {
      if ( !tokenAddress || !userAddress ) return 0n; // Want a graceful way to handle this instead of throwing an error
      // Could check tokenAddress to see if it 'ethersv6.ZeroAddress' and if so then call provider.getBalance(userAddress). This would be for native tokens. In balanceUtils.ts, this is done with token.isNative
      const contract = this.getTokenContract( tokenAddress );
      if ( !contract ) return 0n;
      return await contract.call( 'balanceOf', userAddress ); // This checks the contract to see if it has the given userAddress registered and if it has a balance
    } catch (error) {
      log.error('Contract - getBalance - error', false, error);
      return 0n;
    }
  }

  async updateTokenBalances( userAddress: string ): Promise<void> {
    try {
      if ( !userAddress ) throw new Error( 'Invalid parameters' );
      // This fuction is defined in tokens.ts and updates the standard token balances and custom token balances.
      // Since this is the only function within the method then no need for await
      updateTokenBalances( userAddress, this.blockchain?.getProvider()?.getProvider() ?? undefined );
    } catch ( error ) {
      log.error( 'Error updating token balances:', false, error );
    }
  }

  async transfer( tokenAddress: string, toAddress: string, amount: BigNumberish ): Promise<TransactionResponse> {
    try {
      if ( !tokenAddress || !toAddress || !amount ) throw new Error( 'Invalid parameters' );
      const contract = this.getTokenContract( tokenAddress );
      if ( !contract ) throw new Error( 'Invalid contract' );

      const gasEstimate = await contract.estimateGas( 'transfer', toAddress, amount );
      const tx = await contract.populateTransaction( 'transfer', toAddress, amount );
      if ( !tx ) throw new Error( 'Invalid transaction' );
      tx.gasLimit = gasEstimate;

      return await this.blockchain!.sendTransaction( tx );
    }
    catch ( error ) {
      log.error( 'Contract - transfer - error', false, error );
      throw new Error(`Error transferring tokens: ${error}`);
    }
  }
}
