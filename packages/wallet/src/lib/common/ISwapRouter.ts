export interface ISwapRouter {
  exactInputSingle( params: ExactInputSingleParams ): Promise<number>;

  exactOutputSingle( params: ExactOutputSingleParams ): Promise<number>;

  // Add other methods from the ABI if needed...
}

export interface ExactInputSingleParams {
  tokenIn: string;
  tokenOut: string;
  fee: number;
  recipient: string;
  deadline: number;
  amountIn: bigint;
  amountOutMinimum: bigint;
  sqrtPriceLimitX96: number;
}

export interface ExactOutputSingleParams {
  tokenIn: string;
  tokenOut: string;
  fee: number;
  recipient: string;
  deadline: number;
  amountOut: bigint;
  amountInMaximum: bigint;
  sqrtPriceLimitX96: number;
}
