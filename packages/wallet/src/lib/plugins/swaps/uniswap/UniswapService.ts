/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// UniswapService.ts
import { SwapManager, type SwapQuote } from '../../SwapManager';
import { AlphaRouter, SwapType, type SwapOptions } from '@uniswap/smart-order-router';
import { Token as UniswapToken, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core';
import type { Blockchain } from '../../Blockchain';
import type { Provider } from '../../Provider';
import type { TransactionResponse } from '$lib/common/interfaces';
import type { BigNumberish } from '$lib/common/bignumber';
import type { Token } from '$plugins/Token';

export class UniswapService extends SwapManager {
  private readonly router: AlphaRouter;
  private feeBasisPoints: number;

  constructor(
    blockchain: Blockchain,
    provider: Provider,
    initialFeeBasisPoints: number = 875
  ) {
    super(blockchain, provider);
    this.feeBasisPoints = initialFeeBasisPoints;
    this.router = new AlphaRouter({ chainId: blockchain.chainId, provider: provider as any });
  }

  private convertToUniswapToken(token: Token): UniswapToken {
    return new UniswapToken(
      this.blockchain.chainId,
      token.address,
      token.decimals,
      token.symbol,
      token.name
    );
  }

  public async getQuote(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: BigNumberish
  ): Promise<SwapQuote> {
    const uniswapTokenIn = this.convertToUniswapToken(tokenIn);
    const uniswapTokenOut = this.convertToUniswapToken(tokenOut);
    const amount = CurrencyAmount.fromRawAmount(uniswapTokenIn, amountIn!.toString());

    const swapOptions: SwapOptions = {
      type: SwapType.SWAP_ROUTER_02,
      recipient: await this.provider.getSigner().getAddress(),
      slippageTolerance: new Percent(50, 10000), // Default 0.5% slippage tolerance
      deadline: Math.floor(Date.now() / 1000 + 1800)
    };

    const route = await this.router.route(
      amount,
      uniswapTokenOut,
      TradeType.EXACT_INPUT,
      swapOptions
    );

    if (!route) throw new Error('No route found');

    const quote = BigInt(route.quote.toString());
    const feeAmount = (quote * BigInt(this.feeBasisPoints)) / 10000n;
    const quoteWithFee = quote - feeAmount;

    const priceImpact = Number((feeAmount * 10000n) / quote) / 100;

    return {
      amountIn,
      amountOut: quoteWithFee.toString(),
      path: route.route.map(r => r.toString()),
      priceImpact
    };
  }

  public async executeSwap(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: BigNumberish,
    minAmountOut: BigNumberish,
    recipient: string,
    deadline: number
  ): Promise<TransactionResponse> {
    const uniswapTokenIn = this.convertToUniswapToken(tokenIn);
    const uniswapTokenOut = this.convertToUniswapToken(tokenOut);
    const amount = CurrencyAmount.fromRawAmount(uniswapTokenIn, amountIn!.toString());
  
    const swapOptions: SwapOptions = {
      type: SwapType.SWAP_ROUTER_02,
      recipient,
      slippageTolerance: new Percent(50, 10000), // Default 0.5% slippage tolerance
      deadline
    };
  
    const route = await this.router.route(
      amount,
      uniswapTokenOut,
      TradeType.EXACT_INPUT,
      swapOptions
    );
  
    if (!route) throw new Error('No route found');
  
    const { methodParameters } = route;
    if (!methodParameters) throw new Error('No method parameters found');
  
    const tx = await this.provider.getSigner().sendTransaction({
      data: methodParameters.calldata,
      to: methodParameters.to,
      value: methodParameters.value,
      from: await this.provider.getSigner().getAddress(),
      chainId: this.blockchain.chainId,
    });
  
    return tx;
  }

  public async addLiquidity(
    tokenA: Token,
    tokenB: Token,
    amountA: BigNumberish,
    amountB: BigNumberish,
    minAmountA: BigNumberish,
    minAmountB: BigNumberish,
    recipient: string,
    deadline: number
  ): Promise<TransactionResponse> {
    // TODO: Implement addLiquidity functionality for Uniswap
    throw new Error('addLiquidity method is not implemented for Uniswap');
  }

  public async removeLiquidity(
    tokenA: Token,
    tokenB: Token,
    liquidity: BigNumberish,
    minAmountA: BigNumberish,
    minAmountB: BigNumberish,
    recipient: string,
    deadline: number
  ): Promise<TransactionResponse> {
    // TODO: Implement removeLiquidity functionality for Uniswap
    throw new Error('removeLiquidity method is not implemented for Uniswap');
  }
}
