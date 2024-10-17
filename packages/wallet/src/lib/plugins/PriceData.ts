import type { BigNumberish } from '$lib/common/bignumber';
import type { SwapToken } from '$lib/common/interfaces';

abstract class BasePriceData {
  provider: string;
  lastUpdated: Date;
  chainId: number;
  status?: number;
  message?: string;

  constructor ( provider: string, chainId: number ) {
    this.provider = provider;
    this.lastUpdated = new Date();
    this.chainId = chainId;
  }
}

export class MarketPriceData extends BasePriceData {
  price: number;
  pair: string;
  isNative: boolean;

  constructor ( provider: string, chainId: number, price: number, pair: string, isNative: boolean ) {
    super( provider, chainId );
    this.price = price;
    this.pair = pair;
    this.isNative = isNative;
  }
}

export class SwapPriceData extends BasePriceData {
  tokenIn: SwapToken;
  tokenOut: SwapToken;
  amountIn: BigNumberish;
  amountOut: BigNumberish;
  price: number;
  priceImpact: number;
  path: string[];

  constructor ( provider: string, chainId: number, tokenIn: SwapToken, tokenOut: SwapToken, amountIn: BigNumberish, amountOut: BigNumberish, price: number, priceImpact: number, path: string[] ) {
    super( provider, chainId );
    this.tokenIn = tokenIn;
    this.tokenOut = tokenOut;
    this.amountIn = amountIn;
    this.amountOut = amountOut;
    this.price = price;
    this.priceImpact = priceImpact;
    this.path = path;
  }
}

export class PoolInfoData extends BasePriceData {
  fee: number;
  liquidity: string;
  sqrtPriceX96: string;
  tick: number;
  tokenAReserve: string;
  tokenBReserve: string;
  tokenAUsdPrice: number;
  tokenBUsdPrice: number;
  tvl: number;

  constructor ( provider: string, chainId: number, fee: number, liquidity: string, sqrtPriceX96: string, tick: number, tokenAReserve: string, tokenBReserve: string, tokenAUsdPrice: number, tokenBUsdPrice: number, tvl: number ) {
    super( provider, chainId );
    this.fee = fee;
    this.liquidity = liquidity;
    this.sqrtPriceX96 = sqrtPriceX96;
    this.tick = tick;
    this.tokenAReserve = tokenAReserve;
    this.tokenBReserve = tokenBReserve;
    this.tokenAUsdPrice = tokenAUsdPrice;
    this.tokenBUsdPrice = tokenBUsdPrice;
    this.tvl = tvl;
  }
}
