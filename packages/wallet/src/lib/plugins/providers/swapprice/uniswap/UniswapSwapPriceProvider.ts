// /* eslint-disable @typescript-eslint/no-explicit-any */
// // UniswapPriceProvider.ts
// import { debug_log } from '$lib/common/debug';
// import { ethers as ethersv6 } from 'ethers-v6';
// import type { MarketPriceData, PoolInfoData, PriceData, SwapPriceProvider, PriceProvider, SwapPriceData, SwapToken } from '$lib/common/interfaces';
// import { ADDRESSES } from '$plugins/contracts/evm/constants-evm';
// import type { Provider } from '$plugins/Provider';
// import { getToken, type TokenPair } from '$lib/common/tokens';
// import { Pool, SqrtPriceMath, TickMath } from '@uniswap/v3-sdk';
// import { CurrencyAmount, Token } from '@uniswap/sdk-core';
// import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
// import IUniswapV3FactoryABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json';
// import IQuoterV2ABI from '@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json';
// // import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
// import { BigNumber, YAKKL_FEE_BASIS_POINTS, type BigNumberish } from '$lib/common';
// import {  safeConvertBigIntToNumber } from '$lib/utilities/utilities';
// import JSBI from 'jsbi';


// export class UniswapSwapPriceProvider implements SwapPriceProvider {
//   private providerYakkl: Provider;
//   private nativePriceProvider: PriceProvider;
//   private provider: ethersv6.JsonRpcProvider | undefined;
//   private factory: ethersv6.Contract | undefined;
//   private quoter: ethersv6.Contract | undefined;
//   // private pool: ethersv6.Contract | undefined;
//   private feeBasisPoints: number;

//   // private initialized: boolean = false;

//   constructor ( providerYakkl: Provider, nativePriceProvider: PriceProvider, feeBasisPoints: number = YAKKL_FEE_BASIS_POINTS ) {
//     this.nativePriceProvider = nativePriceProvider;
//     this.providerYakkl = providerYakkl;
//     this.feeBasisPoints = feeBasisPoints;
//     this.initializeProvider();
//   }

//   async initialize(): Promise<void> {
//     await this.initializeProvider();
//   }

//   private async initializeProvider(): Promise<void> {
//     try {
//       if ( this.provider && this.factory && this.quoter ) {
//         return;
//       }

//       const url = await this.providerYakkl.getProviderURL();
//       this.provider = new ethersv6.JsonRpcProvider( url );

//       this.factory = new ethersv6.Contract( ADDRESSES.UNISWAP_FACTORY, IUniswapV3FactoryABI.abi, this.provider );
//       this.quoter = new ethersv6.Contract( ADDRESSES.UNISWAP_V3_QUOTER, IQuoterV2ABI.abi, this.provider );

//       // this.initialized = true;
//     } catch ( error ) {
//       console.log( 'Failed to initialize provider:', false, error );
//       throw error;
//     }
//   }

//   // Make sure all methods that use the provider wait for initialization
//   private async ensureInitialized(): Promise<void> {
//     // if ( !this.initialized  || !this.provider || !this.factory || !this.quoter ) {
//     if ( !this.provider || !this.factory || !this.quoter ) {
//       await this.initialize();
//     }
//   }

//   getName(): string {
//     return 'Uniswap V3';
//   }

//   setFeeBasisPoints( feeBasisPoints: number ): void {
//     this.feeBasisPoints = feeBasisPoints;
//   }

//   getFeeBasisPoints(): number {
//     return this.feeBasisPoints;
//   }

//   private calculateFee( amount: bigint ): bigint {
//     if ( amount === 0n ) return 0n;
//     return ( amount * BigInt( this.feeBasisPoints ) ) / BigInt( 100000 );
//   }

