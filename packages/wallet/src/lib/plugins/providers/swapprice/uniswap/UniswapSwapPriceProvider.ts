/* eslint-disable @typescript-eslint/no-explicit-any */
// UniswapPriceProvider.ts
import { ethers } from 'ethers';
import type { MarketPriceData, PoolInfoData, PriceData, SwapPriceProvider, PriceProvider, SwapPriceData, SwapToken } from '$lib/common/interfaces';
import { ADDRESSES } from '$plugins/contracts/evm/constants-evm';
import type { Provider } from '$lib/plugins/Provider';
import { getToken, type TokenPair } from '$lib/common/tokens';
import { Pool, SqrtPriceMath, TickMath } from '@uniswap/v3-sdk';
import { CurrencyAmount, Token } from '@uniswap/sdk-core';
import type { BigNumberish } from '$lib/common/bignumber';
import JSBI from 'jsbi';

// const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
// const WBTC = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
// const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
// const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

export class UniswapSwapPriceProvider implements SwapPriceProvider {
  private providerYakkl: Provider;
  private nativePriceProvider: PriceProvider;
  private provider: ethers.JsonRpcProvider | undefined;
  private factory: ethers.Contract | undefined;
  private quoter: ethers.Contract | undefined;
  private pool: ethers.Contract | undefined;
  private chainId: number = 1;
  private feeBasisPoints: number;

  constructor ( providerYakkl: Provider, nativePriceProvider: PriceProvider, feeBasisPoints: number = 875 ) {
    this.nativePriceProvider = nativePriceProvider;
    this.providerYakkl = providerYakkl;
    this.feeBasisPoints = feeBasisPoints;
    this.initializeProvider();
  }

  private async initializeProvider(): Promise<void> {
    try {
      const url = await this.providerYakkl.getProviderURL();
      this.chainId = this.providerYakkl.getChainId();
      this.provider = new ethers.JsonRpcProvider( url );
      this.factory = new ethers.Contract( ADDRESSES.UNISWAP_FACTORY_ADDRESS, [
        'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
      ], this.provider );
      this.quoter = new ethers.Contract( ADDRESSES.UNISWAP_V3_QUOTER, [
          'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
          'function quoteExactOutputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountOut, uint160 sqrtPriceLimitX96) external returns (uint256 amountIn)'
        ], this.provider );
    } catch ( error ) {
      console.error( 'Failed to initialize provider:', error );
      throw new Error( 'Provider initialization failed' );
    }
  }

  getName(): string {
    return 'Uniswap V3';
  }
  
  setFeeBasisPoints( feeBasisPoints: number ): void {
    this.feeBasisPoints = feeBasisPoints;
  }

