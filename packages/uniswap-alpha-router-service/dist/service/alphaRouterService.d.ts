import type { Token } from '@uniswap/sdk-core';
import type { AlphaRouterResponse } from '../types';
export declare class AlphaRouterService {
    private worker;
    private pending;
    constructor();
    getQuote(tokenIn: Token, tokenOut: Token, amount: string, fundingAddress: string, isExactIn?: boolean): Promise<AlphaRouterResponse>;
    private handleWorkerMessage;
    private handleWorkerError;
    dispose(): void;
}
