import type { BigNumberish, TransactionResponse } from '$lib/common';
import type { Token } from '$plugins/Token';
import type { Blockchain } from './Blockchain';
import type { Provider } from '$plugins/Provider';


// export interface Token {
//   address: string;
//   symbol: string;
//   decimals: number;
// }

export interface SwapQuote {
  amountIn: BigNumberish;
  amountOut: BigNumberish;
  path: string[];
  priceImpact: number;
}

export abstract class SwapManager {
  protected blockchain: Blockchain;
  protected provider: Provider;

  constructor(blockchain: Blockchain, provider: Provider) {
    this.blockchain = blockchain;
    this.provider = provider;
  }

  abstract getQuote(tokenIn: Token, tokenOut: Token, amountIn: BigNumberish): Promise<SwapQuote>;
  abstract executeSwap(tokenIn: Token, tokenOut: Token, amountIn: BigNumberish, minAmountOut: BigNumberish, recipient: string, deadline: number): Promise<TransactionResponse>;
  abstract addLiquidity(tokenA: Token, tokenB: Token, amountA: BigNumberish, amountB: BigNumberish, minAmountA: BigNumberish, minAmountB: BigNumberish, recipient: string, deadline: number): Promise<TransactionResponse>;
  abstract removeLiquidity(tokenA: Token, tokenB: Token, liquidity: BigNumberish, minAmountA: BigNumberish, minAmountB: BigNumberish, recipient: string, deadline: number): Promise<TransactionResponse>;
}
