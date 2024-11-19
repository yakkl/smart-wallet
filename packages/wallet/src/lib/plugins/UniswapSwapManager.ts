/* eslint-disable @typescript-eslint/no-explicit-any */
// UniswapSwapManager.ts
import { debug_log } from '$lib/common/debug';
import { abi as ISwapRouterABI } from '@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json';
import { SwapManager } from './SwapManager';
import { getToken, type TokenPair } from '$lib/common/tokens';
import { Pool, SqrtPriceMath, TickMath } from '@uniswap/v3-sdk';
import { Token } from './Token';
import { CurrencyAmount, Token as UniswapToken } from '@uniswap/sdk-core';
import { type BigNumberish, type TransactionResponse, type PoolInfoData, type TransactionRequest, type SwapParams, type SwapPriceData, YAKKL_FEE_BASIS_POINTS, type SwapToken, type PriceData, YAKKL_GAS_ESTIMATE_MULTIPLIER_BASIS_POINTS, toBigInt, YAKKL_GAS_ESTIMATE_MIN_USD, YAKKL_GAS_ESTIMATE_MULTIHOP_SWAP_DEFAULT } from '$lib/common';
import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
import { ADDRESSES } from './contracts/evm/constants-evm';
import type { ExactInputSingleParams, ExactInputParams } from '$lib/common/ISwapRouter';
import { EVMToken } from './tokens/evm/EVMToken';
import { ethers } from 'ethers';
import { ethers as ethersv5 } from 'ethers-v5';
import type { Ethereum } from './blockchains/evm/ethereum/Ethereum';
import type { Provider } from './Provider';
import { formatPrice, safeConvertBigIntToNumber } from '../utilities/utilities';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import IUniswapV3FactoryABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json';
import IQuoterV2ABI from '@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json';
import { convertToUniswapToken, sqrtPriceX96ToPrice } from './utilities/uniswap';
import JSBI from 'jsbi';
import { EthersConverter } from './utilities/EthersConverter';


export class UniswapSwapManager extends SwapManager {
  private routerContract: ethers.Contract | null = null;
  private providerEthers: ethers.JsonRpcProvider | null = null;
  private factory: ethers.Contract | null = null;
  private quoter: ethers.Contract | null = null;

  constructor (
    blockchain: Ethereum,
    provider: Provider,
    initialFeeBasisPoints: number = YAKKL_FEE_BASIS_POINTS
  ) {
    super( blockchain, provider, initialFeeBasisPoints );
    this.initialize().then();
  }

  async initialize(): Promise<void> {
    const url = await this.provider.getProviderURL();
    this.providerEthers = new ethers.JsonRpcProvider( url );

    this.factory = new ethers.Contract( ADDRESSES.UNISWAP_FACTORY, IUniswapV3FactoryABI.abi, this.providerEthers );
    this.quoter = new ethers.Contract( ADDRESSES.UNISWAP_V3_QUOTER, IQuoterV2ABI.abi, this.providerEthers );

    this.routerContract = new ethers.Contract(
      ADDRESSES.UNISWAP_V3_ROUTER,
      ISwapRouterABI,
      this.providerEthers
    );
  }

  getName(): string {
    return 'Uniswap V3';
  }

  // Get best price tier for a swap - future implementation


  async checkIfPoolExists( tokenIn: Token, tokenOut: Token, fee: number ): Promise<boolean> {
    if ( !this.factory ) throw new Error( 'Factory contract not initialized' );
    try {
      const poolAddress = await this.factory.getPool( tokenIn.address, tokenOut.address, fee );
      return poolAddress !== ethers.ZeroAddress;
    } catch ( error ) {
      return false;
    }
  }


  // async testGetQuotev5() {
  //   // Step 1: Set up the provider using Alchemy
  //   const alchemyApiKey = 'pBm4VA9q8Laz9x3bmXTNZ9m-ArxczEWk'; // Replace with your Alchemy API key
  //   const provider = new ethersv5.providers.AlchemyProvider( 'mainnet', alchemyApiKey );