//   async getMarketPrice( pair: string ): Promise<MarketPriceData> {
//     return await this.nativePriceProvider.getMarketPrice( `${ pair }` );
//   }

  // async getSwapPriceOut(
  //   tokenIn: SwapToken,
  //   tokenOut: SwapToken,
  //   amountIn: BigNumberish,
  //   fee: number = 3000
  // ): Promise<SwapPriceData> {
  //   await this.ensureInitialized();

  //   if ( !this.quoter || !this.factory ) throw new Error( 'Quoter or Factory not initialized' );
  //   if ( !tokenIn || !tokenOut ) throw new Error( 'Invalid tokens' );
  //   if ( amountIn === null || amountIn === undefined ) throw new Error( 'Amount in is null or undefined' );

  //   try {
  //     if ( amountIn === 0n ) {
  //       // If all values are zero then nothing has happened yet
  //       return {
  //         provider: this.getName(),
  //         lastUpdated: new Date(),
  //         chainId: this.providerYakkl.getChainId(),
  //         tokenIn,
  //         tokenOut,
  //         quoteAmount: 0n,
  //         feeAmount: 0n,
  //         amountIn: 0n,
  //         amountOut: 0n,
  //         exchangeRate: 0n,
  //         marketPriceIn: 0,
  //         marketPriceOut: 0,
  //         // price: 0,
  //         priceImpact: 0,
  //         path: [ tokenIn.address, tokenOut.address ],
  //         fee,
  //         feeEstimate: 0n,  // Value and not rate
  //         gasEstimate: 0n
  //       };
  //     }

  //     // const poolAddress = await this.factory.getPool( tokenIn.address, tokenOut.address, fee );
  //     // if ( poolAddress === ethersv6.ZeroAddress ) {
  //     //   throw new Error( 'Pool does not exist for tier' );
  //     // }

  //     const amountInBigInt = EthereumBigNumber.toBigInt( amountIn );
  //     if ( !amountInBigInt ) throw new Error( 'Invalid amount' );

  //     debug_log( 'UniswapPriceProvider - getSwapPriceOut - amountInBigInt:', amountInBigInt );

  //     let quoteAmount: bigint = 0n;
  //     let sqrtPriceX96After: bigint = 0n;
  //     let initializedTicksCrossed: number = 0;
  //     let gasEstimate: bigint = 0n;
  //     let amountOut: bigint = 0n;

  //     // Don't change parameter names
  //     const params = {
  //       tokenIn: tokenIn.address,
  //       tokenOut: tokenOut.address,
  //       fee,
  //       amountIn: amountInBigInt,
  //       sqrtPriceLimitX96: 0n
  //     };

  //     [ quoteAmount, sqrtPriceX96After, initializedTicksCrossed, gasEstimate ] = await this.quoter.quoteExactInputSingle.staticCall(params);

  //     amountOut = quoteAmount;

  //     const updatedPrice = this.calculatePriceFromSqrtPriceX96( sqrtPriceX96After, tokenIn.decimals, tokenOut.decimals );

  //     debug_log( 'UniswapPriceProvider - getSwapPriceOut - quoteAmount:', quoteAmount, 'sqrtPriceX96After:', sqrtPriceX96After, 'updated price after:', updatedPrice, 'initializedTicksCrossed:', initializedTicksCrossed, 'gasEstimate:', gasEstimate );




  //     const priceIn = await this.getMarketPrice( `${ tokenIn.symbol }-USD` );
  //     const priceOut = await this.getMarketPrice( `${ tokenOut.symbol }-USD` );

  //     debug_log( 'UniswapPriceProvider - getSwapPriceOut (before) - priceIn:', priceIn, 'priceOut:', priceOut );
  //     debug_log( 'UniswapPriceProvider - getSwapPriceOut - fee, this.feeBasisPoints, converted:', fee, this.feeBasisPoints, convertBasisPointsToDecimal( this.feeBasisPoints ) );

  //     priceIn.price = priceIn.price * ( 1 - convertBasisPointsToDecimal( this.feeBasisPoints ) );
  //     priceOut.price = priceOut.price * ( 1 - convertBasisPointsToDecimal( this.feeBasisPoints ) ); // This will be changed later

  //     debug_log( 'UniswapPriceProvider - getSwapPriceOut (end) - priceIn:', priceIn.price, 'priceOut:', priceOut.price );




  //     if ( amountOut === 0n ) {
  //       return {
  //         provider: this.getName(),
  //         lastUpdated: new Date(),
  //         chainId: this.providerYakkl.getChainId(),
  //         tokenIn,
  //         tokenOut,
  //         quoteAmount: 0n,
  //         feeAmount: 0n,
  //         amountIn: amountInBigInt,
  //         amountOut: 0n,
  //         exchangeRate: 0n,
  //         marketPriceIn: priceIn.price,
  //         marketPriceOut: priceOut.price,
  //         // price: 0,
  //         // priceImpact: 0,
  //         path: [ tokenIn.address, tokenOut.address ],
  //         fee,
  //         feeEstimate: 0n,
  //         gasEstimate: 0n
  //       };
  //     }

  //     priceOut.price = priceIn.price / Number( amountOut ); // Adjust to ratio amount from uniswap to market price of tokenIn
  //     debug_log( 'UniswapPriceProvider - getSwapPriceOut - priceIn:', priceIn.price, 'priceOut:', priceOut.price );

  //     const feeAmount = this.calculateFee( amountOut );
  //     const amountOutWithFee = amountOut - feeAmount;

  //     const fAmount = formatEther( feeAmount );

  //     const amountOutDecimal = Number( ethersv6.formatUnits( amountOutWithFee, tokenOut.decimals ) );
  //     const amountInDecimal = Number( ethersv6.formatUnits( amountInBigInt!.toString(), tokenIn.decimals ) );

  //     debug_log( 'UniswapPriceProvider - getSwapPriceOut - amountInDecimal:', amountInDecimal, 'amountOutDecimal:', amountOutDecimal );




  //     const poolData = this.getPoolInfo( tokenIn, tokenOut, fee );
  //     debug_log( 'UniswapPriceProvider - getSwapPriceOut - poolData:', poolData );

  //     const price = 0;

  //     debug_log( 'UniswapPriceProvider - getSwapPriceOut - amountOut:', amountOut, 'amountOutWithFee:', amountOutWithFee, 'feeAmount:', feeAmount, 'feeWei:', EthereumBigNumber.toWei( feeAmount ), 'amountIn:', amountInBigInt, 'price:', price );

  //     const priceImpact = ( ( Number( amountOut ) - Number( amountOutWithFee ) ) / Number( amountOut ) ) * 100;




  //     debug_log( 'UniswapPriceProvider - getSwapPriceOut - priceImpact:', priceImpact );

  //     return {
  //       provider: this.getName(),
  //       lastUpdated: new Date(),
  //       chainId: this.providerYakkl.getChainId(),
  //       tokenIn,
  //       tokenOut,
  //       quoteAmount,
  //       feeAmount,
  //       amountIn: amountInBigInt,
  //       amountOut,
  //       exchangeRate: amountOutDecimal / amountInDecimal,
  //       marketPriceIn: priceIn.price,
  //       marketPriceOut: priceOut.price,
  //       // price,
  //       priceImpact,
  //       path: [ tokenIn.address, tokenOut.address ],
  //       fee,
  //       feeEstimate: fAmount,
  //       gasEstimate: gasEstimate
  //     };
  //   } catch ( error ) {
  //     console.log( 'Error in getSwapPriceOut:', false, error );
  //     throw error;
  //   }
  // }

  // async getSwapPriceIn(
  //   tokenIn: SwapToken,
  //   tokenOut: SwapToken,
  //   amountOut: BigNumberish,
  //   fee: number = 3000
  // ): Promise<SwapPriceData> {
  //   await this.ensureInitialized();

  //   if ( !this.quoter || !this.factory ) throw new Error( 'Quoter or Factory not initialized' );
  //   if ( !tokenIn || !tokenOut ) throw new Error( 'Invalid tokens' );
  //   if ( amountOut === null || amountOut === undefined ) throw new Error( 'Amount out is null or undefined' );

  //   try {
  //     const priceIn = await this.getMarketPrice( `${ tokenIn.symbol }-USD` );
  //     const priceOut = await this.getMarketPrice( `${ tokenOut.symbol }-USD` );

  //     priceIn.price = priceIn.price * ( 1 - convertBasisPointsToDecimal( this.feeBasisPoints ) ); // This will be changed later
  //     priceOut.price = priceOut.price * ( 1 - convertBasisPointsToDecimal( this.feeBasisPoints ) );

  //     const amountOutBigInt = EthereumBigNumber.toBigInt( amountOut ) ?? 0n; // Adjust if necessary
  //     if ( amountOutBigInt === 0n ) {
  //       return {
  //         provider: this.getName(),
  //         lastUpdated: new Date(),
  //         chainId: this.providerYakkl.getChainId(),
  //         tokenIn,
  //         tokenOut,
  //         quoteAmount: 0n,
  //         feeAmount: 0n,
  //         amountIn: 0n,
  //         amountOut: 0n,
  //         exchangeRate: 0n,
  //         marketPriceIn: priceIn.price,
  //         marketPriceOut: priceOut.price,
  //         // price: 0,
  //         priceImpact: 0,
  //         path: [ tokenIn.address, tokenOut.address ],
  //         fee,
  //         feeEstimate: 0n,
  //         gasEstimate: 0n
  //       };
  //     }

  //     // const poolAddress = await this.factory.getPool( tokenIn.address, tokenOut.address, fee );
  //     // if ( poolAddress === ethersv6.ZeroAddress ) {
  //     //   throw new Error( 'Pool does not exist for tier' );
  //     // }

  //     const feeAmount = this.calculateFee( amountOutBigInt );
  //     const amountOutWithFee = amountOutBigInt - feeAmount;

  //     let quoteAmount: bigint = 0n;
  //     let sqrtPriceX96After: bigint = 0n;
  //     let initializedTicksCrossed: number = 0;
  //     let gasEstimate: bigint = 0n;
  //     let amountIn: bigint = 0n;

  //     // Don't change parameter names
  //     const params = {
  //       tokenIn: tokenIn.address,
  //       tokenOut: tokenOut.address,
  //       fee,
  //       amount: amountOutWithFee,
  //       sqrtPriceLimitX96: 0n
  //     };

  //     [ quoteAmount, sqrtPriceX96After, initializedTicksCrossed, gasEstimate ] = await this.quoter.quoteExactOutputSingle.staticCall(params);

  //     debug_log( 'UniswapPriceProvider - getSwapPriceIn - quoteAmount:', quoteAmount, 'sqrtPriceX96After:', sqrtPriceX96After, 'initializedTicksCrossed:', initializedTicksCrossed, 'gasEstimate:', gasEstimate );

  //     amountIn = quoteAmount;
  //     if ( amountIn === 0n ) {
  //       return {
  //         provider: this.getName(),
  //         lastUpdated: new Date(),
  //         chainId: this.providerYakkl.getChainId(),
  //         tokenIn,
  //         tokenOut,
  //         quoteAmount,
  //         feeAmount,
  //         amountIn: 0,
  //         amountOut: amountOutBigInt,
  //         exchangeRate: 0,
  //         marketPriceIn: priceIn.price,
  //         marketPriceOut: priceOut.price,
  //         // price: 0,
  //         priceImpact: 0,
  //         path: [ tokenIn.address, tokenOut.address ],
  //         fee,
  //         feeEstimate: 0n,
  //         gasEstimate: gasEstimate
  //       };
  //     }

  //     priceIn.price = priceOut.price / Number( amountOut ); // Adjust to ratio amount from uniswap to market price of tokenIn
  //     debug_log( 'UniswapPriceProvider - getSwapPriceIn - priceIn:', priceIn.price, 'priceOut:', priceOut.price );

  //     const amountInDecimal = Number( ethersv6.formatUnits( amountIn, tokenIn.decimals ) );
  //     const amountOutDecimal = Number( ethersv6.formatUnits( amountOutBigInt, tokenOut.decimals ) );
  //     // const price = 0;

  //     // Calculate price impact (simplified, you might want to implement a more sophisticated calculation)
  //     const priceImpact = ( ( Number( amountOutWithFee ) - Number( amountOutBigInt ) ) / Number( amountOutBigInt ) ) * 100;

  //     return {
  //       provider: this.getName(),
  //       lastUpdated: new Date(),
  //       chainId: this.providerYakkl.getChainId(),
  //       tokenIn,
  //       tokenOut,
  //       quoteAmount,
  //       feeAmount,
  //       amountIn,
  //       amountOut: amountOutBigInt,
  //       exchangeRate: amountOutDecimal / amountInDecimal,
  //       marketPriceIn: 0,
  //       marketPriceOut: 0,
  //       // price,
  //       priceImpact,
  //       path: [ tokenIn.address, tokenOut.address ],
  //       fee,
  //       feeEstimate: formatEther(this.calculateFee( amountOutBigInt )),
  //       gasEstimate: gasEstimate
  //     };
  //   } catch ( error ) {
  //     console.log( 'Error in getSwapPriceIn:', false, error );
  //     throw error;
  //   }
  // }



  // Old way
