import { ethers } from "ethers";
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { FeeAmount } from '@uniswap/v3-sdk'
import { YAKKL_FEE_BASIS_POINTS } from '../../wallet/src/lib/common/constants';

dotenv.config();

const OWNER_ADDRESS           = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // This is the first address in the local network (10 addresses are created by default)
const RECIPIENT_ADDRESS       = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // This is the second address in the local network (10 addresses are created by default)
const UNISWAP_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984"; // Uniswap Factory address
const WETH_ADDRESS            = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH address
const USDC_ADDRESS            = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC address

const YAKKL_ADDRESS = "0x36B81ebd01C31643BAF132240C8Bc6874B329c4C";

const MAX_WAIT_TIME = 60000; // 60 seconds, adjust as needed - This is for the tx.wait() or waitForTransaction() function
const MINIMUM_WETH_LIQUIDITY = ethers.parseEther("0.1"); // Adjust this value as needed
const SLIPPAGE_TOLERANCE = 0.005; // 0.5%
const AMOUNT_IN = "0.1"; // Adjust this value as needed
const FEE_BASIS_POINTS = YAKKL_FEE_BASIS_POINTS; // 42.25 bps fee
const FEE_PRECISION = 1000000n;

// ABIs
const SwapRouterABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../out/SwapRouter.sol/SwapRouter.json'), 'utf8')).abi;
const FeeManagerABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../out/FeeManager.sol/FeeManager.json'), 'utf8')).abi;
const IERC20ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function approve(address spender, uint256 amount) returns (bool)"
];

// Network configurations
const networks = {
    local: {
        rpcUrl: "http://localhost:8545",
        swapRouterAddress: "0xd2983525E903Ef198d5dD0777712EB66680463bc", // Replace with the actual SwapRouter address you wish to use (should be latest always)
        feeManagerAddress: "0xe8c3F27D20472e4f3C546A3f73C04B54DD72871d", // Replace with the actual FeeManager address you wish to use (should be latest always)
        tokenInAddress: WETH_ADDRESS,
        tokenOutAddress: USDC_ADDRESS
    },
    sepolia: {
        // Removed because testing on a local forked mainnet
        rpcUrl: process.env.SEPOLIA_RPC_URL,
        swapRouterAddress: "0x",
        feeManagerAddress: "0x",
        tokenInAddress: "0x",
        tokenOutAddress: "0x"
    },
    mainnet: {
        rpcUrl: process.env.MAINNET_RPC_URL,
        swapRouterAddress: "0x", // Replace with the actual SwapRouter address
        feeManagerAddress: "0x", // Replace with the actual FeeManager address
        tokenInAddress: WETH_ADDRESS,
        tokenOutAddress: USDC_ADDRESS
    }
};

