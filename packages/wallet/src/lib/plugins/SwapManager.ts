// SwapManager.ts
import type { Blockchain } from './Blockchain';
import type { Provider } from './Provider';
import type { Token } from './Token';
import type { BigNumberish, TransactionResponse } from '$lib/common';
import { ADDRESSES, ABIs } from './contracts/evm/constants-evm';
import type { AbstractContract } from './Contract';
import type { PoolInfoData, SwapParams, SwapQuote, TransactionRequest } from '$lib/common/interfaces';

export abstract class SwapManager {
  protected blockchain: Blockchain;
  protected provider: Provider;
  protected factory: AbstractContract;
  protected quoter: AbstractContract;
  protected feeBasisPoints: number;

  constructor ( blockchain: Blockchain, provider: Provider, initialFeeBasisPoints: number = 875 ) {
    this.blockchain = blockchain;
    this.provider = provider;
    this.feeBasisPoints = initialFeeBasisPoints;

    this.factory = this.blockchain.createContract(
      ADDRESSES.UNISWAP_FACTORY,
      ABIs.UNISWAP_V3_FACTORY
    );

    this.quoter = this.blockchain.createContract(
      ADDRESSES.UNISWAP_V3_QUOTER,
      [
        'function quoteExactInputSingle(address,address,uint24,uint256,uint160) external returns (uint256)',
        'function quoteExactOutputSingle(address,address,uint24,uint256,uint160) external returns (uint256)'
      ]
    );
  }

  getFeeBasisPoints(): number {
    return this.feeBasisPoints;
  }

  setFeeBasisPoints( feeBasisPoints: number ): void {
    this.feeBasisPoints = feeBasisPoints;
  }

  protected calculateFee( amount: bigint ): bigint {
    return ( amount * BigInt( this.feeBasisPoints ) ) / BigInt( 100000 );
  }

  abstract getName(): string;

  abstract getQuote(
    tokenIn: Token,
    tokenOut: Token,
    amount: BigNumberish,
    isExactIn?: boolean,
    fee?: number
  ): Promise<SwapQuote>;

  abstract executeSwap( params: SwapParams ): Promise<TransactionResponse>;

  abstract getPoolInfo(
    tokenA: Token,
    tokenB: Token,
    fee?: number
  ): Promise<PoolInfoData>;

  abstract populateSwapTransaction(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    recipient: string,
    deadline: number,
    fee?: number,
    estimateOnly?: boolean
  ): Promise<TransactionRequest | bigint>;
}