//   sqrtPriceX96ToPrice( sqrtPriceX96: bigint, token0Decimals: number, token1Decimals: number ): number {
//     const price = Number( sqrtPriceX96 ) / 2 ** 96;
//     const adjustedPrice = price * price * ( 10 ** ( token0Decimals - token1Decimals ) );
//     return adjustedPrice;
//   }


//   calculatePriceFromSqrtPriceX96( sqrtPriceX96: bigint, token0Decimals: number, token1Decimals: number ): {
//     price0: string,  // Price of token0 in terms of token1
//     price1: string,  // Price of token1 in terms of token0
//   } {
//     // Convert sqrtPriceX96 to price
//     const Q192 = BigInt( 2 ) ** BigInt( 192 );
//     const price0 = Number(
//       ( sqrtPriceX96 * sqrtPriceX96 * BigInt( 10 ** token1Decimals ) ) /
//       ( Q192 * BigInt( 10 ** token0Decimals ) )
//     );

//     const price1 = 1 / price0;

//     return {
//       price0: price0.toFixed( token1Decimals ),
//       price1: price1.toFixed( token0Decimals )
//     };
//   }


//   async getPoolInfo( tokenIn: SwapToken, tokenOut: SwapToken, fee: number = 3000 ): Promise<PoolInfoData> {
//     await this.ensureInitialized();

