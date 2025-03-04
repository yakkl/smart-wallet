/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// UniswapSwapManager.ts
import { toBigInt, YAKKL_FEE_BASIS_POINTS, YAKKL_GAS_ESTIMATE_MIN_USD, YAKKL_GAS_ESTIMATE_MULTIHOP_SWAP_DEFAULT, YAKKL_GAS_ESTIMATE_MULTIPLIER_BASIS_POINTS, type BigNumberish, type PoolInfoData, type PriceData, type SwapParams, type SwapPriceData, type SwapToken, type TransactionReceipt, type TransactionRequest, type TransactionResponse } from '$lib/common';
import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
import type { ExactInputParams, ExactInputSingleParams } from '$lib/common/ISwapRouter';
import IUniswapV3FactoryABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json';
import { abi as ISwapRouterABI } from '@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json';
import IQuoterV2ABI from '@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json';
import { ethers as ethersv6 } from 'ethers-v6';
import { ethers as ethersv5 } from 'ethers';
import { formatFeeToUSD, formatPrice } from '../utilities/utilities';
import type { Ethereum } from './blockchains/evm/ethereum/Ethereum';
import { ADDRESSES } from './contracts/evm/constants-evm';
import type { Provider } from './Provider';
import { SwapManager } from './SwapManager';
import { Token } from './Token';
import { EVMToken } from './tokens/evm/EVMToken';
import { EthersConverter } from './utilities/EthersConverter';
import { log } from '$plugins/Logger';

// import { getToken, type TokenPair } from '$lib/common/tokens';
// import { CurrencyAmount, Token as UniswapToken } from '@uniswap/sdk-core';
// import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
// import { Pool, SqrtPriceMath, TickMath } from '@uniswap/v3-sdk';
// import JSBI from 'jsbi';
// import JSBI from '@uniswap/sdk-core/node_modules/jsbi';
// import { convertToUniswapToken, sqrtPriceX96ToPrice } from './utilities/uniswap';
// import { AlphaRouterService } from '@yakkl/uniswap-alpha-router-service';

const SUPPORTED_STABLECOINS = [ 'USDC', 'USDT', 'DAI', 'BUSD' ];

// example
// import { AlphaRouterService } from 'uniswap-alpha-router-service';

// const service = new AlphaRouterService();
// try {
//   const quote = await service.getQuote( tokenIn, tokenOut, amount, fundingAddress );
//   // Use quote data
// } catch ( error ) {
//   log.error( 'Quote error:', false, error );
// } finally {
//   service.dispose();
// }


export class UniswapSwapManager extends SwapManager {
  private routerContract: ethersv6.Contract | null = null;
  private providerNative: ethersv6.JsonRpcProvider | null = null;
  private signerNative: ethersv6.JsonRpcSigner | null = null;
  private factory: ethersv6.Contract | null = null;
  // private alphaRouter: AlphaRouterService;

  constructor (
    blockchain: Ethereum,
    provider: Provider,
    initialFeeBasisPoints: number = YAKKL_FEE_BASIS_POINTS
  ) {
    super( blockchain, provider, initialFeeBasisPoints );
    // this.alphaRouter = new AlphaRouterService();
    this.initialize().then();
  }

  async initialize(): Promise<void> {
    this.providerNative = await this.provider.getProvider(); // This needs to be the normal native provider and not Signer
    if ( !this.providerNative ) throw new Error( 'Ethereum native provider not initialized' );
    this.signerNative = this.provider.getSignerNative();
    if ( !this.signerNative ) throw new Error( 'Ethereum native signer not initialized' );

    this.factory = new ethersv6.Contract( ADDRESSES.UNISWAP_FACTORY, IUniswapV3FactoryABI.abi, this.providerNative );

    this.routerContract = new ethersv6.Contract(
      ADDRESSES.UNISWAP_V3_ROUTER,
      ISwapRouterABI,
      this.signerNative
    );

    this.tokens = await this.fetchTokenList();
    this.preferredTokens = this.getPreferredTokens( this.tokens );
    this.tokens = this.tokens
      .filter( token => !this.preferredTokens.includes( token ) )
      .sort( ( a, b ) => a.symbol.localeCompare( b.symbol ) );
    this.stablecoinTokens = this.tokens.filter( token => token.isStablecoin );
  }

  dispose() {
    // this.alphaRouter.dispose();
  }

  getName(): string {
    return 'Uniswap V3';
  }

  // Get best price tier for a swap - future implementation

  async checkIfPoolExists( tokenIn: Token, tokenOut: Token, fee: number ): Promise<boolean> {
    if ( !this.factory ) throw new Error( 'Factory contract not initialized' );
    try {
      const poolAddress = await this.factory.getPool( tokenIn.address, tokenOut.address, fee );
      return poolAddress !== ethersv6.ZeroAddress;
    } catch ( error ) {
      return false;
    }
  }

  // For getting the tokens specific to Uniswap V3
  async fetchTokenList(): Promise<SwapToken[]> {
    try {
      const response = await fetch( 'https://tokens.uniswap.org' );
      const data = await response.json();
      data.tokens
        .filter( ( token: SwapToken ) => token.chainId === this.blockchain?.getChainId() )
        .map( ( token: SwapToken ) => {
          if ( SUPPORTED_STABLECOINS.includes( token.symbol ) ) {
            token.isStablecoin = true;
          }
          return token;
        } );

      const eth: SwapToken = {
        chainId: 1,
        address: ADDRESSES.WETH,
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        isNative: true,
        isStablecoin: false,
        logoURI: '/images/ethereum.svg',
      };

      data.tokens.unshift( eth );
      return data.tokens;
    } catch ( error ) {
      log.error( 'Error fetching token list:', false, error );
      return [];
    }
  }

  getPreferredTokens( tokens: SwapToken[] ): SwapToken[] {
    const preferredTokenSymbols = [ "ETH", "WETH", "WBTC", "USDC", "USDT", "DAI" ];
    return preferredTokenSymbols
      .map( symbol => tokens.find( token => token.symbol === symbol ) )
      .filter( ( token ): token is SwapToken => token !== undefined );
  }

  // Final fallback for multi-hop quotes but we may move this up and replace the multiHopQuote method
//   async multiHopQuoteAlphaRouter(
//     tokenIn: Token,
//     tokenOut: Token,
//     amount: BigNumberish,
//     fundingAddress: string,
//     isExactIn: boolean = true
//   ): Promise<SwapPriceData> {
//   try {
//     // Step 1: Set up the provider using Alchemy (ethers v5)
//     const provider = new ethersv5.providers.AlchemyProvider(
//       'mainnet',
//       import.meta.env.VITE_ALCHEMY_API_KEY_PROD
//     );

//     // Step 2: Initialize the AlphaRouter
//     const router = new AlphaRouter( { chainId: 1, provider } );

//     const slippageTolerance = new Percent( 5, 100 );

//     // Step 3: Set up the Swap route request
//     const amountInOrOut = ethersv5.BigNumber.from( amount );
//     const swapRouteOptions: SwapOptions = {
//       recipient: fundingAddress,
//       slippageTolerance: slippageTolerance, // Setting a 5% slippage tolerance
//       deadline: Math.floor( Date.now() / 1000 ) + 60 * 20, // 20 minutes from now
//       type: SwapType.SWAP_ROUTER_02, // Set the type to indicate the router version (SwapRouter02 is the most used)
//     };

//     // Convert to uniswap tokens

//     const currencyAmount = CurrencyAmount.fromRawAmount( convertToUniswapToken( isExactIn ? tokenIn : tokenOut ), amountInOrOut.toString() );

//     // Step 4: Call AlphaRouter to get the best swap route
//     const swapRoute: SwapRoute | null = await router.route(
//       currencyAmount,
//       convertToUniswapToken( tokenOut),
//       isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
//       swapRouteOptions
//     );

//     if ( !swapRoute ) {
//       throw new Error( 'No valid route exists for the provided tokens and amount' );
//     }

//     // Step 5: Extract quote information from the SwapRoute
//     const quoteAmount = swapRoute.quote.toFixed( 0 ); // CurrencyAmount has address and which token in it
//     const gasEstimate = ethersv5.BigNumber.from( swapRoute.estimatedGasUsed );

//     let poolFee: number | undefined = undefined;

//     if ( swapRoute instanceof V3RouteWithValidQuote ) {
//       const route = swapRoute.route; // V3Route object containing pool information
//       if ( route && route.pools && route.pools.length > 0 ) {
//         // Extracting the fee from the first pool in the route
//         poolFee = route.pools[ 0 ].fee; // Assuming this pool has a 'fee' property
//       }
//     }

//     const fee = poolFee ?? 3000; // Default to 3000 basis points if pool fee is not found

//     return await this.constructQuoteData(
//       tokenIn,
//       tokenOut,
//       fundingAddress,
//       amount,
//       BigInt( quoteAmount ),
//       fee, // Assuming first fee for simplicity
//       gasEstimate.toBigInt(),
//       true, // multiHop
//       0n, // sqrtPriceX96After.toBigInt(),
//       0, // initializedTicksCrossed,
//       isExactIn
//     );
//   } catch ( error ) {
//     debug_log( 'Error fetching multi-hop quote using AlphaRouter:', false, error );
//     throw new Error( 'Failed to get multi-hop quote via AlphaRouter. This means pools do not exist.' );
//   }
// }


