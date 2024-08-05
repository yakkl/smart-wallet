// services/swapService.ts
import { ethers } from 'ethers';
import { UniswapService } from './uniswap/UniswapService';
import { SushiSwapService } from './sushiswap/SushiSwapService';
import { ChainId } from '@sushiswap/sdk';

// Choose either Alchemy or Infura
const ALCHEMY_API_KEY = 'YOUR_ALCHEMY_API_KEY';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const INFURA_PROJECT_ID = 'YOUR_INFURA_PROJECT_ID';

// Use Alchemy
const provider = new ethers.AlchemyProvider('mainnet', ALCHEMY_API_KEY);

// Or use Infura
// const provider = new ethers.InfuraProvider('mainnet', INFURA_PROJECT_ID);

async function initializeServices() {
  // You'll need to implement a way to get the signer, possibly through a wallet connection
  const signer = await provider.getSigner();

  const uniswapService = new UniswapService(
    provider,
    signer,
    'YOUR_DEPLOYED_CONTRACT_ADDRESS',
    1, // chainId (1 for Ethereum mainnet)
    0.00875 // Initial fee percentage
  );

  const sushiSwapService = new SushiSwapService(
    provider,
    signer,
    ChainId.MAINNET,
    0.00875 // Initial fee percentage
  );

  return { uniswapService, sushiSwapService };
}

export const swapServices = initializeServices();
