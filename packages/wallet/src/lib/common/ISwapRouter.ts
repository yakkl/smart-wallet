export interface ISwapRouter {
  exactInputSingle( params: ExactInputSingleParams ): Promise<number>;

  exactOutputSingle( params: ExactOutputSingleParams ): Promise<number>;

  // Add other methods from the ABI if needed...
}

export interface ExactInputParams {
  path: string[];           // Encoded path (token addresses) for multi-hop
  recipient: string;        // The address that will receive the output of the swap
  deadline: number;         // Unix timestamp after which the transaction will revert
  amountIn: bigint;         // The amount of the input token to swap
  amountOutMinimum: bigint; // The minimum amount of the output token that must be received
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
