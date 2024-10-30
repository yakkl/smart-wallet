/* eslint-disable @typescript-eslint/no-explicit-any */
// UniswapSwapManager.ts
import { abi as ISwapRouterABI } from '@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json';
import { SwapManager } from './SwapManager';
import type { Token } from './Token';
import type { BigNumberish, TransactionResponse, PoolInfoData, TransactionRequest, SwapParams, SwapPriceData } from '$lib/common';
import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
import { ADDRESSES } from './contracts/evm/constants-evm';
import type { ExactInputSingleParams } from '$lib/common/ISwapRouter';
import { ABIs } from './contracts/evm/constants-evm';
import { EVMToken } from './tokens/evm/EVMToken';
import { ethers } from 'ethers';
import type { Ethereum } from './blockchains/evm/ethereum/Ethereum';
import type { Provider } from './Provider';
import { formatEther } from '../utilities/utilities';
import { UniswapSwapPriceProvider } from './providers/swapprice/uniswap/UniswapSwapPriceProvider';
import { CoinbasePriceProvider } from './providers/price/coinbase/CoinbasePriceProvider';


export class UniswapSwapManager extends SwapManager {
  protected priceProvider: UniswapSwapPriceProvider;
  private routerContract: ethers.Contract;

  constructor (
    blockchain: Ethereum,
    provider: Provider,
    initialFeeBasisPoints: number = 875
  ) {
    super( blockchain, provider, initialFeeBasisPoints );

    this.priceProvider = new UniswapSwapPriceProvider( provider, new CoinbasePriceProvider() ); // May want to change to a more abstract provider like coingecko later

    this.routerContract = new ethers.Contract(
      ADDRESSES.UNISWAP_V3_ROUTER,
      ISwapRouterABI,
      this.provider as any
    );
  }

  getName(): string {
    return 'Uniswap V3';
  }

  async getQuote(
    tokenIn: Token,
    tokenOut: Token,
    amount: BigNumberish,
    isExactIn: boolean = true,
    fee: number = 3000
  ): Promise<SwapPriceData> {
    if ( !tokenIn?.address || !tokenOut?.address || !amount ) {
      throw new Error( 'Invalid token addresses or amount' );
    }

    console.log( 'Hello from UniswapSwapManager' );

    console.log( 'Getting quote:', {tokenIn, tokenOut, amount, isExactIn, fee} );

    try {
      const poolAddress = await this.factory.call(
        'getPool',
        tokenIn.address,
        tokenOut.address,
        fee
      );

      if ( poolAddress === ethers.ZeroAddress ) {
        throw new Error( 'Pool does not exist' );
      }

      const amountBigInt = EthereumBigNumber.from( amount ).toBigInt();
      if ( !amountBigInt ) throw new Error( 'Invalid amount' );

      // Create ethers contract instance for the quoter
      const quoterContract = new ethers.Contract(
        ADDRESSES.UNISWAP_V3_QUOTER,
        [
          'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
          'function quoteExactOutputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountOut, uint160 sqrtPriceLimitX96) external returns (uint256 amountIn)'
        ],
        this.provider as any
      );

      let quoteAmount: bigint;
      if ( isExactIn ) {
        quoteAmount = await quoterContract.quoteExactInputSingle.staticCall(
          tokenIn.address,
          tokenOut.address,
          fee,
          amountBigInt,
          0
        );
      } else {
        quoteAmount = await quoterContract.quoteExactOutputSingle.staticCall(
          tokenIn.address,
          tokenOut.address,
          fee,
          amountBigInt,
          0
        );
      }

      console.log( 'Quote amount:', quoteAmount.toString(), {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        fee,
        amount: amountBigInt.toString()
      } );

      const feeAmount = this.calculateFee( quoteAmount );
      const amountAfterFee = quoteAmount - feeAmount;

      const price = Number( amountAfterFee ) / Number( amountBigInt ); // TODO: Check if this is correct
      const priceImpact = ( ( Number( quoteAmount ) - Number( amountAfterFee ) ) / Number( quoteAmount ) ) * 100;

      const fAmount = formatEther( feeAmount );
      const qAmount = formatEther( quoteAmount );
      const aAFee = formatEther( amountAfterFee );
      const aBInt = formatEther( amountBigInt );

      console.log( 'Quote:>>>>====<<<< (feeAmount, quoteAmount, amountAfterFee, amountBigInt, price, priceImpact)',
        {
          fAmount,
          qAmount,
          aAFee,
          aBInt,
          price,
          priceImpact
        } )

      console.log( 'Quote: Going to call getPoolInfo' );

      const priceProvider = new UniswapSwapPriceProvider( this.provider, new CoinbasePriceProvider() ); // Calling it here but may need to be called earlier in the stack.

      const poolInfo = await this.getPoolInfo( tokenIn, tokenOut, fee );

      console.log( 'Quote: (UniswapSwapManager) getPoolInfo:', poolInfo );

      console.log( 'Quote: Going to call UniswapSwapPriceProvider - provider', this.provider );
      
      console.log( 'Quote: (UniswapSwapPriceProvider) priceProvider:', priceProvider );

      const priceProviderData = await priceProvider.getPoolInfo( tokenIn, tokenOut );

      console.log( 'Quote: (UniswapSwapPriceProvider) priceProviderData:', { priceProviderData } );

      return {
        provider: this.getName(),
        lastUpdated: new Date(),
        chainId: this.blockchain.getChainId(),
        tokenIn,
        tokenOut,
        amountIn: isExactIn ? amount : amountAfterFee,
        amountOut: isExactIn ? amountAfterFee : amount,
        exchangeRate: price, // TODO: Check if this is correct
        price,
        priceImpact,
        path: [ tokenIn.address, tokenOut.address ],
        fee,
        feeBasisPoints: feeAmount
      };
    } catch ( error ) {
      console.error( 'Error in getQuote:', error, {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amount: amount.toString()
      } );
      throw error;
    }
  }

