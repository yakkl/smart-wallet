import type { BigNumberish, TransactionResponse, SwapPriceData } from '$lib/common';
import type { Token } from '$plugins/Token';
import type { Blockchain } from './Blockchain';
import type { Provider } from '$plugins/Provider';

// SushiSwapManager and UniswapService use SwapQuote. This is temporary until their interfaces are updated or the classes are removed.
// export interface SwapQuote {
//   amountIn: BigNumberish;
//   amountOut: BigNumberish;
//   path: string[];
//   priceImpact: number;
// }

export abstract class SwapManager {
  protected blockchain: Blockchain;
  protected provider: Provider;
  protected feeBasisPoints: number;

  constructor ( blockchain: Blockchain, provider: Provider, initialFeeBasisPoints: number = 875 ) {
    this.blockchain = blockchain;
    this.provider = provider;
    this.feeBasisPoints = initialFeeBasisPoints;
  }

  setFeeBasisPoints( feeBasisPoints: number ): void {
    this.feeBasisPoints = feeBasisPoints;
  }

  getFeeBasisPoints(): number {
    return this.feeBasisPoints;
  }

  protected calculateFee( amount: bigint ): bigint {
    return ( amount * BigInt( this.feeBasisPoints ) ) / BigInt( 10000 );
  }

  abstract getName(): string;
  abstract getQuote(tokenIn: Token, tokenOut: Token, amountIn: BigNumberish): Promise<SwapPriceData>;
  abstract executeSwap(tokenIn: Token, tokenOut: Token, amountIn: BigNumberish, minAmountOut: BigNumberish, recipient: string, deadline: number): Promise<TransactionResponse>;
  abstract addLiquidity(tokenA: Token, tokenB: Token, amountA: BigNumberish, amountB: BigNumberish, minAmountA: BigNumberish, minAmountB: BigNumberish, recipient: string, deadline: number): Promise<TransactionResponse>;
  abstract removeLiquidity(tokenA: Token, tokenB: Token, liquidity: BigNumberish, minAmountA: BigNumberish, minAmountB: BigNumberish, recipient: string, deadline: number): Promise<TransactionResponse>;
}
