/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SwapManager } from './SwapManager';
import type { Token } from '$plugins/Token';
import type { Provider } from '$plugins/Provider';
import { type BigNumberish, type TransactionRequest, type TransactionResponse, type SwapToken, WETH_ADDRESS, type SwapPriceData } from '$lib/common';
import { ABIs, ADDRESSES } from '$plugins/contracts/evm/constants-evm';
import { ethers } from 'ethers';
import type { Ethereum } from './blockchains/evm/ethereum/Ethereum';
import { UniswapSwapPriceProvider } from '$lib/plugins/providers/swapprice/uniswap/UniswapSwapPriceProvider';
import { CoinbasePriceProvider } from './providers/price/coinbase/CoinbasePriceProvider';
import { abi as SwapRouterABI } from '@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json';
import type { ExactInputSingleParams } from '$lib/common/ISwapRouter';

// These are here for reference at the moment. They come from the Uniswap V3 SDK constants.ts file.
/**
 * The default factory enabled fee amounts, denominated in hundredths of bips.
 */
// export enum FeeAmount {
//   LOWEST = 100,
//   LOW_200 = 200,
//   LOW_300 = 300,
//   LOW_400 = 400,
//   LOW = 500,
//   MEDIUM = 3000,
//   HIGH = 10000,
// }

/**
 * The default factory tick spacings by fee amount.
 */
// export const TICK_SPACINGS: { [ amount in FeeAmount ]: number } = {
//   [ FeeAmount.LOWEST ]: 1,
//   [ FeeAmount.LOW_200 ]: 4,
//   [ FeeAmount.LOW_300 ]: 6,
//   [ FeeAmount.LOW_400 ]: 8,
//   [ FeeAmount.LOW ]: 10,
//   [ FeeAmount.MEDIUM ]: 60,
//   [ FeeAmount.HIGH ]: 200,
// };

export class UniswapSwapManager extends SwapManager {
  private router: any;
  private quoter: any;
  private uniswapPriceProvider: UniswapSwapPriceProvider;
  private ethersProvider: ethers.JsonRpcProvider | null;

  constructor ( blockchain: Ethereum, provider: Provider, initialFeeBasisPoints: number = 875 ) {
    super( blockchain, provider, initialFeeBasisPoints );
    this.uniswapPriceProvider = new UniswapSwapPriceProvider( provider, new CoinbasePriceProvider(), initialFeeBasisPoints );
    this.ethersProvider = null;
    this.initializeProvider();
  }

  private async initializeProvider(): Promise<void> {
    try {
      // this.router = this.blockchain.createContract( ADDRESSES.UNISWAP_V3_ROUTER, SwapRouterABI );
      const url = await this.provider.getProviderURL();
      this.ethersProvider = new ethers.JsonRpcProvider( url );
      this.router = new ethers.Contract( ADDRESSES.UNISWAP_V3_ROUTER, SwapRouterABI, this.ethersProvider );
      this.quoter = this.blockchain.createContract( ADDRESSES.UNISWAP_V3_QUOTER, ABIs.UNISWAP_V3_QUOTER );
    } catch ( error ) {
      console.error( 'Failed to initialize provider:', error );
      throw new Error( 'Provider initialization failed' );
    }
  }

  getName(): string {
    return 'Uniswap V3';
  }

  async getQuote( tokenIn: Token, tokenOut: Token, amountIn: BigNumberish, fee: number = 3000 ): Promise<SwapPriceData> {
    try {
      if ( !tokenIn || !tokenOut || !amountIn ) {
        throw new Error( 'Invalid token or amount' );
      }
      const swapTokenIn: SwapToken = {
        address: tokenIn.address,
        symbol: tokenIn.symbol,
        decimals: tokenIn.decimals,
        chainId: tokenIn.chainId,
        name: tokenIn.name,
      };

      const swapTokenOut: SwapToken = {
        address: tokenOut.address,
        symbol: tokenOut.symbol,
        decimals: tokenOut.decimals,
        chainId: tokenOut.chainId,
        name: tokenOut.name,
      };

      const swapPriceData = await this.uniswapPriceProvider.getSwapPriceOut( swapTokenIn, swapTokenOut, amountIn, 3000 );
      if ( !swapPriceData || !swapPriceData.amountOut ) {
        throw new Error( 'Failed to get price data' );
      }
      
      const amountOutBigInt = BigInt( swapPriceData.amountOut.toString() );
      const feeAmount = this.calculateFee( amountOutBigInt );
      const amountOutWithFee = amountOutBigInt - feeAmount;

      return {
        provider: this.uniswapPriceProvider.getName(),
        lastUpdated: new Date(),
        chainId: this.provider.getChainId(),
        tokenIn: swapTokenIn,
        tokenOut: swapTokenOut,
        amountIn: BigInt( amountIn.toString() ),
        amountOut: amountOutWithFee,//swapPriceData.amountOut,
        price: swapPriceData.price,
        priceImpact: swapPriceData.priceImpact,
        path: [ tokenIn.address, tokenOut.address ],
        fee,
        feeBasisPoints: feeAmount,
      };
    } catch ( error ) {
      console.log( 'UniswapSwapManager - getQuote - error', error );
      throw error;
    }
  }

