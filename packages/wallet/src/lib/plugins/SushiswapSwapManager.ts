import type { AbstractBlockchain } from '$plugins/Blockchain';
import type { Provider } from '$plugins/Provider';
import { SwapManager } from './SwapManager';
import type { BaseTransaction, SwapPriceData, TransactionResponse } from '$lib/common/interfaces';
import { BigNumber, type BigNumberish } from '$lib/common/bignumber';
import type { AbstractContract } from '$plugins/Contract';
import type { Token } from '$plugins/Token';

const SUSHISWAP_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)'
]; // Add the necessary ABI here

export class SushiSwapManager<T extends BaseTransaction> extends SwapManager {
  private router: AbstractContract;

  constructor ( blockchain: AbstractBlockchain<T>, provider: Provider, routerAddress: string = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', initialFeeBasisPoints: number = 875 ) {
    super(blockchain, provider, initialFeeBasisPoints);
    this.router = blockchain.createContract(routerAddress, SUSHISWAP_ROUTER_ABI);
  }

  getName(): string {
    return 'SushiSwap';
  }

  async getQuote( tokenIn: Token, tokenOut: Token, amountIn: BigNumberish ): Promise<SwapPriceData> {
    if( !tokenIn || !tokenOut || !amountIn ) {
      throw new Error( 'Invalid token or amount' );
    }
    
    const path = [ tokenIn.address, tokenOut.address ];
    const amounts = await this.router.call( 'getAmountsOut', amountIn, path );
    const amountOut = amounts[ 1 ];

    const amountInBigInt = BigInt( amountIn.toString() );
    const amountOutBigInt = BigInt( amountOut.toString() );

    // Apply the fee
    const feeAmount = this.calculateFee( amountOutBigInt );
    const amountOutWithFee = amountOutBigInt - feeAmount;

    // Calculate price impact (simplified)
    const impactNumerator = ( amountInBigInt - amountOutWithFee ) * BigInt( 10000 );
    const priceImpact = Number( impactNumerator / amountInBigInt ) / 100;

    // Calculate price
    const price = Number( amountOutBigInt ) / Number( amountInBigInt );

    return {
      provider: 'SushiSwap',
      lastUpdated: new Date(),
      chainId: this.blockchain.getChainId(),
      tokenIn: {
        address: tokenIn.address,
        symbol: tokenIn.symbol,
        decimals: tokenIn.decimals,
        chainId: tokenIn.chainId,
        name: tokenIn.name,
      },
      tokenOut: {
        address: tokenOut.address,
        symbol: tokenOut.symbol,
        decimals: tokenOut.decimals,
        chainId: tokenOut.chainId,
        name: tokenOut.name,
      },
      amountIn: amountInBigInt,
      amountOut: amountOutBigInt,
      price,
      priceImpact,
      path,
      fee: feeAmount
    };
  }

  async executeSwap(tokenIn: Token, tokenOut: Token, amountIn: BigNumber, minAmountOut: BigNumber, to: string, deadline: number): Promise<TransactionResponse> {
    const path = [tokenIn.address, tokenOut.address];
    return this.router.sendTransaction('swapExactTokensForTokens', amountIn, minAmountOut, path, to, deadline);
  }

  async addLiquidity(tokenA: Token, tokenB: Token, amountA: BigNumber, amountB: BigNumber, minAmountA: BigNumber, minAmountB: BigNumber, to: string, deadline: number): Promise<TransactionResponse> {
    return this.router.sendTransaction('addLiquidity', tokenA.address, tokenB.address, amountA, amountB, minAmountA, minAmountB, to, deadline);
  }

  async removeLiquidity(tokenA: Token, tokenB: Token, liquidity: BigNumber, minAmountA: BigNumber, minAmountB: BigNumber, to: string, deadline: number): Promise<TransactionResponse> {
    return this.router.sendTransaction('removeLiquidity', tokenA.address, tokenB.address, liquidity, minAmountA, minAmountB, to, deadline);
  }
}
