// src/worker/alphaRouterWorker.ts
import { AlphaRouter, SwapType } from '@uniswap/smart-order-router';
import { CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
class AlphaRouterWorker {
    constructor() {
        this.provider = new ethers.providers.AlchemyProvider('mainnet', process.env.ALCHEMY_API_KEY);
        this.router = new AlphaRouter({
            chainId: 1,
            provider: this.provider
        });
    }
    extractFeeFromRoute(route) {
        if (this.isV3Route(route)) {
            const v3Route = route;
            return v3Route.pools[0]?.fee ?? 3000;
        }
        return 3000; // Default fee for V2
    }
    isV3Route(route) {
        return 'pools' in route;
    }
    extractPathFromRoute(route) {
        if (this.isV3Route(route)) {
            const v3Route = route;
            return v3Route.tokenPath.map((token) => token.address);
        }
        else {
            const v2Route = route;
            return v2Route.tokenPath.map((token) => token.address);
        }
    }
    async handleRequest(request) {
        try {
            const { tokenIn, tokenOut, amount, fundingAddress, isExactIn } = request.payload;
            const slippageTolerance = new Percent(5, 100);
            const amountValue = ethers.BigNumber.from(amount);
            // Convert Token to CurrencyAmount
            const currencyAmount = CurrencyAmount.fromRawAmount(isExactIn ? tokenIn : tokenOut, amountValue.toString());
            const route = await this.router.route(currencyAmount, isExactIn ? tokenOut : tokenIn, isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT, {
                recipient: fundingAddress,
                slippageTolerance,
                deadline: Math.floor(Date.now() / 1000) + 1800,
                type: SwapType.SWAP_ROUTER_02
            });
            if (!route || !route.route || route.route.length === 0) {
                throw new Error('No route found');
            }
            const firstRoute = route.route[0];
            const fee = this.extractFeeFromRoute(firstRoute);
            const path = this.extractPathFromRoute(firstRoute);
            return {
                success: true,
                data: {
                    quoteAmount: route.quote.toFixed(0),
                    fee,
                    gasEstimate: route.estimatedGasUsed.toString(),
                    path
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
// Worker setup
const worker = new AlphaRouterWorker();
self.onmessage = async (event) => {
    const response = await worker.handleRequest(event.data.request);
    self.postMessage({
        id: event.data.id,
        response
    });
};