async function checkUniswapPoolLiquidity(provider: ethers.Provider, tokenAAddress: string, tokenBAddress: string, fee: number): Promise<{ liquidityTokenA: bigint, liquidityTokenB: bigint }> {
  console.log(`Checking liquidity for pool: ${tokenAAddress} - ${tokenBAddress}`);
  try {
    const factory = new ethers.Contract(UNISWAP_FACTORY_ADDRESS, ["function getPool(address,address,uint24) external view returns (address)"], provider);
    const poolAddress = await factory.getPool(tokenAAddress, tokenBAddress, fee);

    console.log(`Pool address: ${poolAddress}`);
    if (poolAddress === ethers.ZeroAddress) {
      throw new Error("Pool does not exist");
    }

    const poolContract = new ethers.Contract(poolAddress, [
      'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
      'function liquidity() external view returns (uint128)'
    ], provider);

    const tokenAContract = new ethers.Contract(tokenAAddress, ['function decimals() view returns (uint8)', 'function symbol() view returns (string)'], provider);
    const tokenBContract = new ethers.Contract(tokenBAddress, ['function decimals() view returns (uint8)', 'function symbol() view returns (string)'], provider);

    const [slot0, liquidity, tokenADecimals, tokenBDecimals, tokenASymbol, tokenBSymbol] = await Promise.all([
      poolContract.slot0(),
      poolContract.liquidity(),
      tokenAContract.decimals(),
      tokenBContract.decimals(),
      tokenAContract.symbol(),
      tokenBContract.symbol()
    ]);

    console.log(`Token A (${tokenASymbol}) decimals: ${tokenADecimals}`);
    console.log(`Token B (${tokenBSymbol}) decimals: ${tokenBDecimals}`);
    console.log(`Slot0:`, slot0);
    console.log(`Liquidity: ${liquidity.toString()}`);

    const poolLiquidity = BigInt(liquidity.toString());
    console.log("Raw pool liquidity:", poolLiquidity.toString());

    // Get current price from sqrtPriceX96
    const price = (BigInt(slot0.sqrtPriceX96) * BigInt(slot0.sqrtPriceX96) * BigInt(10n ** BigInt(tokenBDecimals))) / (BigInt(2n ** 192n) * BigInt(10n ** BigInt(tokenADecimals)));
    console.log("Current price (tokenB per tokenA):", price.toString());

    // Estimate liquidity in both tokens
    const liquidityTokenA = poolLiquidity * BigInt(2n ** 96n) / BigInt(slot0.sqrtPriceX96);
    const liquidityTokenB = poolLiquidity * BigInt(slot0.sqrtPriceX96) / BigInt(2n ** 96n);

    console.log(`Estimated liquidity in ${tokenASymbol}: ${ethers.formatUnits(liquidityTokenA, tokenADecimals)}`);
    console.log(`Estimated liquidity in ${tokenBSymbol}: ${ethers.formatUnits(liquidityTokenB, tokenBDecimals)}`);

    return { liquidityTokenA, liquidityTokenB };
  } catch (error) {
    console.error("Error in checkUniswapPoolLiquidity:", false, error);
    throw error;
  }
}

async function estimateGas(swapRouter: ethers.Contract, method: string, params: any, value: bigint = 0n): Promise<bigint> {
    try {
        const gasEstimate = await swapRouter[method].estimateGas(...params, { value });
        console.log(`\nEstimated gas: ${gasEstimate.toString()}`);
        return gasEstimate;
    } catch (error: any) {
        console.error("Gas estimation failed:", false, error);
        if (error.reason) console.error("Reason:", error.reason);
        if (error.data) console.error("Error data:", error.data);
        throw error;
    }
}

function calculateMinimumAmountOut(amount: bigint, slippageTolerance: number): bigint {
  return amount * BigInt(Math.floor((1 - slippageTolerance) * 10000)) / 10000n;
}

async function checkLiquidityDepth(poolContract: ethers.Contract, currentTick: number, depth: number) {
  const tickSpacing = 60; // Assuming 0.3% fee tier
  const lowerTick = Math.floor(currentTick / tickSpacing) * tickSpacing - depth * tickSpacing;
  const upperTick = Math.ceil(currentTick / tickSpacing) * tickSpacing + depth * tickSpacing;

  let totalLiquidity = 0n;
  for (let tick = lowerTick; tick <= upperTick; tick += tickSpacing) {
      const liquidityNet = await poolContract.ticks(tick);
      totalLiquidity += BigInt(liquidityNet.toString());
  }

  return totalLiquidity;
}

function calculatePriceImpact(amountIn: bigint, amountOut: bigint, spotPrice: bigint): number {
  const expectedAmountOut = amountIn * spotPrice / BigInt(1e18);
  const priceImpact = (expectedAmountOut - amountOut) * 10000n / expectedAmountOut;
  return Number(priceImpact) / 100; // Convert to percentage
}

async function getQuote(
  swapRouter: ethers.Contract,
  tokenIn: string,
  tokenOut: string,
  fee: bigint,
  amountIn: bigint
): Promise<{ amountOut: bigint, priceImpact: number }> {
  try {
    console.log(`Getting quote for ${ethers.formatEther(amountIn)} ...`);
    console.log(`Token Out: ${tokenOut}`);
    console.log(`Fee: ${fee}`);
    console.log(`Amount In: ${amountIn}`);
    
    const [amountOut, priceImpact] = await swapRouter.getQuote.staticCall(tokenIn, tokenOut, fee, amountIn);
    return {
        amountOut: BigInt(amountOut.toString()),
        priceImpact: Number(priceImpact) / 100  // Convert basis points to percentage
    };
  } catch (error: any) {
    console.error(`\nError in getQuote:\n`, false, error);
    if (error.reason) console.error("Reason:", error.reason);
    if (error.data) console.error("Error data:", error.data);
    if (error.transaction) console.error("Transaction:", error.transaction);
    throw error;
  }
}

