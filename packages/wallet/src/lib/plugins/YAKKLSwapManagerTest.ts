import { ethers } from 'ethers';
import { Token } from '@uniswap/sdk-core';
import { ChainId } from '@sushiswap/sdk';
import { UniswapService } from './swaps/uniswap/UniswapService';
import { SushiSwapService } from './swaps/sushiswap/SushiSwapService';

async function main() {
  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');
  const privateKey = 'YOUR_PRIVATE_KEY';
  const signer = new ethers.Wallet(privateKey, provider);

  // Define tokens
  const WETH = new Token(ChainId.MAINNET, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, 'WETH', 'Wrapped Ether');
  const USDC = new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD Coin');

  // Initialize services
  const uniswapService = new UniswapService(
    provider,
    signer,
    'YOUR_YAKKL_SWAP_CONTRACT_ADDRESS',
    ChainId.MAINNET,
    0.00875 // Initial fee percentage
  );

  const sushiSwapService = new SushiSwapService(
    provider,
    signer,
    ChainId.MAINNET,
    0.00875 // Initial fee percentage
  );

  // Choose the service to use
  const selectedDex = process.argv[2] || 'uniswap';
  const swapService = selectedDex === 'sushiswap' ? sushiSwapService : uniswapService;

  try {
    // Get a quote
    const amountIn = ethers.parseEther('1').toString(); // 1 WETH
    const quote = await swapService.getSwapQuote(WETH, USDC, amountIn);
    console.log('DEX:', selectedDex);
    console.log('Quote:', ethers.formatUnits(quote.quote.quotient.toString(), USDC.decimals));
    console.log('Quote with fee:', ethers.formatUnits(quote.quoteWithFee.quotient.toString(), USDC.decimals));
    console.log('Fee:', ethers.formatUnits(quote.fee.quotient.toString(), USDC.decimals));
    console.log('Price Impact:', quote.priceImpact.toFixed(2), '%');
    console.log('Route:', quote.route);

    // Uncomment the following lines to execute the swap
    // console.log('Executing swap...');
    // const tx = await swapService.executeSwap(WETH, USDC, amountIn);
    // console.log('Transaction hash:', tx.hash);
    // await tx.wait();
    // console.log('Transaction confirmed');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

// Usage:
// npx ts-node YAKKLSwapManagerTest.ts [uniswap|sushiswap]
