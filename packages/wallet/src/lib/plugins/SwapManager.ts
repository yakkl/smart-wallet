/* eslint-disable @typescript-eslint/no-explicit-any */
// SwapManager.ts
// SwapManager.ts
import type { Blockchain } from './Blockchain';
import type { Provider } from './Provider';

export interface Token {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  isNative?: boolean;
}

export interface SwapQuote {
  quote: string;
  quoteWithFee: string;
  minAmountOut: string;
  fee: string;
  priceImpact: string;
  route: string;
  slippageToleranceBps: string
}

export interface SwapTransactionResponse {
  hash: string;
  wait: () => Promise<any>;
}

export abstract class SwapManager {
  protected readonly blockchain: Blockchain;
  protected readonly provider: Provider;
  protected feeBasisPoints: number = 0;

  constructor(
    blockchain: Blockchain,
    provider: Provider,
    initialFeeBasisPoints: number = 875 // 0.875%
  ) {
    this.blockchain = blockchain;
    this.provider = provider;
    this.setFeeBasisPoints(initialFeeBasisPoints);
  }

  public setFeeBasisPoints(newFeeBasisPoints: number): void {
    if (newFeeBasisPoints < 0 || newFeeBasisPoints > 10000) {
      throw new Error('Fee basis points must be between 0 and 10000');
    }
    this.feeBasisPoints = newFeeBasisPoints;
  }

  public abstract getSwapQuote(
    tokenIn: Token,
    tokenOut: Token,
    amount: string,
    slippageToleranceBps?: number
  ): Promise<SwapQuote>;

  public abstract executeSwap(
    tokenIn: Token,
    tokenOut: Token,
    amount: string,
    slippageToleranceBps?: number
  ): Promise<SwapTransactionResponse>;

  public abstract addLiquidity(
    tokenA: Token,
    tokenB: Token,
    amountA: string,
    amountB: string,
    slippageToleranceBps?: number
  ): Promise<SwapTransactionResponse>;

  protected convertBpsToPercent(bps: number): number {
    return bps / 10000;
  }
}
