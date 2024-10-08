/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SwapManager, type SwapQuote } from './SwapManager';
import type { Token } from '$plugins/Token';
import type { Provider } from '$plugins/Provider';
import type { BigNumberish, TransactionRequest, TransactionResponse } from '$lib/common';
import { ABIs, ADDRESSES } from '$plugins/contracts/evm/constants-evm';
import { FeeAmount } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import type { Ethereum } from './blockchains/evm/ethereum/Ethereum';

export class UniswapV3SwapManager extends SwapManager {
  private router: any;
  private quoter: any;

  constructor(blockchain: Ethereum, provider: Provider) {
    super(blockchain, provider);
    this.router = this.blockchain.createContract(ADDRESSES.UNISWAP_V3_ROUTER, ABIs.UNISWAP_V3_ROUTER);
    this.quoter = this.blockchain.createContract(ADDRESSES.UNISWAP_V3_QUOTER, ABIs.UNISWAP_V3_QUOTER);
  }

  async getQuote(tokenIn: Token, tokenOut: Token, amountIn: BigNumberish): Promise<SwapQuote> {
    const fee = FeeAmount.MEDIUM; // Assume 0.3% fee, adjust as needed
    const quotedAmountOut = await this.quoter.call('quoteExactInputSingle', [
      tokenIn.address,
      tokenOut.address,
      fee,
      amountIn,
      0
    ]);

    // Calculate price impact (simplified)
    const priceImpact = 0; // Implement price impact calculation

    return {
      amountIn,
      amountOut: quotedAmountOut,
      path: [tokenIn.address, tokenOut.address],
      priceImpact
    };
  }

  async populateSwapTransaction(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    recipient: string,
    deadline: number
  ): Promise<TransactionRequest> {
    const fee = 3000; // 0.3% fee tier
    const amountInWei = ethers.parseUnits(amountIn ? amountIn.toString() : '0', tokenIn.decimals);
    const amountOutMinWei = ethers.parseUnits(amountOutMin ? amountOutMin.toString() : '0', tokenOut.decimals);

    const params = {
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
      fee: fee,
      recipient: recipient,
      deadline: deadline,
      amountIn: amountInWei,
      amountOutMinimum: amountOutMinWei,
      sqrtPriceLimitX96: 0
    };

    const populatedTx = await this.router.populateTransaction('exactInputSingle', [params]);
    return populatedTx as TransactionRequest;
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
    deadline: number
  ): Promise<TransactionResponse> {
    const params = {
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
      fee: FeeAmount.MEDIUM, // Assume 0.3% fee, adjust as needed
      recipient,
      deadline,
      amountIn,
      amountOutMinimum: minAmountOut,
      sqrtPriceLimitX96: 0
    };

    const tx = await this.router.populateTransaction('exactInputSingle', [params]);
    return await this.blockchain.sendTransaction(tx);
  }

  async addLiquidity(
    tokenA: Token,
    tokenB: Token,
    amountA: BigNumberish,
    amountB: BigNumberish,
    minAmountA: BigNumberish,
    minAmountB: BigNumberish,
    recipient: string,
    deadline: number
  ): Promise<TransactionResponse> {
    // TODO: Implement Uniswap V3 add liquidity logic
    // Parameters are defined for future implementation
    throw new Error('Method not implemented.');
  }

  async removeLiquidity(
    tokenA: Token,
    tokenB: Token,
    liquidity: BigNumberish,
    minAmountA: BigNumberish,
    minAmountB: BigNumberish,
    recipient: string,
    deadline: number
  ): Promise<TransactionResponse> {
    // TODO: Implement Uniswap V3 remove liquidity logic
    // Parameters are defined for future implementation
    throw new Error('Method not implemented.');
  }
}