  async multiHopQuote(
    tokenIn: Token,
    tokenOut: Token,
    amount: BigNumberish,
    fundingAddress: string,
    isExactIn: boolean = true,
    fee: number = 3000
  ): Promise<SwapPriceData> {



    // const quote = await this.alphaRouter.getQuote(
    //   tokenIn,
    //   tokenOut,
    //   amount.toString(),
    //   fundingAddress,
    //   isExactIn
    // );

    // if ( !quote.success || !quote.data ) {
    //   throw new Error( quote.error || 'Failed to get quote' );
    // }

    // return this.constructQuoteData(
    //   tokenIn,
    //   tokenOut,
    //   fundingAddress,
    //   amount,
    //   BigInt( quote.data.quoteAmount ),
    //   quote.data.fee ?? 3000,
    //   BigInt( quote.data.gasEstimate ),
    //   true,
    //   0n,
    //   0,
    //   isExactIn
    // );



    // multiHopQuoteAlphaRouter(tokenIn, tokenOut, amount, fundingAddress, isExactIn);

    // Step 1: Set up the provider using Alchemy (ethers v5)
    const provider = new ethersv5.providers.AlchemyProvider( 'mainnet', import.meta.env.VITE_ALCHEMY_API_KEY_PROD );
    // Step 2: Define the QuoterV2 contract address and ABI
    const quoterV2ABI = [
      {
        "inputs": [
          {
            "internalType": "bytes",
            "name": "path",
            "type": "bytes"
          },
          {
            "internalType": "uint256",
            "name": "amountIn",
            "type": "uint256"
          }
        ],
        "name": "quoteExactInput",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "amountOut",
            "type": "uint256"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes",
            "name": "path",
            "type": "bytes"
          },
          {
            "internalType": "uint256",
            "name": "amountOut",
            "type": "uint256"
          }
        ],
        "name": "quoteExactOutput",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "amountIn",
            "type": "uint256"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];

    // Step 3: Create the contract instance
    const quoterContract = new ethersv5.Contract( ADDRESSES.UNISWAP_V3_QUOTER, quoterV2ABI, provider );

    // Step 4: Encode the path using solidityPack (ethers v5)
    const tokenInAddress = tokenIn.address;
    const tokenOutAddress = tokenOut.address;

    const encodedPath = isExactIn ? ethersv5.utils.solidityPack(
      [ 'address', 'uint24', 'address', 'uint24', 'address' ],
      [
        tokenInAddress,  // TokenIn address
        fee,             // Fee for TokenIn -> WETH pool
        ADDRESSES.WETH,     // WETH address
        fee,             // Fee for WETH -> TokenOut pool
        tokenOutAddress  // TokenOut address
      ]
    ) : ethersv5.utils.solidityPack(
      [ 'address', 'uint24', 'address', 'uint24', 'address' ],
      [
        tokenOutAddress,  // TokenOut address
        fee,             // Fee for TokenOut -> WETH pool
        ADDRESSES.WETH,     // WETH address
        fee,             // Fee for WETH -> TokenIn pool
        tokenInAddress  // TokenIn address
      ]
    );

    // Step 5: Call the contract method
    const amountInOrOut = ethersv5.BigNumber.from( toBigInt( amount ) );

    const multiHopParams = {
      path: encodedPath,
      ...( isExactIn ? { amountIn: amountInOrOut } : { amountOut: amountInOrOut } )
    };

    try {
      let quoteAmount: ethersv5.BigNumber;

      // Returns a single value for the quote instead of a tuple of values
      if ( isExactIn ) {
        quoteAmount = await quoterContract.callStatic.quoteExactInput( multiHopParams.path, amountInOrOut );
      } else {
        quoteAmount = await quoterContract.callStatic.quoteExactOutput( multiHopParams.path, amountInOrOut );
      }

      if ( quoteAmount.gt( 0 ) ) {
        const gasEstimate = await this.getGasEstimateForSwap( tokenInAddress, tokenOutAddress, amountInOrOut.toBigInt(), fundingAddress, fee );

        return await this.constructQuoteData(
          tokenIn,
          tokenOut,
          fundingAddress,
          amount,
          quoteAmount.toBigInt(),
          fee,
          gasEstimate,
          true, // multiHop
          0n, //sqrtPriceX96After.toBigInt(),
          0, //initializedTicksCrossed,
          isExactIn
        );
      }
    } catch ( error ) {
      const excludedProperties = ["url", "requestBody", "requestMethod", "accessList"];
      const formattedError = this.errorUniswap(error, excludedProperties);
      // debug_log( 'Formatted error: ', formattedError );

      throw new Error(formattedError);
      // AlphaRouter causes issues with current version of ethers so it is no longer used here
      // return this.multiHopQuoteAlphaRouter( tokenIn, tokenOut, amount, fundingAddress, isExactIn );
    }

