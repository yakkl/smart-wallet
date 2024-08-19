// services/swapService.ts
import WalletManager from '..//WalletManager';
import { UniswapService } from './uniswap/UniswapService';
import { SushiSwapService } from './sushiswap/SushiSwapService';

async function initializeServices() {
  const wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], 1);
  const blockchain = wallet.getBlockchain();
  const provider = wallet.getProvider();

  if (!provider) {
    throw new Error('Provider not initialized');
  }

  const uniswapService = new UniswapService(
    blockchain,
    provider,
    875 // Initial fee basis points (0.875%)
  );

  const sushiSwapService = new SushiSwapService(
    blockchain,
    provider,
    875 // Initial fee basis points (0.875%)
  );

  return { uniswapService, sushiSwapService };
}
export const swapServices = initializeServices();
