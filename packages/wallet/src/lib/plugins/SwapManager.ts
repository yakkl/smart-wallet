// SwapManager.ts
import type { Blockchain } from './Blockchain';
import type { Provider } from './Provider';
import type { Token } from './Token';
import { YAKKL_FEE_BASIS_POINTS, YAKKL_FEE_BASIS_POINTS_MAX, type BigNumberish, type TransactionResponse } from '$lib/common';
import type { PoolInfoData, SwapParams, SwapPriceData, SwapToken, TransactionRequest } from '$lib/common/interfaces';
import { PriceManager } from './PriceManager';


export abstract class SwapManager {
  protected blockchain: Blockchain;
  protected provider: Provider;
  protected feeBasisPoints: number = YAKKL_FEE_BASIS_POINTS;
  protected priceManager: PriceManager;
  public tokens: SwapToken[] = [];
  public preferredTokens: SwapToken[] = [];
  public stablecoinTokens: SwapToken[] = [];

  constructor ( blockchain: Blockchain, provider: Provider, initialFeeBasisPoints: number = YAKKL_FEE_BASIS_POINTS ) {
    this.blockchain = blockchain;
    this.provider = provider;
    this.feeBasisPoints = initialFeeBasisPoints < 0 ? YAKKL_FEE_BASIS_POINTS : initialFeeBasisPoints > YAKKL_FEE_BASIS_POINTS_MAX ? YAKKL_FEE_BASIS_POINTS_MAX : initialFeeBasisPoints;

    this.priceManager = new PriceManager();
  }

  getChainId(): number {
    return this.blockchain.chainId;
  }

  getMarketPrice( pair: string ) {
    return this.priceManager.getMarketPrice( pair ); //By default, this will cycle through all specified providers and return the first successful response unless 
  }

  getFeeBasisPoints(): number {
    return this.feeBasisPoints;
  }

  setFeeBasisPoints( feeBasisPoints: number ): void {
    this.feeBasisPoints = feeBasisPoints;
  }

  protected calculateFee( amount: bigint ): bigint {
    try {
      if ( amount === 0n || this.feeBasisPoints <= 0 ) return 0n;  // No fee if amount is zero or fee is <= zero
      if ( this.feeBasisPoints > YAKKL_FEE_BASIS_POINTS_MAX ) {
        this.feeBasisPoints = YAKKL_FEE_BASIS_POINTS_MAX;
        console.log( 'Fee basis points greater than max, setting to guard amount:', this.feeBasisPoints );
      } 
      return ( amount * BigInt( this.feeBasisPoints ) ) / BigInt( 100000 );
    } catch ( error ) {
      console.log( 'Error calculating fee:', error );
      return 0n;
    }
  }

  abstract checkIfPoolExists( tokenIn: Token, tokenOut: Token, fee: number ): Promise<boolean>;
  abstract fetchTokenList(): Promise<SwapToken[]>;
  abstract getPreferredTokens( tokens: SwapToken[] ): SwapToken[];
  abstract getName(): string;

  abstract getQuote(
    tokenIn: Token,
    tokenOut: Token,
    amount: BigNumberish,
    fundingAddress: string,
    isExactIn: boolean,
    fee?: number
  ): Promise<SwapPriceData>;

  abstract executeSwap( params: SwapParams ): Promise<TransactionResponse>;

  abstract getPoolInfo(
    tokenA: Token,
    tokenB: Token,
    fee?: number
  ): Promise<PoolInfoData>;

  abstract populateSwapTransaction(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    recipient: string,
    deadline: number,
    fee?: number,
    estimateOnly?: boolean
  ): Promise<TransactionRequest | bigint>;

  abstract distributeFeeManually(
    tokenOut: Token,
    feeAmount: BigNumberish,
    feeRecipient: string
  ): Promise<TransactionResponse>;

  abstract distributeFeeThroughSmartContract(
    tokenOut: Token,
    feeAmount: BigNumberish,
    feeRecipient: string
  ): Promise<TransactionResponse>;

}
