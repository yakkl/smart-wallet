/* eslint-disable @typescript-eslint/no-explicit-any */
// UniswapPriceProvider.ts
import { ethers } from 'ethers';
import type { PriceData, PriceProvider, SwapToken } from '$lib/common/interfaces';
import { ADDRESSES } from '$plugins/contracts/evm/constants-evm';
import type { Provider } from '$lib/plugins/Provider';
import { getToken, type TokenPair } from '$lib/common/tokens';

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';

const FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
];

const QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)'
];

const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() external view returns (uint128)'
];

export class UniswapPriceProvider implements PriceProvider {
  private providerYakkl: Provider;
  private nativePriceProvider: PriceProvider;
  private provider: ethers.JsonRpcProvider | undefined;
  private factory: ethers.Contract | undefined;
  private quoter: ethers.Contract | undefined;
  private pool: ethers.Contract | undefined;

  constructor ( providerYakkl: Provider, nativePriceProvider: PriceProvider ) {
    this.nativePriceProvider = nativePriceProvider;
    this.providerYakkl = providerYakkl;
    this.initializeProvider();
  }

  private async initializeProvider(): Promise<void> {
    try {
      const url = await this.providerYakkl.getProviderURL();
      this.provider = new ethers.JsonRpcProvider( url );
      this.factory = new ethers.Contract( ADDRESSES.UNISWAP_FACTORY_ADDRESS, FACTORY_ABI, this.provider );
      this.quoter = new ethers.Contract( ADDRESSES.UNISWAP_V3_QUOTER, QUOTER_ABI, this.provider );
    } catch ( error ) {
      console.error( 'Failed to initialize provider:', error );
      throw new Error( 'Provider initialization failed' );
    }
  }

  getName(): string {
    return 'Uniswap V3';
  }

  async getPrice( pair: string ): Promise<PriceData> {
    try {
      const tokenPair = await this.getTokenPair( pair );
      if ( !tokenPair ) {
        return this.returnError( `Invalid pair - ${ pair }` );
      }
      if ( 'price' in tokenPair ) {
        
        console.log( 'UniswapPriceProvider - PriceData:', tokenPair );

        return tokenPair; // This is a PriceData object, likely an error or native price
      }
      const rc = await this.getUniswapPrice( tokenPair.tokenIn, tokenPair.tokenOut );
      console.log( 'UniswapPriceProvider - getPrice - getUniswapPrice - rc:', rc );
      return rc;
    } catch ( error ) {
      console.error( 'Error in getPrice:', error );
      return this.returnError( `Error fetching price for ${ pair }: ${ error }` );
    }
  }

  // If fee is 0, it will try 500, 3000, and 10000 pools else it will only try the specified fee
  private async getUniswapPrice( tokenIn: SwapToken, tokenOut: SwapToken, fee: number = 3000 ): Promise<PriceData> {
    let fees = [ fee ];
    let bestQuoteAmount = 0;
    let bestFee = 3000;
    let bestPoolInfo: any = null;

    if ( fee === 0 ) {
      fees = [ 500, 3000, 10000 ];
    }

    for ( const fee of fees ) {
      try {
        const poolInfo = await this.getPoolInfo( tokenIn, tokenOut, fee );
        if ( poolInfo && poolInfo.quoteAmount > bestQuoteAmount ) {
          bestQuoteAmount = poolInfo.quoteAmount;
          bestFee = fee;
          bestPoolInfo = poolInfo;
        }
      } catch ( error ) {
        console.error( `Error processing fee ${ fee }:`, error );
      }
    }

    if ( bestQuoteAmount === 0 ) {
      return this.returnError( `No liquidity pool found for ${ tokenIn.symbol }-${ tokenOut.symbol }` );
    }

    return {
      provider: this.getName(),
      price: bestQuoteAmount,
      lastUpdated: new Date(),
      contractFeePool: bestFee,
      status: 0,
      message: '',
      chainId: this.providerYakkl.chainId,
      poolInfo: {
        ...bestPoolInfo,
        tokenASymbol: tokenIn.symbol,
        tokenBSymbol: tokenOut.symbol,
      }
    };
  }