//     if ( !this.factory || !this.provider ) throw new Error( 'Contracts not initialized' );

//     try {
//       const poolAddress = await this.factory.getPool( tokenIn.address, tokenOut.address, fee );
//       if ( !poolAddress || poolAddress === ethersv6.ZeroAddress ) {
//         throw new Error( 'Pool does not exist' );
//       }

//       const tokenA = convertToUniswapToken( tokenIn );
//       const tokenB = convertToUniswapToken( tokenOut );

//       const poolContract = new ethersv6.Contract( poolAddress, IUniswapV3PoolABI.abi, this.provider );
//       if ( !poolContract ) throw new Error( 'Pool contract not found' );

//       const [ slot0, liquidity, token0Address, token1Address, tickSpacing, poolFee, tickBitmap, ticks ] = await Promise.all( [
//         poolContract.slot0(),
//         poolContract.liquidity(),
//         poolContract.token0(),
//         poolContract.token1(),
//         poolContract.tickSpacing(),
//         poolContract.fee(),
//         poolContract.tickBitmap( 0 ),
//         poolContract.ticks( 0 )
//       ] );

//       debug_log( '\n\nUniswapPriceProvider - getPoolInfo: >>>>>>>>>>>>>>>>>>>>>>>>>>>> POOL START <<<<<<<<<<<<<<<<<<<<<<<<\n\n' );
//       debug_log( 'UniswapPriceProvider - getPoolInfo:', poolContract );

