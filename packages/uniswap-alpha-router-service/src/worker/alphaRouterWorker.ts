// src/worker/alphaRouterWorker.ts
import {
  AlphaRouter,
  SwapType,
  type SwapRoute,
  V3Route,
  V2Route,
  RouteWithValidQuote,
  V3RouteWithValidQuote,
  V2RouteWithValidQuote
} from '@uniswap/smart-order-router';
import {
  Token,
  CurrencyAmount,
  TradeType,
  Percent,
  Currency
} from '@uniswap/sdk-core';
import { Pool } from '@uniswap/v3-sdk';
import { Pair } from '@uniswap/v2-sdk';
import { ethers } from 'ethers';
import type { AlphaRouterRequest, AlphaRouterResponse, RouteData, WorkerMessage, WorkerResponse } from '../types';

interface V3RouteExtended extends V3RouteWithValidQuote {
  pools: Pool[];
  tokenPath: Token[];
}

interface V2RouteExtended extends V2RouteWithValidQuote {
  pairs: Pair[];
  tokenPath: Token[];
}

class AlphaRouterWorker {
  private provider: ethers.providers.BaseProvider;
  private router: AlphaRouter;

  constructor () {
    this.provider = new ethers.providers.AlchemyProvider(
      'mainnet',
      process.env.ALCHEMY_API_KEY
    ) as ethers.providers.BaseProvider;

    this.router = new AlphaRouter( {
      chainId: 1,
      provider: this.provider
    } );
  }

  private extractFeeFromRoute( route: RouteWithValidQuote ): number {
    if ( this.isV3Route( route ) ) {
      const v3Route = route as V3RouteExtended;
      return v3Route.pools[ 0 ]?.fee ?? 3000;
    }
    return 3000; // Default fee for V2
  }

  private isV3Route( route: RouteWithValidQuote ): route is V3RouteExtended {
    return 'pools' in route;
  }

  private extractPathFromRoute( route: RouteWithValidQuote ): string[] {
    if ( this.isV3Route( route ) ) {
      const v3Route = route as V3RouteExtended;
      return v3Route.tokenPath.map( ( token: Token ) => token.address );
    } else {
      const v2Route = route as V2RouteExtended;
      return v2Route.tokenPath.map( ( token: Token ) => token.address );
    }
  }

  async handleRequest( request: AlphaRouterRequest ): Promise<WorkerResponse[ 'response' ]> {
    try {
      const { tokenIn, tokenOut, amount, fundingAddress, isExactIn } = request.payload;

      const slippageTolerance = new Percent( 5, 100 );
      const amountValue = ethers.BigNumber.from( amount );

      // Convert Token to CurrencyAmount
      const currencyAmount = CurrencyAmount.fromRawAmount(
        isExactIn ? tokenIn : tokenOut,
        amountValue.toString()
      );

      const route: SwapRoute | null = await this.router.route(
        currencyAmount,
        isExactIn ? tokenOut : tokenIn,
        isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
        {
          recipient: fundingAddress,
          slippageTolerance,
          deadline: Math.floor( Date.now() / 1000 ) + 1800,
          type: SwapType.SWAP_ROUTER_02
        }
      );

      if ( !route || !route.route || route.route.length === 0 ) {
        throw new Error( 'No route found' );
      }

      const firstRoute = route.route[ 0 ];
      const fee = this.extractFeeFromRoute( firstRoute );
      const path = this.extractPathFromRoute( firstRoute );

      return {
        success: true,
        data: {
          quoteAmount: route.quote.toFixed( 0 ),
          fee,
          gasEstimate: route.estimatedGasUsed.toString(),
          path
        }
      };
    } catch ( error ) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Worker setup
const worker = new AlphaRouterWorker();

self.onmessage = async ( event: MessageEvent<WorkerMessage> ) => {
  const response = await worker.handleRequest( event.data.request );
  self.postMessage( {
    id: event.data.id,
    response
  } as WorkerResponse );
};

export type {
  RouteData,
  AlphaRouterRequest,
  AlphaRouterResponse,
  WorkerMessage,
  WorkerResponse
};
