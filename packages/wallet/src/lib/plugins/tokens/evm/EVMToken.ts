// EVMToken.ts
import { Token } from '$plugins/Token';
import type { Blockchain } from '$plugins/Blockchain';
import type { BigNumberish, TransactionResponse } from '$lib/common';
import { ABIs } from '$lib/plugins/contracts/evm/constants-evm';
import type { AbstractContract } from '$plugins/Contract';
import type { Provider } from '$lib/plugins/Provider';

export class EVMToken extends Token {
  private _contract: AbstractContract | null = null;

  constructor(
    address: string,
    name: string,
    symbol: string,
    decimals: number,
    logoURI: string,
    description: string = `${name} token`,
    chainId: number = 1,
    isNative?: boolean,
    isStablecoin?: boolean,
    blockchain?: Blockchain,
    provider?: Provider,
    privateKey?: string
  ) {
    super(address, name, symbol, decimals, logoURI, description, chainId, isNative, isStablecoin, blockchain, provider, privateKey);
  }

  async getContract(): Promise<AbstractContract | null> {
    if (!this._contract) {
      this._contract = this.blockchain.createContract(this.address, ABIs.ERC20);
    }
    return this._contract;
  }

  async getBalance(userAddress: string): Promise<BigNumberish> {
    const contract = await this.getContract();
    if (!contract) return 0n; // Want a graceful way to handle this instead of throwing an error
    return await contract.call('balanceOf', userAddress);
  }

  async transfer(toAddress: string, amount: BigNumberish): Promise<TransactionResponse> {
    const contract = await this.getContract();
    if (!contract) throw new Error('Invalid contract');
    const gasEstimate = await contract.estimateGas('transfer', toAddress, amount);
    const tx = await contract.populateTransaction( 'transfer', toAddress, amount );
    if (!tx) throw new Error('Invalid transaction');
    tx.gasLimit = gasEstimate;

    return await this.blockchain.sendTransaction(tx);
  }
}