//       debug_log( 'Slot0:', slot0 );
//       debug_log( 'Liquidity:', liquidity.toString() );
//       debug_log( 'Token0 address:', token0Address, tokenA );
//       debug_log( 'Token1 address:', token1Address, tokenB );
//       debug_log( 'Tick spacing:', tickSpacing.toString() );
//       debug_log( 'Pool fee:', poolFee.toString() );

//       debug_log( 'Tick bitmap:', tickBitmap );
//       debug_log( 'Ticks:', ticks );

//       const { sqrtPriceX96, tick } = slot0;

//       debug_log( 'sqrtPriceX96:', sqrtPriceX96.toString() );
//       debug_log( 'tick:', tick );

//       const token0 = new Token( this.providerYakkl.getChainId(), token0Address, tokenIn.decimals, tokenIn.symbol, tokenIn.name );
//       const token1 = new Token( this.providerYakkl.getChainId(), token1Address, tokenOut.decimals, tokenOut.symbol, tokenOut.name );

//       debug_log( 'Token0:', token0 );
//       debug_log( 'Token1:', token1 );

//       // Ensure tick is within valid range
//       const minTick = BigInt( TickMath.MIN_TICK );
//       const maxTick = BigInt( TickMath.MAX_TICK );
//       const tickBigInt = BigInt( tick.toString() );
//       const validTickBigInt = tickBigInt < minTick ? minTick : ( tickBigInt > maxTick ? maxTick : tickBigInt );

