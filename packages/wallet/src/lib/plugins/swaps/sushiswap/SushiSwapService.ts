/* eslint-disable @typescript-eslint/no-unused-vars */
// SushiSwapService.ts
import { SwapManager, type SwapQuote } from '../../SwapManager';
import type { Token } from '$plugins/Token';
import type { Blockchain } from '../../Blockchain';
import type { Provider } from '../../Provider';
import type { TransactionResponse } from '$lib/common/interfaces';
import type { BigNumberish } from '$lib/common/bignumber';
import type { AbstractContract } from '$plugins/Contract';

const SUSHISWAP_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
];

export class SushiSwapService extends SwapManager {
  private sushiSwapRouter: AbstractContract;
  private feeBasisPoints: number;
  protected blockchain: Blockchain;

  constructor(
    blockchain: Blockchain,
    provider: Provider,
    initialFeeBasisPoints: number = 875
  ) {
    super(blockchain, provider);
    this.feeBasisPoints = initialFeeBasisPoints;
    this.blockchain = blockchain;
    this.sushiSwapRouter = this.blockchain.createContract(
      '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', // SushiSwap router address
      SUSHISWAP_ROUTER_ABI
    );
  }

  public async getQuote(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: BigNumberish
  ): Promise<SwapQuote> {
    const path = [tokenIn.address, tokenOut.address];
  
    const amounts = await this.sushiSwapRouter.call('getAmountsOut', amountIn!.toString(), path);  
    const amountOut = BigInt(amounts[1].toString());
  
    const feeAmount = (amountOut * BigInt(this.feeBasisPoints)) / 10000n;
    const amountOutWithFee = amountOut - feeAmount;
  
    const priceImpact = amountOut === 0n ? 0 : Number((feeAmount * 10000n) / amountOut) / 100;
  
    return {
      amountIn,
      amountOut: amountOutWithFee.toString(),
      path,
      priceImpact,
    };
  }

  public async executeSwap(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: BigNumberish,
    minAmountOut: BigNumberish,
    recipient: string,
    deadline: number
  ): Promise<TransactionResponse> {
    const path = [tokenIn.address, tokenOut.address];
  
    // May want to do more checking here
    const amtIn = amountIn!.toString();
    const minAmtOut = minAmountOut!.toString();

    // Approve the router to spend tokens
    if (!tokenIn.isNative) {
      const tokenContract = this.blockchain.createContract(
        tokenIn.address,
        ['function approve(address spender, uint256 amount) public returns (bool)']
      );
      const approveTx = await tokenContract.call('approve', this.sushiSwapRouter.address, amtIn);
      await approveTx.wait();
    }
  
    // Execute the swap
    const tx = await this.sushiSwapRouter.call('swapExactTokensForTokens',
      amtIn,
      minAmtOut,
      path,
      recipient,
      deadline,
      { value: tokenIn.isNative ? amtIn : '0' }
    );
  
    return tx;
  }

  public async addLiquidity(
    tokenA: Token,
    tokenB: Token,
    amountA: BigNumberish,
    amountB: BigNumberish,
    minAmountA: BigNumberish,
    minAmountB: BigNumberish,
    recipient: string,
    deadline: number
  ): Promise<TransactionResponse> {
    // TODO: Implement addLiquidity functionality for SushiSwap
    throw new Error('addLiquidity method is not implemented for SushiSwap');
  }

  public async removeLiquidity(
    tokenA: Token,
    tokenB: Token,
    liquidity: BigNumberish,
    minAmountA: BigNumberish,
    minAmountB: BigNumberish,
    recipient: string,
    deadline: number
  ): Promise<TransactionResponse> {
    // TODO: Implement removeLiquidity functionality for SushiSwap
    throw new Error('removeLiquidity method is not implemented for SushiSwap');
  }
}












// // SushiSwapService.ts
// import { SwapManager, type Token, type SwapQuote } from '../../SwapManager';
// import type { Blockchain } from '../../Blockchain';
// import type { Provider } from '../../Provider';
// import type { BaseTransaction, TransactionReceipt, TransactionResponse } from '$lib/common/interfaces';
// import { BigNumber } from '$lib/common/bignumber';
// import type { Log } from '$lib/common/evm';
// // import type { ethers } from 'ethers-v5';
import { blockContextMenu } from '../../../utilities/utilities';

// const SUSHISWAP_ROUTER_ABI = [
//   'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
//   'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
// ];

// export class SushiSwapService extends SwapManager<T extends BaseTransaction> extends SwapManager<T> {
//   // private readonly sushiSwapRouter: any; // Replace 'any' with appropriate contract type
//   private feeBasisPoints: number;

//   constructor(
//     blockchain: Blockchain<T>,
//     provider: Provider,
//     initialFeeBasisPoints: number = 875
//   ) {
//     super(blockchain, provider); //, initialFeeBasisPoints);
//     this.feeBasisPoints = initialFeeBasisPoints;
//     // this.sushiSwapRouter = blockchain.createContract(
//     //   '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', // SushiSwap router address
//     //   SUSHISWAP_ROUTER_ABI
//     // );
//     // this.sushiSwapRouter = new blockchain.Contract(
//     //   '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', // SushiSwap router address
//     //   SUSHISWAP_ROUTER_ABI,
//     //   provider.getSigner()
//     // );
//   }