async function getETHQuote(
  swapRouter: ethers.Contract,
  tokenOut: string,
  fee: bigint,
  amountIn: bigint
): Promise<{ amountOut: bigint, priceImpact: number }> {
  try {
    console.log(`Getting quote for ${ethers.formatEther(amountIn)} ETH...`);
    console.log(`Token Out: ${tokenOut}`);
    console.log(`Fee: ${fee}`);
    console.log(`Amount In: ${amountIn}`);
    
    const [amountOut, priceImpact] = await swapRouter.getETHQuote.staticCall(tokenOut, fee, amountIn);
    
    console.log("Amount out:", amountOut.toString());
    console.log("Price impact:", priceImpact.toString());

    return {
        amountOut: BigInt(amountOut.toString()),
        priceImpact: Number(priceImpact) / 100  // Convert basis points to percentage
    };
  } catch (error: any) {
    console.error(`\nError in getETHQuote:\n`, false, error);
    if (error.reason) console.error("Reason:", error.reason);
    if (error.data) console.error("Error data:", error.data);
    if (error.transaction) console.error("Transaction:", error.transaction);
    throw error;
  }
}

async function resetNonce(wallet: ethers.Wallet) {
  const currentNonce = await wallet.provider!.getTransactionCount(wallet.address);
  console.log(`Current nonce: ${currentNonce}`);
  return currentNonce;
}

const waitForTransaction = async (tx: ethers.TransactionResponse, maxWaitTime: number = MAX_WAIT_TIME, confirmations: number = 1): Promise<ethers.TransactionReceipt | null> => {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTime) {
      try {
          const receipt = await tx.provider.getTransactionReceipt(tx.hash);
          if (receipt) { // && await receipt.confirmations() >= confirmations) {
            if (receipt.status === 0) {
              throw new Error("Transaction failed");
            }
            return receipt;
          }
      } catch (error: any) {
          throw new Error("Error checking transaction receipt");          
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking again
  }
  throw new Error("Transaction wait timeout");
};

const bumpGasPrice = async (wallet: ethers.Wallet, tx: ethers.ContractTransaction, increaseFactor: number = 1.1): Promise<ethers.TransactionResponse> => {
  const newGasPrice = tx.gasPrice ? BigInt(Math.floor(Number(tx.gasPrice) * increaseFactor)) : undefined;
  const newMaxFeePerGas = tx.maxFeePerGas ? BigInt(Math.floor(Number(tx.maxFeePerGas) * increaseFactor)) : undefined;
  const newMaxPriorityFeePerGas = tx.maxPriorityFeePerGas ? BigInt(Math.floor(Number(tx.maxPriorityFeePerGas) * increaseFactor)) : undefined;

  return await wallet.sendTransaction({
      to: tx.to,
      from: tx.from,
      nonce: tx.nonce,
      data: tx.data,
      value: tx.value,
      gasLimit: tx.gasLimit,
      gasPrice: newGasPrice,
      maxFeePerGas: newMaxFeePerGas,
      maxPriorityFeePerGas: newMaxPriorityFeePerGas,
  });
};

