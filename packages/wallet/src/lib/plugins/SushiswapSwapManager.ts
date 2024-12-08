/* eslint-disable @typescript-eslint/no-unused-vars */
// SushiSwapManager.ts
import type { AbstractBlockchain } from '$plugins/Blockchain';
import type { Provider } from '$plugins/Provider';
import { SwapManager } from './SwapManager';
import type { BaseTransaction, SwapPriceData, TransactionResponse, SwapParams, PoolInfoData, TransactionRequest, SwapToken, TransactionReceipt } from '$lib/common/interfaces';
import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
import { YAKKL_FEE_BASIS_POINTS, type BigNumberish } from '$lib/common';
import type { AbstractContract } from '$plugins/Contract';
import type { Token } from '$plugins/Token';
import { EVMToken } from './tokens/evm/EVMToken';
import { ADDRESSES } from './contracts/evm/constants-evm';
import { ethers as ethersv6 } from 'ethers-v6';

const SUSHISWAP_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)'
];

export class SushiSwapManager<T extends BaseTransaction> extends SwapManager {
  private router: AbstractContract | null = null;

  constructor (
    blockchain: AbstractBlockchain<T>,
    provider: Provider,
    routerAddress: string = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    initialFeeBasisPoints: number = YAKKL_FEE_BASIS_POINTS
  ) {
    super( blockchain, provider, initialFeeBasisPoints );
    this.router = blockchain.createContract( routerAddress, SUSHISWAP_ROUTER_ABI );
  }

  async estimateSwapGas(swapRouterAddress: string, swapParams: SwapParams): Promise<bigint> {
    return 0n;
  }

  approveToken( token: Token, amount: string ): Promise<TransactionReceipt> {
    throw new Error( 'Method not implemented.' );
  }
  checkAllowance( token: Token, fundingAddress: string ): Promise<bigint> {
    throw new Error( 'Method not implemented.' );
  }

  async fetchTokenList(): Promise<SwapToken[]> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPreferredTokens(tokens: SwapToken[]): SwapToken[] {
    return [];
  }

  getName(): string {
    return 'SushiSwap';
  }

