/* eslint-disable @typescript-eslint/no-explicit-any */
// UniswapPriceProvider.ts
import { ethers } from 'ethers';
import type { MarketPriceData, PoolInfoData, PriceData, SwapPriceProvider, PriceProvider, SwapPriceData, SwapToken } from '$lib/common/interfaces';
import { ADDRESSES } from '$plugins/contracts/evm/constants-evm';
import type { Provider } from '$plugins/Provider';
import { getToken, type TokenPair } from '$lib/common/tokens';
import { computePoolAddress, Pool, SqrtPriceMath, TickMath } from '@uniswap/v3-sdk';
import { CurrencyAmount, Token } from '@uniswap/sdk-core';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
import { BigNumber, type BigNumberish } from '$lib/common';
import { safeConvertBigIntToNumber } from '$lib/utilities/utilities';
import JSBI from 'jsbi';


export class UniswapSwapPriceProvider implements SwapPriceProvider {
  private providerYakkl: Provider;
  private nativePriceProvider: PriceProvider;
  private provider: ethers.JsonRpcProvider | undefined;
  private factory: ethers.Contract | undefined;
  private quoter: ethers.Contract | undefined;
  private pool: ethers.Contract | undefined;
  private chainId: number = 1;
  private feeBasisPoints: number;

  private initialized: boolean = false;

  constructor ( providerYakkl: Provider, nativePriceProvider: PriceProvider, feeBasisPoints: number = 875 ) {
    this.nativePriceProvider = nativePriceProvider;
    this.providerYakkl = providerYakkl;
    this.feeBasisPoints = feeBasisPoints;
    this.initializeProvider();
  }

  async initialize(): Promise<void> {
    // if ( this.initialized ) return;

    await this.initializeProvider();
    // this.initialized = true;
  }

  private async initializeProvider(): Promise<void> {
    try {
      if ( this.provider && this.factory && this.quoter ) {
        console.log( 'UniswapPriceProvider - initializeProvider - Already initialized :)' );
        return;
      }

      const url = await this.providerYakkl.getProviderURL();
      this.chainId = this.providerYakkl.getChainId();
      this.provider = new ethers.JsonRpcProvider( url );

      this.factory = new ethers.Contract( ADDRESSES.UNISWAP_FACTORY, [
        'function getPool(address,address,uint24) external view returns (address)'
      ], this.provider );
      this.quoter = new ethers.Contract( ADDRESSES.UNISWAP_V3_QUOTER, [
        'function quoteExactInputSingle(address,address,uint24,uint256,uint160) external returns (uint256)',
        'function quoteExactOutputSingle(address,address,uint24,uint256,uint160) external returns (uint256)'
      ], this.provider );

      this.initialized = true;
    } catch ( error ) {
      console.error( 'Failed to initialize provider:', error );
      throw error;
    }
  }

  // Make sure all methods that use the provider wait for initialization
  private async ensureInitialized(): Promise<void> {
    if ( !this.initialized  || !this.provider || !this.factory || !this.quoter ) {
      await this.initialize();
    }
  }

  getName(): string {
    return 'Uniswap V3';
  }

  setFeeBasisPoints( feeBasisPoints: number ): void {
    this.feeBasisPoints = feeBasisPoints;
  }

  private calculateFee( amount: bigint ): bigint {
    if ( amount === 0n ) return 0n;
    console.log( 'UniswapPriceProvider - calculateFee - amount:', amount, 'feeBasisPoints:', this.feeBasisPoints, 'basis:', ( BigInt( this.feeBasisPoints ) ) / BigInt( 100000 ), 'nonbigint:', this.feeBasisPoints / 100000, 'fee:', ( amount * BigInt( this.feeBasisPoints ) ) / BigInt( 100000 ) );
    return ( amount * BigInt( this.feeBasisPoints ) ) / BigInt( 100000 );
  }

  async getMarketPrice( pair: string ): Promise<MarketPriceData> {
    return await this.nativePriceProvider.getMarketPrice( `${ pair }` );
  }

  // async getTokenPrice( token: SwapToken, reserve: string ): Promise<number> {
  //   try {
  //     // Attempt to fetch from the native price provider
  //     if ( token.isNative ) {
  //       const externalPriceData = await this.nativePriceProvider.getMarketPrice( `${ token.symbol }-USD` );
  //       if ( externalPriceData && externalPriceData.price > 0 ) {