//       let validTick: number;
//       try {
//         validTick = safeConvertBigIntToNumber( validTickBigInt );
//       } catch ( error ) {
//         console.log( 'Error converting tick to number:', false, error );
//         // Fallback to a default tick value or handle the error as appropriate for your use case
//         validTick = 0; // or some other default value
//       }

//       debug_log( 'Valid tick:', validTick );

//       // Calculate reserves
//       const Q96 = 2n ** 96n;

//       // Calculate price from sqrtPriceX96
//       const price = ( Number( sqrtPriceX96 ) / Number( Q96 ) ) ** 2;
//       debug_log( 'Price:', price );

//       // Ensure sqrtPriceX96 is within valid range
//       const minSqrtRatio = JSBI.BigInt( TickMath.MIN_SQRT_RATIO.toString() );
//       const maxSqrtRatio = JSBI.BigInt( TickMath.MAX_SQRT_RATIO.toString() );
//       const sqrtPriceX96BigInt = JSBI.BigInt( sqrtPriceX96.toString() );
//       const clampedSqrtPriceX96 = JSBI.lessThan( sqrtPriceX96BigInt, minSqrtRatio )
//         ? minSqrtRatio
//         : ( JSBI.greaterThan( sqrtPriceX96BigInt, maxSqrtRatio ) ? maxSqrtRatio : sqrtPriceX96BigInt );

//       debug_log( 'Clamped sqrtPriceX96:', clampedSqrtPriceX96.toString() );

//       const pool = new Pool(
//         token0,
//         token1,
//         fee,
//         clampedSqrtPriceX96.toString(),
//         liquidity.toString(),
//         validTick
//       );

//       debug_log( 'Pool created successfully', pool );

//       // Calculate amounts from liquidity
//       const tickLow = Math.floor( validTick / Number(tickSpacing) ) * Number(tickSpacing);
//       const tickHigh = tickLow + Number(tickSpacing);
//       const sqrtPriceLow = TickMath.getSqrtRatioAtTick( tickLow );
//       const sqrtPriceHigh = TickMath.getSqrtRatioAtTick( tickHigh );

//       debug_log( 'Tick low:', tickLow );
//       debug_log( 'Tick high:', tickHigh );
//       debug_log( 'Sqrt price low:', sqrtPriceLow.toString() );
//       debug_log( 'Sqrt price high:', sqrtPriceHigh.toString() );