    throw new Error( 'Token pools not found' );
    // AlphaRouter causes issues with current version of ethers so it is no longer used here
    // return this.multiHopQuoteAlphaRouter( tokenIn, tokenOut, amount, fundingAddress, isExactIn );
  }

  async getQuote(
    tokenIn: Token,
    tokenOut: Token,
    amount: BigNumberish,
    fundingAddress: string,
    isExactIn: boolean = true,
    fee: number = 3000,
  ): Promise<SwapPriceData> {
    // Determine actual tokens for routing
    const actualTokenIn = tokenIn.isNative ? await this.getWETHToken() : tokenIn;
    const actualTokenOut = tokenOut.isNative ? await this.getWETHToken() : tokenOut;

    switch ( fee ) {
      case 500:
      case 3000:
      case 10000:
        break;
      default:
        fee = 3000;
        break;
    }

    if ( !actualTokenIn?.address || !actualTokenOut?.address || !amount ) {
      // Default empty quote return if params are not sufficient
      return {
        provider: this.getName(),
        lastUpdated: new Date(),
        chainId: this.provider ? this.provider.getChainId() : 1,
        tokenIn,
        tokenOut,
        fundingAddress,
        quoteAmount: 0n,
        feeAmount: 0n,
        amountAfterFee: 0n,
        amountIn: 0n,
        amountOut: 0n,
        exchangeRate: 0,
        marketPriceIn: 0,
        marketPriceOut: 0,
        marketPriceGas: 0,
        priceImpactRatio: 0,
        path: [
          tokenIn.isNative ? ethersv6.ZeroAddress : tokenIn.address,
          tokenOut.isNative ? ethersv6.ZeroAddress : tokenOut.address
        ],
        fee,
        feeBasisPoints: this.feeBasisPoints,
        feeAmountPrice: 0,
        feeAmountInUSD: '',
        gasEstimate: 0n,
        gasEstimateInUSD: '',
        tokenOutPriceInUSD: '',
        slippageTolerance: 0.5,
        deadline: 10,
        sqrtPriceX96After: 0n,
        initializedTicksCrossed: 0,
        multiHop: false,
        error: 'Insufficient parameters for quote',
        isLoading: false,
      };
    }
    if ( !this.providerNative ) throw new Error( 'Provider(s) not set' );
    // Step 1: Get available pools
    const availablePools = await this.getAvailablePools( actualTokenIn, actualTokenOut );
    // Step 2: Proceed with the first available pool (or select a pool with the desired fee). There are cases where pools only have a single fee tier.
    let newFee = fee;

    if (!availablePools || !availablePools.includes( fee )) {
      newFee = availablePools[ 0 ];
    }

    if ( !availablePools || availablePools.length === 0 ) {
      // Handle multi-hop or throw an error if no valid routes exist
      try {
        return await this.multiHopQuote( tokenIn, tokenOut, amount, fundingAddress, isExactIn, newFee );
      } catch ( error ) {
        log.error( 'Multi-hop quote failed:', false, error );
        throw new Error( 'No valid route exists for the provided tokens and amount' );
      }
    }

    try {
      // Step 3: Call `quoteExactInputSingle` or `quoteExactOutputSingle` based on the type of swap
      // (Using the fee obtained from the available pool)
      const params = {
        tokenIn: actualTokenIn.address,
        tokenOut: actualTokenOut.address,
        fee: newFee,
        sqrtPriceLimitX96: 0n,
        ...( isExactIn ? { amountIn: amount } : { amount: amount } ),
      };

      const quoterContract = new ethersv6.Contract( ADDRESSES.UNISWAP_V3_QUOTER, IQuoterV2ABI.abi, this.providerNative );
      let quoteAmount: bigint;
      let sqrtPriceX96After: bigint = 0n;
      let initializedTicksCrossed: number = 0;
      let gasEstimate: bigint = 0n;

      if ( isExactIn ) {
        [ quoteAmount, sqrtPriceX96After, initializedTicksCrossed, gasEstimate ] =
          await quoterContract.quoteExactInputSingle.staticCall( params );
      } else {
        [ quoteAmount, sqrtPriceX96After, initializedTicksCrossed, gasEstimate ] =
          await quoterContract.quoteExactOutputSingle.staticCall( params );
      }

      if ( quoteAmount > 0n ) {
        return await this.constructQuoteData(
          tokenIn,
          tokenOut,
          fundingAddress,
          amount,
          quoteAmount,
          newFee,
          gasEstimate,
          false, // multiHop
          sqrtPriceX96After,
          initializedTicksCrossed,
          isExactIn
        );
      }
    } catch ( error ) {
      log.error( 'Direct pool quote failed, trying multi-hop:', false, error );
    }

    // If direct pool fails, attempt multi-hop anyway
    try {
      return await this.multiHopQuote( tokenIn, tokenOut, amount, fundingAddress, isExactIn, newFee );
    } catch ( error ) {
      log.error( 'Multi-hop quote failed:', false, error );
      throw new Error( 'No valid route exists for the provided tokens and amount' );
    }
  }

  // WIP - Not yet implemented
  async estimateSwapGas( swapRouterAddress: string, swapParams: SwapParams ): Promise<bigint> {
    // debug_log( 'Estimating gas for swap:', swapParams );
    return 0n;
  }

  async getAvailablePools( tokenA: Token, tokenB: Token ): Promise<number[]> {
    const availablePools: number[] = [];
    const feeTiers = [ 500, 3000, 10000 ]; // Common fee tiers on Uniswap V3

    // Loop through each fee tier to check if a pool exists
    for ( const fee of feeTiers ) {
      try {
        const poolAddress = await this.getPoolAddress( tokenA, tokenB, fee );
        if ( poolAddress !== ethersv6.ZeroAddress ) {
          availablePools.push( fee );
        }
      } catch ( error ) {
        log.error( `Pool not found for tokens ${ tokenA.symbol }/${ tokenB.symbol } with fee ${ fee }` );
      }
    }
    return availablePools;
  }

  async getPoolAddress( tokenA: Token, tokenB: Token, fee: number ): Promise<string> {
    if ( !this.factory ) throw new Error( 'Factory contract not initialized' );
    // Sort the tokens by address to get the correct pool address (Uniswap requires tokens in sorted order)
    const [ token0, token1 ] = [ tokenA.address, tokenB.address ].sort( ( a, b ) => a.toLowerCase() < b.toLowerCase() ? -1 : 1 );
    const poolAddress = await this.factory.getPool( token0, token1, fee );
    return poolAddress;
  }

  // WIP - Not yet implemented - Liquidity consideration of pools.
  // async getQuoteWithLiquidityConsideration(
  //   tokenIn: Token,
  //   tokenOut: Token,
  //   amount: BigNumberish,
  //   fundingAddress: string,
  //   isExactIn: boolean = true,
  //   preferredFee: number = 3000,
  //   liquidityThreshold?: BigNumberish // Updated to be optional
  // ): Promise<SwapPriceData> {
  //   try {
  //     // Determine actual tokens for routing
  //     const actualTokenIn = tokenIn.isNative ? await this.getWETHToken() : tokenIn;
  //     const actualTokenOut = tokenOut.isNative ? await this.getWETHToken() : tokenOut;

  //     // Step 1: Get available pools
  //     const availablePools = await this.getAvailablePools( actualTokenIn, actualTokenOut );

  //     if ( availablePools.length === 0 ) {
  //       log.error( `No pools exist for ${ tokenIn.symbol } and ${ tokenOut.symbol }` );
  //       // Handle multi-hop or throw an error if no valid routes exist
  //       return await this.multiHopQuote( tokenIn, tokenOut, amount, fundingAddress, isExactIn );
  //     }

  //     // Step 2: Choose the appropriate fee tier based on liquidity
  //     let selectedFee: number | undefined = undefined;
  //     let maxLiquidity = BigInt( 0 );

  //     for ( const fee of availablePools ) {
  //       const liquidity = await this.getPoolLiquidity( actualTokenIn, actualTokenOut, fee );
  //       if ( liquidity === null ) {
  //         log.error( `Liquidity data unavailable for pool with fee ${ fee }` );
  //         continue;
  //       }

  //       // Check if the liquidity is greater than the threshold or keep track of the highest liquidity
  //       if (
  //         liquidityThreshold == null ||
  //         ( liquidityThreshold != null && BigInt( liquidity ) > BigInt( liquidityThreshold ) )
  //       ) {
  //         if ( BigInt( liquidity ) > maxLiquidity ) {
  //           selectedFee = fee;
  //           maxLiquidity = BigInt( liquidity );
  //         }
  //       }
  //     }

  //     // If no suitable pool was found based on the threshold, use the first available pool
  //     const fee = selectedFee ? selectedFee : availablePools[ 0 ];
  //     log.error( `Using fee tier ${ fee } with liquidity ${ maxLiquidity.toString() }` );

  //     // Step 3: Create quote parameters
  //     const params = {
  //       tokenIn: actualTokenIn.address,
  //       tokenOut: actualTokenOut.address,
  //       fee,
  //       sqrtPriceLimitX96: 0n,
  //       ...( isExactIn ? { amountIn: amount } : { amount: amount } ),
  //     };

  //     const quoterContract = new ethersv6.Contract(
  //       ADDRESSES.UNISWAP_V3_QUOTER,
  //       IQuoterV2ABI.abi,
  //       this.providerNative
  //     );
  //     if ( !quoterContract ) throw new Error( 'Invalid quoter contract' );

  //     let quoteAmount: bigint = 0n;
  //     let sqrtPriceX96After: bigint = 0n;
  //     let initializedTicksCrossed: number = 0;
  //     let gasEstimate: bigint = 0n;

  //     try {
  //       if ( isExactIn ) {
  //         // Comes from fromAmount
  //         [ quoteAmount, sqrtPriceX96After, initializedTicksCrossed, gasEstimate ] =
  //           await quoterContract.quoteExactInputSingle.staticCall( params );
  //       } else {
  //         // Comes from toAmount
  //         [ quoteAmount, sqrtPriceX96After, initializedTicksCrossed, gasEstimate ] =
  //           await quoterContract.quoteExactOutputSingle.staticCall( params );
  //       }

  //       if ( quoteAmount > 0n ) {
  //         return await this.constructQuoteData(
  //           tokenIn,
  //           tokenOut,
  //           fundingAddress,
  //           amount,
  //           quoteAmount,
  //           fee,
  //           gasEstimate,
  //           false, // multiHop
  //           sqrtPriceX96After,
  //           initializedTicksCrossed,
  //           isExactIn
  //         );
  //       }
  //     } catch ( error ) {
  //       log.error( 'Direct pool quote failed, trying multi-hop:', false, error );
  //     }

  //     // Step 4: If no direct pool works, attempt a multi-hop route
  //     return await this.multiHopQuote( tokenIn, tokenOut, amount, fundingAddress, isExactIn );
  //   } catch ( error ) {
  //     log.error( 'Error in getQuoteWithLiquidityConsideration:', false, error );
  //     throw error;
  //   }
  // }

  // async getPoolLiquidity( tokenA: Token, tokenB: Token, fee: number ): Promise<BigNumberish | null> {
  //   try {
  //     const poolAddress = await this.getPoolAddress( tokenA, tokenB, fee );
  //     if ( poolAddress === ethersv6.ZeroAddress ) {
  //       log.error( `No pool exists for the token pair ${ tokenA.symbol }/${ tokenB.symbol } at fee ${ fee }` );
  //       return null;
  //     }

  //     const poolContract = new ethersv6.Contract( poolAddress, UNISWAP_POOL_ABI, this.providerNative );
  //     const liquidity = await poolContract.liquidity();
  //     return liquidity;
  //   } catch ( error ) {
  //     log.error( 'Error fetching pool liquidity:', false, error );
  //     return null;
  //   }
  // }

  // Where fees are calculated...

  private async constructQuoteData(
    tokenIn: Token,
    tokenOut: Token,
    fundingAddress: string,
    amount: BigNumberish,
    quoteAmount: bigint,
    fee: number,
    gasEstimate: bigint,
    multiHop: boolean,
    sqrtPriceX96After: bigint,
    initializedTicksCrossed: number,
    isExactIn: boolean
  ): Promise<SwapPriceData> {
    // Fee should always be calculated based on the 'buy' side
    const feeAmount = this.calculateFee( isExactIn ? quoteAmount : toBigInt( amount ) );

    const amountAfterFee = isExactIn ? quoteAmount - feeAmount : quoteAmount + feeAmount; // Adjusted amount after fee

    const formattedAmountIn = Number( ethersv6.formatUnits( isExactIn ? toBigInt( amount ) : amountAfterFee, tokenIn.decimals ) );
    const formattedAmountOut = Number( ethersv6.formatUnits( isExactIn ? amountAfterFee : toBigInt( amount ), tokenOut.decimals ) );
    const exchangeRate = formattedAmountOut / formattedAmountIn;

    // Fetch USD prices (these should come back as `number`)
    // These should cycle through the providers to get the first price
    const priceIn = await this.getMarketPrice( `${ tokenIn.symbol }-USD` );
    const priceOut = await this.getMarketPrice( `${ tokenOut.symbol }-USD` );

    // This is not checking specific prices but the object itself
    if ( !priceIn || !priceOut ) {
      throw new Error( 'Failed to get price from provider' );
    }

    // const feeAmountInTokenOut = ethersv6.formatUnits( feeAmount, tokenOut.decimals ); // Fee amount in tokenOut

    const feeAmountInUSD = formatFeeToUSD( feeAmount, tokenOut.decimals, priceOut.price );  //feeAmountInTokenOut * priceOut.price; // Always in tokenOut (buy side)
    const priceOutBigInt = BigInt( Math.round( priceOut.price * 10 ** tokenOut.decimals ) );

    let gasEstimateInUSD = '';
    let adjustedGasEstimate = 0n;

    const gasPrice = await this.getMarketPrice( `ETH-USD` );

    if ( gasEstimate > 0n ) {
      adjustedGasEstimate = ( gasEstimate * ( 10000n + YAKKL_GAS_ESTIMATE_MULTIPLIER_BASIS_POINTS ) ) / 10000n;

      // Convert gas estimate from Gwei to Ether
      const gasEstimateInEther = adjustedGasEstimate * 10n ** 9n;
      const gasEstimateInEtherNumber = Number( gasEstimateInEther ) / 10 ** 18;

      // Calculate gas cost in USD using the price of Ether
      const ethPriceInUSD = gasPrice.price;

      // Multiply gas in Ether with Ether's price to get the cost in USD
      const gasCostInUSD = gasEstimateInEtherNumber * ethPriceInUSD;

      // Can use Math.max to ensure a gas estimate
      gasEstimateInUSD = gasCostInUSD > YAKKL_GAS_ESTIMATE_MIN_USD ? formatPrice( gasCostInUSD ) : formatPrice( YAKKL_GAS_ESTIMATE_MIN_USD ); // This is only a conservative minimum estimate and not actual
    }

    return {
      provider: this.getName(),
      lastUpdated: new Date(),
      chainId: this.getChainId(),
      tokenIn,
      tokenOut,
      fundingAddress,
      quoteAmount,
      feeAmount,
      amountAfterFee,
      amountIn: isExactIn ? amount : quoteAmount,
      amountOut: isExactIn ? amountAfterFee : amount,
      exchangeRate,
      marketPriceIn: priceIn.price,
      marketPriceOut: priceOut.price,
      marketPriceGas: gasPrice.price, // Defaults to ETH
      priceImpactRatio: 0,
      path: [ tokenIn.isNative ? ethersv6.ZeroAddress : tokenIn.address, tokenOut.isNative ? ethersv6.ZeroAddress : tokenOut.address ],
      fee,
      feeBasisPoints: this.feeBasisPoints,
      feeAmountPrice: (Number(feeAmount) * priceOut.price) / formattedAmountOut,
      feeAmountInUSD,
      gasEstimate: adjustedGasEstimate,
      gasEstimateInUSD,
      tokenOutPriceInUSD: formatPrice( Number( priceOutBigInt ) / 10 ** tokenOut.decimals ),

      // Default values and have no meaning here but are required for the interface and will be corrected further up the chain
      slippageTolerance: 0.5,
      deadline: 10,

      sqrtPriceX96After,
      initializedTicksCrossed,
      multiHop,
      error: null,
      isLoading: false,
    };
  }

  async getGasEstimateForSwap(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    fundingAddress: string,
    fee: number,
  ): Promise<bigint> {
    // Ensure provider is not null
    if ( !this.providerNative ) {
      throw new Error( 'Ethereum provider not initialized' );
    }

    // Step 1: Set up the SwapRouter contract (Uniswap V3)
    const swapRouterABI = [
      "function exactInput((bytes path,uint256 amountIn,uint256 amountOutMinimum,address recipient,uint256 deadline)) external payable returns (uint256 amountOut)"
    ];

    // Create a provider from the existing provider
    const provider = new ethersv5.providers.JsonRpcProvider(
      await this.provider.getProviderURL()
    );

    const swapRouter = new ethersv5.Contract(
      ADDRESSES.UNISWAP_V3_ROUTER,
      swapRouterABI,
      provider
    );

    // Step 2: Encode the multi-hop path using ethers v5 utils
    const encodedPath = ethersv5.utils.solidityPack(
      [ 'address', 'uint24', 'address', 'uint24', 'address' ],
      [
        tokenIn,  // TokenIn address
        fee,      // Fee for TokenIn -> WETH pool
        ADDRESSES.WETH, // WETH address
        fee,      // Fee for WETH -> TokenOut pool
        tokenOut  // TokenOut address
      ]
    );

    // Step 3: Prepare swap parameters
    const recipient: string = fundingAddress;

    const deadline = Math.floor( Date.now() / 1000 ) + 60 * 20; // 20 minutes from the current Unix time
    const amountOutMinimum = 0; // You can adjust slippage tolerance here

    // Parameters for the swap
    const swapParams = {
      path: encodedPath,
      amountIn: amountIn.toString(), // Convert to string for ethers v5
      amountOutMinimum: amountOutMinimum,
      recipient: recipient,
      deadline: deadline
    };

    // Step 4: Estimate gas for the transaction
    try {
      // Populate the transaction using the contract method directly
      const tx = await swapRouter.populateTransaction[ 'exactInput' ]( swapParams );

      // Ensure from address is set
      tx.from = recipient;

      // Add value for native token input
      // If tokenIn is native, add the amountIn as value
      const isNativeInput = tokenIn.toLowerCase() === ethersv6.ZeroAddress.toLowerCase();
      if ( isNativeInput ) {
        tx.value = ethersv5.BigNumber.from( amountIn.toString() );
      }

      // Try to estimate gas with a fallback mechanism
      let gasEstimate;
      try {
        gasEstimate = await provider.estimateGas( {
          ...tx,
          from: recipient
        } );
      } catch ( estimateError ) {
        // Fallback: Use a fixed gas limit or a percentage increase
        const baseGasLimit = YAKKL_GAS_ESTIMATE_MULTIHOP_SWAP_DEFAULT; // Adjust based on typical multi-hop swap gas usage
        gasEstimate = ethersv5.BigNumber.from( baseGasLimit );
      }

      // Add a buffer to the gas estimate
      // Convert to bigint
      const gasEstimateBigInt = gasEstimate.toBigInt(); // Convert BigNumber to BigInt
      const adjustedGasEstimate = ( gasEstimateBigInt * ( 10000n + YAKKL_GAS_ESTIMATE_MULTIPLIER_BASIS_POINTS ) ) / 10000n;

      return adjustedGasEstimate;
    } catch ( error ) {
      // Fallback to a default gas estimate
      const fallbackGasLimit = BigInt( YAKKL_GAS_ESTIMATE_MULTIHOP_SWAP_DEFAULT ); // Adjust based on typical multi-hop swap gas usage
      return fallbackGasLimit;
    }
  }

  async getPoolInfo( tokenIn: SwapToken, tokenOut: SwapToken, fee: number = 3000 ): Promise<PoolInfoData> {
    throw new Error("Not implemented yet");
  }

  // async getPoolInfo( tokenIn: SwapToken, tokenOut: SwapToken, fee: number = 3000 ): Promise<PoolInfoData> {
  //   if ( !this.factory || !this.provider ) throw new Error( 'Contracts not initialized' );

  //   try {
  //     const poolAddress = await this.factory.getPool( tokenIn.address, tokenOut.address, fee );
  //     if ( !poolAddress || poolAddress === ethersv6.ZeroAddress ) {
  //       throw new Error( 'Pool does not exist' );
  //     }

  //     const tokenA = convertToUniswapToken( tokenIn );
  //     const tokenB = convertToUniswapToken( tokenOut );

  //     const poolContract = new ethersv6.Contract( poolAddress, IUniswapV3PoolABI.abi, this.providerNative );
  //     if ( !poolContract ) throw new Error( 'Pool contract not found' );

  //     const [ slot0, liquidity, token0Address, token1Address, tickSpacing, poolFee, tickBitmap, ticks ] = await Promise.all( [
  //       poolContract.slot0(),
  //       poolContract.liquidity(),
  //       poolContract.token0(),
  //       poolContract.token1(),
  //       poolContract.tickSpacing(),
  //       poolContract.fee(),
  //       poolContract.tickBitmap( 0 ),
  //       poolContract.ticks( 0 )
  //     ] );

  //     debug_log( '\n\nUniswapPriceProvider - getPoolInfo: >>>>>>>>>>>>>>>>>>>>>>>>>>>> POOL START <<<<<<<<<<<<<<<<<<<<<<<<\n\n' );
  //     debug_log( 'UniswapPriceProvider - getPoolInfo:', poolContract );

  //     debug_log( 'Slot0:', slot0 );
  //     debug_log( 'Liquidity:', liquidity.toString() );
  //     debug_log( 'Token0 address:', token0Address, tokenA );
  //     debug_log( 'Token1 address:', token1Address, tokenB );
  //     debug_log( 'Tick spacing:', tickSpacing.toString() );
  //     debug_log( 'Pool fee:', poolFee.toString() );

  //     debug_log( 'Tick bitmap:', tickBitmap );
  //     debug_log( 'Ticks:', ticks );

  //     const { sqrtPriceX96, tick } = slot0;

  //     debug_log( 'sqrtPriceX96:', sqrtPriceX96.toString() );
  //     debug_log( 'tick:', tick );

  //     const token0 = new UniswapToken( this.getChainId(), token0Address, tokenIn.decimals, tokenIn.symbol, tokenIn.name );
  //     const token1 = new UniswapToken( this.getChainId(), token1Address, tokenOut.decimals, tokenOut.symbol, tokenOut.name );

  //     debug_log( 'Token0:', token0 );
  //     debug_log( 'Token1:', token1 );

  //     // Ensure tick is within valid range
  //     const minTick = BigInt( TickMath.MIN_TICK );
  //     const maxTick = BigInt( TickMath.MAX_TICK );
  //     const tickBigInt = BigInt( tick.toString() );
  //     const validTickBigInt = tickBigInt < minTick ? minTick : ( tickBigInt > maxTick ? maxTick : tickBigInt );

  //     let validTick: number;
  //     try {
  //       validTick = safeConvertBigIntToNumber( validTickBigInt );
  //     } catch ( error ) {
  //       log.error( 'Error converting tick to number:', false, error );
  //       // Fallback to a default tick value or handle the error as appropriate for your use case
  //       validTick = 0; // or some other default value
  //     }

  //     debug_log( 'Valid tick:', validTick );

  //     // Calculate reserves
  //     const Q96 = 2n ** 96n;

  //     // Calculate price from sqrtPriceX96
  //     const price = ( Number( sqrtPriceX96 ) / Number( Q96 ) ) ** 2;
  //     debug_log( 'Price:', price );

  //     // Ensure sqrtPriceX96 is within valid range
  //     const minSqrtRatio = JSBI.BigInt( TickMath.MIN_SQRT_RATIO.toString() );
  //     const maxSqrtRatio = JSBI.BigInt( TickMath.MAX_SQRT_RATIO.toString() );
  //     const sqrtPriceX96BigInt = JSBI.BigInt( sqrtPriceX96.toString() );
  //     const clampedSqrtPriceX96 = JSBI.lessThan( sqrtPriceX96BigInt, minSqrtRatio )
  //       ? minSqrtRatio
  //       : ( JSBI.greaterThan( sqrtPriceX96BigInt, maxSqrtRatio ) ? maxSqrtRatio : sqrtPriceX96BigInt );

  //     debug_log( 'Clamped sqrtPriceX96:', clampedSqrtPriceX96.toString() );

  //     const pool = new Pool(
  //       token0,
  //       token1,
  //       fee,
  //       clampedSqrtPriceX96.toString(),
  //       liquidity.toString(),
  //       validTick
  //     );

  //     debug_log( 'Pool created successfully', pool );

  //     // Calculate amounts from liquidity
  //     const tickLow = Math.floor( validTick / Number( tickSpacing ) ) * Number( tickSpacing );
  //     const tickHigh = tickLow + Number( tickSpacing );
  //     const sqrtPriceLow = TickMath.getSqrtRatioAtTick( tickLow );
  //     const sqrtPriceHigh = TickMath.getSqrtRatioAtTick( tickHigh );

  //     debug_log( 'Tick low:', tickLow );
  //     debug_log( 'Tick high:', tickHigh );
  //     debug_log( 'Sqrt price low:', sqrtPriceLow.toString() );
  //     debug_log( 'Sqrt price high:', sqrtPriceHigh.toString() );

  //     const price2 = sqrtPriceX96ToPrice( BigInt( sqrtPriceLow.toString() ), token0.decimals, token1.decimals );
  //     debug_log( 'Price at low tick:', price2 );
  //     const price3 = sqrtPriceX96ToPrice( BigInt( sqrtPriceHigh.toString() ), token0.decimals, token1.decimals );
  //     debug_log( 'Price at high tick:', price3 );

  //     const avgPrice = ( price2 + price3 ) / 2;
  //     debug_log( 'Average price:', avgPrice );

  //     const sqrtPrice = sqrtPriceX96 / Q96;
  //     debug_log( 'Sqrt price:', sqrtPrice );

  //     const liquidityBigInt = BigInt( liquidity.toString() );

  //     const token0Amt = Number( liquidityBigInt ) / ( Number( sqrtPrice ) * ( 2 ** 96 ) );
  //     const token1Amt = Number( liquidityBigInt ) * Number( sqrtPrice ) / ( 2 ** 96 );

  //     debug_log( 'Token0 amount:', token0Amt );
  //     debug_log( 'Token1 amount:', token1Amt );



  //     // Calculate reserves
  //     const token0Reserve = parseFloat(
  //       ethersv6.formatUnits( liquidity.toString(), token0.decimals )
  //     );
  //     const token1Reserve = parseFloat(
  //       ethersv6.formatUnits( liquidity.toString(), token1.decimals )
  //     );

  //     debug_log( 'Token0 reserve:', token0Reserve );
  //     debug_log( 'Token1 reserve:', token1Reserve );

  //     // Calculate amounts of token0 and token1 in the pool
  //     const sqrtRatioX96 = JSBI.BigInt( clampedSqrtPriceX96.toString() );

  //     const liquidity_ = JSBI.BigInt( liquidity.toString());

  //     debug_log( 'sqrtRatioX96:', sqrtRatioX96.toString() );
  //     debug_log( 'liquidity_:', liquidity_.toString() );

  //     const token0Amount = SqrtPriceMath.getAmount0Delta(
  //       sqrtRatioX96,
  //       TickMath.MAX_SQRT_RATIO,
  //       liquidity_,
  //       true
  //     );

  //     const token1Amount = SqrtPriceMath.getAmount1Delta(
  //       TickMath.MIN_SQRT_RATIO,
  //       sqrtRatioX96,
  //       liquidity_,
  //       true
  //     );

  //     debug_log( 'token0Amount:', token0Amount.toString() );
  //     debug_log( 'token1Amount:', token1Amount.toString() );

  //     // Get CurrencyAmount for 1 unit of each token
  //     const amount0 = CurrencyAmount.fromRawAmount(
  //       token0,
  //       JSBI.exponentiate( JSBI.BigInt( 10 ), JSBI.BigInt( token0.decimals ) ).toString()
  //     );
  //     const amount1 = CurrencyAmount.fromRawAmount(
  //       token1,
  //       JSBI.exponentiate( JSBI.BigInt( 10 ), JSBI.BigInt( token1.decimals ) ).toString()
  //     );

  //     debug_log( 'amount0:', amount0.toExact() );
  //     debug_log( 'amount1:', amount1.toExact() );

  //     // Calculate prices
  //     let token0Price, token1Price;
  //     try {
  //       // Get the sqrt price from the pool
  //       const sqrtPriceX96 = JSBI.BigInt( pool.sqrtRatioX96.toString() );

  //       // Calculate price0 (token1 per token0)
  //       const price0 = JSBI.divide(
  //         JSBI.multiply( sqrtPriceX96, sqrtPriceX96 ),
  //         JSBI.exponentiate( JSBI.BigInt( 2 ), JSBI.BigInt( 192 ) )
  //       );

  //       // Calculate price1 (token0 per token1)
  //       const price1 = JSBI.divide(
  //         JSBI.exponentiate( JSBI.BigInt( 2 ), JSBI.BigInt( 192 ) ),
  //         JSBI.multiply( sqrtPriceX96, sqrtPriceX96 )
  //       );

  //       // Convert to decimal representation
  //       const price0Decimal = Number( price0.toString() ) / Math.pow( 10, token1.decimals - token0.decimals );
  //       const price1Decimal = Number( price1.toString() ) / Math.pow( 10, token0.decimals - token1.decimals );

  //       debug_log( 'token0:', token0 );
  //       debug_log( 'token1:', token1 );

  //       debug_log( 'price0Decimal:', price0Decimal );
  //       debug_log( 'price1Decimal:', price1Decimal );

  //       token0Price = price0Decimal.toFixed( 6 );
  //       token1Price = price1Decimal.toFixed( 6 );

  //       debug_log( 'token0Price:', token0Price );
  //       debug_log( 'token1Price:', token1Price );

  //     } catch ( error ) {
  //       log.error( 'Error calculating prices:', false, error );
  //       token0Price = '0';
  //       token1Price = '0';
  //     }

  //     const token0Reserves = ethersv6.formatUnits( token0Amount.toString(), tokenIn.decimals );
  //     const token1Reserves = ethersv6.formatUnits( token1Amount.toString(), tokenOut.decimals );

  //     debug_log( 'token0Reserves:', token0Reserves );
  //     debug_log( 'token1Reserves:', token1Reserves );

  //     // Calculate TVL using the price as a string and parseFloat
  //     const tvl = ( parseFloat( token0Reserves ) * parseFloat( token0Price ) ) +
  //       ( parseFloat( token1Reserves ) * parseFloat( token1Price ) );

  //     debug_log( 'TVL:', tvl );

  //     debug_log( '\n\nUniswapPriceProvider - getPoolInfo: >>>>>>>>>>>>>>>>>>>>>>>>>>>> POOL END <<<<<<<<<<<<<<<<<<<<<<<<\n\n' );

  //     return {
  //       provider: this.getName(),
  //       lastUpdated: new Date(),
  //       chainId: this.getChainId(),
  //       fee,
  //       liquidity: liquidity.toString(),
  //       sqrtPriceX96: clampedSqrtPriceX96.toString(),
  //       tick: validTick,
  //       tokenInReserve: token0Reserves,
  //       tokenOutReserve: token1Reserves,
  //       tokenInUSDPrice: token0Price,
  //       tokenOutUSDPrice: token1Price,
  //       tvl
  //     };
  //   } catch ( error ) {
  //     log.error( 'Error in getPoolInfo:', false, error );
  //     throw error;
  //   }
  // }

  // async getTokenPair( pair: string ): Promise<TokenPair | PriceData> {
  //   if ( !pair ) {
  //     return this.returnError( `Invalid pair - ${ pair }` );
  //   }

  //   const [ tokenInSymbol, tokenOutSymbol ] = pair.split( '-' );
  //   if ( !tokenInSymbol || !tokenOutSymbol ) {
  //     return this.returnError( `Invalid pair format - ${ pair }` );
  //   }

  //   const tokenIn = this.getStandardizedToken( tokenInSymbol );
  //   const tokenOut = this.getStandardizedToken( tokenOutSymbol );

  //   if ( !tokenIn || !tokenOut ) {
  //     return this.returnError( `Token not found for ${ pair }` );
  //   }

  //   if ( tokenIn.address === tokenOut.address ) {
  //     return this.getMarketPrice( `${ tokenInSymbol }-USD` );
  //   }

  //   return { tokenIn, tokenOut };
  // }

  private returnError( message: string ): PriceData {
    return {
      provider: this.getName(),
      price: 0,
      lastUpdated: new Date(),
      status: 404,
      message
    };
  }

  errorUniswap(error: any, excludeProps: string[] = []): string {
    // Recursive function to clean up the object
    const cleanObject = (obj: any, exclude: string[]): any => {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        // Create a shallow copy to avoid mutating the original object
        const cleaned = Array.isArray(obj) ? [...obj] : { ...obj };

        for (const key in cleaned) {
            if (exclude.includes(key)) {
                delete cleaned[key];
            } else if (typeof cleaned[key] === 'string') {
                // Attempt to parse stringified JSON for better readability
                try {
                    const parsed = JSON.parse(cleaned[key]);
                    cleaned[key] = parsed; // Replace with parsed JSON if valid
                } catch {
                    // Keep the string as-is if it's not valid JSON
                }
            } else if (typeof cleaned[key] === 'object') {
                // Recursively clean nested objects
                cleaned[key] = cleanObject(cleaned[key], exclude);
            }
        }

        return cleaned;
    };

    // Extract and clean up the error object
    const cleanedError = cleanObject(error, excludeProps);

    // Format the cleaned object into a readable JSON string
    return JSON.stringify(cleanedError, null, 2);
  }

  private async getTokenReserve( token: Token, poolAddress: string ): Promise<string> {
    const balance = await token.getBalance( poolAddress );
    return balance ? balance.toString() : '0';
  }

  private async getTokenUSDPrice( token: Token ): Promise<number> {
    try {
      const price = await this.getMarketPrice( token.symbol + '-USD' );
      return price.price;
    } catch ( error ) {
      log.error( 'Error getting token price. Defaulting to 0:', false, error );
      return 0;
    }
  }

  private async calculateTVL(
    tokenA: Token,
    tokenB: Token,
    poolAddress: string
  ): Promise<number> {
    const [ reserveA, reserveB ] = await Promise.all( [
      this.getTokenReserve( tokenA, poolAddress ),
      this.getTokenReserve( tokenB, poolAddress )
    ] );

    const [ priceA, priceB ] = await Promise.all( [
      this.getTokenUSDPrice( tokenA ),
      this.getTokenUSDPrice( tokenB )
    ] );

    const valueA = ( Number( reserveA ) / 10 ** tokenA.decimals ) * priceA;
    const valueB = ( Number( reserveB ) / 10 ** tokenB.decimals ) * priceB;

    return valueA + valueB;
  }

  getRouterAddress(): string {
    return this.routerContract!.target as string;
  }

  async getWETHToken(): Promise<Token> {
    const chainId = this.getChainId();
    const wethAddress = chainId === 1 ? ADDRESSES.WETH : ADDRESSES.WETH_SEPOLIA;

    return new EVMToken(
      wethAddress,
      'Wrapped Ether',
      'WETH',
      18,
      '/images/ethereum.svg',
      'Wrapped version of Ether',
      chainId,
      false, // Not native since it's wrapped,
      false,
      this.blockchain,
      this.provider
    );
  }

  async populateSwapTransaction(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    recipient: string,
    deadline: number,
    fee: number = 3000,
    estimateOnly: boolean = false
  ): Promise<TransactionRequest | bigint> {
    const params: ExactInputSingleParams = {
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
      fee,
      recipient,
      deadline,
      amountIn: toBigInt( amountIn ),
      amountOutMinimum: toBigInt( amountOutMin ),
      sqrtPriceLimitX96: 0
    };

    if ( !this.routerContract ) throw new Error( "Router contract not initialized" );
    const populatedTx = await this.routerContract.exactInputSingle.populateTransaction( params );

    if ( estimateOnly ) {
      const signer = this.provider.getSigner();
      if ( !signer ) throw new Error( 'No signer available' );

      const gasEstimate = await this.provider.estimateGas( {
        from: await signer.getAddress(),
        to: this.routerContract!.target as string,
        data: populatedTx.data,
        value: tokenIn.isNative ? amountIn : 0,
        chainId: this.getChainId()
      } );

      return gasEstimate;
    }

    return {
      to: this.routerContract.target as string,
      data: populatedTx.data,
      value: tokenIn.isNative ? amountIn : 0,
      from: params.recipient,
      chainId: this.getChainId()
    };
  }

  // No fee needed for multi-hop swaps since it is enoded in the route
  async populateMultiHopSwapTransaction(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    recipient: string,
    deadline: number
  ): Promise<TransactionRequest> {
    const params: ExactInputParams = {
      path: [ tokenIn.address, ADDRESSES.WETH, tokenOut.address ],
      recipient,
      deadline,
      amountIn: EthereumBigNumber.from( amountIn ).toBigInt() ?? 0n,
      amountOutMinimum: EthereumBigNumber.from( amountOutMin ).toBigInt() ?? 0n
    };

    if ( !this.routerContract ) throw new Error( "Router contract not initialized" );
    const populatedTx = await this.routerContract.exactInput.populateTransaction( params );

    return {
      to: this.routerContract!.target as string,
      data: populatedTx.data,
      value: tokenIn.isNative ? amountIn : 0,
      from: params.recipient,
      chainId: this.getChainId()
    };
  }

  async checkAllowance( token: Token, fundingAddress: string ): Promise<bigint> {
    try {
      if ( !token || token.isNative || !fundingAddress || !this.providerNative ) {
        // debug_log( 'Token, provider, or swap manager not initialized', { token, fundingAddress } );
        return 0n;
      }

      const tokenContract = new ethersv6.Contract(
        token.address,
        [ 'function allowance(address,address) view returns (uint256)' ],
        this.providerNative
      );

      if ( !tokenContract ) {
        throw new Error( 'Token contract not initialized' );
      }

      const allowance = await tokenContract.allowance(
        fundingAddress,
        this.getRouterAddress()
      );
      return toBigInt( allowance );
    } catch ( error ) {
      log.error( 'Error checking allowance:', false, error );
      return 0n;
    }
  }

  async approveToken( token: Token, amount: string ): Promise<TransactionReceipt> {
    // Validate inputs
    if ( !this.blockchain ) {
      throw new Error( 'Blockchain not initialized' );
    }
    if ( !this.signerNative ) {
      throw new Error( 'Signer not initialized' );
    }
    if ( !token.address || token.address === ethersv6.ZeroAddress ) {
      throw new Error( 'Invalid token address' );
    }
    const routerAddress = this.getRouterAddress();
    if ( !routerAddress || routerAddress === ethersv6.ZeroAddress ) {
      throw new Error( 'Invalid router address' );
    }
    // Create token contract
    const tokenContract = new ethersv6.Contract(
      token.address,
      [ 'function approve(address,uint256) public returns (bool)' ],
      this.signerNative
    );
    if ( !tokenContract ) {
      throw new Error( 'Token contract not initialized' );
    }

    try {
      // Parse the amount with correct decimals
      const parsedAmount = ethersv6.parseUnits( amount, token.decimals );
      if ( !parsedAmount ) {
        throw new Error( 'Failed to parse amount' );
      }

      // Set gas parameters defaults - these can be adjusted based on network conditions and token approval requirements
      const gasLimit = 100000; // Set an appropriate gas limit value
      const maxPriorityFeePerGas = ethersv6.parseUnits( '1.5', 'gwei' ); // Adjust based on network conditions
      const maxFeePerGas = ethersv6.parseUnits( '20', 'gwei' ); // Adjust based on network conditions

      // Call approve with gas overrides
      const tx = await tokenContract.approve(
        routerAddress,
        parsedAmount,
        {
          chainId: this.getChainId() || 1,
          type: 2,
          gasLimit,
          maxPriorityFeePerGas,
          maxFeePerGas,
        }
      );

      // Wait for transaction confirmation to get the receipt
      const receipt = await tx.wait(); // TODO: Move the class to background processing and setup a listener for the transaction receipt with no 'wait'
      if ( receipt.status !== 1 ) {
        throw new Error( 'Token approval transaction failed' );
      }

      // Check if the approval was successful (true or false)
      if ( receipt.logs.length > 0 ) {
        const eventFragment = tokenContract.interface.getEvent( 'Approval' );
        const log = receipt.logs.find( ( log: { topics: string[]; } ) => log.topics[ 0 ] === eventFragment?.topicHash );
        // if ( log ) {
        //   debug_log( 'Approval event detected: ***************************', log );
        // }
      }

      return EthersConverter.ethersTransactionReceiptToTransactionReceipt(receipt);
    } catch ( error ) {
      log.error( 'Token approval error:', false, error );
      throw error;
    }
  }

  async executeSwap( params: SwapParams ): Promise<TransactionResponse> {
    try {
      const {
        tokenIn,
        tokenOut,
        amount,
        fee,
        slippage,
        deadline,
        recipient,
        gasLimit,
        maxPriorityFeePerGas,
        maxFeePerGas
      } = params;

      const quote = await this.getQuote( tokenIn, tokenOut, amount, recipient );
      if ( !quote || quote.error ) throw new Error( quote && quote.error ? quote.error : 'Failed to get quote for excute swap' );

      const minOut = ( toBigInt( quote.amountOut ) * BigInt( 1000 - Math.floor( slippage * 10 ) ) ) / 1000n;
      let tx;
      if ( quote.multiHop ) {
        // No fee required for multi-hop swaps (encoded in path)
        tx = await this.populateMultiHopSwapTransaction(
          tokenIn,
          tokenOut,
          amount,
          minOut,
          recipient,
          Math.floor( Date.now() / 1000 ) + ( deadline * 60 )
        );
      } else {
        tx = await this.populateSwapTransaction(
          tokenIn,
          tokenOut,
          amount,
          minOut,
          recipient,
          Math.floor( Date.now() / 1000 ) + ( deadline * 60 ),
          fee
        );
      }

      if ( typeof tx === 'bigint' ) {
        throw new Error( 'Received gas estimate instead of transaction request' );
      }

      tx.type = 2;
      tx.gasLimit = toBigInt( gasLimit );
      tx.maxPriorityFeePerGas = toBigInt( maxPriorityFeePerGas );
      tx.maxFeePerGas = toBigInt( maxFeePerGas );

      return await this.provider.sendTransaction( tx );
    } catch ( error ) {
      log.error( 'Error executing swap:', false, error );
      throw error;
    }
  }

  async executeFullSwap( params: SwapParams ): Promise<[ TransactionReceipt, TransactionReceipt ]> {
    try {
      const tx = await this.executeSwap( params );
      if ( !tx ) {
        throw new Error( 'Failed to execute swap - 1' );
      }

      // Wait for the swap transaction receipt
      const swapReceipt = await tx.wait();
      if ( !swapReceipt ) {
        throw new Error( 'Failed to get transaction receipt - 2' );
      }

      // Distribute the fee via transaction/transfer and wait for the fee transaction receipt
      const feeReceipt = await this.distributeFee( params.tokenOut, params.feeAmount, params.feeRecipient, params.gasLimit, params.maxPriorityFeePerGas, params.maxFeePerGas );

      // Return both receipts as an array, as expected by the function return type
      return [ swapReceipt, feeReceipt ];
    } catch ( error ) {
      log.error( 'Error executing FULL swap:', false, error );
      throw error;
    }
  }

  async distributeFee(
    tokenOut: Token,
    feeAmount: BigNumberish,
    feeRecipient: string,
    gasLimit: BigNumberish,
    maxPriorityFeePerGas: BigNumberish,
    maxFeePerGas: BigNumberish
  ): Promise<TransactionReceipt> {
    if ( !this.provider ) {
      throw new Error( 'Provider not initialized' );
    }
    if ( !tokenOut.address && !tokenOut.isNative ) {
      throw new Error( 'Fee distribution only works with ERC20 tokens' );
    }
    if ( !feeRecipient ) {
      throw new Error( 'Fee recipient address is required' );
    }
    if ( !feeAmount ) {
      throw new Error( 'Fee amount is required' );
    }

    let priorityFee = toBigInt( maxPriorityFeePerGas );
    const maxFee = toBigInt( maxFeePerGas );

    // Ensure maxPriorityFeePerGas does not exceed maxFeePerGas
    if ( priorityFee > maxFee ) {
      priorityFee = maxFee;  // Adjust to make sure it's valid
    }

    if ( tokenOut.isNative ) {
      try {
        // Create a transaction to send the fee directly as a transfer
        const signer = this.provider.getSigner();
        if ( !signer ) {
          throw new Error( 'Signer not available' );
        }

        const txRequest = {
          to: feeRecipient,
          value: toBigInt( feeAmount ),
          from: await signer.getAddress(),
          chainId: this.getChainId(),
          gasLimit: toBigInt( gasLimit ),
          maxPriorityFeePerGas: priorityFee,
          maxFeePerGas: maxFee,
          type: 2,
        };

        const tx = await this.provider.sendTransaction( txRequest ); // sendTransaction and not transfer since it's a native transaction
        const receipt = await tx.wait();

        try {
          const gasUsed = toBigInt( receipt.gasUsed ) || 0n;
          const cummulativeGasUsed = receipt.cumulativeGasUsed ? toBigInt( receipt.cumulativeGasUsed.toString() ) : 0n;
          const effectiveGasPrice = receipt.effectiveGasPrice ? toBigInt( receipt.effectiveGasPrice.toString() ) : 0n;
          const gasCost = gasUsed * effectiveGasPrice;
        } catch ( error ) {
          log.error( 'Error calculating gas cost (informational-transaction):', false, error );
        }
        return receipt;

      } catch ( error ) {
        log.error( 'Fee distribution failed (transaction):', false, error );
        throw error;
      }
    }

    try {
      const tokenContract = new ethersv6.Contract(
        tokenOut.address,
        [
          'function transfer(address recipient, uint256 amount) public returns (bool)'
        ],
        this.signerNative  // Use the signer for transactions, transfers, etc.
      );

      // Use the `transfer` function of the ERC-20 token to send the tokens to the recipient
      // NOTE: Using ethers and it supports transaction overrides like { gasLimit, maxPriorityFeePerGas, maxFeePerGas }
      const tx = await tokenContract.transfer( feeRecipient, feeAmount, {
        gasLimit: toBigInt( gasLimit ),
        maxPriorityFeePerGas: toBigInt( maxPriorityFeePerGas ),
        maxFeePerGas: toBigInt( maxFeePerGas ),
      } );

      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      // May want to do something with the receipt here...

      // Use the gas spends that come back and calculate actual gas cost for transaction
      try {
        const gasUsed = toBigInt( receipt.gasUsed ) || 0n;
        const cummulativeGasUsed = toBigInt( receipt.cumulativeGasUsed.toString() ) || 0n;
        const effectiveGasPrice = receipt.effectiveGasPrice ? toBigInt( receipt.effectiveGasPrice.toString() ) : 0n;
        const gasCost = gasUsed * effectiveGasPrice;
      } catch ( error ) {
        log.error( 'Error calculating gas cost (informational-transfer):', false, error );
      }

      return receipt;
    } catch ( error ) {
      log.error( 'Fee distribution failed (transfer):', false, error );
      throw error;
    }
  }

  async wrapETH( amount: BigNumberish, recipient: string ): Promise<TransactionReceipt | null> {
    if ( !this.signerNative ) throw new Error( 'Ethereum signer not initialized' );
    if ( !recipient ) throw new Error( 'Recipient address is required' );
    if ( !amount ) throw new Error( 'Amount is required' );

    try {
      const wethContract = new ethersv6.Contract(
        ADDRESSES.WETH,
        [ 'function deposit() public payable' ],
        this.signerNative
      );

      // Make sure that the signer is connected properly for the recipient
      // const tx = await wethContract.connect( this.signerNative ).deposit( {
      //   value: amount,
      //   from: recipient
      // } );

      let tx;
      if ( recipient !== await this.signerNative.getAddress() ) {
        tx = await wethContract.deposit( {
          value: amount,
          from: recipient
        } );
      } else {
        tx = await wethContract.deposit( {
          value: amount
        } );
      }

      const receipt = await tx.wait();
      return await EthersConverter.ethersTransactionReceiptToTransactionReceipt( receipt );
    } catch ( error ) {
      log.error( 'Error wrapping ETH:', false, error );
      throw error;
    }
  }

  async unwrapWETH( amount: BigNumberish, recipient: string ): Promise<TransactionReceipt | null> {
    if ( !this.signerNative ) throw new Error( 'Ethereum signer not initialized' );
    if ( !recipient ) throw new Error( 'Recipient address is required' );
    if ( !amount ) throw new Error( 'Amount is required' );

    try {
      const wethContract = new ethersv6.Contract(
        ADDRESSES.WETH,
        [
          'function withdraw(uint256 amount) public',
          'function transfer(address to, uint256 value) public returns (bool)',
        ],
        this.signerNative
      );

      const tx = await wethContract.withdraw( amount );
      const receiptTrans = await tx.wait();

      if ( !receiptTrans || receiptTrans.status !== 1 ) {
        throw new Error( 'Failed to withdraw WETH' );
      }

      // Send the resulting ETH to the recipient
      if ( recipient !== await this.signerNative.getAddress() ) {
        // This means unwrap WETH to ETH and send to someone else (not the signer)
        const txTransfer = await this.signerNative.sendTransaction( {
          to: recipient,
          value: toBigInt( amount )
        } );

        const receipt = await txTransfer.wait();
        if ( !receipt || receipt.status !== 1 ) {
          throw new Error( 'Failed to transfer ETH to recipient' );
        }

        return receipt ? await EthersConverter.ethersTransactionReceiptToTransactionReceipt( receipt ) : null;
      } else {
        return receiptTrans; // Return the original receipt if the recipient is the signer
      }
    } catch ( error ) {
      log.error( 'Error unwrapping WETH:', false, error );
      throw error;
    }
  }

  // private getStandardizedToken( symbol: string ): SwapToken | null {
  //   let standardizedSymbol = symbol;
  //   if ( symbol === 'USD' ) standardizedSymbol = 'USDC';
  //   if ( symbol === 'ETH' ) standardizedSymbol = 'WETH';
  //   return getToken( standardizedSymbol, this.getChainId() );
  // }

}
