import { ethers } from 'ethers';
import * as IUniswapV3Factory from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json';

const UNISWAP_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984"; // Uniswap Factory address
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const YAKKL_ADDRESS = "0x2B64822cf4bbDd77d386F51AA2B40c5cdbeb80b5";

async function createLiquidityPool(yakklAddress: string, wethAddress: string, fee: number) {
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  const signer = await provider.getSigner();
  
  const factory = new ethers.Contract(UNISWAP_FACTORY_ADDRESS, IUniswapV3Factory.abi, signer);

  const tx = await factory.createPool(yakklAddress, wethAddress, fee);
  const receipt = await tx.wait();
  console.log(`Pool created. Transaction hash: ${receipt.transactionHash}`);

  const poolAddress = await factory.getPool(yakklAddress, wethAddress, fee);
  console.log(`Pool address: ${poolAddress}`);

  return poolAddress;
}

createLiquidityPool(YAKKL_ADDRESS, WETH_ADDRESS, 3000); // 0.3% fee tier