  private async getPoolInfo( tokenIn: SwapToken, tokenOut: SwapToken, fee: number ): Promise<any | null> {
    if ( !this.factory || !this.quoter || !this.provider ) {
      throw new Error( 'Contracts not initialized' );
    }

    const pool = await this.factory.getPool( tokenIn.address, tokenOut.address, BigInt( fee ) );
    if ( pool === ethers.ZeroAddress ) {
      return null;
    }

    const amountIn = ethers.parseUnits( '1', tokenIn.decimals );
    const amountOut = await this.quoter.quoteExactInputSingle.staticCall(
      tokenIn.address,
      tokenOut.address,
      BigInt( fee ),
      amountIn,
      0
    );

    const quoteAmount = parseFloat( ethers.formatUnits( amountOut, tokenOut.decimals ) );

    this.pool = new ethers.Contract( pool, POOL_ABI, this.provider );
    const liquidity = await this.pool.liquidity();
    const slot0 = await this.pool.slot0();

    const sqrtPriceX96 = BigInt( slot0[ 0 ] );

    // Calculate price
    const price = ( sqrtPriceX96 * sqrtPriceX96 * BigInt( 10 ** 18 ) ) / ( BigInt( 2 ) ** BigInt( 192 ) );

    const liquidityBigInt = BigInt( liquidity );

    // Calculate reserves
    const sqrtPrice = Number( sqrtPriceX96 ) / 2 ** 96;
    const tokenAAmount = Number( liquidityBigInt ) / sqrtPrice / ( 10 ** tokenIn.decimals );
    const tokenBAmount = Number( liquidityBigInt ) * sqrtPrice / ( 10 ** tokenOut.decimals );

    const [ tokenAPrice, tokenBPrice ] = await Promise.all( [
      this.nativePriceProvider.getPrice( `${ tokenIn.symbol }-USD` ),
      this.nativePriceProvider.getPrice( `${ tokenOut.symbol }-USD` )
    ] );

    const tvl = ( tokenAAmount * tokenAPrice.price ) + ( tokenBAmount * tokenBPrice.price );

    // Logging for debugging
    console.log( 'Raw sqrtPriceX96:', sqrtPriceX96.toString() );
    console.log( 'Calculated price:', Number( price ) / 1e18 );
    console.log( 'Token A (WBTC) amount:', tokenAAmount );
    console.log( 'Token B (WETH) amount:', tokenBAmount );
    console.log( 'Calculated TVL:', tvl );
    
    return {
      fee,
      liquidity: liquidity.toString(),
      quoteAmount,
      price: Number( price ) / 1e18,
      tokenAReserve: tokenAAmount,
      tokenBReserve: tokenBAmount,
      tvl,
      tokenAUsdPrice: tokenAPrice.price,
      tokenBUsdPrice: tokenBPrice.price
    };
  }

  async getTokenPair( pair: string ): Promise<TokenPair | PriceData> {
    if ( !pair ) {
      return this.returnError( `Invalid pair - ${ pair }` );
    }

    const [ tokenInSymbol, tokenOutSymbol ] = pair.split( '-' );
    if ( !tokenInSymbol || !tokenOutSymbol ) {
      return this.returnError( `Invalid pair format - ${ pair }` );
    }

    const tokenIn = this.getStandardizedToken( tokenInSymbol );
    const tokenOut = this.getStandardizedToken( tokenOutSymbol );

    if ( !tokenIn || !tokenOut ) {
      return this.returnError( `Token not found for ${ pair }` );
    }

    if ( tokenIn.address === tokenOut.address ) {
      return this.nativePriceProvider.getPrice( `${ tokenInSymbol }-USD` );
    }

    if ( tokenIn.address === WETH && tokenOut.address === WETH ) {
      return this.nativePriceProvider.getPrice( 'ETH-USD' );
    }

    if ( tokenIn.address === WBTC && tokenOut.address === WBTC ) {
      return this.nativePriceProvider.getPrice( 'BTC-USD' );
    }

    return { tokenIn, tokenOut };
  }

  private getStandardizedToken( symbol: string ): SwapToken | null {
    let standardizedSymbol = symbol;
    if ( symbol === 'USD' ) standardizedSymbol = 'USDC';
    if ( symbol === 'ETH' ) standardizedSymbol = 'WETH';
    return getToken( standardizedSymbol, this.providerYakkl.chainId );
  }

  private returnError( message: string ): PriceData {
    return {
      provider: this.getName(),
      price: 0,
      lastUpdated: new Date(),
      status: 404,
      message
    };
  }

  calculateFee( swapAmount: number, feeTier: number ): bigint {
    const amount = this.convertToBigInt( swapAmount );
    return ( amount * BigInt( feeTier ) ) / BigInt( 10000 );
  }

  convertToBigInt( price: number, decimals: number = 18 ): bigint {
    const scaledPrice = price * Math.pow( 10, decimals );
    return BigInt( Math.floor( scaledPrice ) );
  }
}
