// SwapAggregator.ts
import type { SwapManager } from './SwapManager';
import type { Token } from '$plugins/Token';
import type { BigNumberish, SwapPriceData, TransactionResponse, SwapParams } from '$lib/common';
import { log } from '$plugins/Logger';

export class SwapAggregator {
  private swapManagers: SwapManager[];

  constructor ( swapManagers: SwapManager[] ) {
    this.swapManagers = swapManagers;
  }

  async getBestQuote(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: BigNumberish,
    fundingAddress: string,
    isExactIn: boolean = true
  ): Promise<SwapPriceData | null> {
    const quotes = await Promise.all(
      this.swapManagers.map( async manager => {
        try {
          return await manager.getQuote( tokenIn, tokenOut, amountIn, fundingAddress, isExactIn );
        } catch ( error ) {
          log.error( `Error getting quote from ${ manager.getName() }:`, false, error );
          return null;
        }
      } )
    );

    const validQuotes = quotes.filter( ( quote ): quote is SwapPriceData =>
      quote !== null && quote.amountOut !== undefined && quote.amountOut !== null
    );

    if ( validQuotes.length === 0 ) {
      log.warn( 'No valid quotes received' );
      return null;
    }

    return validQuotes.reduce( ( best, current ) => {
      if ( !best || !best.amountOut ) return current;
      if ( !current || !current.amountOut ) return best;

      const bestAmount = BigInt( best.amountOut.toString() );
      const currentAmount = BigInt( current.amountOut.toString() );

      return currentAmount > bestAmount ? current : best;
    } );
  }

  async executeBestSwap( params: SwapParams ): Promise<TransactionResponse> {
    const { tokenIn, tokenOut, amount, recipient } = params;

    const bestQuote = await this.getBestQuote( tokenIn, tokenOut, amount, recipient );
    if ( !bestQuote ) {
      throw new Error( 'No valid quotes received' );
    }

    const bestManager = this.swapManagers.find(
      manager => manager.getName() === bestQuote.provider
    );

    if ( !bestManager ) {
      throw new Error( 'No suitable swap manager found' );
    }

    return bestManager.executeSwap( params );
  }
}













// // SwapAggregator.ts

// import type { SwapManager } from './SwapManager';
// import type { Token } from '$plugins/Token';
// import type { BigNumberish, SwapPriceData, TransactionResponse } from '$lib/common';

// export class SwapAggregator {
//   private swapManagers: SwapManager[];

//   constructor ( swapManagers: SwapManager[] ) {
//     this.swapManagers = swapManagers;
//   }

//   async getBestQuote( tokenIn: Token, tokenOut: Token, amountIn: BigNumberish ): Promise<SwapPriceData | null> {
//     const quotes = await Promise.all(
//       this.swapManagers.map( async manager => {
//         try {
//           return await manager.getQuote( tokenIn, tokenOut, amountIn );
//         } catch ( error ) {
//           console.log( `Error getting quote from ${ manager.getName() }:`, false, error );
//           return null;
//         }
//       } )
//     );

//     const validQuotes = quotes.filter( ( quote ): quote is SwapPriceData =>
//       quote !== null && quote.amountOut !== undefined && quote.amountOut !== null
//     );

//     if ( validQuotes.length === 0 ) {
//       console.warn( 'No valid quotes received' );
//       return null;
//     }

//     return validQuotes.reduce( ( best, current ) => {
//       if ( !best || !best.amountOut) return current;
//       if ( !current || !current.amountOut) return best;

//       const bestAmount = BigInt( best.amountOut.toString() );
//       const currentAmount = BigInt( current.amountOut.toString() );

//       return currentAmount > bestAmount ? current : best;
//     } );
//   }

//   async executeBestSwap( tokenIn: Token, tokenOut: Token, amountIn: BigNumberish, minAmountOut: BigNumberish, recipient: string, deadline: number ): Promise<TransactionResponse> {
//     const bestQuote = await this.getBestQuote( tokenIn, tokenOut, amountIn );
//     if ( !bestQuote ) {
//       throw new Error( 'No valid quotes received' );
//     }

//     const bestManager = this.swapManagers.find( manager => manager.getName() === bestQuote.provider );

//     if ( !bestManager ) {
//       throw new Error( 'No suitable swap manager found' );
//     }

//     return bestManager.executeSwap( tokenIn, tokenOut, amountIn, minAmountOut, recipient, deadline );
//   }
// }