  private calculateFee( amount: bigint ): bigint {
    return ( amount * BigInt( this.feeBasisPoints ) ) / BigInt( 10000 );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getMarketPrice( pair: string ): Promise<MarketPriceData> {
    // Implement market price fetching logic
    throw new Error("Method not implemented.");
  }
  
  async getTokenUSDPrice( token: SwapToken, reserve: string ): Promise<number> {
    try {
      // Attempt to fetch from the native price provider
      const externalPriceData = await this.nativePriceProvider.getMarketPrice( `${ token.symbol }-USD` );
      if ( externalPriceData && externalPriceData.price > 0 ) {
        
        console.log( 'UniswapPriceProvider - fetchTokenPriceFallback - externalPriceData:', externalPriceData );

        return externalPriceData.price;
      }
    } catch ( error ) {
      console.log( `Error fetching external price for ${ token.symbol }, falling back to pool price:`, error );
    }

    // Fallback to calculating price based on the pool's reserves
    const tokenAmountInPool = parseFloat( reserve );
    if ( tokenAmountInPool > 0 ) {
      // Return fallback price based on pool liquidity (simplified)
      console.log( 'UniswapPriceProvider - fetchTokenPriceFallback - tokenAmountInPool:', tokenAmountInPool, 1 / tokenAmountInPool );

      return 1 / tokenAmountInPool;
    }

    console.log( 'UniswapPriceProvider - fetchTokenPriceFallback - $$$ 0 $$$:' );
    return 0; // Return $0 if no price is available
  }

  
  async getSwapPriceOut(
    tokenIn: SwapToken,
    tokenOut: SwapToken,
    amountIn: BigNumberish,
    fee: number = 3000
  ): Promise<SwapPriceData> {
    if ( !this.quoter ) throw new Error( 'Quoter not initialized' );
    if ( amountIn == null ) throw new Error( 'Amount in is null or undefined' );

    try {
      const amountInBigInt = BigInt( amountIn.toString() );
      const amountOut = await this.quoter.quoteExactInputSingle.staticCall(
        tokenIn.address,
        tokenOut.address,
        fee,
        amountInBigInt,
        0
      );

      const feeAmount = this.calculateFee( amountOut );
      const amountOutWithFee = amountOut - feeAmount;

      const amountOutDecimal = Number( ethers.formatUnits( amountOutWithFee, tokenOut.decimals ) );
      const amountInDecimal = Number( ethers.formatUnits( amountInBigInt, tokenIn.decimals ) );
      const price = amountOutDecimal / amountInDecimal;

      // Calculate price impact (simplified, you might want to implement a more sophisticated calculation)
      const priceImpact = ( ( Number( amountOut ) - Number( amountOutWithFee ) ) / Number( amountOut ) ) * 100;

      return {
        provider: this.getName(),
        lastUpdated: new Date(),
        chainId: this.providerYakkl.getChainId(),
        tokenIn,
        tokenOut,
        amountIn: amountInBigInt,
        amountOut,
        price,
        priceImpact,
        path: [ tokenIn.address, tokenOut.address ],
        fee,
        feeBasisPoints: feeAmount
      };
    } catch ( error ) {
      console.error( 'Error in getSwapPriceOut:', error );
      throw error;
    }
  }

  async getSwapPriceIn(
    tokenIn: SwapToken,
    tokenOut: SwapToken,
    amountOut: BigNumberish,
    fee: number = 3000
  ): Promise<SwapPriceData> {
    if ( !this.quoter ) throw new Error( 'Quoter not initialized' );
    if ( amountOut == null ) throw new Error( 'Amount out is null or undefined' );

    try {
      const amountOutBigInt = BigInt( amountOut.toString() );
      const amountOutWithFee = amountOutBigInt + this.calculateFee( amountOutBigInt );

      const amountIn = await this.quoter.quoteExactOutputSingle.staticCall(
        tokenIn.address,
        tokenOut.address,
        fee,
        amountOutWithFee,
        0
      );

      const amountInDecimal = Number( ethers.formatUnits( amountIn, tokenIn.decimals ) );
      const amountOutDecimal = Number( ethers.formatUnits( amountOutBigInt, tokenOut.decimals ) );
      const price = amountOutDecimal / amountInDecimal;

      // Calculate price impact (simplified, you might want to implement a more sophisticated calculation)
      const priceImpact = ( ( Number( amountOutWithFee ) - Number( amountOutBigInt ) ) / Number( amountOutBigInt ) ) * 100;

      return {
        provider: this.getName(),
        lastUpdated: new Date(),
        chainId: this.providerYakkl.getChainId(),
        tokenIn,
        tokenOut,
        amountIn,
        amountOut: amountOutBigInt,
        price,
        priceImpact,
        path: [ tokenIn.address, tokenOut.address ],
        fee,
        feeBasisPoints: this.calculateFee( amountOutBigInt )
      };
    } catch ( error ) {
      console.error( 'Error in getSwapPriceIn:', error );
      throw error;
    }
  }

  // Define tick spacing based on fee tier
  getTickSpacing( fee: number ): number {
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

  async getPoolInfo( tokenA: SwapToken, tokenB: SwapToken, fee: number = 3000 ): Promise<PoolInfoData> {
    if ( !this.factory || !this.provider ) throw new Error( 'Contracts not initialized' );

    try {
      const poolAddress = await this.factory.getPool( tokenA.address, tokenB.address, fee );
      if ( poolAddress === ethers.ZeroAddress ) {
        throw new Error( 'Pool does not exist' );
      }

      const poolContract = new ethers.Contract( poolAddress, [
        'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
        'function liquidity() external view returns (uint128)',
        'function token0() external view returns (address)',
        'function token1() external view returns (address)'
      ], this.provider );

      const [ slot0, liquidity, token0Address, token1Address ] = await Promise.all( [
        poolContract.slot0(),
        poolContract.liquidity(),
        poolContract.token0(),
        poolContract.token1()
      ] );

      const { sqrtPriceX96, tick } = slot0;

      const token0 = new Token( this.providerYakkl.getChainId(), token0Address, tokenA.decimals, tokenA.symbol, tokenA.name );
      const token1 = new Token( this.providerYakkl.getChainId(), token1Address, tokenB.decimals, tokenB.symbol, tokenB.name );

      const pool = new Pool(
        token0,
        token1,
        fee,
        sqrtPriceX96.toString(),
        liquidity.toString(),
        tick
      );

      // Calculate amounts of token0 and token1 in the pool
      const sqrtRatioX96 = JSBI.BigInt( sqrtPriceX96.toString() );
      const liquidity_ = JSBI.BigInt( liquidity.toString() );

      const token0Amount = SqrtPriceMath.getAmount0Delta(
        sqrtRatioX96,
        TickMath.MAX_SQRT_RATIO,
        liquidity_,
        true
      );
      const token1Amount = SqrtPriceMath.getAmount1Delta(
        TickMath.MIN_SQRT_RATIO,
        sqrtRatioX96,
        liquidity_,
        true
      );

      // Get CurrencyAmount for 1 unit of each token
      const amount0 = CurrencyAmount.fromRawAmount( token0, JSBI.BigInt( 10 ** token0.decimals ).toString() );
      const amount1 = CurrencyAmount.fromRawAmount( token1, JSBI.BigInt( 10 ** token1.decimals ).toString() );


      // Calculate prices
      const token0Price = pool.priceOf( token0 ).quote( amount0 );
      const token1Price = pool.priceOf( token1 ).quote( amount1 );

      const token0Reserves = ethers.formatUnits( token0Amount.toString(), tokenA.decimals );
      const token1Reserves = ethers.formatUnits( token1Amount.toString(), tokenB.decimals );

      const tvl = ( Number( ethers.formatUnits( liquidity, tokenA.decimals ) ) * Number( token0Price ) ) +
        ( Number( ethers.formatUnits( liquidity, tokenB.decimals ) ) * Number( token1Price ) );

      return {
        provider: this.getName(),
        lastUpdated: new Date(),
        chainId: this.providerYakkl.getChainId(),
        fee,
        liquidity: liquidity.toString(),
        sqrtPriceX96: sqrtPriceX96.toString(),
        tick,
        tokenInReserve: token0Reserves,
        tokenOutReserve: token1Reserves,
        tokenInUSDPrice: token0Price.toSignificant( 6 ),
        tokenOutUSDPrice: token1Price.toSignificant( 6 ),
        tvl
      };
    } catch ( error ) {
      console.error( 'Error in getPoolInfo:', error );
      throw error;
    }
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
      return this.nativePriceProvider.getMarketPrice( `${ tokenInSymbol }-USD` );
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

  convertToBigInt( price: number, decimals: number = 18 ): bigint {
    const scaledPrice = price * Math.pow( 10, decimals );
    return BigInt( Math.floor( scaledPrice ) );
  }
}