  async populateSwapTransaction(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    recipient: string,
    deadline: number,
    fee: number = 3000,
    estimateOnly: boolean = false // New parameter, defaulting to false
  ): Promise<TransactionRequest | bigint> {
    try {
      const params: ExactInputSingleParams = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        fee: fee,
        recipient: recipient,
        deadline: deadline,
        amountIn: BigInt( amountIn?.toString() || 0n ), // ensure it's a BigInt
        amountOutMinimum: BigInt( amountOutMin?.toString() || 0n ), // ensure it's a BigInt
        sqrtPriceLimitX96: 0,
      };

      const data = this.router.interface.encodeFunctionData( 'exactInputSingle', [ params ] );

      if ( estimateOnly ) {
        // Perform a gas estimate using eth_estimateGas
        const gasEstimate = await this.provider.estimateGas( {
          from: await this.provider.getSigner().getAddress(), // Ensure valid address
          to: this.router.address,
          data: data,
          value: tokenIn.address === WETH_ADDRESS ? amountIn : 0,
          chainId: this.provider.getChainId(), // Get chainId from provider
        } );

        return gasEstimate; // Return the gas estimate as BigInt
      } else {
        // Populate the transaction normally
        const populatedTransaction: TransactionRequest = {
          to: this.router.address,
          data: data,
          value: tokenIn.address === WETH_ADDRESS ? amountIn : 0,
          from: await this.provider.getSigner().getAddress(), // Get the address of the signer
          chainId: this.provider.getChainId(), // Get chainId from provider
        };

        return populatedTransaction; // Return the full transaction request object
      }
    } catch ( error ) {
      console.error( 'Error in populateSwapTransaction:', error );
      throw error;
    }
  }

  getRouterAddress(): string {
    return ADDRESSES.UNISWAP_V3_ROUTER;
  }

  async executeSwap(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: BigNumberish,
    minAmountOut: BigNumberish,
    recipient: string,
    deadline: number,
    fee: number = 3000,
  ): Promise<TransactionResponse> {
    try {
      const params = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        fee: fee,
        recipient,
        deadline,
        amountIn,
        amountOutMinimum: minAmountOut,
        sqrtPriceLimitX96: 0,
      };

      const signer = this.provider.getSigner();
      const routerWithSigner = this.router.connect( signer );

      const tx = await routerWithSigner.exactInputSingle( params, {
        value: tokenIn.address === WETH_ADDRESS ? amountIn : 0,
      } );

      return tx;
    } catch ( error ) {
      console.log( 'UniswapSwapManager - executeSwap - error', error );
      throw new Error( `Error executing swap - ${ error }` );
    }
  }

  async addLiquidity(
    tokenA: Token,
    tokenB: Token,
    amountA: BigNumberish,
    amountB: BigNumberish,
    minAmountA: BigNumberish,
    minAmountB: BigNumberish,
    recipient: string,
    deadline: number,
  ): Promise<TransactionResponse> {
    // TODO: Implement Uniswap V3 add liquidity logic
    // Parameters are defined for future implementation
    throw new Error( 'Method not implemented.' );
  }

  async removeLiquidity(
    tokenA: Token,
    tokenB: Token,
    liquidity: BigNumberish,
    minAmountA: BigNumberish,
    minAmountB: BigNumberish,
    recipient: string,
    deadline: number,
  ): Promise<TransactionResponse> {
    // TODO: Implement Uniswap V3 remove liquidity logic
    // Parameters are defined for future implementation
    throw new Error( 'Method not implemented.' );
  }
}

