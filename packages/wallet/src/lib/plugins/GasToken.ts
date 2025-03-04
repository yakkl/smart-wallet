/* eslint-disable @typescript-eslint/no-explicit-any */
// GasToken.ts
import { Token, type IToken } from '$plugins/Token';
import type { Blockchain } from '$plugins/Blockchain';
import type { Provider } from '$plugins/Provider';
import { type MarketPriceData } from '$lib/common';
import { PriceManager } from './PriceManager';
import { log } from "$plugins/Logger";

export interface IGasToken extends IToken {
  getSponsoredGasEstimate( transaction: any ): Promise<bigint>;
  checkSponsorshipEligibility( userAddress: string ): Promise<boolean>;
}

export class GasToken extends Token {
  protected priceManager: PriceManager;
  protected fundingAddress: string | null = null;
  protected fundingPair: string | null = null;
  protected lastPrice: MarketPriceData | null = null;
  protected lastPriceCheck: number = 0;
  protected lastBalanceCheck: number = 0;

  constructor (
    name: string,
    symbol: string,
    blockchain: Blockchain,
    provider: Provider,
    fundingAddress: string | null = null,
    chainId: number = 1,
    decimals: number = 18,
    logoURI: string = '/images/logoBullFav.svg',
    contractAddress: string = ''
  ) {
    super(
      contractAddress, // GasToken does not need an address, it is native. However, in the future we may sponsor a gas token, so we keep this field
      name,
      symbol,
      decimals,
      logoURI,
      `${ name } YAKKL native gas token`,
      chainId,
      true, // Native token
      false, // Not a stablecoin
      blockchain,
      provider
    );

    this.priceManager = new PriceManager();
    this.fundingAddress = fundingAddress;
    if ( this.fundingAddress ) this.getBalance( this.fundingAddress ).then( balance => { this.balance = balance; this.lastBalanceCheck = Date.now(); } );
    this.fundingPair = `${ symbol }-USD`;
  }

  // GasToken does not need a contract, as it is native to the blockchain
  async getContract(): Promise<null> {
    return null;
  }

  // Overriding to provide more appropriate handling for native balance
  async getBalance( userAddress: string ): Promise<bigint> {
    if ( !userAddress ) return 0n;
    if ( this.blockchain ) {
      this.balance = await this.blockchain.getBalance( userAddress );
      this.lastBalanceCheck = Date.now();
    } else {
      this.balance = 0n;
    }
    return this.balance;
  }

  async getMarketPrice( pair: string | null = this.fundingPair ): Promise<MarketPriceData> {
    try {
      if (!pair ) {
        log.error('GasToken - getMarketPrice - pair is invalid (null)');
        throw new Error("Invalid pair for market price check");
      }

      // log.debug('GasToken - getMarketPrice - pair', pair);

      const price = await this.priceManager.getMarketPrice( pair );
      this.lastPrice = price;
      this.lastPriceCheck = Date.now();
      return price;
    } catch ( error ) {
      log.errorStack('GasToken - getMarketPrice', false, error);
      throw error;
    }
  }

  async hasSufficientBalance( userAddress: string, amount: bigint ): Promise<boolean> {
    this.balance = await this.getBalance( userAddress ); // Update the balance
    return this.balance >= amount;
  }

  // Transferring native tokens typically involves direct blockchain transactions
  // async transfer( toAddress: string, amount: bigint ): Promise<any> {
  //   const tx = {
  //     to: toAddress,
  //     value: amount,
  //     gasLimit: 21000 // Default gas limit for a native token transfer
  //   };
  //   return await this.provider.sendTransaction( tx );
  // }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transfer( toAddress: string, amount: bigint ): Promise<any> {
    throw new Error('Not implemented');
  }

  async getSponsoredGasEstimate( transaction: any ): Promise<bigint> {
    const gasEstimate = await this.provider.estimateGas( transaction );

    // Logic to determine if gas fees are sponsored by YAKKL
    const isSponsored = await this.checkSponsorshipEligibility( transaction.from );

    if ( isSponsored ) {
      // Apply a discount or use YAKKL to pay the gas fee
      return gasEstimate / 2n; // Example: half the gas fees covered by sponsorship
    }

    return gasEstimate;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkSponsorshipEligibility( userAddress: string ): Promise<boolean> {
    // Check user's eligibility for gas sponsorship (e.g., based on holdings or subscription)
    return true; // Placeholder logic
  }
}