  //   // Step 2: Define the QuoterV2 contract address and ABI
  //   const quoterV2Address = ADDRESSES.UNISWAP_V3_QUOTER;  // Replace with the actual QuoterV2 contract address
  //   const quoterV2ABI = [
  //     {
  //       "inputs": [
  //         {
  //           "internalType": "bytes",
  //           "name": "path",
  //           "type": "bytes"
  //         },
  //         {
  //           "internalType": "uint256",
  //           "name": "amountIn",
  //           "type": "uint256"
  //         }
  //       ],
  //       "name": "quoteExactInput",
  //       "outputs": [
  //         {
  //           "internalType": "uint256",
  //           "name": "amountOut",
  //           "type": "uint256"
  //         }
  //       ],
  //       "stateMutability": "view",
  //       "type": "function"
  //     }
  //   ];

  //   // Step 3: Create the contract instance
  //   const quoterContract = new ethersv5.Contract( quoterV2Address, quoterV2ABI, provider );

  //   // Step 4: Encode the path using solidityPack
  //   const tokenInAddress = '0x6982508145454Ce325dDbE47a25d4ec3d2311933'; // PEPE address
  //   const wethAddress = '0xC02aaa39b223FE8D0a0e5C4F27eAD9083c756Cc2';  // WETH address
  //   const tokenOutAddress = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'; // AAVE address
  //   const fee = 3000;  // Example fee tier (0.3%)

  //   const encodedPath = ethersv5.utils.solidityPack(
  //     [ 'address', 'uint24', 'address', 'uint24', 'address' ],
  //     [
  //       tokenInAddress,  // TokenIn address
  //       fee,             // Fee for TokenIn -> WETH pool
  //       wethAddress,     // WETH address
  //       fee,             // Fee for WETH -> TokenOut pool
  //       tokenOutAddress  // TokenOut address
  //     ]
  //   );

  //   // Step 5: Call the contract method
  //   const amountIn = ethersv5.BigNumber.from( '46391417000000000000000000' ); // Example input amount

  //   try {
  //     const quote = await quoterContract.quoteExactInput( encodedPath, amountIn );
  //     console.log( `Quoted output amount: ${ quote.toString() }` );
  //   } catch ( error ) {
  //     console.error( 'Error fetching quote:', error );
  //   }
  // }

  // async testGetQuotev6() {
  //   // Step 1: Set up the provider using Alchemy (for ethers v6)
  //   const alchemyApiKey = 'pBm4VA9q8Laz9x3bmXTNZ9m-ArxczEWk'; // Replace with your Alchemy API key
  //   const provider = new ethers.AlchemyProvider( 'mainnet', alchemyApiKey );

  //   // Step 2: Define the QuoterV2 contract address and ABI
  //   const quoterV2Address = ADDRESSES.UNISWAP_V3_QUOTER;  // Replace with the actual QuoterV2 contract address
  //   const quoterV2ABI = [
  //     {
  //       "inputs": [
  //         {
  //           "internalType": "bytes",
  //           "name": "path",
  //           "type": "bytes"
  //         },
  //         {
  //           "internalType": "uint256",
  //           "name": "amountIn",
  //           "type": "uint256"
  //         }
  //       ],
  //       "name": "quoteExactInput",
  //       "outputs": [
  //         {
  //           "internalType": "uint256",
  //           "name": "amountOut",
  //           "type": "uint256"
  //         }
  //       ],
  //       "stateMutability": "view",
  //       "type": "function"
  //     }
  //   ];

  //   // Step 3: Create the contract instance
  //   const quoterContract = new ethers.Contract( quoterV2Address, quoterV2ABI, provider );

