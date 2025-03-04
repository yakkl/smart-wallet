import { BigNumber, type BigNumberish } from '$lib/common/bignumber';
import { YAKKL_FEE_BASIS_POINTS } from '$lib/common/constants';
import type { SwapToken } from '$lib/common/interfaces';
import { Token } from '@uniswap/sdk-core';
import { log } from '../Logger';

export function getTickSpacing( fee: number ): number {
  switch ( fee ) {
    case 500:
      return 10;
    case 3000:
      return 60;
    case 10000:
      return 200;
    default:
      throw new Error( `Unsupported fee tier: ${ fee }` );
  }
}

// Function to convert SwapToken to Uniswap Token
export function convertToUniswapToken( swapToken: SwapToken ): Token {
  return new Token(
    swapToken.chainId,    // Chain ID from SwapToken
    swapToken.address,     // Token contract address from SwapToken
    swapToken.decimals,    // Token decimals from SwapToken
    swapToken.symbol,      // Token symbol from SwapToken
    swapToken.name         // Token name from SwapToken
  );
}

// Function to convert Uniswap Token to SwapToken
export function convertToSwapToken( uniswapToken: Token ): SwapToken {
  return {
    chainId: uniswapToken.chainId,
    address: uniswapToken.address,
    decimals: uniswapToken.decimals,
    symbol: uniswapToken.symbol as string, // May need to adjust this if the symbol is not a string
    name: uniswapToken.name as string, // May need to adjust this if the name is not a string
    isNative: false // Assuming it's not a native token (adjust as needed)
  };
}

export function convertToBigInt( price: number, decimals: number = 18 ): bigint {
  const scaledPrice = price * Math.pow( 10, decimals );
  return BigInt( Math.floor( scaledPrice ) );
}

export function sqrtPriceX96ToPrice( sqrtPriceX96: bigint, token0Decimals: number, token1Decimals: number ): number {
  const price = Number( sqrtPriceX96 ) / 2 ** 96;
  const adjustedPrice = price * price * ( 10 ** ( token0Decimals - token1Decimals ) );
  return adjustedPrice;
}

export function calculatePriceFromSqrtPriceX96( sqrtPriceX96: bigint, token0Decimals: number, token1Decimals: number ): {
  price0: string,  // Price of token0 in terms of token1
  price1: string,  // Price of token1 in terms of token0
  } {
  // Convert sqrtPriceX96 to price
  const Q192 = BigInt( 2 ) ** BigInt( 192 );
  const price0 = Number(
    ( sqrtPriceX96 * sqrtPriceX96 * BigInt( 10 ** token1Decimals ) ) /
    ( Q192 * BigInt( 10 ** token0Decimals ) )
  );

  const price1 = 1 / price0;

  return {
    price0: price0.toFixed( token1Decimals ),
    price1: price1.toFixed( token0Decimals )
  };
}

export function tokenInNetAmount( tokenOut: SwapToken, tokenOutAmount: BigNumberish, exchangeRate: bigint, feeBasisPoint: number = YAKKL_FEE_BASIS_POINTS ): BigNumberish {
  try {
    if ( !tokenOut || !tokenOutAmount || !exchangeRate ) {
      throw new Error( 'Invalid parameters' );
    }
    if ( tokenOutAmount === 0n ) {
      return 0n;
    }
    // Constants
    const tokenOutAmt: bigint = BigNumber.toBigInt( tokenOutAmount ) as bigint * BigInt( 10 ** tokenOut.decimals ); // 30 WETH with 18 decimals (using bigint for WETH)
    const conversionRate: bigint = BigInt( exchangeRate ); // 1 tokenIn = X tokenOut
    const feeBasisPoints: bigint = BigInt( feeBasisPoint ); // 0.875% as 875 basis points
    const feeDivisor: bigint = BigInt( 100000 ); // 100% is 100,000 basis points (so divide by 100,000)

    // Calculate the pre-fee amount of tokenOut in full precision
    const tokenOutAmountBeforeFee: bigint = ( tokenOutAmt * feeDivisor ) / ( feeDivisor - feeBasisPoints );

    // Calculate the required amount of tokenIn to net the desired amount of tokenOut
    const tokenInAmount: bigint = tokenOutAmountBeforeFee / conversionRate;

    return tokenInAmount;
  } catch ( error ) {
    log.error( 'Error calculating net amount:', false, error );
    return 0n;
  }
}