//       const price2 = this.sqrtPriceX96ToPrice( BigInt(sqrtPriceLow.toString()), token0.decimals, token1.decimals );
//       debug_log( 'Price at low tick:', price2 );
//       const price3 = this.sqrtPriceX96ToPrice( BigInt( sqrtPriceHigh.toString() ), token0.decimals, token1.decimals );
//       debug_log( 'Price at high tick:', price3 );

//       const avgPrice = ( price2 + price3 ) / 2;
//       debug_log( 'Average price:', avgPrice );

//       const sqrtPrice = sqrtPriceX96 / Q96;
//       debug_log( 'Sqrt price:', sqrtPrice );

//       const liquidityBigInt = BigInt( liquidity.toString() );

//       const token0Amt = Number( liquidityBigInt ) / ( Number( sqrtPrice ) * ( 2 ** 96 ) );
//       const token1Amt = Number( liquidityBigInt ) * Number( sqrtPrice ) / ( 2 ** 96 );

//       debug_log( 'Token0 amount:', token0Amt );
//       debug_log( 'Token1 amount:', token1Amt );



//       // Calculate reserves
//       const token0Reserve = parseFloat(
//         ethersv6.formatUnits( liquidity.toString(), token0.decimals )
//       );
//       const token1Reserve = parseFloat(
//         ethersv6.formatUnits( liquidity.toString(), token1.decimals )
//       );

//       debug_log( 'Token0 reserve:', token0Reserve );
//       debug_log( 'Token1 reserve:', token1Reserve );

//       // Calculate amounts of token0 and token1 in the pool
//       const sqrtRatioX96 = JSBI.BigInt( clampedSqrtPriceX96 );
//       const liquidity_ = JSBI.BigInt( liquidity.toString() );

//       debug_log( 'sqrtRatioX96:', sqrtRatioX96.toString() );
//       debug_log( 'liquidity_:', liquidity_.toString() );

//       const token0Amount = SqrtPriceMath.getAmount0Delta(
//         sqrtRatioX96,
//         TickMath.MAX_SQRT_RATIO,
//         liquidity_,
//         true
//       );

//       const token1Amount = SqrtPriceMath.getAmount1Delta(
//         TickMath.MIN_SQRT_RATIO,
//         sqrtRatioX96,
//         liquidity_,
//         true
//       );

//       debug_log( 'token0Amount:', token0Amount.toString() );
//       debug_log( 'token1Amount:', token1Amount.toString() );

//       // Get CurrencyAmount for 1 unit of each token
//       const amount0 = CurrencyAmount.fromRawAmount(
//         token0,
//         JSBI.exponentiate( JSBI.BigInt( 10 ), JSBI.BigInt( token0.decimals ) ).toString()
//       );
//       const amount1 = CurrencyAmount.fromRawAmount(
//         token1,
//         JSBI.exponentiate( JSBI.BigInt( 10 ), JSBI.BigInt( token1.decimals ) ).toString()
//       );

//       debug_log( 'amount0:', amount0.toExact() );
//       debug_log( 'amount1:', amount1.toExact() );

//       // Calculate prices
//       let token0Price, token1Price;
//       try {
//         // Get the sqrt price from the pool
//         const sqrtPriceX96 = JSBI.BigInt( pool.sqrtRatioX96.toString() );

//         // Calculate price0 (token1 per token0)
//         const price0 = JSBI.divide(
//           JSBI.multiply( sqrtPriceX96, sqrtPriceX96 ),
//           JSBI.exponentiate( JSBI.BigInt( 2 ), JSBI.BigInt( 192 ) )
//         );

//         // Calculate price1 (token0 per token1)
//         const price1 = JSBI.divide(
//           JSBI.exponentiate( JSBI.BigInt( 2 ), JSBI.BigInt( 192 ) ),
//           JSBI.multiply( sqrtPriceX96, sqrtPriceX96 )
//         );

