/* eslint-disable @typescript-eslint/no-explicit-any */
// UniswapService.ts
import { SwapManager, type Token, type SwapQuote } from '../../SwapManager';
import { AlphaRouter, SwapType, type SwapOptions } from '@uniswap/smart-order-router';
import { Token as UniswapToken, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core';
import type { Blockchain } from '../../Blockchain';
import type { Provider } from '../../Provider';
import type { TransactionResponse } from '$lib/common/interfaces';
import { ethers } from 'ethers-v5';
import type { Log } from '$lib/common/evm';

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





















// /* eslint-disable @typescript-eslint/no-explicit-any */
// // UniswapService.ts
// // UniswapService.ts
// import { SwapManager } from '../../SwapManager';
// import { Token, CurrencyAmount, Percent, TradeType, type Currency } from '@uniswap/sdk-core';
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// import { AlphaRouter, SwapType, type SwapOptions, type SwapRoute } from '@uniswap/smart-order-router';
// import { ethers } from 'ethers';

// export class UniswapService extends SwapManager {
//   private router: AlphaRouter;
//   private swapContract: ethers.Contract;

//   constructor(
//     provider: ethers.Provider,
//     signer: ethers.Signer,
//     private swapContractAddress: string,
//     private chainId: number,
//     initialFeePercentage: number = 0.00875
//   ) {
//     super(provider, signer, initialFeePercentage);
//     this.router = new AlphaRouter({ chainId, provider: provider as any });
//     this.swapContract = new ethers.Contract(
//       swapContractAddress,
//       ['function swap(address[] calldata path, uint256 amountIn, uint256 amountOutMinimum, address recipient, uint256 deadline) external payable returns (uint256 amountOut)'],
//       signer
//     );
//   }

//   async getSwapQuote(
//     tokenIn: Token,
//     tokenOut: Token,
//     amount: string,
//     slippageTolerance: number = 0.5
//   ): Promise<{
//     quote: CurrencyAmount<Currency>;
//     quoteWithFee: CurrencyAmount<Currency>;
//     fee: CurrencyAmount<Currency>;
//     priceImpact: Percent;
//     route: string;
//   }> {
//     const amountIn = CurrencyAmount.fromRawAmount(tokenIn, amount);
//     const slippagePercent = new Percent(Math.floor(slippageTolerance * 100), 10000);

//     const swapOptions: SwapOptions = {
//       type: SwapType.SWAP_ROUTER_02,
//       recipient: await this.signer.getAddress(),
//       slippageTolerance: slippagePercent,
//       deadline: Math.floor(Date.now() / 1000 + 1800)
//     };

//     const route = await this.router.route(
//       amountIn,
//       tokenOut,
//       TradeType.EXACT_INPUT,
//       swapOptions
//     );

//     if (!route) throw new Error('No route found');

//     const feeAmount = route.quote.multiply(this.feePercentage);
//     const amountOutWithFee = route.quote.subtract(feeAmount);

//     return {
//       quote: route.quote,
//       quoteWithFee: amountOutWithFee,
//       fee: feeAmount,
//       priceImpact: route.trade.priceImpact,
//       route: route.toString(),
//     };
//   }

//   async executeSwap(
//     tokenIn: Token,
//     tokenOut: Token,
//     amount: string,
//     slippageTolerance: number = 0.5
//   ): Promise<ethers.TransactionResponse> {
//     const quote = await this.getSwapQuote(tokenIn, tokenOut, amount, slippageTolerance);
    
//     const path = [tokenIn.address, tokenOut.address];
//     const amountOutMinimum = quote.quoteWithFee.quotient.toString();

//     return this.swapContract.swap(
//       path,
//       amount,
//       amountOutMinimum,
//       await this.signer.getAddress(),
//       Math.floor(Date.now() / 1000 + 1800),
//       { value: tokenIn.isNative ? amount : '0' }
//     );
//   }

//   async addLiquidity(
//     tokenA: Token,
//     tokenB: Token,
//     amountA: string,
//     amountB: string,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     slippageTolerance: number = 0.5
//   ): Promise<ethers.TransactionResponse> {
//     // Implementation for adding liquidity
//     // This is a placeholder and needs to be implemented based on your specific requirements
//     throw new Error('Method not implemented.');
//   }
// }


// // Example usage uniswap alone:
// // services/swapService.ts
// // import { ethers } from 'ethers';
// // import { UniswapService } from './UniswapService';
// // Import other DEX services as needed

// // Choose either Alchemy or Infura
// // const ALCHEMY_API_KEY = 'YOUR_ALCHEMY_API_KEY';
// // const INFURA_PROJECT_ID = 'YOUR_INFURA_PROJECT_ID';

// // Use Alchemy
// // const provider = new ethers.AlchemyProvider('mainnet', ALCHEMY_API_KEY);

// // Or use Infura
// // const provider = new ethers.InfuraProvider('mainnet', INFURA_PROJECT_ID);

// // You'll need to implement a way to get the signer, possibly through a wallet connection
// // const signer = provider.getSigner();

// // export const uniswapService = new UniswapService(
// //   provider,
// //   signer,
// //   'YOUR_DEPLOYED_CONTRACT_ADDRESS',
// //   1, // chainId (1 for Ethereum mainnet)
// //   0.00875 // Initial fee percentage
// // );

// // Initialize other DEX services as needed
// // export const sushiswapService = new SushiSwapService(...);


// // From sveltekit:
// // <script lang="ts">
// //   import { uniswapService } from '../services/swapService';
// //   import type { Token } from '@uniswap/sdk-core';

// //   let tokenIn: Token;
// //   let tokenOut: Token;
// //   let amount: string;

// //   async function handleSwap() {
// //     try {
// //       const tx = await uniswapService.executeSwap(tokenIn, tokenOut, amount);
// //       await tx.wait();
// //       console.log('Swap successful!');
// //     } catch (error) {
// //       console.error('Swap failed:', error);
// //     }
// //   }
// // </script>

// // <button on:click={handleSwap}>Swap</button>
