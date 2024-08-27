import { ethers } from 'ethers';
import * as IUniswapV3Pool from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';

async function initializePool(poolAddress: string, initialPrice: number) {
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  const signer = await provider.getSigner();
  
  const pool = new ethers.Contract(poolAddress, IUniswapV3Pool.abi, signer);

  const sqrtPriceX96 = Math.sqrt(initialPrice) * 2**96;
  const tx = await pool.initialize(ethers.toBigInt(Math.floor(sqrtPriceX96)));
  const receipt = await tx.wait();
  console.log(`Pool initialized. Transaction hash: ${receipt.transactionHash}`);
}

initializePool('POOL_ADDRESS_FROM_PREVIOUS_STEP', 1); // Assuming 1 YAKKL = 1 WETH initially