async function performSwapETHForTokens(networkName: string) {
  const network = networks[networkName as keyof typeof networks];

  if (!network) {
      throw new Error(`Invalid network: ${networkName}. Choose from local, sepolia, or mainnet.`);
  }

  const PRIVATE_KEY = networkName === 'local' ? process.env.LOCAL_PRIVATE_KEY : process.env.PRIVATE_KEY;

  if (!network.rpcUrl || !PRIVATE_KEY) {
      throw new Error("Please set RPC_URL and (LOCAL_PRIVATE_KEY or PRIVATE_KEY depending on your environment) in your .env file");
  }

  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("SwapRouter address:", network.swapRouterAddress);
  console.log("Wallet address:", wallet.address);
  console.log("ETH balance:", ethers.formatEther(await provider.getBalance(wallet.address)));

  console.log(`\nStarting ETH swap process on ${networkName}...`);

  const swapRouter = new ethers.Contract(network.swapRouterAddress, SwapRouterABI, wallet);
  const feeManager = new ethers.Contract(network.feeManagerAddress, FeeManagerABI, wallet);
  const tokenOut = new ethers.Contract(network.tokenOutAddress, IERC20ABI, wallet);

  console.log(`Connected to SwapRouter at ${network.swapRouterAddress}`);
  console.log(`Connected to FeeManager at ${network.feeManagerAddress}`);
  console.log(`Connected to tokenOut at ${network.tokenOutAddress}\n`);

  const feeRecipient = await feeManager.getFeeRecipient();
  console.log("FeeManager fee recipient:", feeRecipient);

  const tokenOutDecimals = await tokenOut.decimals();

  // Initial balance checks
  const initialUserEthBalance = await provider.getBalance(wallet.address);
  const initialUserTokenOutBalance = await tokenOut.balanceOf(wallet.address);

  console.log(`Initial User ETH Balance: ${ethers.formatEther(initialUserEthBalance)} ETH`);
  console.log(`Initial User ${await tokenOut.symbol()} Balance: ${ethers.formatUnits(initialUserTokenOutBalance, tokenOutDecimals)}`);

  const amountIn = ethers.parseEther(AMOUNT_IN);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
  const feeBasisPoints = FEE_BASIS_POINTS;
  
  console.log(`\nAmount in: ${ethers.formatEther(amountIn)} ETH`);
  console.log(`Deadline: ${deadline}`);
  console.log(`Fee basis points: ${feeBasisPoints}\n`);

  const { amountOut, priceImpact } = await getETHQuote(swapRouter, network.tokenOutAddress, BigInt(FeeAmount.LOW), amountIn);

  console.log(`\nQuote for ${ethers.formatEther(amountIn)} ETH:`);
  console.log(`Expected output: ${ethers.formatUnits(amountOut, tokenOutDecimals)} ${await tokenOut.symbol()}`);
  console.log(`Estimated price impact: ${priceImpact.toFixed(2)}%`);
  
  // Calculate minimum amount out based on slippage tolerance
  const slippageTolerance = SLIPPAGE_TOLERANCE;  // 0.5%
  const minAmountOut = amountOut * BigInt(Math.floor((1 - slippageTolerance) * 10000)) / 10000n;
  
  console.log(`Minimum amount out (with ${slippageTolerance * 100}% slippage tolerance): ${ethers.formatUnits(minAmountOut, tokenOutDecimals)} ${await tokenOut.symbol()}`);
  console.log(`Swapping ${ethers.formatEther(amountIn)} ETH for ${await tokenOut.symbol()}...`);

  try {
      const ethBalance = await provider.getBalance(wallet.address);
      console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH\n`);

      if (ethBalance < amountIn) {
          throw new Error("Insufficient ETH balance");
      }

      const swapRouterCode = await provider.getCode(network.swapRouterAddress);
      const feeManagerCode = await provider.getCode(network.feeManagerAddress);

      console.log(`SwapRouter deployed: ${swapRouterCode !== '0x'}`);
      console.log(`FeeManager deployed: ${feeManagerCode !== '0x'}`);

      let poolLiquidity: { liquidityTokenA: bigint, liquidityTokenB: bigint } | null = null;
      try {
          console.log(`\n`);

          poolLiquidity = await checkUniswapPoolLiquidity(provider, network.tokenInAddress, network.tokenOutAddress, FeeAmount.LOW);
          
          console.log(`\nWETH/USDC Pool Liquidity:`);
          console.log(`WETH: ${ethers.formatEther(poolLiquidity.liquidityTokenA)} WETH`);
          console.log(`USDC: ${ethers.formatUnits(poolLiquidity.liquidityTokenB, tokenOutDecimals)} USDC\n`);
          
          if (poolLiquidity && poolLiquidity.liquidityTokenA < MINIMUM_WETH_LIQUIDITY) {
            console.warn(`Insufficient liquidity in the pool. Required: ${ethers.formatEther(MINIMUM_WETH_LIQUIDITY)} WETH, Available: ${ethers.formatEther(poolLiquidity.liquidityTokenA)} WETH`);
            throw new Error("Insufficient pool liquidity");
          }

          const MINIMUM_LIQUIDITY_THRESHOLD = ethers.parseEther("10"); // Example: 10 WETH

          if (poolLiquidity.liquidityTokenA < MINIMUM_LIQUIDITY_THRESHOLD) {
              console.warn("Pool liquidity is below the minimum threshold. Swap may have high slippage.");
          }
      } catch (error) {
          console.error(`\nError checking pool liquidity:`, false, error);
          if (error instanceof Error) {
              console.error("Error message:", error.message);
          }
          console.log("Continuing with swap despite liquidity check failure...");
      }

      try {
          console.log(`\nChecking slippage tolerance...`);
          
          let nonce = await resetNonce(wallet);
          console.log(`Nonce: ${nonce}`);

          const expectedAmountOut = await swapRouter.getAmountOut(
              network.tokenInAddress,
              network.tokenOutAddress,
              FeeAmount.LOW,
              amountIn,
              { nonce: nonce }
          );

          console.log(`\nExpected amount out:\n`, expectedAmountOut);

          console.log(`\nMinimum amount out (with ${slippageTolerance * 100}% slippage tolerance): ${ethers.formatUnits(minAmountOut, tokenOutDecimals)} ${await tokenOut.symbol()}`);

      } catch (error) {
          console.error(`\nError checking slippage:`, false, error);
          if (error instanceof Error) {
              console.error("Error message:", error.message);
          }
          console.log("Continuing with swap despite slippage failure...");
      }

      const params = [
          network.tokenOutAddress,
          minAmountOut,
          wallet.address,
          deadline,
          feeBasisPoints,
          FeeAmount.LOW
      ];

      console.log(`\nSwap parameters:`, params);

      let gasEstimate: bigint = 1000n;
      try {
          gasEstimate = await estimateGas(swapRouter, 'swapExactETHForTokens', params, amountIn);
          console.log(`Estimated gas: ${gasEstimate.toString()}`);
      } catch (error) {
          console.error("Gas estimation failed:", false, error);
      }

      const uniswapRouterAddress = await swapRouter.getUniswapRouterAddress();
      console.log(`\nUniswap Router address:`, uniswapRouterAddress);

      let nonce = await resetNonce(wallet);
      console.log(`\nNonce: ${++nonce}`);

      let tx = await swapRouter.swapExactETHForTokens(...params, {
          value: amountIn,
          gasLimit: gasEstimate * 120n / 100n,
          nonce: nonce,
          maxFeePerGas: ethers.parseUnits("50", "gwei"),  // Adjust this value as needed
          maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),  // Adjust this value as needed
      });

      console.log(`Transaction sent: ${tx.hash}`);
      let receipt = await waitForTransaction(tx, 30000); // This is good sometime for testing but not reliable for production
      // const receipt = await tx.wait(); // This is more reliable than waitForTransaction for production because of it's deeper checks
      if (receipt) {
          console.log(`\nTransaction confirmed in block ${receipt.blockNumber}`);
      } else {
        console.log("Transaction taking too long, bumping gas price...");
        tx = await bumpGasPrice(wallet, tx);
        receipt = await waitForTransaction(tx);
      }

      // Final balance checks
      const finalUserEthBalance = await provider.getBalance(wallet.address);
      const finalUserTokenOutBalance = await tokenOut.balanceOf(wallet.address);

      const ethSpent = initialUserEthBalance - finalUserEthBalance;
      const tokenOutReceived = finalUserTokenOutBalance - initialUserTokenOutBalance;

      console.log(`\nETH spent: ${ethers.formatEther(ethSpent)} ETH`);
      console.log(`${await tokenOut.symbol()} received: ${ethers.formatUnits(tokenOutReceived, tokenOutDecimals)}`);

      // Calculate fee
      const expectedOutputWithoutFee = amountOut;
      const feeAmount = (expectedOutputWithoutFee * BigInt(feeBasisPoints)) / FEE_PRECISION;
      const expectedOutputAfterFee = expectedOutputWithoutFee - feeAmount;
      
      console.log(`Expected output without fee: ${ethers.formatUnits(expectedOutputWithoutFee, tokenOutDecimals)} ${await tokenOut.symbol()}`);
      console.log(`Fee amount: ${ethers.formatUnits(feeAmount, tokenOutDecimals)} ${await tokenOut.symbol()}`);
      console.log(`Expected output after fee: ${ethers.formatUnits(expectedOutputAfterFee, tokenOutDecimals)} ${await tokenOut.symbol()}`);
      
      // Calculate actual fee percentage
      const actualFeePercentage = Number(ethers.formatUnits(feeAmount, tokenOutDecimals)) / Number(ethers.formatUnits(expectedOutputWithoutFee, tokenOutDecimals)) * 100;
      console.log(`Actual Fee Percentage: ${actualFeePercentage.toFixed(4)}%`);
      
      // Calculate the difference between expected and actual received amount
      const actualReceivedBigInt = BigInt(tokenOutReceived.toString());
      const difference = actualReceivedBigInt - expectedOutputAfterFee;
      console.log(`Difference (actual - expected): ${ethers.formatUnits(difference, tokenOutDecimals)} ${await tokenOut.symbol()}`);
      
      // Additional logging for clarity
      console.log(`Actual received: ${ethers.formatUnits(actualReceivedBigInt, tokenOutDecimals)} ${await tokenOut.symbol()}`);
      console.log(`Expected after fee: ${ethers.formatUnits(expectedOutputAfterFee, tokenOutDecimals)} ${await tokenOut.symbol()}`);
            
      // Call the FeeManager contract to calculate the fee
      const contractFeeAmount = await feeManager.calculateFee(expectedOutputWithoutFee, feeBasisPoints);

      console.log(`Fee amount (local calculation): ${ethers.formatUnits(feeAmount, tokenOutDecimals)} ${await tokenOut.symbol()}`);
      console.log(`Fee amount (contract calculation): ${ethers.formatUnits(contractFeeAmount, tokenOutDecimals)} ${await tokenOut.symbol()}`);

      if (feeAmount !== contractFeeAmount) {
          console.warn("Warning: Local fee calculation does not match contract calculation!");
      } else {
          console.log(`\nFee calculations match between local script and contract.\n`);
      }

      // Estimate the gas cost
      const gasPrice = receipt?.gasPrice || tx.gasPrice || 0n;
      const gasUsed = receipt?.gasUsed || 0n;
      const gasCost = gasPrice * gasUsed;
      console.log(`Estimated gas cost: ${ethers.formatEther(gasCost)} ETH`);

      // Calculate the actual ETH amount used for the swap
      const actualSwapAmount = ethSpent - BigInt(gasCost);
      console.log(`Actual ETH amount swapped: ${ethers.formatEther(actualSwapAmount)} ETH`);

      // Calculate and display the effective exchange rate
      const effectiveRate = Number(ethers.formatUnits(tokenOutReceived, tokenOutDecimals)) / Number(ethers.formatEther(actualSwapAmount));
      console.log(`Effective exchange rate: 1 ETH = ${effectiveRate.toFixed(4)} ${await tokenOut.symbol()}\n\n`);

  } catch (error: any) {
      console.error(`\nError performing swap:\n`, false, error);
      if (error.reason) console.error("Reason:", error.reason);
      if (error.data) console.error("Error data:", error.data);
      if (error.transaction) console.error("Transaction:", error.transaction);
      throw error;
  }
}

async function performSwapTokensForTokens(networkName: string) {
  const network = networks[networkName as keyof typeof networks];

  if (!network) {
      throw new Error(`Invalid network: ${networkName}. Choose from local, sepolia, or mainnet.`);
  }

  const PRIVATE_KEY = networkName === 'local' ? process.env.LOCAL_PRIVATE_KEY : process.env.PRIVATE_KEY;

  if (!network.rpcUrl || !PRIVATE_KEY) {
      throw new Error("Please set RPC_URL and (LOCAL_PRIVATE_KEY or PRIVATE_KEY depending on your environment) in your .env file");
  }

  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`\nStarting token swap process on ${networkName}...`);

  const swapRouter = new ethers.Contract(network.swapRouterAddress, SwapRouterABI, wallet);
  const feeManager = new ethers.Contract(network.feeManagerAddress, FeeManagerABI, wallet);
  const tokenIn = new ethers.Contract(network.tokenInAddress, IERC20ABI, wallet);
  const tokenOut = new ethers.Contract(network.tokenOutAddress, IERC20ABI, wallet);

  console.log(`Connected to SwapRouter at ${network.swapRouterAddress}`);
  console.log(`Connected to FeeManager at ${network.feeManagerAddress}`);
  console.log(`Connected to tokenIn at ${network.tokenInAddress}`);
  console.log(`Connected to tokenOut at ${network.tokenOutAddress}`);

  const feeRecipient = await feeManager.getFeeRecipient();
  console.log("\nFee Recipient:", feeRecipient);

  const tokenInDecimals = await tokenIn.decimals();
  const tokenOutDecimals = await tokenOut.decimals();

  // Initial balance checks
  const initialUserTokenInBalance = await tokenIn.balanceOf(wallet.address);
  const initialUserTokenOutBalance = await tokenOut.balanceOf(wallet.address);
  const initialFeeRecipientTokenOutBalance = await tokenOut.balanceOf(feeRecipient);

  console.log(`Initial User ${await tokenIn.symbol()} Balance: ${ethers.formatUnits(initialUserTokenInBalance, tokenInDecimals)}`);
  console.log(`Initial User ${await tokenOut.symbol()} Balance: ${ethers.formatUnits(initialUserTokenOutBalance, tokenOutDecimals)}`);
  console.log(`Initial Fee Recipient ${await tokenOut.symbol()} Balance: ${ethers.formatUnits(initialFeeRecipientTokenOutBalance, tokenOutDecimals)}`);

  const amountIn = ethers.parseUnits(AMOUNT_IN, tokenInDecimals);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
  const feeBasisPoints = FEE_BASIS_POINTS; 
  
  console.log(`\nAmount in: ${ethers.formatUnits(amountIn, tokenInDecimals)} ${await tokenIn.symbol()}`);
  console.log(`Deadline: ${deadline}`);
  console.log(`Fee basis points: ${feeBasisPoints}`);

  const { amountOut, priceImpact } = await getQuote(swapRouter, network.tokenInAddress, network.tokenOutAddress, BigInt(FeeAmount.LOW), amountIn);

  console.log(`\nQuote for ${ethers.formatUnits(amountIn, tokenInDecimals)} ${await tokenIn.symbol()}:`);
  console.log(`Expected output: ${ethers.formatUnits(amountOut, tokenOutDecimals)} ${await tokenOut.symbol()}`);
  console.log(`Estimated price impact: ${priceImpact.toFixed(2)}%`);
  
  // Calculate minimum amount out based on slippage tolerance
  const slippageTolerance = SLIPPAGE_TOLERANCE;  // 0.5%
  const minAmountOut = amountOut * BigInt(Math.floor((1 - slippageTolerance) * 10000)) / 10000n;
  
  console.log(`Minimum amount out (with ${slippageTolerance * 100}% slippage tolerance): ${ethers.formatUnits(minAmountOut, tokenOutDecimals)} ${await tokenOut.symbol()}`);

  try {
      const tokenInBalance = await tokenIn.balanceOf(wallet.address);
      console.log(`${await tokenIn.symbol()} Balance: ${ethers.formatUnits(tokenInBalance, tokenInDecimals)} ${await tokenIn.symbol()}\n`);

      if (tokenInBalance < amountIn) {
          throw new Error(`Insufficient ${await tokenIn.symbol()} balance`);
      }

      // Approve SwapRouter to spend tokens
      const approveTx = await tokenIn.approve(swapRouter.address, amountIn);
      await approveTx.wait();
      console.log(`Approved SwapRouter to spend ${ethers.formatUnits(amountIn, tokenInDecimals)} ${await tokenIn.symbol()}`);

      const params = [
          network.tokenInAddress,
          amountIn,
          network.tokenOutAddress,
          minAmountOut,
          wallet.address,
          deadline,
          feeBasisPoints,
          FeeAmount.LOW
      ];

      console.log("Swap parameters:", params);

      let gasEstimate: bigint;
      try {
          gasEstimate = await estimateGas(swapRouter, 'swapExactTokensForTokens', params);
          console.log(`Estimated gas: ${gasEstimate.toString()}`);
      } catch (error) {
          console.error("Gas estimation failed:", false, error);
          gasEstimate = 1000000n;
      }

      let nonce = await resetNonce(wallet);
      console.log(`Nonce: ${nonce}`);

      const tx = await swapRouter.swapExactTokensForTokens(...params, {
          gasLimit: gasEstimate * 120n / 100n,
          nonce: nonce
      });

      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`\nTransaction confirmed in block ${receipt?.blockNumber}`);

      // Final balance checks
      const finalUserTokenInBalance = await tokenIn.balanceOf(wallet.address);
      const finalUserTokenOutBalance = await tokenOut.balanceOf(wallet.address);
      const finalFeeRecipientTokenOutBalance = await tokenOut.balanceOf(feeRecipient);

      const tokenInSpent = initialUserTokenInBalance - finalUserTokenInBalance;
      const tokenOutReceived = finalUserTokenOutBalance - initialUserTokenOutBalance;
      const feeCollected = finalFeeRecipientTokenOutBalance - initialFeeRecipientTokenOutBalance;

      console.log(`\n${await tokenIn.symbol()} spent: ${ethers.formatUnits(tokenInSpent, tokenInDecimals)}`);
      console.log(`${await tokenOut.symbol()} received by user: ${ethers.formatUnits(tokenOutReceived, tokenOutDecimals)}`);
      console.log(`Fee collected (in ${await tokenOut.symbol()}): ${ethers.formatUnits(feeCollected, tokenOutDecimals)}`);

      console.log(`\nFinal User ${await tokenIn.symbol()} Balance: ${ethers.formatUnits(finalUserTokenInBalance, tokenInDecimals)}`);
      console.log(`Final User ${await tokenOut.symbol()} Balance: ${ethers.formatUnits(finalUserTokenOutBalance, tokenOutDecimals)}`);
      console.log(`Final Fee Recipient ${await tokenOut.symbol()} Balance: ${ethers.formatUnits(finalFeeRecipientTokenOutBalance, tokenOutDecimals)}`);

      // Calculate total output and fee percentage
      const totalTokenOutOutput = tokenOutReceived + feeCollected;
      console.log(`\nTotal ${await tokenOut.symbol()} output from swap: ${ethers.formatUnits(totalTokenOutOutput, tokenOutDecimals)}`);

      const actualFeePercentage = Number(ethers.formatUnits(feeCollected, tokenOutDecimals)) / Number(ethers.formatUnits(totalTokenOutOutput, tokenOutDecimals)) * 100;
      console.log(`Actual Fee Percentage: ${actualFeePercentage.toFixed(4)}%`);

      // Calculate and display the effective exchange rate
      const effectiveRate = Number(ethers.formatUnits(totalTokenOutOutput, tokenOutDecimals)) / Number(ethers.formatUnits(tokenInSpent, tokenInDecimals));
      console.log(`Effective exchange rate: 1 ${await tokenIn.symbol()} = ${effectiveRate.toFixed(4)} ${await tokenOut.symbol()}\n\n`);

  } catch (error: any) {
      console.error(`\nError performing swap:\n`, false, error);
      if (error.reason) console.error("Reason:", error.reason);
      if (error.data) console.error("Error data:", error.data);
      if (error.transaction) console.error("Transaction:", error.transaction);
      throw error;
  }
}

async function main() {
    const networkName = process.argv[2] || 'local';
    const swapType = process.argv[3] || 'eth';

    if (!['local', 'sepolia', 'mainnet'].includes(networkName)) {
        throw new Error(`Invalid network: ${networkName}. Choose from local, sepolia, or mainnet.`);
    }

    if (!['eth', 'token'].includes(swapType)) {
        throw new Error(`Invalid swap type: ${swapType}. Choose from eth or token.`);
    }

    console.log(`Network: ${networkName}`);
    console.log(`Swap Type: ${swapType}`);

    // const liquidityDepth = await checkLiquidityDepth(poolContract, slot0.tick, 5); // Check 5 ticks in each direction
    // console.log(`Liquidity depth: ${ethers.formatEther(liquidityDepth)} WETH`);

    // const spotPrice = BigInt(slot0.sqrtPriceX96) ** 2n * BigInt(1e18) / (2n ** 192n);
    // const priceImpact = calculatePriceImpact(amountIn, expectedAmountOut, spotPrice);
    // console.log(`Estimated price impact: ${priceImpact.toFixed(2)}%`);

    try {
        if (swapType === 'eth') {
            await performSwapETHForTokens(networkName);
        } else {
            await performSwapTokensForTokens(networkName);
        }
    } catch (error) {
        console.error("Error performing swap:", false, error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error("Unhandled error:", false, error);
        process.exit(1);
    });
}
