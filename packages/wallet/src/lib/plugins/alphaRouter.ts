/* eslint-disable @typescript-eslint/no-explicit-any */
import { TradeType, Percent } from '@uniswap/sdk-core';
import { AlphaRouter, type SwapOptions, type SwapRoute, SwapType, V3RouteWithValidQuote } from '@uniswap/smart-order-router';
import { CurrencyAmount } from '@uniswap/sdk-core';
import { ethers as ethersv5 } from 'ethers-v5';  // v5
import { Token } from './Token';
import type { BigNumberish } from '$lib/common/bignumber';
import { debug_log } from '$lib/common';
import { convertToUniswapToken } from './utilities/uniswap';

export async function multiHopQuoteAlphaRouter(
  tokenIn: Token,
  tokenOut: Token,
  amount: BigNumberish,
  fundingAddress: string,
  isExactIn: boolean = true
): Promise<void> {
  try {
    if (!amount) throw new Error("Amount is required");
    
    // Create both v5 and v6 providers
    const provider = new ethersv5.providers.AlchemyProvider(
      'mainnet',
      import.meta.env.VITE_ALCHEMY_API_KEY_PROD
    );

    // Initialize AlphaRouter with the v5-compatible provider
    const router = new AlphaRouter( {
      chainId: 1,
      provider: provider
    } );

    const slippageTolerance = new Percent( 5, 100 );

    // Convert amount to v5 BigNumber if needed
    const amountV5 = ethersv5.BigNumber.from( amount.toString() );

    const swapRouteOptions: SwapOptions = {
      recipient: fundingAddress,
      slippageTolerance,
      deadline: Math.floor( Date.now() / 1000 ) + 60 * 20,
      type: SwapType.SWAP_ROUTER_02,
    };

    // Convert tokens and create CurrencyAmount
    const uniswapTokenIn = convertToUniswapToken( tokenIn );
    const uniswapTokenOut = convertToUniswapToken( tokenOut );

    const currencyAmount = CurrencyAmount.fromRawAmount(
      isExactIn ? uniswapTokenIn : uniswapTokenOut,
      amountV5.toString()
    );

    // Get the swap route
    const swapRoute: SwapRoute | null = await router.route(
      currencyAmount,
      isExactIn ? uniswapTokenOut : uniswapTokenIn,
      isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
      swapRouteOptions
    );

    if ( !swapRoute ) {
      throw new Error( 'No valid route exists for the provided tokens and amount' );
    }

    // Extract quote information
    const quoteAmount = swapRoute.quote.toFixed( 0 );
    const gasEstimate = swapRoute.estimatedGasUsed;

    // Extract pool fee if available
    let poolFee: number | undefined;
    if ( swapRoute instanceof V3RouteWithValidQuote ) {
      const route = swapRoute.route;
      if ( route?.pools?.[ 0 ] ) {
        poolFee = route.pools[ 0 ].fee;
      }
    }

    const fee = poolFee ?? 3000;

    debug_log( 'Multi-hop quote:', {
      fee,
      quoteAmount,
      gasEstimate,
      swapRoute,
      currencyAmount,
      amountV5: amountV5.toString(),
      tokenIn,
      tokenOut,
      router,
      slippageTolerance,
    } );
    // return await constructQuoteData(
    //   tokenIn,
    //   tokenOut,
    //   fundingAddress,
    //   amount,
    //   BigInt( quoteAmount ),
    //   fee, // Assuming first fee for simplicity
    //   gasEstimate.toBigInt(),
    //   true, // multiHop
    //   0n, // sqrtPriceX96After.toBigInt(),
    //   0, // initializedTicksCrossed,
    //   isExactIn
    // );
  } catch ( error ) {
    debug_log( 'Error fetching multi-hop quote using AlphaRouter:', error );
    throw new Error( 'Failed to get multi-hop quote via AlphaRouter. This means pools do not exist.' );
  }
}
