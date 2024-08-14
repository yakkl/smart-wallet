/* eslint-disable @typescript-eslint/no-explicit-any */
// SushiSwapService.ts
import { SwapManager, type Token, type SwapQuote } from '../../SwapManager';
import type { Blockchain } from '../../Blockchain';
import type { Provider } from '../../Provider';
import type { TransactionReceipt, TransactionResponse } from 'lib/common/interfaces';
import type { Log } from 'lib/common/evm';
import type { ethers } from 'ethers-v5';

const SUSHISWAP_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
];

export class SushiSwapService extends SwapManager {
  private readonly sushiSwapRouter: any; // Replace 'any' with appropriate contract type

  constructor(
    blockchain: Blockchain,
    provider: Provider,
    initialFeeBasisPoints: number = 875
  ) {
    super(blockchain, provider, initialFeeBasisPoints);
    this.sushiSwapRouter = new blockchain.Contract(
      '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', // SushiSwap router address
      SUSHISWAP_ROUTER_ABI
    );
  }

  public async getSwapQuote(
    tokenIn: Token,
    tokenOut: Token,
    amount: string,
    slippageToleranceBps: number = 50
  ): Promise<SwapQuote> {
    const amountIn = BigInt(amount);
    const path = [tokenIn.address, tokenOut.address];
  
    const amounts = await this.sushiSwapRouter.getAmountsOut(amountIn, path);
    const amountOut = amounts[1];
  
    const quote = amountOut;
    const feeAmount = (amountOut * BigInt(this.feeBasisPoints)) / 10000n;
    const quoteWithFee = amountOut - feeAmount;
  
    const minAmountOut = (quoteWithFee * (10000n - BigInt(slippageToleranceBps))) / 10000n;
  
    const priceImpact = Number((feeAmount * 10000n) / amountOut) / 100;
  
    return {
      quote: quote.toString(),
      quoteWithFee: quoteWithFee.toString(),
      minAmountOut: minAmountOut.toString(),
      fee: feeAmount.toString(),
      priceImpact: priceImpact.toFixed(2),
      route: path.join(' -> '),
      slippageToleranceBps: slippageToleranceBps.toString(),
    };
  }

  public async executeSwap(
    tokenIn: Token,
    tokenOut: Token,
    amount: string,
    slippageToleranceBps: number = 50
  ): Promise<TransactionResponse> {
    const quote = await this.getSwapQuote(tokenIn, tokenOut, amount, slippageToleranceBps);
    const amountIn = BigInt(amount);
    const amountOutMin = BigInt(quote.minAmountOut);
  
    const path = [tokenIn.address, tokenOut.address];
    const to = await this.provider.getSigner().getAddress();
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
  
    // Approve the router to spend tokens
    if (!tokenIn.isNative) {
      const tokenContract = await this.blockchain.getContract(
        tokenIn.address,
        ['function approve(address spender, uint256 amount) public returns (bool)']
      );
      const approveTx = await tokenContract.approve(this.sushiSwapRouter.address, amountIn);
      await approveTx.wait();
    }
  
    // Execute the swap
    const tx = await this.sushiSwapRouter.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline,
      { value: tokenIn.isNative ? amountIn : 0 }
    );
  
    return this.convertToTransactionResponse(tx);
  }

  private convertToTransactionResponse(tx: ethers.providers.TransactionResponse): TransactionResponse {
    return {
      hash: tx.hash,
      to: tx.to ?? '',
      from: tx.from,
      nonce: tx.nonce,
      gasLimit: tx.gasLimit.toBigInt(),
      gasPrice: tx.gasPrice?.toBigInt(),
      data: tx.data,
      value: tx.value.toBigInt(),
      chainId: tx.chainId,
      blockNumber: tx.blockNumber ?? undefined,
      blockHash: tx.blockHash ?? undefined,
      timestamp: tx.timestamp,
      confirmations: tx.confirmations,
      raw: tx.raw,
      type: tx.type ?? undefined,
      accessList: tx.accessList,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toBigInt(),
      maxFeePerGas: tx.maxFeePerGas?.toBigInt(),
      wait: async (confirmations?: number) => {
        const receipt = await tx.wait(confirmations);
        return this.convertToTransactionReceipt(receipt);
      }
    };
  }
  
  private convertToTransactionReceipt(receipt: ethers.providers.TransactionReceipt): TransactionReceipt {
    return {
      to: receipt.to ?? '',
      from: receipt.from,
      contractAddress: receipt.contractAddress ?? undefined,
      transactionIndex: receipt.transactionIndex,
      root: receipt.root ?? undefined,
      gasUsed: receipt.gasUsed.toBigInt(),
      logsBloom: receipt.logsBloom,
      blockHash: receipt.blockHash,
      transactionHash: receipt.transactionHash,
      logs: receipt.logs.map(this.convertToLog),
      blockNumber: receipt.blockNumber,
      confirmations: receipt.confirmations,
      cumulativeGasUsed: receipt.cumulativeGasUsed.toBigInt(),
      effectiveGasPrice: receipt.effectiveGasPrice?.toBigInt(),
      byzantium: receipt.byzantium,
      type: receipt.type,
      status: receipt.status
    };
  }
  
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
    // TODO: Implement addLiquidity functionality for SushiSwap
    console.log('slippageToleranceBps', slippageToleranceBps); // To remove error of not being used at this time.
    throw new Error('addLiquidity method is not implemented for SushiSwap');
  }
}
