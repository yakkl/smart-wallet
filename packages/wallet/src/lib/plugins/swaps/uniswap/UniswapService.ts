/* eslint-disable @typescript-eslint/no-explicit-any */
// UniswapService.ts
import { SwapManager, type Token, type SwapQuote } from '../../SwapManager';
import { AlphaRouter, SwapType, type SwapOptions } from '@uniswap/smart-order-router';
import { Token as UniswapToken, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core';
import type { Blockchain } from '../../Blockchain';
import type { Provider } from '../../Provider';
import type { TransactionResponse } from 'lib/common/interfaces';
import { ethers } from 'ethers-v5';
import type { Log } from 'lib/common/evm';

export class UniswapService extends SwapManager {
  private readonly router: AlphaRouter;

  constructor(
    blockchain: Blockchain,
    provider: Provider,
    initialFeeBasisPoints: number = 875
  ) {
    super(blockchain, provider, initialFeeBasisPoints);
    this.router = new AlphaRouter({ chainId: blockchain.chainId, provider: provider as any });
  }

  private convertToUniswapToken(token: Token): UniswapToken {
    return new UniswapToken(
      this.blockchain.chainId,
      token.address,
      token.decimals,
      token.symbol,
      token.name
    );
  }

  public async getSwapQuote(
    tokenIn: Token,
    tokenOut: Token,
    amount: string,
    slippageToleranceBps: number = 50
  ): Promise<SwapQuote> {
    const uniswapTokenIn = this.convertToUniswapToken(tokenIn);
    const uniswapTokenOut = this.convertToUniswapToken(tokenOut);
    const amountIn = CurrencyAmount.fromRawAmount(uniswapTokenIn, amount);

    const swapOptions: SwapOptions = {
      type: SwapType.SWAP_ROUTER_02,
      recipient: await this.provider.getSigner().getAddress(),
      slippageTolerance: new Percent(slippageToleranceBps, 10000),
      deadline: Math.floor(Date.now() / 1000 + 1800)
    };

    const route = await this.router.route(
      amountIn,
      uniswapTokenOut,
      TradeType.EXACT_INPUT,
      swapOptions
    );

    if (!route) throw new Error('No route found');

    const quote = BigInt(route.quote.toString());
    const feeAmount = (quote * BigInt(this.feeBasisPoints)) / 10000n;
    const quoteWithFee = quote - feeAmount;

    const minAmountOut = (quoteWithFee * (10000n - BigInt(slippageToleranceBps))) / 10000n;

    const priceImpact = Number((feeAmount * 10000n) / quote) / 100;

    return {
      quote: quote.toString(),
      quoteWithFee: quoteWithFee.toString(),
      minAmountOut: minAmountOut.toString(),
      fee: feeAmount.toString(),
      priceImpact: priceImpact.toFixed(2),
      route: route.route.map(r => r.toString()).join(' -> '),
      slippageToleranceBps: slippageToleranceBps.toString(),
    };
  }

  public async executeSwap(
    tokenIn: Token,
    tokenOut: Token,
    amount: string,
    slippageToleranceBps: number = 50
  ): Promise<TransactionResponse> {
    const uniswapTokenIn = this.convertToUniswapToken(tokenIn);
    const uniswapTokenOut = this.convertToUniswapToken(tokenOut);
    const amountIn = CurrencyAmount.fromRawAmount(uniswapTokenIn, amount);
  
    const swapOptions: SwapOptions = {
      type: SwapType.SWAP_ROUTER_02,
      recipient: await this.provider.getSigner().getAddress(),
      slippageTolerance: new Percent(slippageToleranceBps, 10000),
      deadline: Math.floor(Date.now() / 1000 + 1800)
    };
  
    const route = await this.router.route(
      amountIn,
      uniswapTokenOut,
      TradeType.EXACT_INPUT,
      swapOptions
    );
  
    if (!route) throw new Error('No route found');
  
    const { methodParameters } = route;
    if (!methodParameters) throw new Error('No method parameters found');
  
    const tx = await this.provider.getSigner().sendTransaction({
      data: methodParameters.calldata,
      to: methodParameters.to,
      value: ethers.BigNumber.from(methodParameters.value),
      from: await this.provider.getSigner().getAddress(),
      chainId: this.blockchain.chainId,
    });
  
    return tx; //this.convertToTransactionResponse(tx);
  }

  // private convertToTransactionResponse(tx: ethers.providers.TransactionResponse): TransactionResponse {
  //   return {
  //     hash: tx.hash,
  //     to: tx.to ?? '',
  //     from: tx.from,
  //     nonce: tx.nonce,
  //     gasLimit: tx.gasLimit.toBigInt(),
  //     gasPrice: tx.gasPrice?.toBigInt(),
  //     data: tx.data,
  //     value: tx.value.toBigInt(),
  //     chainId: tx.chainId,
  //     blockNumber: tx.blockNumber ?? undefined,
  //     blockHash: tx.blockHash ?? undefined,
  //     timestamp: tx.timestamp,
  //     confirmations: tx.confirmations,
  //     raw: tx.raw,
  //     type: tx.type ?? undefined,
  //     accessList: tx.accessList,
  //     maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toBigInt(),
  //     maxFeePerGas: tx.maxFeePerGas?.toBigInt(),
  //     wait: async (confirmations?: number) => {
  //       const receipt = await tx.wait(confirmations);
  //       return this.convertToTransactionReceipt(receipt);
  //     }
  //   };
  // }
  
  // private convertToTransactionReceipt(receipt: ethers.providers.TransactionReceipt): TransactionReceipt {
  //   return {
  //     to: receipt.to ?? '',
  //     from: receipt.from,
  //     contractAddress: receipt.contractAddress ?? undefined,
  //     transactionIndex: receipt.transactionIndex,
  //     root: receipt.root ?? undefined,
  //     gasUsed: receipt.gasUsed.toBigInt(),
  //     logsBloom: receipt.logsBloom,
  //     blockHash: receipt.blockHash,
  //     transactionHash: receipt.transactionHash,
  //     logs: receipt.logs.map(this.convertToLog),
  //     blockNumber: receipt.blockNumber,
  //     confirmations: receipt.confirmations,
  //     cumulativeGasUsed: receipt.cumulativeGasUsed.toBigInt(),
  //     effectiveGasPrice: receipt.effectiveGasPrice?.toBigInt(),
  //     byzantium: receipt.byzantium,
  //     type: receipt.type,
  //     status: receipt.status
  //   };
  // }
  
  private convertToLog(log: ethers.providers.Log): Log {
    return {
      blockNumber: log.blockNumber,
      blockHash: log.blockHash,
      transactionIndex: log.transactionIndex,
      removed: log.removed,
      address: log.address,
      data: log.data,
      topics: [...log.topics],
      transactionHash: log.transactionHash,
      logIndex: log.logIndex
    };
  }
  
  public async addLiquidity(
    tokenA: Token,
    tokenB: Token,
    amountA: string,
    amountB: string,
    slippageToleranceBps: number = 50
  ): Promise<TransactionResponse> {
    // TODO: Implement addLiquidity functionality for Uniswap
    console.log('slippageToleranceBps', slippageToleranceBps); // To remove error of not being used at this time.
    throw new Error('addLiquidity method is not implemented for Uniswap');
  }
}