  //   // Step 4: Encode the path using solidityPack
  //   const tokenInAddress = '0x6982508145454Ce325dDbE47a25d4ec3d2311933'; // PEPE address
  //   const wethAddress = ADDRESSES.WETH; //'0xC02aaa39b223FE8D0a0e5C4F27eAD9083c756Cc2';  // WETH address
  //   const tokenOutAddress = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'; // AAVE address
  //   const fee = 3000;  // Example fee tier (0.3%)

  //   const encodedPath = ethers.AbiCoder.defaultAbiCoder().encode(
  //     [ 'address', 'uint24', 'address', 'uint24', 'address' ],
  //     [
  //       tokenInAddress,  // TokenIn address
  //       fee,             // Fee for TokenIn -> WETH pool
  //       wethAddress,     // WETH address
  //       fee,             // Fee for WETH -> TokenOut pool
  //       tokenOutAddress  // TokenOut address
  //     ]
  //   );

  //   // Step 5: Call the contract method
  //   const amountIn = 46391417000000000000000000n; // Example input amount using bigint for ethers v6

  //   try {
  //     const quote = await quoterContract.quoteExactInput( encodedPath, amountIn );
  //     console.log( `Quoted output amount: ${ quote.toString() }` );
  //   } catch ( error ) {
  //     console.error( 'Error fetching quote:', error );
  //   }
  // }

  // Uses ethers v5.7.2 instead of v6.13.1+ due to encoding issues
  async multiHopQuote(
    tokenIn: Token,
    tokenOut: Token,
    amount: BigNumberish,
    fundingAddress: string,
    isExactIn: boolean = true,
    fee: number = 3000
  ): Promise<SwapPriceData> {
    // Step 1: Set up the provider using Alchemy (ethers v5)
    const provider = new ethersv5.providers.AlchemyProvider( 'mainnet', import.meta.env.VITE_ALCHEMY_API_KEY_PROD );

    // Step 2: Define the QuoterV2 contract ABI
    // const quoterV2ABI = [
    //   {
    //     "inputs": [
    //       {
    //         "internalType": "bytes",
    //         "name": "path",
    //         "type": "bytes"
    //       },
    //       {
    //         "internalType": "uint256",
    //         "name": "amountIn",
    //         "type": "uint256"
    //       }
    //     ],
    //     "name": "quoteExactInput",
    //     "outputs": [
    //       {
    //         "internalType": "uint256",
    //         "name": "amountOut",
    //         "type": "uint256"
    //       }
    //     ],
    //     "stateMutability": "view",
    //     "type": "function"
    //   }
    // ];
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

      const gasEstimate = await this.getGasEstimateForSwap( tokenInAddress, tokenOutAddress, amountInOrOut.toBigInt(), fundingAddress, fee );

      if ( quoteAmount.gt( 0 ) ) {
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
      console.log( 'Error fetching multi-hop quote:', error );
      throw new Error( 'Failed to get multi-hop quote' );
    }

    throw new Error( 'No valid route exists for the provided tokens and amount' );
  }

