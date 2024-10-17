/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// EthereumGasProvider.ts

import { BigNumber, type BigNumberish } from '$lib/common/bignumber';
import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
import { ETH_BASE_UNISWAP_GAS_UNITS } from '$lib/common/constants';
import type {
  GasProvider,
  GasEstimate,
  HistoricalGasData,
  GasPrediction,
  FeeEstimate
} from '$lib/common/gas-types';
import type { SwapToken, TransactionRequest } from '$lib/common/interfaces';
import type { Blockchain, Wallet } from '$lib/plugins';
import { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
import { Token } from '$lib/plugins/Token';
import type { UniswapSwapManager } from '$lib/plugins/UniswapSwapManager';
import type { Provider } from '$plugins/Provider';

export class EthereumGasProvider implements GasProvider {
  private provider: Provider;
  private blockchain: Ethereum;

  constructor ( provider: Provider, blockchain: Blockchain ) {
    this.provider = provider;
    this.blockchain = blockchain as Ethereum;
  }

  getName(): string {
    return "EthereumGasProvider";
  }

  async getGasEstimate( transaction: TransactionRequest ): Promise<GasEstimate> {
    try {
      const gasLimit = await this.provider.estimateGas( transaction );
      const feeData = await this.provider.getFeeData();

      const feeEstimate: FeeEstimate = {
        baseFee: feeData.lastBaseFeePerGas.toString(),
        priorityFee: feeData.maxPriorityFeePerGas.toString(),
        totalFee: BigNumber.from( feeData.lastBaseFeePerGas ).add( feeData.maxPriorityFeePerGas ).toString()
      };

      return {
        gasLimit: gasLimit.toString(),
        feeEstimate: feeEstimate
      };
    } catch ( error ) {
      console.error( 'Error estimating gas:', error );
      throw error;
    }
  }

  async getHistoricalGasData( duration: number ): Promise<HistoricalGasData[]> {
    try {
      // Implement the logic to fetch historical gas data from an external API or indexer
      // For example, you can use a service like Etherscan or Infura to retrieve historical gas data
      // You'll need to make an HTTP request to the API endpoint and parse the response
      // The response should contain the historical gas data for the specified duration
      // Map the response data to the HistoricalGasData interface and return it

      // Example using a mock API response
      const response = await fetch( 'https://api.example.com/historical-gas-data' );
      const data = await response.json();

      return data.map( ( item: any ) => ( {
        timestamp: item.timestamp,
        baseFee: item.baseFeePerGas,
        priorityFee: item.priorityFeePerGas
      } ) );
    } catch ( error ) {
      console.error( 'Error fetching historical gas data:', error );
      throw error;
    }
  }

  async predictFutureFees( duration: number ): Promise<GasPrediction[]> {
    try {
      // Implement the logic to predict future gas fees using a predictive model
      // You can use historical gas data and machine learning techniques to build a predictive model
      // The model should take into account factors like network congestion, transaction volume, etc.
      // Train the model using historical data and use it to predict future gas fees for the specified duration
      // Map the predicted data to the GasPrediction interface and return it

      // Example using a mock prediction model
      const historicalData = await this.getHistoricalGasData( duration );
      const predictions = historicalData.map( ( item ) => ( {
        timestamp: item.timestamp + duration,
        estimatedBaseFee: item.baseFee,
        estimatedPriorityFee: item.priorityFee
      } ) );

      return predictions;
    } catch ( error ) {
      console.error( 'Error predicting future gas fees:', error );
      throw error;
    }
  }

  async estimateSwapGasFee(
    fromToken: SwapToken,
    toToken: SwapToken,
    fromAmount: BigNumberish,
    slippageTolerance: number,
    deadline: number,
    swapManager: UniswapSwapManager,
    fee: number = 3000,
    dummyFromAddress: string = '0x0000000000000000000000000000000000000000' // Dummy from address for ETH swaps estimates
  ): Promise<string> {
    try {
      if ( !fromToken || !toToken || !fromAmount || !slippageTolerance || !deadline || !swapManager ) {
        return 'Invalid parameters'; // Return an error message if any required parameters are missing
      }

      const fromAmountBN = EthereumBigNumber.fromEther( fromAmount.toString() );
      const slippageBN = fromAmountBN.mul( EthereumBigNumber.from( Math.floor( slippageTolerance * 100 ) ) ).div( EthereumBigNumber.from( 10000 ) );
      const minAmountOut: EthereumBigNumber = EthereumBigNumber.from( fromAmountBN.sub( slippageBN ) );
      const deadlineTimestamp = Math.floor( Date.now() / 1000 ) + deadline * 60;

      // const swapTx: TransactionRequest | bigint;

      // if ( fromToken.symbol === 'ETH' ) {
      // Handle ETH swap
      // swapTx = await swapManager.populateSwapTransactionWithETH(
      //   Token.fromSwapToken( toToken, this.blockchain, this.provider ),
      //   minAmountOut.toWei().toBigInt() ?? BigInt( 0 ),
      //   dummyFromAddress,
      //   deadlineTimestamp,
      //   3000,
      //   true // Set estimateOnly to true
      // );
      // } else {
      // Handle token swap
      const swapTx = await swapManager.populateSwapTransaction(
        Token.fromSwapToken( fromToken, this.blockchain, this.provider ),
        Token.fromSwapToken( toToken, this.blockchain, this.provider ),
        fromAmountBN.toWei().toBigInt() ?? BigInt( 0 ),
        minAmountOut.toWei().toBigInt() ?? BigInt( 0 ),
        dummyFromAddress,
        deadlineTimestamp,
        fee,
        true // Set estimateOnly to true
      );
      // }

      if ( typeof swapTx === 'bigint' ) {
        // If the returned value is a gas estimate, handle it here
        return `${ swapTx.toString() } gas units`;
      }

      let estimatedGas;
      try {
        estimatedGas = await this.provider.estimateGas( swapTx );
      } catch ( estimateError: any ) {
        console.log( 'Gas estimation failed:', estimateError );
        if ( estimateError.code === 'UNPREDICTABLE_GAS_LIMIT' ) {
          const revertReason = estimateError.error?.data?.message;
          if ( revertReason === 'STF' ) {
            console.log( 'Swap failed due to insufficient token balance or allowance' );
          } else {
            console.log( 'Swap failed due to:', revertReason );
          }
        }
        estimatedGas = EthereumBigNumber.from( ETH_BASE_UNISWAP_GAS_UNITS ).mul( 120 ).div( 100 );
        console.log( 'Using default gas estimate:', estimatedGas.toString() );
      }

      const feeData = await this.provider.getFeeData();
      const gasPriceGwei = EthereumBigNumber.from( feeData.maxFeePerGas || feeData.gasPrice || 0 );
      const gasFeeGwei = EthereumBigNumber.from( estimatedGas ).mul( gasPriceGwei );
      const gasFeeEth = EthereumBigNumber.fromGwei( gasFeeGwei.toString() ).toEtherString();

      const ethPrice = await this.getEthPrice();
      const gasFeeUsd = parseFloat( gasFeeEth ) * ethPrice;

      return `$${ gasFeeUsd.toFixed( 2 ) } (${ gasFeeEth } ETH)`;
    } catch ( error ) {
      console.log( 'Error estimating swap gas fee:', error );
      return `Unable to estimate: ${ error }`;
    }
  }

  // async estimateSwapGasFee(
  //   fromToken: SwapToken,
  //   toToken: SwapToken,
  //   fromAmount: BigNumberish,
  //   slippageTolerance: number,
  //   deadline: number, 
  //   swapManager: UniswapV3SwapManager,
  //   dummyFromAddress: string = '0x0000000000000000000000000000000000000000' // Dummy from address for ETH swaps estimates
  // ): Promise<string> {
  //   try {
  //     if ( !fromToken || !toToken || !fromAmount || !slippageTolerance || !deadline || !swapManager ) {
  //       return 'Invalid parameters'; // Return an error message if any required parameters are missing
  //     }
  //     const fromAmountBN = EthereumBigNumber.fromEther( fromAmount.toString() );
  //     const slippageBN = fromAmountBN.mul( EthereumBigNumber.from( Math.floor( slippageTolerance * 100 ) ) ).div( EthereumBigNumber.from( 10000 ) );
  //     const minAmountOut: EthereumBigNumber = EthereumBigNumber.from( fromAmountBN.sub( slippageBN ) );
  //     const deadlineTimestamp = Math.floor( Date.now() / 1000 ) + deadline * 60;

  //     let swapTx: TransactionRequest;

  //     if ( fromToken.symbol === 'ETH' ) {
  //       // Handle ETH swap
  //       swapTx = await swapManager.populateSwapTransactionWithETH(
  //         Token.fromSwapToken( toToken, this.blockchain, this.provider ),
  //         minAmountOut.toWei().toBigInt() ?? BigInt( 0 ),
  //         //await wallet.getSigner()!.getAddress(),  // Would have to add wallet as a parameter again
  //         dummyFromAddress,
  //         deadlineTimestamp,
  //         3000
  //       );
  //       swapTx.value = fromAmountBN.toWei().toBigInt() ?? BigInt( 0 );
  //     } else {
  //       // Handle token swap
  //       swapTx = await swapManager.populateSwapTransaction(
  //         Token.fromSwapToken( fromToken, this.blockchain, this.provider ),
  //         Token.fromSwapToken( toToken, this.blockchain, this.provider ),
  //         fromAmountBN.toWei().toBigInt() ?? BigInt( 0 ),
  //         minAmountOut.toWei().toBigInt() ?? BigInt( 0 ),
  //         // await wallet.getSigner()!.getAddress(),
  //         dummyFromAddress,
  //         deadlineTimestamp,
  //         3000
  //       );
  //     }

  //     // const swapTx = await swapManager.populateSwapTransaction(
  //     //   Token.fromSwapToken( fromToken, this.blockchain, this.provider ),
  //     //   Token.fromSwapToken( toToken, this.blockchain, this.provider ),
  //     //   fromAmountBN.toWei().toBigInt() ?? BigInt( 0 ),
  //     //   minAmountOut.toWei().toBigInt() ?? BigInt( 0 ),
  //     //   await wallet.getSigner()!.getAddress(),
  //     //   deadlineTimestamp,
  //     //   3000
  //     // );

  //     let estimatedGas;
  //     try {
  //       estimatedGas = await this.provider.estimateGas( swapTx );
  //     } catch ( estimateError: any ) {
  //       console.log( 'Gas estimation failed:', estimateError );
  //       if ( estimateError.code === 'UNPREDICTABLE_GAS_LIMIT' ) {
  //         // Handle specific error cases based on the revert reason
  //         const revertReason = estimateError.error?.data?.message;
  //         if ( revertReason === 'STF' ) {
  //           // Handle insufficient token balance or allowance
  //           console.log( 'Swap failed due to insufficient token balance or allowance' );
  //         } else {
  //           // Handle other revert reasons
  //           console.log( 'Swap failed due to:', revertReason );
  //         }
  //       }
  //       estimatedGas = EthereumBigNumber.from( ETH_BASE_UNISWAP_GAS_UNITS ).mul( 120 ).div( 100 );
  //       console.log( 'Using default gas estimate:', estimatedGas.toString() );
  //     }

  //     const feeData = await this.provider.getFeeData();
  //     const gasPriceGwei = EthereumBigNumber.from( feeData.maxFeePerGas || feeData.gasPrice || 0 );
  //     const gasFeeGwei = EthereumBigNumber.from( estimatedGas ).mul( gasPriceGwei );
  //     const gasFeeEth = EthereumBigNumber.fromGwei( gasFeeGwei.toString() ).toEtherString();

  //     const ethPrice = await this.getEthPrice();
  //     const gasFeeUsd = parseFloat( gasFeeEth ) * ethPrice;

  //     return `$${ gasFeeUsd.toFixed( 2 ) } (${ gasFeeEth } ETH)`;
  //   } catch ( error ) {
  //     console.log( 'Error estimating swap gas fee:', error );
  //     return `Unable to estimate: ${ error }`;
  //   }
  // }

  async getEthPrice(): Promise<number> {
    // throw new Error( 'Method not implemented.' );
    return 2500; // Return a mock ETH price for testing
  }

}
