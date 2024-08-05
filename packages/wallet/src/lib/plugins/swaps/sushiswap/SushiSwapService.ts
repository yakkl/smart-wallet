// SushiSwapService.ts
import { SwapManager } from '../../SwapManager';
import { Token, CurrencyAmount, Percent, type Currency } from '@uniswap/sdk-core';
import { ethers } from 'ethers';

const SUSHISWAP_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
];

export class SushiSwapService extends SwapManager {
  private sushiSwapRouter: ethers.Contract;

  constructor(
    provider: ethers.Provider,
    signer: ethers.Signer,
    private chainId: number,
    initialFeePercentage: number = 0.00875
  ) {
    super(provider, signer, initialFeePercentage);
    this.sushiSwapRouter = new ethers.Contract(
      '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', // SushiSwap router address
      SUSHISWAP_ROUTER_ABI,
      signer
    );
  }

  async getSwapQuote(
    tokenIn: Token,
    tokenOut: Token,
    amount: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    slippageTolerance: number = 0.5
  ): Promise<{
    quote: CurrencyAmount<Currency>;
    quoteWithFee: CurrencyAmount<Currency>;
    fee: CurrencyAmount<Currency>;
    priceImpact: Percent;
    route: string;
  }> {
    const amountIn = ethers.parseUnits(amount, tokenIn.decimals);
    const path = [tokenIn.address, tokenOut.address];

    const amounts = await this.sushiSwapRouter.getAmountsOut(amountIn, path);
    const amountOut = amounts[1];

    const quote = CurrencyAmount.fromRawAmount(tokenOut, amountOut.toString());
    const feeAmount = quote.multiply(this.feePercentage);
    const quoteWithFee = quote.subtract(feeAmount);

    // Simplified price impact calculation
    const priceImpact = new Percent(
      feeAmount.quotient,
      quote.add(feeAmount).quotient
    );

    return {
      quote,
      quoteWithFee,
      fee: feeAmount,
      priceImpact,
      route: path.join(' -> '),
    };
  }

  async executeSwap(
    tokenIn: Token,
    tokenOut: Token,
    amount: string,
    slippageTolerance: number = 0.5
  ): Promise<ethers.TransactionResponse> {
    const quote = await this.getSwapQuote(tokenIn, tokenOut, amount, slippageTolerance);
    const amountIn = ethers.parseUnits(amount, tokenIn.decimals);
    const amountOutMin = ethers.parseUnits(
      quote.quoteWithFee.toExact(),
      tokenOut.decimals
    );

    const path = [tokenIn.address, tokenOut.address];
    const to = await this.signer.getAddress();
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

    // Approve the router to spend tokens
    const tokenContract = new ethers.Contract(
      tokenIn.address,
      ['function approve(address spender, uint256 amount) public returns (bool)'],
      this.signer
    );

    await tokenContract.approve(this.sushiSwapRouter.address, amountIn);

    // Execute the swap
    return this.sushiSwapRouter.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline
    );
  }

  async addLiquidity(
    tokenA: Token,
    tokenB: Token,
    amountA: string,
    amountB: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    slippageTolerance: number = 0.5
  ): Promise<ethers.TransactionResponse> {
    // Implementation for adding liquidity to SushiSwap
    // This is a placeholder and needs to be implemented based on your specific requirements
    throw new Error('Method not implemented.');
  }
}