  async getQuote(
    tokenIn: Token,
    tokenOut: Token,
    amount: BigNumberish,
    fundingAddress: string,
    isExactIn: boolean = true,
    fee: number = 3000
  ): Promise<SwapPriceData> {
    // Determine actual tokens for routing
    const actualTokenIn = tokenIn.isNative
      ? await this.getWETHToken()
      : tokenIn;

    const actualTokenOut = tokenOut.isNative
      ? await this.getWETHToken()
      : tokenOut;

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
        priceImpactRatio: 0,
        path: [
          tokenIn.isNative ? ethers.ZeroAddress : tokenIn.address,
          tokenOut.isNative ? ethers.ZeroAddress : tokenOut.address
        ],
        fee,
        feeBasisPoints: this.feeBasisPoints,
        feeAmountPrice: 0,
        feeAmountInUSD: '',
        gasEstimate: 0n,
        gasEstimateInUSD: '',
        tokenOutPriceInUSD: '',
        sqrtPriceX96After: 0n,
        initializedTicksCrossed: 0,
        multiHop: false,
        error: 'Insufficient parameters for quote',
        isLoading: false,
      };
    }

    if ( !this.providerEthers ) throw new Error( 'Provider(s) not set' );

    try {
      const quoterContract = new ethers.Contract(
        ADDRESSES.UNISWAP_V3_QUOTER,
        IQuoterV2ABI.abi,
        this.providerEthers
      );
      if ( !quoterContract ) throw new Error( 'Invalid quoter contract' );

      let quoteAmount: bigint = 0n;
      let sqrtPriceX96After: bigint = 0n;
      let initializedTicksCrossed: number = 0;
      let gasEstimate: bigint = 0n;
      let multiHop = false;

      // Step 1: Try Direct Pool Quote
      const poolExists = await this.checkIfPoolExists( actualTokenIn, actualTokenOut, fee );

      if ( poolExists ) {
        try {
          const params = {
            tokenIn: actualTokenIn.address,
            tokenOut: actualTokenOut.address,
            fee,
            sqrtPriceLimitX96: 0n,
            ...( isExactIn ? { amountIn: amount } : { amount } )
          };

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
              fee,
              gasEstimate,
              multiHop,
              sqrtPriceX96After,
              initializedTicksCrossed,
              isExactIn
            );
          }
        } catch ( error ) {
          console.log( 'Direct pool quote failed, trying multi-hop:', error );
        }
      }

      // Step 2: Multi-Hop Quote Attempt
      try {
        multiHop = true;
        // Uses ethers v5.7.2 instead of v6.13.1+ due to encoding issues
        return this.multiHopQuote( tokenIn, tokenOut, amount, fundingAddress, isExactIn, fee );
      } catch ( error ) {
        console.log( 'Multi-hop quote failed:', error );
        // Log the full error details for debugging
        console.log( 'Multi-hop quote error details:', {
          tokenIn: actualTokenIn.address,
          tokenOut: actualTokenOut.address,
          amount: amount.toString(),
          isExactIn,
          error: error instanceof Error ? error.message : error
        } );
      }

      throw new Error( 'No valid route exists for the provided tokens and amount' );
    } catch ( error ) {
      console.log( 'Error in getQuote:', error, {
        originalTokenIn: tokenIn.address,
        originalTokenOut: tokenOut.address,
        actualTokenIn: actualTokenIn.address,
        actualTokenOut: actualTokenOut.address,
        amount: amount.toString(),
      } );
      throw error;
    }
  }

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
    const feeAmount = this.calculateFee( isExactIn ? quoteAmount : toBigInt( amount ) ); //quoteAmount );
    const amountAfterFee = isExactIn ? quoteAmount - feeAmount : quoteAmount; //quoteAmount - feeAmount;

    const formattedAmountIn = Number( ethers.formatUnits( isExactIn ? toBigInt( amount ) : quoteAmount, tokenIn.decimals ) );
    const formattedAmountOut = Number( ethers.formatUnits( isExactIn ? amountAfterFee : toBigInt( amount ), tokenOut.decimals ) );
    const exchangeRate = formattedAmountOut / formattedAmountIn;

    // Fetch USD prices (these should come back as `number`)
    const priceIn = await this.getMarketPrice( `${ tokenIn.symbol }-USD` );
    const priceOut = await this.getMarketPrice( `${ tokenOut.symbol }-USD` );

    if ( !priceIn || !priceOut ) {
      throw new Error( 'Failed to get price from provider' );
    }

    const feeAmountInTokenOut = isExactIn
      ? Number( ethers.formatUnits( feeAmount, tokenOut.decimals ) )
      : Number( ethers.formatUnits( feeAmount, tokenIn.decimals ) );

    const feeAmountInUSD = feeAmountInTokenOut * ( isExactIn ? priceOut.price : priceIn.price );
    const priceOutBigInt = BigInt( Math.round( priceOut.price * 10 ** tokenOut.decimals ) );

    let gasEstimateInUSD = '';
    let adjustedGasEstimate = 0n;

    if ( gasEstimate > 0n ) {
      adjustedGasEstimate = ( gasEstimate * ( 10000n + BigInt( YAKKL_GAS_ESTIMATE_MULTIPLIER_BASIS_POINTS ) ) ) / 10000n;

      // Convert gas estimate from Gwei to Ether
      const gasEstimateInEther = adjustedGasEstimate * 10n ** 9n;
      const gasEstimateInEtherNumber = Number( gasEstimateInEther ) / 10 ** 18;

      // Calculate gas cost in USD using the price of Ether
      const gasPrice = await this.getMarketPrice( `ETH-USD` );
      const ethPriceInUSD = gasPrice.price;

      // Multiply gas in Ether with Ether's price to get the cost in USD
      const gasCostInUSD = gasEstimateInEtherNumber * ethPriceInUSD;

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
      priceImpactRatio: 0,
      path: [ tokenIn.isNative ? ethers.ZeroAddress : tokenIn.address, tokenOut.isNative ? ethers.ZeroAddress : tokenOut.address ],
      fee,
      feeBasisPoints: this.feeBasisPoints,
      feeAmountPrice: feeAmountInUSD / formattedAmountOut,
      feeAmountInUSD: `$${ feeAmountInUSD.toFixed( 2 ) }`,
      gasEstimate: adjustedGasEstimate,
      gasEstimateInUSD,
      tokenOutPriceInUSD: formatPrice( Number( priceOutBigInt ) / 10 ** tokenOut.decimals ),
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
    if ( !this.providerEthers ) {
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
      const isNativeInput = tokenIn.toLowerCase() === ethers.ZeroAddress.toLowerCase();
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

      // Convert to bigint
      return BigInt( gasEstimate.toString() );
    } catch ( error ) {
      // Fallback to a default gas estimate
      const fallbackGasLimit = BigInt( YAKKL_GAS_ESTIMATE_MULTIHOP_SWAP_DEFAULT ); // Adjust based on typical multi-hop swap gas usage
      return fallbackGasLimit;
    }
  }

  async getPoolInfo( tokenIn: SwapToken, tokenOut: SwapToken, fee: number = 3000 ): Promise<PoolInfoData> {
    // await this.ensureInitialized();

    if ( !this.factory || !this.provider ) throw new Error( 'Contracts not initialized' );

    try {
      const poolAddress = await this.factory.getPool( tokenIn.address, tokenOut.address, fee );
      if ( !poolAddress || poolAddress === ethers.ZeroAddress ) {
        throw new Error( 'Pool does not exist' );
      }

      const tokenA = convertToUniswapToken( tokenIn );
      const tokenB = convertToUniswapToken( tokenOut );

      const poolContract = new ethers.Contract( poolAddress, IUniswapV3PoolABI.abi, this.providerEthers );
      if ( !poolContract ) throw new Error( 'Pool contract not found' );

      const [ slot0, liquidity, token0Address, token1Address, tickSpacing, poolFee, tickBitmap, ticks ] = await Promise.all( [
        poolContract.slot0(),
        poolContract.liquidity(),
        poolContract.token0(),
        poolContract.token1(),
        poolContract.tickSpacing(),
        poolContract.fee(),
        poolContract.tickBitmap( 0 ),
        poolContract.ticks( 0 )
      ] );

      debug_log( '\n\nUniswapPriceProvider - getPoolInfo: >>>>>>>>>>>>>>>>>>>>>>>>>>>> POOL START <<<<<<<<<<<<<<<<<<<<<<<<\n\n' );
      debug_log( 'UniswapPriceProvider - getPoolInfo:', poolContract );

      debug_log( 'Slot0:', slot0 );
      debug_log( 'Liquidity:', liquidity.toString() );
      debug_log( 'Token0 address:', token0Address, tokenA );
      debug_log( 'Token1 address:', token1Address, tokenB );
      debug_log( 'Tick spacing:', tickSpacing.toString() );
      debug_log( 'Pool fee:', poolFee.toString() );

      debug_log( 'Tick bitmap:', tickBitmap );
      debug_log( 'Ticks:', ticks );

      const { sqrtPriceX96, tick } = slot0;

      debug_log( 'sqrtPriceX96:', sqrtPriceX96.toString() );
      debug_log( 'tick:', tick );

      const token0 = new UniswapToken( this.getChainId(), token0Address, tokenIn.decimals, tokenIn.symbol, tokenIn.name );
      const token1 = new UniswapToken( this.getChainId(), token1Address, tokenOut.decimals, tokenOut.symbol, tokenOut.name );

      debug_log( 'Token0:', token0 );
      debug_log( 'Token1:', token1 );

      // Ensure tick is within valid range
      const minTick = BigInt( TickMath.MIN_TICK );
      const maxTick = BigInt( TickMath.MAX_TICK );
      const tickBigInt = BigInt( tick.toString() );
      const validTickBigInt = tickBigInt < minTick ? minTick : ( tickBigInt > maxTick ? maxTick : tickBigInt );

      let validTick: number;
      try {
        validTick = safeConvertBigIntToNumber( validTickBigInt );
      } catch ( error ) {
        console.log( 'Error converting tick to number:', error );
        // Fallback to a default tick value or handle the error as appropriate for your use case
        validTick = 0; // or some other default value
      }

      debug_log( 'Valid tick:', validTick );

      // Calculate reserves
      const Q96 = 2n ** 96n;

      // Calculate price from sqrtPriceX96
      const price = ( Number( sqrtPriceX96 ) / Number( Q96 ) ) ** 2;
      debug_log( 'Price:', price );

      // Ensure sqrtPriceX96 is within valid range
      const minSqrtRatio = JSBI.BigInt( TickMath.MIN_SQRT_RATIO.toString() );
      const maxSqrtRatio = JSBI.BigInt( TickMath.MAX_SQRT_RATIO.toString() );
      const sqrtPriceX96BigInt = JSBI.BigInt( sqrtPriceX96.toString() );
      const clampedSqrtPriceX96 = JSBI.lessThan( sqrtPriceX96BigInt, minSqrtRatio )
        ? minSqrtRatio
        : ( JSBI.greaterThan( sqrtPriceX96BigInt, maxSqrtRatio ) ? maxSqrtRatio : sqrtPriceX96BigInt );

      debug_log( 'Clamped sqrtPriceX96:', clampedSqrtPriceX96.toString() );

      const pool = new Pool(
        token0,
        token1,
        fee,
        clampedSqrtPriceX96.toString(),
        liquidity.toString(),
        validTick
      );

      debug_log( 'Pool created successfully', pool );

      // Calculate amounts from liquidity
      const tickLow = Math.floor( validTick / Number( tickSpacing ) ) * Number( tickSpacing );
      const tickHigh = tickLow + Number( tickSpacing );
      const sqrtPriceLow = TickMath.getSqrtRatioAtTick( tickLow );
      const sqrtPriceHigh = TickMath.getSqrtRatioAtTick( tickHigh );

      debug_log( 'Tick low:', tickLow );
      debug_log( 'Tick high:', tickHigh );
      debug_log( 'Sqrt price low:', sqrtPriceLow.toString() );
      debug_log( 'Sqrt price high:', sqrtPriceHigh.toString() );

      const price2 = sqrtPriceX96ToPrice( BigInt( sqrtPriceLow.toString() ), token0.decimals, token1.decimals );
      debug_log( 'Price at low tick:', price2 );
      const price3 = sqrtPriceX96ToPrice( BigInt( sqrtPriceHigh.toString() ), token0.decimals, token1.decimals );
      debug_log( 'Price at high tick:', price3 );

      const avgPrice = ( price2 + price3 ) / 2;
      debug_log( 'Average price:', avgPrice );

      const sqrtPrice = sqrtPriceX96 / Q96;
      debug_log( 'Sqrt price:', sqrtPrice );

      const liquidityBigInt = BigInt( liquidity.toString() );

      const token0Amt = Number( liquidityBigInt ) / ( Number( sqrtPrice ) * ( 2 ** 96 ) );
      const token1Amt = Number( liquidityBigInt ) * Number( sqrtPrice ) / ( 2 ** 96 );

      debug_log( 'Token0 amount:', token0Amt );
      debug_log( 'Token1 amount:', token1Amt );



      // Calculate reserves
      const token0Reserve = parseFloat(
        ethers.formatUnits( liquidity.toString(), token0.decimals )
      );
      const token1Reserve = parseFloat(
        ethers.formatUnits( liquidity.toString(), token1.decimals )
      );

      debug_log( 'Token0 reserve:', token0Reserve );
      debug_log( 'Token1 reserve:', token1Reserve );

      // Calculate amounts of token0 and token1 in the pool
      const sqrtRatioX96 = JSBI.BigInt( clampedSqrtPriceX96 );
      const liquidity_ = JSBI.BigInt( liquidity.toString() );

      debug_log( 'sqrtRatioX96:', sqrtRatioX96.toString() );
      debug_log( 'liquidity_:', liquidity_.toString() );

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

      debug_log( 'token0Amount:', token0Amount.toString() );
      debug_log( 'token1Amount:', token1Amount.toString() );

      // Get CurrencyAmount for 1 unit of each token
      const amount0 = CurrencyAmount.fromRawAmount(
        token0,
        JSBI.exponentiate( JSBI.BigInt( 10 ), JSBI.BigInt( token0.decimals ) ).toString()
      );
      const amount1 = CurrencyAmount.fromRawAmount(
        token1,
        JSBI.exponentiate( JSBI.BigInt( 10 ), JSBI.BigInt( token1.decimals ) ).toString()
      );

      debug_log( 'amount0:', amount0.toExact() );
      debug_log( 'amount1:', amount1.toExact() );

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

        debug_log( 'token0:', token0 );
        debug_log( 'token1:', token1 );

        debug_log( 'price0Decimal:', price0Decimal );
        debug_log( 'price1Decimal:', price1Decimal );

        token0Price = price0Decimal.toFixed( 6 );
        token1Price = price1Decimal.toFixed( 6 );

        debug_log( 'token0Price:', token0Price );
        debug_log( 'token1Price:', token1Price );

      } catch ( error ) {
        console.log( 'Error calculating prices:', error );
        token0Price = '0';
        token1Price = '0';
      }

      const token0Reserves = ethers.formatUnits( token0Amount.toString(), tokenIn.decimals );
      const token1Reserves = ethers.formatUnits( token1Amount.toString(), tokenOut.decimals );

      debug_log( 'token0Reserves:', token0Reserves );
      debug_log( 'token1Reserves:', token1Reserves );

      // Calculate TVL using the price as a string and parseFloat
      const tvl = ( parseFloat( token0Reserves ) * parseFloat( token0Price ) ) +
        ( parseFloat( token1Reserves ) * parseFloat( token1Price ) );

      debug_log( 'TVL:', tvl );

      debug_log( '\n\nUniswapPriceProvider - getPoolInfo: >>>>>>>>>>>>>>>>>>>>>>>>>>>> POOL END <<<<<<<<<<<<<<<<<<<<<<<<\n\n' );

      return {
        provider: this.getName(),
        lastUpdated: new Date(),
        chainId: this.getChainId(),
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
      console.log( 'Error in getPoolInfo:', error );
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
      return this.getMarketPrice( `${ tokenInSymbol }-USD` );
    }

    return { tokenIn, tokenOut };
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

  async distributeFeeManually(
    tokenOut: Token,
    feeAmount: BigNumberish,
    feeRecipient: string
  ): Promise<TransactionResponse> {
    if ( !this.provider ) {
      throw new Error( 'Provider not initialized' );
    }

    // Ensure the token is an ERC20 token (not native)
    if ( tokenOut.isNative ) {
      throw new Error( 'Fee distribution only works with ERC20 tokens' );
    }

    const tokenContract = new ethers.Contract(
      tokenOut.address,
      [
        'function transfer(address recipient, uint256 amount) public returns (bool)'
      ],
      this.providerEthers
    );

    try {
      const tx = await tokenContract.transfer( feeRecipient, feeAmount );
      return await EthersConverter.ethersTransactionResponseToTransactionResponse( tx.wait() );
    } catch ( error ) {
      console.error( 'Fee distribution failed:', error );
      throw error;
    }
  }

  // Optional: Smart contract fee distribution method
  async distributeFeeThroughSmartContract(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tokenOut: Token,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    feeAmount: BigNumberish,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    feeRecipient: string
  ): Promise<TransactionResponse> {
    // Implement smart contract interaction for fee distribution
    // This would involve calling a specific method on your fee distribution contract
    throw new Error( 'Not implemented' );
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
      console.error( 'Error getting token price. Defaulting to 0:', error );
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
      false, // Not native since it's wrapped
      this.blockchain,
      this.provider
    );
  }

  // async prepareTokensForSwap(
  //   tokenIn: Token,
  //   tokenOut: Token
  // ): Promise<[ Token, Token ]> {
  //   let actualTokenIn = tokenIn;
  //   let actualTokenOut = tokenOut;

  //   // Handle ETH -> WETH conversion
  //   if ( tokenIn.isNative ) {
  //     actualTokenIn = await this.getWETHToken();
  //   }
  //   if ( tokenOut.isNative ) {
  //     actualTokenOut = await this.getWETHToken();
  //   }

  //   return [ actualTokenIn, actualTokenOut ];
  // }

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
      amountIn: EthereumBigNumber.from( amountIn ).toBigInt() ?? 0n,
      amountOutMinimum: EthereumBigNumber.from( amountOutMin ).toBigInt() ?? 0n,
      sqrtPriceLimitX96: 0
    };

    const populatedTx = await this.routerContract!.exactInputSingle.populateTransaction( params );

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
      to: this.routerContract!.target as string,
      data: populatedTx.data,
      value: tokenIn.isNative ? amountIn : 0,
      from: await this.provider.getSigner()?.getAddress() as string,
      chainId: this.getChainId()
    };
  }

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

    const populatedTx = await this.routerContract!.exactInput.populateTransaction( params );

    return {
      to: this.routerContract!.target as string,
      data: populatedTx.data,
      value: tokenIn.isNative ? amountIn : 0,
      from: await this.provider.getSigner()?.getAddress() as string,
      chainId: this.getChainId()
    };
  }

  async executeSwap( params: SwapParams ): Promise<TransactionResponse> {
    const {
      tokenIn,
      tokenOut,
      amount,
      slippage,
      deadline,
      recipient
    } = params;

    const quote = await this.getQuote( tokenIn, tokenOut, amount, recipient );
    const minOut = EthereumBigNumber.from( quote.amountOut )
      .mul( 1000 - Math.floor( slippage * 10 ) )
      .div( 1000 );

    let tx;
    if ( quote.multiHop ) {
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
        Math.floor( Date.now() / 1000 ) + ( deadline * 60 )
      );
    }

    if ( typeof tx === 'bigint' ) {
      throw new Error( 'Received gas estimate instead of transaction request' );
    }

    return await this.provider.sendTransaction( tx );
  }

  private getStandardizedToken( symbol: string ): SwapToken | null {
    let standardizedSymbol = symbol;
    if ( symbol === 'USD' ) standardizedSymbol = 'USDC';
    if ( symbol === 'ETH' ) standardizedSymbol = 'WETH';
    return getToken( standardizedSymbol, this.getChainId() );
  }

}