  private async calculatePriceImpact(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: BigNumberish,
    amountOut: BigNumberish,
    fee: number
  ): Promise<number> {
    const poolInfo = await this.getPoolInfo( tokenIn, tokenOut, fee );
    const spotPrice = Number( poolInfo.sqrtPriceX96 ) / 2 ** 96;

    const amountInDecimal = Number( amountIn ) / 10 ** tokenIn.decimals;
    const amountOutDecimal = Number( amountOut ) / 10 ** tokenOut.decimals;
    const executionPrice = amountOutDecimal / amountInDecimal;

    return Math.abs( ( executionPrice - spotPrice ) / spotPrice * 100 );
  }

  async getPoolInfo(
    tokenA: Token,
    tokenB: Token,
    fee: number = 3000
  ): Promise<PoolInfoData> {
    const poolAddress = await this.factory.call(
      'getPool',
      tokenA.address,
      tokenB.address,
      fee
    );

    if ( poolAddress === '0x0000000000000000000000000000000000000000' ) {
      throw new Error( 'Pool does not exist' );
    }

    const pool = this.blockchain.createContract( poolAddress, ABIs.UNISWAP_V3_POOL );

    const [ slot0, liquidity ] = await Promise.all( [
      pool.call( 'slot0' ),
      pool.call( 'liquidity' )
    ] );

    return {
      fee,
      liquidity: liquidity.toString(),
      sqrtPriceX96: slot0.sqrtPriceX96.toString(),
      tick: slot0.tick,
      tokenInReserve: await this.getTokenReserve( tokenA, poolAddress ),
      tokenOutReserve: await this.getTokenReserve( tokenB, poolAddress ),
      tokenInUSDPrice: (await this.getTokenUSDPrice( tokenA )).toString(),
      tokenOutUSDPrice: (await this.getTokenUSDPrice( tokenB )).toString(),
      tvl: await this.calculateTVL( tokenA, tokenB, poolAddress ),
      lastUpdated: new Date(),
      provider: this.getName()
    };
  }

  // UniswapSwapManager.ts (continuation)
  private async getTokenReserve( token: Token, poolAddress: string ): Promise<string> {
    const balance = await token.getBalance( poolAddress );
    return balance ? balance.toString() : '0';
  }

  private async getTokenUSDPrice( token: Token ): Promise<number> {
    try {
      const price = await this.priceProvider.getMarketPrice( token.symbol + '-USD' );
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
    return this.routerContract.target as string;
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
      amountIn: EthereumBigNumber.from( amountIn ).toBigInt() ?? 0n,
      amountOutMinimum: EthereumBigNumber.from( amountOutMin ).toBigInt() ?? 0n,
      sqrtPriceLimitX96: 0
    };

    // const router = this.blockchain.createContract(
    //   ADDRESSES.UNISWAP_V3_ROUTER,
    //   ABIs.UNISWAP_V3_ROUTER
    // );

    // const data = await router.populateTransaction( 'exactInputSingle', [ params ] );
    // const signer = this.provider.getSigner();
    // if ( !signer ) throw new Error( 'No signer available' );
    // const from = await signer.getAddress();

    const populatedTx = await this.routerContract.exactInputSingle.populateTransaction( params );

    if ( estimateOnly ) {
      const signer = this.provider.getSigner();
      if ( !signer ) throw new Error( 'No signer available' );

      const gasEstimate = await this.provider.estimateGas( {
        from: await signer.getAddress(),
        to: this.routerContract.target as string,
        data: populatedTx.data,
        value: tokenIn.isNative ? amountIn : 0,
        chainId: this.provider.getChainId()
      } );

      return gasEstimate;
    }

    return {
      to: this.routerContract.target as string,
      data: populatedTx.data,
      value: tokenIn.isNative ? amountIn : 0,
      from: await this.provider.getSigner()?.getAddress() as string,
      chainId: this.provider.getChainId()
    };
  }

  private async getWETHToken(): Promise<Token> {
    const chainId = this.blockchain.getChainId();
    const wethAddress = chainId === 1 ? ADDRESSES.WETH : ADDRESSES.WETH_SEPOLIA;

    return new EVMToken(
      wethAddress,
      'Wrapped Ether',
      'WETH',
      18,
      '/images/weth.png',
      'Wrapped version of Ether',
      chainId,
      false, // Not native since it's wrapped
      this.blockchain,
      this.provider
    );
  }

  async prepareTokensForSwap(
    tokenIn: Token,
    tokenOut: Token
  ): Promise<[ Token, Token ]> {
    let actualTokenIn = tokenIn;
    let actualTokenOut = tokenOut;

    // Handle ETH -> WETH conversion
    if ( tokenIn.isNative ) {
      actualTokenIn = await this.getWETHToken();
    }
    if ( tokenOut.isNative ) {
      actualTokenOut = await this.getWETHToken();
    }

    return [ actualTokenIn, actualTokenOut ];
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

    const quote = await this.getQuote( tokenIn, tokenOut, amount );
    const minOut = EthereumBigNumber.from( quote.amountOut )
      .mul( 1000 - Math.floor( slippage * 10 ) )
      .div( 1000 );

    const tx = await this.populateSwapTransaction(
      tokenIn,
      tokenOut,
      amount,
      minOut,
      recipient,
      Math.floor( Date.now() / 1000 ) + ( deadline * 60 )
    );

    if ( typeof tx === 'bigint' ) {
      throw new Error( 'Received gas estimate instead of transaction request' );
    }

    return await this.provider.sendTransaction( tx );
  }
}