//   public async getSwapQuote(
//     tokenIn: Token,
//     tokenOut: Token,
//     amount: string,
//     slippageToleranceBps: number = 50
//   ): Promise<SwapQuote> {
//     const amountIn = BigInt(amount);
//     const path = [tokenIn.address, tokenOut.address];
  
//     const amounts = await this.sushiSwapRouter.getAmountsOut(amountIn, path);
//     const amountOut = amounts[1];
  
//     const quote = amountOut;
//     const feeAmount = (amountOut * BigInt(this.feeBasisPoints)) / 10000n;
//     const quoteWithFee = amountOut - feeAmount;
  
//     const minAmountOut = (quoteWithFee * (10000n - BigInt(slippageToleranceBps))) / 10000n;
  
//     const priceImpact = Number((feeAmount * 10000n) / amountOut) / 100;
  
//     return {
//       quote: quote.toString(),
//       quoteWithFee: quoteWithFee.toString(),
//       minAmountOut: minAmountOut.toString(),
//       fee: feeAmount.toString(),
//       priceImpact: priceImpact.toFixed(2),
//       route: path.join(' -> '),
//       slippageToleranceBps: slippageToleranceBps.toString(),
//     };
//   }

//   public async executeSwap(
//     tokenIn: Token,
//     tokenOut: Token,
//     amount: string,
//     slippageToleranceBps: number = 50
//   ): Promise<TransactionResponse> {
//     const quote = await this.getSwapQuote(tokenIn, tokenOut, amount, slippageToleranceBps);
//     const amountIn = BigInt(amount);
//     const amountOutMin = BigInt(quote.minAmountOut);
  
//     const path = [tokenIn.address, tokenOut.address];
//     const to = await this.provider.getSigner().getAddress();
//     const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
  
//     // Approve the router to spend tokens
//     if (!tokenIn.isNative) {
//       const tokenContract = this.blockchain.createContract(
//         tokenIn.address,
//         ['function approve(address spender, uint256 amount) public returns (bool)']
//       );
//       const approveTx = await tokenContract.call('approve', this.sushiSwapRouter.address, amountIn);
//       await approveTx.wait();
//     }
  
//     // Execute the swap
//     const tx = await this.sushiSwapRouter.swapExactTokensForTokens(
//       amountIn,
//       amountOutMin,
//       path,
//       to,
//       deadline,
//       { value: tokenIn.isNative ? amountIn : 0 }
//     );
  
//     return this.convertToTransactionResponse(tx);
//   }

//   private convertToTransactionResponse(tx: ethers.providers.TransactionResponse): TransactionResponse {
//     return {
//       hash: tx.hash,
//       to: tx.to ?? '',
//       from: tx.from,
//       nonce: tx.nonce,
//       gasLimit: tx.gasLimit.toBigInt(),
//       gasPrice: tx.gasPrice?.toBigInt(),
//       data: tx.data,
//       value: tx.value.toBigInt(),
//       chainId: tx.chainId,
//       blockNumber: tx.blockNumber ?? undefined,
//       blockHash: tx.blockHash ?? undefined,
//       timestamp: tx.timestamp,
//       confirmations: tx.confirmations,
//       raw: tx.raw,
//       type: tx.type ?? undefined,
//       accessList: tx.accessList,
//       maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toBigInt(),
//       maxFeePerGas: tx.maxFeePerGas?.toBigInt(),
//       wait: async (confirmations?: number) => {
//         const receipt = await tx.wait(confirmations);
//         return this.convertToTransactionReceipt(receipt);
//       }
//     };
//   }
  
//   private convertToTransactionReceipt(receipt: ethers.providers.TransactionReceipt): TransactionReceipt {
//     return {
//       to: receipt.to ?? '',
//       from: receipt.from,
//       contractAddress: receipt.contractAddress ?? undefined,
//       transactionIndex: receipt.transactionIndex,
//       root: receipt.root ?? undefined,
//       gasUsed: receipt.gasUsed.toBigInt(),
//       logsBloom: receipt.logsBloom,
//       blockHash: receipt.blockHash,
//       transactionHash: receipt.transactionHash,
//       logs: receipt.logs.map(this.convertToLog),
//       blockNumber: receipt.blockNumber,
//       confirmations: receipt.confirmations,
//       cumulativeGasUsed: receipt.cumulativeGasUsed.toBigInt(),
//       effectiveGasPrice: receipt.effectiveGasPrice?.toBigInt(),
//       byzantium: receipt.byzantium,
//       type: receipt.type,
//       status: receipt.status
//     };
//   }
  
//   private convertToLog(log: ethers.providers.Log): Log {
//     return {
//       blockNumber: log.blockNumber,
//       blockHash: log.blockHash,
//       transactionIndex: log.transactionIndex,
//       removed: log.removed,
//       address: log.address,
//       data: log.data,
//       topics: [...log.topics],
//       transactionHash: log.transactionHash,
//       logIndex: log.logIndex
//     };
//   }
  
//   public async addLiquidity(
//     tokenA: Token,
//     tokenB: Token,
//     amountA: string,
//     amountB: string,
//     slippageToleranceBps: number = 50
//   ): Promise<TransactionResponse> {
//     // TODO: Implement addLiquidity functionality for SushiSwap
//     console.log('slippageToleranceBps', slippageToleranceBps); // To remove error of not being used at this time.
//     throw new Error('addLiquidity method is not implemented for SushiSwap');
//   }
// }

