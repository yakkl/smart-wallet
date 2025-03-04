/* eslint-disable @typescript-eslint/no-explicit-any */
// SwapManager.ts
import type { Blockchain } from './Blockchain';
import type { Provider } from './Provider';
import type { Token } from './Token';
import { YAKKL_FEE_BASIS_POINTS, type BigNumberish, type TransactionResponse } from '$lib/common';
import type { PoolInfoData, SwapParams, SwapPriceData, SwapToken, TransactionReceipt, TransactionRequest } from '$lib/common/interfaces';
import { PriceManager } from './PriceManager';
import { calculateFeeAmount } from '$lib/utilities';
import { log } from '$plugins/Logger';

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
    this.feeBasisPoints = initialFeeBasisPoints < 0 ? YAKKL_FEE_BASIS_POINTS : initialFeeBasisPoints;  // If overriding the default fee basis points, ensure it is formatted correctly!
    this.priceManager = new PriceManager();
  }

  getChainId(): number {
    return this.blockchain.chainId;
  }

  getMarketPrice( pair: string ) {
    return this.priceManager.getMarketPrice( pair ); //By default, this will cycle through all specified providers and return the first successful response unless
  }

  getProvider(): Provider {
    return this.provider;
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
      return calculateFeeAmount( amount, this.feeBasisPoints );
    } catch ( error ) {
      log.error( 'Error calculating fee:', false, error );
      return 0n;
    }
  }

  abstract estimateSwapGas( swapRouterAddress: string, swapParams: SwapParams ): Promise<bigint>;

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

  abstract approveToken( token: Token, amount: string ): Promise<TransactionReceipt>;
  abstract checkAllowance( token: Token, fundingAddress: string ): Promise<bigint>;
  abstract executeSwap( params: SwapParams ): Promise<TransactionResponse>;
  abstract executeFullSwap( params: SwapParams ): Promise<[TransactionReceipt, TransactionReceipt]>; // Waits for transaction to be mined, sends fees, and returns transaction receipt

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

  abstract distributeFee(
    tokenOut: Token,
    feeAmount: BigNumberish,
    feeRecipient: string,
    gasLimit: BigNumberish,
    maxPriorityFeePerGas: BigNumberish,
    maxFeePerGas: BigNumberish
  ): Promise<TransactionReceipt>;

}
