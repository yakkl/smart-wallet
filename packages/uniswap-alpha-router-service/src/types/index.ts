// src/types/index.ts
import type { Token } from '@uniswap/sdk-core';

export interface TokenData {
  address: string;
  chainId: number;
  decimals: number;
  symbol: string;
  name: string;
}

export interface RouteData {
  quoteAmount: string;
  fee: number;
  gasEstimate: string;
  path: string[];
}

export interface AlphaRouterRequest {
  type: 'QUOTE';
  payload: {
    tokenIn: Token;
    tokenOut: Token;
    amount: string;
    fundingAddress: string;
    isExactIn: boolean;
  };
}

export interface AlphaRouterResponse {
  success: boolean;
  data?: RouteData;
  error?: string;
}

export interface WorkerMessage {
  id: string;
  request: AlphaRouterRequest;
}

export interface WorkerResponse {
  id: string;
  response: AlphaRouterResponse;
}
