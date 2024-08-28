import type { AbstractBlockchain } from '$plugins/Blockchain';
import type { Provider } from '$plugins/Provider';

import { SwapManager, type SwapQuote } from './SwapManager';
import type { BaseTransaction, TransactionResponse } from '$lib/common/interfaces';
import { BigNumber, type BigNumberish } from '$lib/common/bignumber';
import type { AbstractContract } from '$plugins/Contract';
import type { Token } from '$plugins/Token';

const SUSHISWAP_ROUTER_ABI = ['function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)'
]; // Add the necessary ABI here

export class SushiSwapManager<T extends BaseTransaction> extends SwapManager {
  private router: AbstractContract;

  constructor(blockchain: AbstractBlockchain<T>, provider: Provider, routerAddress: string) {
    super(blockchain, provider);
    this.router = blockchain.createContract(routerAddress, SUSHISWAP_ROUTER_ABI);
  }

  async getQuote(tokenIn: Token, tokenOut: Token, amountIn: BigNumberish): Promise<SwapQuote> {
    const path = [tokenIn.address, tokenOut.address];
    const amounts = await this.router.call('getAmountsOut', amountIn, path);
    const amountOut = amounts[1];
    
    const amountInBigInt = amountIn === null ? 0n : BigInt(amountIn.toString());
    const amountOutBigInt = BigInt(amountOut.toString());
  
    // Calculate price impact (simplified)
    const impactNumerator = (amountInBigInt - amountOutBigInt) * BigInt(10000);
    const priceImpact = Number(impactNumerator / amountInBigInt) / 100;
  
    return {
      amountIn,
      amountOut,
      path,
      priceImpact
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