  // TODO Implement later...
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkIfPoolExists(tokenIn: Token, tokenOut: Token, fee: number): Promise<boolean> {
    if ( !tokenIn || !tokenOut ) {
      throw new Error( 'Invalid tokens' );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const path = [ tokenIn.address, tokenOut.address ];
    const pairAddress = await this.getPairAddress( tokenIn.address, tokenOut.address );

    return pairAddress !== ethersv6.ZeroAddress;
  }

  getRouterAddress(): string | null {
    if ( !this.router ) return null;
    return ''; //this.router.address;
  }

  private async getWETHToken(): Promise<Token> {
    const chainId = this.blockchain.getChainId();
    const wethAddress = chainId === 1 ? ADDRESSES.WETH : ADDRESSES.WETH_SEPOLIA;

    return new EVMToken(
      wethAddress,
      'Wrapped Ether',
      'WETH',
      18,
      '/images/weth.png',
      'Wrapped version of Ether',
      chainId,
      false,
      false,
      this.blockchain,
      this.provider
    );
  }

  protected async prepareTokensForSwap(
    tokenIn: Token,
    tokenOut: Token
  ): Promise<[ Token, Token ]> {
    let actualTokenIn = tokenIn;
    let actualTokenOut = tokenOut;

    if ( tokenIn.isNative ) {
      actualTokenIn = await this.getWETHToken();
    }
    if ( tokenOut.isNative ) {
      actualTokenOut = await this.getWETHToken();
    }

    return [ actualTokenIn, actualTokenOut ];
  }

  async getQuote(
    tokenIn: Token,
    tokenOut: Token,
    amount: BigNumberish,
    fundingAddress: string,
    isExactIn: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _fee?: number // SushiSwap doesn't use fee tiers like Uniswap
  ): Promise<SwapPriceData> {
    if ( !tokenIn || !tokenOut || !amount || !this.router ) {
      throw new Error( 'Invalid token or amount or swap router' );
    }

    // TODO: Refactor


    const [ actualTokenIn, actualTokenOut ] = await this.prepareTokensForSwap( tokenIn, tokenOut );
    const path = [ actualTokenIn.address, actualTokenOut.address ];

    let amountInBigInt: bigint;
    let amountOutBigInt: bigint;

    if ( isExactIn ) {
      amountInBigInt = EthereumBigNumber.from( amount ).toBigInt() ?? 0n;
      const amounts = await this.router.call( 'getAmountsOut', amountInBigInt, path );
      amountOutBigInt = BigInt( amounts[ 1 ].toString() );
    } else {
      amountOutBigInt = EthereumBigNumber.from( amount ).toBigInt() ?? 0n;
      const amounts = await this.router.call( 'getAmountsIn', amountOutBigInt, path );
      amountInBigInt = BigInt( amounts[ 0 ].toString() );
    }

    const feeAmount = this.calculateFee( amountOutBigInt );
    const amountOutWithFee = amountOutBigInt - feeAmount;

    const priceImpactRatio = ( ( Number( amountOutBigInt ) - Number( amountOutWithFee ) ) / Number( amountOutBigInt ) ) * 100;
    const price = Number( amountOutWithFee ) / Number( amountInBigInt );

    return {
      provider: this.getName(),
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
      quoteAmount: 0n,
      fundingAddress,
      feeAmount: 0n,
      amountAfterFee: 0n,
      amountIn: amountInBigInt,
      amountOut: amountOutWithFee,
      exchangeRate: price, // TODO: Check if this is correct
      // price,
      marketPriceIn: 0,
      marketPriceOut: 0,
      marketPriceGas: 0,
      priceImpactRatio,
      path,
      feeBasisPoints: this.feeBasisPoints,
      feeAmountPrice: 0,
      feeAmountInUSD: '',
      gasEstimate: 0n,
      gasEstimateInUSD: '',
      tokenOutPriceInUSD: '',
      sqrtPriceX96After: 0n,
      initializedTicksCrossed: 0,
      error: null,
      isLoading: false,    };
  }

  async getPoolInfo(
    tokenA: Token,
    tokenB: Token,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _fee?: number // SushiSwap doesn't use fee tiers
  ): Promise<PoolInfoData> {
    const [ actualTokenA, actualTokenB ] = await this.prepareTokensForSwap( tokenA, tokenB );

    // Get pair address from SushiSwap factory
    const pairAddress = await this.getPairAddress( actualTokenA.address, actualTokenB.address );

    if ( pairAddress === ethersv6.ZeroAddress ) {
      throw new Error( 'Pool does not exist' );
    }

    // Get reserves from the pair contract
    const pair = this.blockchain.createContract( pairAddress, [
      'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
      'function token0() external view returns (address)',
      'function token1() external view returns (address)'
    ] );

    if ( !pair ) throw new Error( 'Invalid pair contract' );

    const [ reserves, token0 ] = await Promise.all( [
      pair.call( 'getReserves' ),
      pair.call( 'token0' )
    ] );

    const [ reserve0, reserve1 ] = reserves;

    // Determine which reserve corresponds to which token
    const isToken0 = actualTokenA.address.toLowerCase() === token0.toLowerCase();
    const tokenAReserve = isToken0 ? reserve0 : reserve1;
    const tokenBReserve = isToken0 ? reserve1 : reserve0;

    return {
      provider: this.getName(),
      lastUpdated: new Date(),
      chainId: this.blockchain.getChainId(),
      liquidity: ( BigInt( tokenAReserve.toString() ) * BigInt( tokenBReserve.toString() ) ).toString(),
      sqrtPriceX96: '0', // SushiSwap V2 doesn't use sqrtPriceX96
      tick: 0, // SushiSwap V2 doesn't use ticks
      tokenInReserve: tokenAReserve.toString(),
      tokenOutReserve: tokenBReserve.toString(),
      tokenInUSDPrice: (await this.getTokenUSDPrice( actualTokenA )).toString(),
      tokenOutUSDPrice: (await this.getTokenUSDPrice( actualTokenB )).toString(),
      tvl: await this.calculateTVL( actualTokenA, actualTokenB, tokenAReserve, tokenBReserve )
    };
  }

  async populateSwapTransaction(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    recipient: string,
    deadline: number,
    _fee?: number, // SushiSwap doesn't use fee tiers
    estimateOnly: boolean = false
  ): Promise<TransactionRequest | bigint> {
    if ( !this.router ) throw new Error( 'Invalid router contract' );

    const [ actualTokenIn, actualTokenOut ] = await this.prepareTokensForSwap( tokenIn, tokenOut );
    const path = [ actualTokenIn.address, actualTokenOut.address ];

    const data = this.router.interface.encodeFunctionData( 'swapExactTokensForTokens', [
      amountIn,
      amountOutMin,
      path,
      recipient,
      deadline
    ] );

    if ( estimateOnly ) {
      const signer = this.provider.getSigner();
      if ( !signer ) throw new Error( 'No signer available' );

      const gasEstimate = await this.provider.estimateGas( {
        from: await signer.getAddress(),
        to: '',//this.router.address,
        data,
        value: tokenIn.isNative ? amountIn : 0,
        chainId: this.provider.getChainId()
      } );

      return gasEstimate;
    }

    return {
      to: '',//this.router.address,
      data,
      value: tokenIn.isNative ? amountIn : 0,
      from: await this.provider.getSigner()!.getAddress(),
      chainId: this.provider.getChainId()
    };
  }

  private async getPairAddress( tokenA: string, tokenB: string ): Promise<string> {
    // Implement SushiSwap pair address lookup
    const factory = this.blockchain.createContract(
      ADDRESSES.SUSHISWAP_FACTORY,
      [ 'function getPair(address tokenA, address tokenB) external view returns (address pair)' ]
    );
    if ( !factory ) throw new Error( 'Invalid factory contract' );
    return await factory.call( 'getPair', tokenA, tokenB );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getTokenUSDPrice( token: Token ): Promise<number> {
    // Implement price fetching logic
    return 0; // Placeholder
  }

  private async calculateTVL(
    tokenA: Token,
    tokenB: Token,
    reserveA: BigNumberish,
    reserveB: BigNumberish
  ): Promise<number> {
    if ( !reserveA || !reserveB ) {
      throw new Error( 'Invalid reserves' );
    }
    const priceA = await this.getTokenUSDPrice( tokenA );
    const priceB = await this.getTokenUSDPrice( tokenB );

    const valueA = Number( ethersv6.formatUnits( reserveA.toString(), tokenA.decimals ) ) * priceA;
    const valueB = Number( ethersv6.formatUnits( reserveB.toString(), tokenB.decimals ) ) * priceB;

    return valueA + valueB;
  }

  async executeSwap( params: SwapParams ): Promise<TransactionResponse> {
    const {
      tokenIn,
      tokenOut,
      amount,
      slippage,
      deadline,
      recipient
    } = params;

    if ( !this.router ) throw new Error( 'Invalid router contract' );
    const [ actualTokenIn, actualTokenOut ] = await this.prepareTokensForSwap( tokenIn, tokenOut );
    const path = [ actualTokenIn.address, actualTokenOut.address ];

    const quote = await this.getQuote( actualTokenIn, actualTokenOut, amount, params.recipient );
    const minAmountOut = EthereumBigNumber.from( quote.amountOut )
      .mul( 1000 - Math.floor( slippage * 10 ) )
      .div( 1000 );

    return this.router.sendTransaction(
      'swapExactTokensForTokens',
      amount,
      minAmountOut,
      path,
      recipient,
      deadline
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async executeFullSwap( params: SwapParams ): Promise<[ TransactionReceipt, TransactionReceipt ]> {
    throw new Error( "Method not implemented." );
  }

  async distributeFee(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tokenOut: Token,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    feeAmount: BigNumberish,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    feeRecipient: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    gasLimit: BigNumberish,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    maxPriorityFeePerGas: BigNumberish,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    maxFeePerGas: BigNumberish
  ): Promise<TransactionReceipt> {
    throw new Error("Method not implemented.");
  }

  // async distributeFeeThroughSmartContract(
  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   tokenOut: Token,
  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   feeAmount: BigNumberish,
  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   feeRecipient: string
  // ): Promise<TransactionResponse> {
  //   throw new Error("Method not implemented.");

  // }
}

















// import type { AbstractBlockchain } from '$plugins/Blockchain';
// import type { Provider } from '$plugins/Provider';
// import { SwapManager } from './SwapManager';
// import type { BaseTransaction, SwapPriceData, TransactionResponse } from '$lib/common/interfaces';
// import { BigNumber, type BigNumberish } from '$lib/common/bignumber';
// import type { AbstractContract } from '$plugins/Contract';
// import type { Token } from '$plugins/Token';

// const SUSHISWAP_ROUTER_ABI = [
//   'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
//   'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
//   'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
//   'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)'
// ]; // Add the necessary ABI here

// export class SushiSwapManager<T extends BaseTransaction> extends SwapManager {
//   private router: AbstractContract;

//   constructor ( blockchain: AbstractBlockchain<T>, provider: Provider, routerAddress: string = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', initialFeeBasisPoints: number = 875 ) {
//     super(blockchain, provider, initialFeeBasisPoints);
//     this.router = blockchain.createContract(routerAddress, SUSHISWAP_ROUTER_ABI);
//   }

//   getName(): string {
//     return 'SushiSwap';
//   }

//   async getQuote( tokenIn: Token, tokenOut: Token, amountIn: BigNumberish, fee: number = 3000 ): Promise<SwapPriceData> {
//     if( !tokenIn || !tokenOut || !amountIn ) {
//       throw new Error( 'Invalid token or amount' );
//     }

//     const path = [ tokenIn.address, tokenOut.address ];
//     const amounts = await this.router.call( 'getAmountsOut', amountIn, path );
//     const amountOut = amounts[ 1 ];

//     const amountInBigInt = BigInt( amountIn.toString() );
//     const amountOutBigInt = BigInt( amountOut.toString() );

//     // Apply the fee
//     const feeAmount = this.calculateFee( amountOutBigInt );
//     const amountOutWithFee = amountOutBigInt - feeAmount;

//     // Calculate price impact (simplified)
//     const impactNumerator = ( amountInBigInt - amountOutWithFee ) * BigInt( 10000 );
//     const priceImpact = Number( impactNumerator / amountInBigInt ) / 100;

//     // Calculate price
//     const price = Number( amountOutBigInt ) / Number( amountInBigInt );

//     return {
//       provider: 'SushiSwap',
//       lastUpdated: new Date(),
//       chainId: this.blockchain.getChainId(),
//       tokenIn: {
//         address: tokenIn.address,
//         symbol: tokenIn.symbol,
//         decimals: tokenIn.decimals,
//         chainId: tokenIn.chainId,
//         name: tokenIn.name,
//       },
//       tokenOut: {
//         address: tokenOut.address,
//         symbol: tokenOut.symbol,
//         decimals: tokenOut.decimals,
//         chainId: tokenOut.chainId,
//         name: tokenOut.name,
//       },
//       amountIn: amountInBigInt,
//       amountOut: amountOutBigInt,
//       price,
//       priceImpact,
//       path,
//       fee,
//       feeBasisPoints: feeAmount
//     };
//   }

//   async executeSwap(tokenIn: Token, tokenOut: Token, amountIn: BigNumber, minAmountOut: BigNumber, to: string, deadline: number): Promise<TransactionResponse> {
//     const path = [tokenIn.address, tokenOut.address];
//     return this.router.sendTransaction('swapExactTokensForTokens', amountIn, minAmountOut, path, to, deadline);
//   }

//   async addLiquidity(tokenA: Token, tokenB: Token, amountA: BigNumber, amountB: BigNumber, minAmountA: BigNumber, minAmountB: BigNumber, to: string, deadline: number): Promise<TransactionResponse> {
//     return this.router.sendTransaction('addLiquidity', tokenA.address, tokenB.address, amountA, amountB, minAmountA, minAmountB, to, deadline);
//   }

//   async removeLiquidity(tokenA: Token, tokenB: Token, liquidity: BigNumber, minAmountA: BigNumber, minAmountB: BigNumber, to: string, deadline: number): Promise<TransactionResponse> {
//     return this.router.sendTransaction('removeLiquidity', tokenA.address, tokenB.address, liquidity, minAmountA, minAmountB, to, deadline);
//   }
// }