  //         console.log( 'UniswapPriceProvider - fetchTokenPriceFallback - externalPriceData:', externalPriceData );

  //         return externalPriceData.price;
  //       }
  //     }
  //   } catch ( error ) {
  //     console.log( `Error fetching external price for ${ token.symbol }, falling back to pool price:`, error );
  //   }

  //   // Fallback to calculating price based on the pool's reserves
  //   const tokenAmountInPool = parseFloat( reserve );
  //   if ( tokenAmountInPool > 0 ) {
  //     // Return fallback price based on pool liquidity (simplified)
  //     console.log( 'UniswapPriceProvider - fetchTokenPriceFallback - tokenAmountInPool:', tokenAmountInPool, 1 / tokenAmountInPool );

  //     // https://blog.uniswap.org/uniswap-v3-math-primer
  //     return 1 / tokenAmountInPool;
  //   }

  //   console.log( 'UniswapPriceProvider - fetchTokenPriceFallback - $$$ 0 $$$:' );
  //   return 0; // Return $0 if no price is available
  // }

  async getSwapPriceOut(
    tokenIn: SwapToken,
    tokenOut: SwapToken,
    amountIn: BigNumberish,
    fee: number = 3000
  ): Promise<SwapPriceData> {
    await this.ensureInitialized();

    if ( !this.quoter || !this.factory ) throw new Error( 'Quoter or Factory not initialized' );
    if ( amountIn === null || amountIn === undefined ) throw new Error( 'Amount in is null or undefined' );

    try {
      console.log( 'UniswapPriceProvider - getSwapPriceOut - tokenIn:', tokenIn, 'tokenOut:', tokenOut, 'amountIn:', amountIn, 'fee:', fee );

      if ( amountIn === 0n ) {
        return {
          provider: this.getName(),
          lastUpdated: new Date(),
          chainId: this.providerYakkl.getChainId(),
          tokenIn,
          tokenOut,
          amountIn: 0,
          amountOut: 0,
          exchangeRate: 0,
          price: 0,
          priceImpact: 0,
          path: [ tokenIn.address, tokenOut.address ],
          fee,
          feeBasisPoints: 0n
        };
      }

      const poolAddress = await this.factory.getPool( tokenIn.address, tokenOut.address, fee );
      if ( poolAddress === ethers.ZeroAddress ) {
        throw new Error( 'Pool does not exist for tier' );
      }

      const amountInBigInt = EthereumBigNumber.toBigInt( amountIn );
      const amountOut = await this.quoter.quoteExactInputSingle.staticCall(
        tokenIn.address,
        tokenOut.address,
        fee,
        amountInBigInt,
        0
      );

      if ( amountOut === 0n ) {
        return {
          provider: this.getName(),
          lastUpdated: new Date(),
          chainId: this.providerYakkl.getChainId(),
          tokenIn,
          tokenOut,
          amountIn: amountInBigInt,
          amountOut: 0,
          exchangeRate: 0,
          price: 0,
          priceImpact: 0,
          path: [ tokenIn.address, tokenOut.address ],
          fee,
          feeBasisPoints: 0n
        };
      }

      const feeAmount = this.calculateFee( amountOut );
      const amountOutWithFee = BigInt( amountOut ) - feeAmount;

      const amountOutDecimal = Number( ethers.formatUnits( amountOutWithFee, tokenOut.decimals ) );
      const amountInDecimal = Number( ethers.formatUnits( amountInBigInt!.toString(), tokenIn.decimals ) );

      console.log( 'UniswapPriceProvider - getSwapPriceOut - amountInDecimal:', amountInDecimal, 'amountOutDecimal:', amountOutDecimal );

      const price = 0; // TODO: Calculate price

      console.log( 'UniswapPriceProvider - getSwapPriceOut - amountOut:', amountOut, 'amountOutWithFee:', amountOutWithFee, 'feeAmount:', feeAmount, 'feeWei:', EthereumBigNumber.toWei( feeAmount ), 'amountIn:', amountInBigInt, 'price:', price );

      // Calculate price impact (simplified, you might want to implement a more sophisticated calculation)
      const priceImpact = ( ( Number( amountOut ) - Number( amountOutWithFee ) ) / Number( amountOut ) ) * 100;

      console.log( 'UniswapPriceProvider - getSwapPriceOut - priceImpact:', priceImpact );

      return {
        provider: this.getName(),
        lastUpdated: new Date(),
        chainId: this.providerYakkl.getChainId(),
        tokenIn,
        tokenOut,
        amountIn: amountInBigInt,
        amountOut,
        exchangeRate: amountOutDecimal / amountInDecimal,
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
    await this.ensureInitialized();

    if ( !this.quoter || !this.factory ) throw new Error( 'Quoter or Factory not initialized' );
    if ( amountOut === null || amountOut === undefined ) throw new Error( 'Amount out is null or undefined' );

    try {
      console.log( 'UniswapPriceProvider - getSwapPriceIn - tokenIn:', tokenIn, 'tokenOut:', tokenOut, 'amountOut:', amountOut, 'fee:', fee );

      const amountOutBigInt = EthereumBigNumber.toBigInt( amountOut ) ?? 0n; // Adjust if necessary
      if ( amountOutBigInt === 0n ) {
        return {
          provider: this.getName(),
          lastUpdated: new Date(),
          chainId: this.providerYakkl.getChainId(),
          tokenIn,
          tokenOut,
          amountIn: 0,
          amountOut: 0,
          exchangeRate: 0,
          price: 0,
          priceImpact: 0,
          path: [ tokenIn.address, tokenOut.address ],
          fee,
          feeBasisPoints: 0n
        };
      }

      const poolAddress = await this.factory.getPool( tokenIn.address, tokenOut.address, fee );
      if ( poolAddress === ethers.ZeroAddress ) {
        throw new Error( 'Pool does not exist for tier' );
      }

      const feeAmount = this.calculateFee( amountOutBigInt );
      const amountOutWithFee = amountOutBigInt - feeAmount;

      const amountIn = await this.quoter.quoteExactInputSingle.staticCall(
        tokenIn.address,
        tokenOut.address,
        fee,
        amountOutWithFee,
        0
      );

      if ( amountIn === 0n ) {
        return {
          provider: this.getName(),
          lastUpdated: new Date(),
          chainId: this.providerYakkl.getChainId(),
          tokenIn,
          tokenOut,
          amountIn: 0,
          amountOut: amountOutBigInt,
          exchangeRate: 0,
          price: 0,
          priceImpact: 0,
          path: [ tokenIn.address, tokenOut.address ],
          fee,
          feeBasisPoints: 0n
        };
      }

      const amountInDecimal = Number( ethers.formatUnits( amountIn, tokenIn.decimals ) );
      const amountOutDecimal = Number( ethers.formatUnits( amountOutBigInt, tokenOut.decimals ) );
      const price = 0; // TODO: Calculate price

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
        exchangeRate: amountOutDecimal / amountInDecimal,
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

  async getPoolInfo( tokenIn: SwapToken, tokenOut: SwapToken, fee: number = 3000 ): Promise<PoolInfoData> {
    await this.ensureInitialized();

    console.log( 'UniswapPriceProvider - getPoolInfo - tokenIn:', tokenIn, 'tokenOut:', tokenOut, 'fee:', fee );
    console.log( 'UniswapPriceProvider - getPoolInfo - ADDRESSES.UNISWAP_FACTORY:', ADDRESSES.UNISWAP_FACTORY );
    console.log( 'UniswapPriceProvider - getPoolInfo - ADDRESSES.UNISWAP_V3_QUOTER:', ADDRESSES.UNISWAP_V3_QUOTER );
    console.log( 'UniswapPriceProvider - getPoolInfo - this.factory, this.provider:', this.factory, this.provider );

    if ( !this.factory || !this.provider ) throw new Error( 'Contracts not initialized' );

    try {
      const poolAddress = await this.factory.getPool( tokenIn.address, tokenOut.address, fee );
      if ( poolAddress === ethers.ZeroAddress ) {
        throw new Error( 'Pool does not exist' );
      }

      const tokenA = convertToUniswapToken( tokenIn );
      const tokenB = convertToUniswapToken( tokenOut );
      const currentPoolAddress = computePoolAddress( {
        factoryAddress: ADDRESSES.UNISWAP_FACTORY,
        tokenA,
        tokenB,
        fee
      } );

      console.log( 'Pool address:', poolAddress, currentPoolAddress );

      const poolContract = new ethers.Contract( poolAddress, IUniswapV3PoolABI.abi, this.provider );

      const [ slot0, liquidity, token0Address, token1Address, tickSpacing, poolFee ] = await Promise.all( [
        poolContract.slot0(),
        poolContract.liquidity(),
        poolContract.token0(),
        poolContract.token1(),
        poolContract.tickSpacing(),
        poolContract.fee()
      ] );

      console.log( 'Slot0:', slot0 );
      console.log( 'Liquidity:', liquidity.toString() );
      console.log( 'Token0 address:', token0Address, tokenA );
      console.log( 'Token1 address:', token1Address, tokenB );
      console.log( 'Tick spacing:', tickSpacing.toString() );
      console.log( 'Pool fee:', poolFee.toString() );

      const { sqrtPriceX96, tick } = slot0;

      console.log( 'sqrtPriceX96:', sqrtPriceX96.toString() );
      console.log( 'tick:', tick );

      const token0 = new Token( this.providerYakkl.getChainId(), token0Address, tokenIn.decimals, tokenIn.symbol, tokenIn.name );
      const token1 = new Token( this.providerYakkl.getChainId(), token1Address, tokenOut.decimals, tokenOut.symbol, tokenOut.name );

      console.log( 'Token0:', token0 );
      console.log( 'Token1:', token1 );

      // Ensure tick is within valid range
      const minTick = BigInt( TickMath.MIN_TICK );
      const maxTick = BigInt( TickMath.MAX_TICK );
      const tickBigInt = BigInt( tick.toString() );
      const validTickBigInt = tickBigInt < minTick ? minTick : ( tickBigInt > maxTick ? maxTick : tickBigInt );

      let validTick: number;
      try {
        validTick = safeConvertBigIntToNumber( validTickBigInt );
      } catch ( error ) {
        console.error( 'Error converting tick to number:', error );
        // Fallback to a default tick value or handle the error as appropriate for your use case
        validTick = 0; // or some other default value
      }

      console.log( 'Valid tick:', validTick );

      // Ensure sqrtPriceX96 is within valid range
      const minSqrtRatio = JSBI.BigInt( TickMath.MIN_SQRT_RATIO.toString() );
      const maxSqrtRatio = JSBI.BigInt( TickMath.MAX_SQRT_RATIO.toString() );
      const sqrtPriceX96BigInt = JSBI.BigInt( sqrtPriceX96.toString() );
      const clampedSqrtPriceX96 = JSBI.lessThan( sqrtPriceX96BigInt, minSqrtRatio )
        ? minSqrtRatio
        : ( JSBI.greaterThan( sqrtPriceX96BigInt, maxSqrtRatio ) ? maxSqrtRatio : sqrtPriceX96BigInt );

      console.log( 'Clamped sqrtPriceX96:', clampedSqrtPriceX96.toString() );

      const pool = new Pool(
        token0,
        token1,
        fee,
        clampedSqrtPriceX96.toString(),
        liquidity.toString(),
        validTick
      );

      console.log( 'Pool created successfully' );

      // Calculate amounts of token0 and token1 in the pool
      const sqrtRatioX96 = JSBI.BigInt( clampedSqrtPriceX96 );
      const liquidity_ = JSBI.BigInt( liquidity.toString() );

      console.log( 'sqrtRatioX96:', sqrtRatioX96.toString() );
      console.log( 'liquidity_:', liquidity_.toString() );

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

      console.log( 'token0Amount:', token0Amount.toString() );
      console.log( 'token1Amount:', token1Amount.toString() );

      // Get CurrencyAmount for 1 unit of each token
      const amount0 = CurrencyAmount.fromRawAmount(
        token0,
        JSBI.exponentiate( JSBI.BigInt( 10 ), JSBI.BigInt( token0.decimals ) ).toString()
      );
      const amount1 = CurrencyAmount.fromRawAmount(
        token1,
        JSBI.exponentiate( JSBI.BigInt( 10 ), JSBI.BigInt( token1.decimals ) ).toString()
      );

      console.log( 'amount0:', amount0.toExact() );
      console.log( 'amount1:', amount1.toExact() );

      // Calculate prices
      let token0Price, token1Price;
      try {
        // Get the sqrt price from the pool
        const sqrtPriceX96 = JSBI.BigInt( pool.sqrtRatioX96.toString() );

        // Calculate price0 (token1 per token0)
        const price0 = JSBI.divide(
          JSBI.multiply( sqrtPriceX96, sqrtPriceX96 ),
          JSBI.exponentiate( JSBI.BigInt( 2 ), JSBI.BigInt( 192 ) )
        );

        // Calculate price1 (token0 per token1)
        const price1 = JSBI.divide(
          JSBI.exponentiate( JSBI.BigInt( 2 ), JSBI.BigInt( 192 ) ),
          JSBI.multiply( sqrtPriceX96, sqrtPriceX96 )
        );

        // Convert to decimal representation
        const price0Decimal = Number( price0.toString() ) / Math.pow( 10, token1.decimals - token0.decimals );
        const price1Decimal = Number( price1.toString() ) / Math.pow( 10, token0.decimals - token1.decimals );

        console.log( 'token0:', token0 );
        console.log( 'token1:', token1 );

        console.log( 'price0Decimal:', price0Decimal );
        console.log( 'price1Decimal:', price1Decimal );

        token0Price = price0Decimal.toFixed( 6 );
        token1Price = price1Decimal.toFixed( 6 );

        console.log( 'token0Price:', token0Price );
        console.log( 'token1Price:', token1Price );

      } catch ( error ) {
        console.error( 'Error calculating prices:', error );
        token0Price = '0';
        token1Price = '0';
      }

      const token0Reserves = ethers.formatUnits( token0Amount.toString(), tokenIn.decimals );
      const token1Reserves = ethers.formatUnits( token1Amount.toString(), tokenOut.decimals );

      console.log( 'token0Reserves:', token0Reserves );
      console.log( 'token1Reserves:', token1Reserves );

      // Calculate TVL using the price as a string and parseFloat
      const tvl = ( parseFloat( token0Reserves ) * parseFloat( token0Price ) ) +
        ( parseFloat( token1Reserves ) * parseFloat( token1Price ) );

      console.log( 'TVL:', tvl );

      return {
        provider: this.getName(),
        lastUpdated: new Date(),
        chainId: this.providerYakkl.getChainId(),
        fee,
        liquidity: liquidity.toString(),
        sqrtPriceX96: clampedSqrtPriceX96.toString(),
        tick: validTick,
        tokenInReserve: token0Reserves,
        tokenOutReserve: token1Reserves,
        tokenInUSDPrice: token0Price,
        tokenOutUSDPrice: token1Price,
        tvl
      };
    } catch ( error ) {
      console.error( 'Error in getPoolInfo:', error );
      throw error;
    }
  }


  // async getReservesInRange( poolContract: Contract, activeTicks: [number], lowerTick: number, upperTick: number ) {
  //   const slot0 = await poolContract.slot0();
  //   const sqrtPriceX96 = slot0.sqrtPriceX96;

  //   let tokenInReserves = 0;
  //   let tokenOutReserves = 0;

  //   // (Implementation for fetching and iterating through active ticks)

  //   for ( const tick of activeTicks ) {
  //     const tickData = await poolContract.ticks( tick );
  //     const liquidityNet = tickData.liquidityNet;

  //     // (Calculations to determine token amounts at this tick using sqrtPriceX96, liquidityNet, etc.)

  //     tokenInReserves += calculatedInAmount;
  //     tokenOutReserves += calculatedOutAmount;
  //   }

  //   return { tokenInReserves, tokenOutReserves };
  // }

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

export function tokenInNetAmount( tokenOut: SwapToken, tokenOutAmount: BigNumberish, exchangeRate: bigint, fee: number = 875 ): BigNumberish {
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
    const feeBasisPoints: bigint = BigInt( fee ); // 0.875% as 875 basis points
    const feeDivisor: bigint = BigInt( 100000 ); // 100% is 100,000 basis points (so divide by 100,000)

    // Calculate the pre-fee amount of tokenOut in full precision
    const tokenOutAmountBeforeFee: bigint = ( tokenOutAmt * feeDivisor ) / ( feeDivisor - feeBasisPoints );

    // Calculate the required amount of tokenIn to net the desired amount of tokenOut
    const tokenInAmount: bigint = tokenOutAmountBeforeFee / conversionRate;

    // Output
    console.log( `To net exactly ${ tokenOutAmt / BigInt( 10 ** tokenOut.decimals ) } WETH, you need approximately ${ tokenInAmount } WBTC before the fee.` );

    return tokenInAmount;
  } catch ( error ) {
    console.error( 'Error calculating net amount:', error );
    return 0n;
  }
}

