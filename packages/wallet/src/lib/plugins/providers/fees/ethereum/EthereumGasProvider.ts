/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// EthereumGasProvider.ts

import { BigNumber, type BigNumberish } from '$lib/common/bignumber';
import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
// import { ETH_BASE_UNISWAP_GAS_UNITS } from '$lib/common/constants';
import type {
  GasProvider,
  GasEstimate,
  HistoricalGasData,
  GasPrediction,
  FeeEstimate
} from '$lib/common/gas-types';
import type { PriceProvider, SwapToken, TransactionRequest } from '$lib/common/interfaces';
import type { Blockchain, Wallet } from '$lib/plugins';
import { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
import type { UniswapSwapManager } from '$lib/plugins/UniswapSwapManager';
import type { Provider } from '$plugins/Provider';
import { ethers as ethersv6 } from 'ethers-v6';

const DEFAULT_GAS_ESTIMATES = {
  ERC20_APPROVE: 46000n,
  SWAP_EXACT_IN: 180000n,
  SWAP_EXACT_OUT: 250000n
};

export class EthereumGasProvider implements GasProvider {
  private provider: Provider;
  private blockchain: Ethereum;
  private priceProvider: PriceProvider;

  constructor ( provider: Provider, blockchain: Blockchain, priceProvider: PriceProvider ) {
    this.provider = provider;
    this.blockchain = blockchain as Ethereum;
    this.priceProvider = priceProvider;
  }

  getName(): string {
    return "EthereumGasProvider";
  }

  async getGasEstimate( transaction: TransactionRequest ): Promise<GasEstimate> {
    let gasLimit: bigint = 0n;
    let feeEstimate: FeeEstimate | null = null;
    let feeData: any;
    try {
      gasLimit = await this.provider.estimateGas( transaction );
      feeData = await this.provider.getFeeData();

      feeEstimate = {
        baseFee: feeData.lastBaseFeePerGas.toString(),
        priorityFee: feeData.maxPriorityFeePerGas.toString(),
        totalFee: BigNumber.from( feeData.lastBaseFeePerGas ).add( feeData.maxPriorityFeePerGas ).toString()
      };

      return {
        gasLimit: gasLimit.toString(),
        feeEstimate: feeEstimate
      };
    } catch ( error ) {
      console.log('Error estimating gas gasLimit, feeEstimate, feeData :==>>', { gasLimit, feeEstimate, feeData });

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
    tokenIn: SwapToken,
    tokenOut: SwapToken,
    fromAmount: BigNumberish,
    slippageTolerance: number,
    deadline: number,
    swapManager: UniswapSwapManager,
    fee: number = 3000
  ): Promise<string> {
    try {
      // Base gas units for different operations
      const BASE_SWAP_GAS = 150000n;
      const APPROVAL_GAS = 46000n;

      // Calculate total gas units needed
      let totalGasUnits = BASE_SWAP_GAS;
      if ( !tokenIn.isNative ) {
        totalGasUnits += APPROVAL_GAS;
      }

      // Get current gas prices
      const feeData = await this.provider.getFeeData();
      const maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice;
      if ( !maxFeePerGas ) throw new Error( 'Could not get gas price' );

      // Calculate total gas cost in wei
      const gasCostWei = totalGasUnits * BigInt( maxFeePerGas.toString() );

      // Convert to ETH
      const gasCostEth = EthereumBigNumber.fromWei( gasCostWei.toString() ).toEtherString();

      // Get ETH price
      const ethPrice = await this.getEthPrice();

      // Calculate USD cost
      const gasCostUsd = parseFloat( gasCostEth ) * ethPrice;

      return `$${ gasCostUsd.toFixed( 2 ) } (${ gasCostEth } ETH)`;
    } catch ( error ) {
      console.error( 'Gas estimation error:', error );
      return 'Unable to estimate gas';
    }
  }

  // First one was tested after bottom one
  // async estimateSwapGasFee(
  //   tokenIn: SwapToken,
  //   tokenOut: SwapToken,
  //   fromAmount: BigNumberish,
  //   slippageTolerance: number,
  //   deadline: number,
  //   swapManager: UniswapSwapManager,
  //   fee: number = 3000,
  //   dummyFromAddress: string = '0x0000000000000000000000000000000000000000'
  // ): Promise<string> {
  //   try {
  //     // Convert input values
  //     const fromAmountBN = EthereumBigNumber.from( fromAmount );
  //     const slippageBN = fromAmountBN.mul( Math.floor( slippageTolerance * 10 ) ).div( 1000 );
  //     const minAmountOut = fromAmountBN.sub( slippageBN );
  //     const deadlineTimestamp = Math.floor( Date.now() / 1000 ) + deadline * 60;
  //     let totalGasEstimate: bigint;

  //     try {
  //       // Attempt to get the exact gas estimate
  //       const swapGasEstimate = await swapManager.populateSwapTransaction(
  //         Token.fromSwapToken( tokenIn, this.blockchain, this.provider ),
  //         Token.fromSwapToken( tokenOut, this.blockchain, this.provider ),
  //         fromAmountBN.toString(),
  //         minAmountOut.toString(),
  //         dummyFromAddress,
  //         deadlineTimestamp,
  //         fee,
  //         true
  //       );

  //       // Check if the result is a bigint (gas estimate) or a TransactionRequest
  //       if ( typeof swapGasEstimate === 'bigint' ) {
  //         totalGasEstimate = swapGasEstimate;
  //       } else {
  //         // Use default estimates based on transaction type
  //         const isMultiHop = false; // Optional: Set this dynamically based on external logic if available
  //         totalGasEstimate = isMultiHop ? 200000n : 150000n;
  //       }

  //       // Add approval gas if not native
  //       if ( !tokenIn.isNative ) {
  //         totalGasEstimate += 46000n;
  //       }
  //     } catch {
  //       console.log( 'Gas estimation failed, using default.' );
  //       totalGasEstimate = ( tokenIn.isNative ? 150000n : 196000n );
  //     }

  //     // Calculate fee in ETH and USD
  //     const feeData = await this.provider.getFeeData();
  //     const gasPriceGwei = EthereumBigNumber.from( feeData.maxFeePerGas || feeData.gasPrice || 0 );
  //     const gasFeeGwei = EthereumBigNumber.from( totalGasEstimate ).mul( gasPriceGwei );
  //     const gasFeeEth = EthereumBigNumber.fromGwei( gasFeeGwei.toString() ).toEtherString();
  //     const ethPrice = await this.getEthPrice();
  //     const gasFeeUsd = parseFloat( gasFeeEth ) * ethPrice;

  //     return `$${ gasFeeUsd.toFixed( 2 ) } (${ gasFeeEth } ETH)`;
  //   } catch ( error ) {
  //     console.log( 'Error estimating swap gas fee:', error );
  //     return 'N/A';
  //   }
  // }

  // async estimateSwapGasFee(
  //   tokenIn: SwapToken,
  //   tokenOut: SwapToken,
  //   fromAmount: BigNumberish,
  //   slippageTolerance: number,
  //   deadline: number,
  //   swapManager: UniswapSwapManager,
  //   fee: number = 3000,
  //   dummyFromAddress: string = '0x0000000000000000000000000000000000000000' // Dummy from address for ETH swaps estimates
  // ): Promise<string> {
  //   try {
  //     if ( !tokenIn || !tokenOut || !fromAmount || !slippageTolerance || !deadline || !swapManager ) {
  //       return 'N/A'; //'Invalid parameters'; // Return an error message if any required parameters are missing
  //     }

  //     const fromAmountBN = EthereumBigNumber.from( fromAmount );
  //     const slippageBN = fromAmountBN.mul( Math.floor( slippageTolerance * 10 ) ).div( 1000 );
  //     const minAmountOut = fromAmountBN.sub( slippageBN );
  //     const deadlineTimestamp = Math.floor( Date.now() / 1000 ) + ( deadline * 60 );

  //     let totalGasEstimate: bigint;

  //     try {
  //       const swapGasEstimate = await swapManager.populateSwapTransaction(
  //         Token.fromSwapToken( tokenIn, this.blockchain, this.provider ),
  //         Token.fromSwapToken( tokenOut, this.blockchain, this.provider ),
  //         fromAmountBN.toString(),
  //         minAmountOut.toString(),
  //         dummyFromAddress,
  //         deadlineTimestamp,
  //         fee,
  //         true
  //       );

  //       if ( typeof swapGasEstimate === 'bigint' ) {
  //         totalGasEstimate = swapGasEstimate;
  //       } else {
  //         // If we couldn't get an exact estimate, use defaults
  //         totalGasEstimate = DEFAULT_GAS_ESTIMATES.SWAP_EXACT_IN;

  //         // Add approval gas if it's not a native token
  //         if ( !tokenIn.isNative ) {
  //           totalGasEstimate += DEFAULT_GAS_ESTIMATES.ERC20_APPROVE;
  //         }
  //       }
  //     } catch ( error ) {
  //       // console.log( 'Gas estimation failed, using default:', error );
  //       console.log( 'Gas estimation failed, using defaults...');

  //       // Use default estimates
  //       totalGasEstimate = DEFAULT_GAS_ESTIMATES.SWAP_EXACT_IN;

  //       // Add approval gas if it's not a native token
  //       if ( !tokenIn.isNative ) {
  //         totalGasEstimate += DEFAULT_GAS_ESTIMATES.ERC20_APPROVE;
  //       }
  //     }

  //     // Calculate fee in ETH
  //     const feeData = await this.provider.getFeeData();
  //     const gasPriceGwei = EthereumBigNumber.from( feeData.maxFeePerGas || feeData.gasPrice || 0 );
  //     const gasFeeGwei = EthereumBigNumber.from( totalGasEstimate ).mul( gasPriceGwei );
  //     const gasFeeEth = EthereumBigNumber.fromGwei( gasFeeGwei.toString() ).toEtherString();

  //     // Get ETH price and calculate USD value
  //     const ethPrice = await this.getEthPrice();
  //     const gasFeeUsd = parseFloat( gasFeeEth ) * ethPrice;

  //     return `$${ gasFeeUsd.toFixed( 2 ) } (${ gasFeeEth } ETH)`;
  //   } catch ( error ) {
  //     console.log( 'Error estimating swap gas fee:', error );
  //     // Even if everything fails, return a conservative estimate
  //     const conservativeGasEstimate = DEFAULT_GAS_ESTIMATES.SWAP_EXACT_IN +
  //       ( !tokenIn.isNative ? DEFAULT_GAS_ESTIMATES.ERC20_APPROVE : 0n );

  //     try {
  //       const feeData = await this.provider.getFeeData();
  //       const gasPriceGwei = EthereumBigNumber.from( feeData.maxFeePerGas || feeData.gasPrice || 0 );
  //       const gasFeeGwei = EthereumBigNumber.from( conservativeGasEstimate ).mul( gasPriceGwei );
  //       const gasFeeEth = EthereumBigNumber.fromGwei( gasFeeGwei.toString() ).toEtherString();
  //       const ethPrice = await this.getEthPrice();
  //       const gasFeeUsd = parseFloat( gasFeeEth ) * ethPrice;

  //       return `≈ $${ gasFeeUsd.toFixed( 2 ) } (${ gasFeeEth } ETH)`;
  //     } catch {
  //       return 'N/A';
  //     }
  //   }
  // }

  async getEthPrice(): Promise<number> {
    try {
      const marketPrice = this.priceProvider.getMarketPrice( 'ETH-USD' );
      return ( await marketPrice ).price;
    } catch ( error ) {
      console.error( 'Error fetching ETH price:', error );
      // throw error;
      return 0;
    }
  }

  // factor is a multiplier to adjust the gas price. Default of 1 will return the current gas price
  async getCurrentGasPriceInGwei(factor: number = 1): Promise<number> {
    const gasPrice = await this.provider.getGasPrice();
    // Convert from wei to gwei (1 gwei = 10^9 wei)
    return Number( ethersv6.formatUnits( gasPrice, "gwei" ) ) * factor;
  }

  async getGasPriceFromEtherscan( apiKey: string ): Promise<number> {
    const response = await fetch( `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ apiKey }` );
    const data = await response.json();
    return Number( data.result.ProposeGasPrice ); // returns a standard gas price in gwei
  }

  async getFormattedGasEstimates( gasEstimate: BigNumberish, factor: number = 1.5, gasPriceInGwei: number = 0, ethPriceInUsd: number = 0 ) {
    if ( !gasEstimate ) {
      throw new Error("Gas estimate must be provided");
    }

    const gasEstimateBigInt = BigNumber.from( gasEstimate ).toBigInt();

    if ( gasEstimateBigInt! <= 0n ) {
      return 0;
    }

    if ( factor <= 0 ) {
      factor = 1;
      console.log( 'Warning: Factor must be greater than 0 - set to 1' );
    }

    if ( gasPriceInGwei < 0 ) {
      gasPriceInGwei = 0;
      console.log( 'Warning: Gas price must be greater than or equal to 0 - set to 0' );
    }

    if ( ethPriceInUsd <= 0 ) {
      ethPriceInUsd = 0;
      console.log( 'Warning: ETH price must be greater than 0 - set to 0' );
    }

    if ( gasPriceInGwei === 0 ) {
      // Get the current gas price in gwei
      gasPriceInGwei = await this.getCurrentGasPriceInGwei(factor);
    }

    if ( ethPriceInUsd === 0 ) {
      // Get the current ETH price in USD
      ethPriceInUsd = await this.getEthPrice();
    }

    // Convert gas price from gwei to ETH (1 gwei = 10^-9 ETH)
    const gasPriceInEth = gasPriceInGwei * 1e-9;
    // Calculate the gas cost in ETH
    const gasEstimateInEth = Number(gasEstimate) * gasPriceInEth;  // May want to stay as bigint
    // Calculate the gas cost in USD
    const gasEstimateInUsd = gasEstimateInEth * ethPriceInUsd;

    return gasEstimateInUsd;
  }

  setPriceProvider( priceProvider: PriceProvider ): void {
    this.priceProvider = priceProvider;
  }
}