//         // Convert to decimal representation
//         const price0Decimal = Number( price0.toString() ) / Math.pow( 10, token1.decimals - token0.decimals );
//         const price1Decimal = Number( price1.toString() ) / Math.pow( 10, token0.decimals - token1.decimals );

//         debug_log( 'token0:', token0 );
//         debug_log( 'token1:', token1 );

//         debug_log( 'price0Decimal:', price0Decimal );
//         debug_log( 'price1Decimal:', price1Decimal );

//         token0Price = price0Decimal.toFixed( 6 );
//         token1Price = price1Decimal.toFixed( 6 );

//         debug_log( 'token0Price:', token0Price );
//         debug_log( 'token1Price:', token1Price );

//       } catch ( error ) {
//         console.log( 'Error calculating prices:', false, error );
//         token0Price = '0';
//         token1Price = '0';
//       }

//       const token0Reserves = ethersv6.formatUnits( token0Amount.toString(), tokenIn.decimals );
//       const token1Reserves = ethersv6.formatUnits( token1Amount.toString(), tokenOut.decimals );

//       debug_log( 'token0Reserves:', token0Reserves );
//       debug_log( 'token1Reserves:', token1Reserves );

//       // Calculate TVL using the price as a string and parseFloat
//       const tvl = ( parseFloat( token0Reserves ) * parseFloat( token0Price ) ) +
//         ( parseFloat( token1Reserves ) * parseFloat( token1Price ) );

//       debug_log( 'TVL:', tvl );

//       debug_log( '\n\nUniswapPriceProvider - getPoolInfo: >>>>>>>>>>>>>>>>>>>>>>>>>>>> POOL END <<<<<<<<<<<<<<<<<<<<<<<<\n\n' );

//       return {
//         provider: this.getName(),
//         lastUpdated: new Date(),
//         chainId: this.providerYakkl.getChainId(),
//         fee,
//         liquidity: liquidity.toString(),
//         sqrtPriceX96: clampedSqrtPriceX96.toString(),
//         tick: validTick,
//         tokenInReserve: token0Reserves,
//         tokenOutReserve: token1Reserves,
//         tokenInUSDPrice: token0Price,
//         tokenOutUSDPrice: token1Price,
//         tvl
//       };
//     } catch ( error ) {
//       console.log( 'Error in getPoolInfo:', false, error );
//       throw error;
//     }
//   }


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

//   async getTokenPair( pair: string ): Promise<TokenPair | PriceData> {
//     if ( !pair ) {
//       return this.returnError( `Invalid pair - ${ pair }` );
//     }

//     const [ tokenInSymbol, tokenOutSymbol ] = pair.split( '-' );
//     if ( !tokenInSymbol || !tokenOutSymbol ) {
//       return this.returnError( `Invalid pair format - ${ pair }` );
//     }

//     const tokenIn = this.getStandardizedToken( tokenInSymbol );
//     const tokenOut = this.getStandardizedToken( tokenOutSymbol );

//     if ( !tokenIn || !tokenOut ) {
//       return this.returnError( `Token not found for ${ pair }` );
//     }

//     if ( tokenIn.address === tokenOut.address ) {
//       return this.nativePriceProvider.getMarketPrice( `${ tokenInSymbol }-USD` );
//     }

//     return { tokenIn, tokenOut };
//   }

//   private getStandardizedToken( symbol: string ): SwapToken | null {
//     let standardizedSymbol = symbol;
//     if ( symbol === 'USD' ) standardizedSymbol = 'USDC';
//     if ( symbol === 'ETH' ) standardizedSymbol = 'WETH';
//     return getToken( standardizedSymbol, this.providerYakkl.chainId );
//   }

//   private returnError( message: string ): PriceData {
//     return {
//       provider: this.getName(),
//       price: 0,
//       lastUpdated: new Date(),
//       status: 404,
//       message
//     };
//   }

//   convertToBigInt( price: number, decimals: number = 18 ): bigint {
//     const scaledPrice = price * Math.pow( 10, decimals );
//     return BigInt( Math.floor( scaledPrice ) );
//   }
// }




