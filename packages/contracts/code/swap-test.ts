import { ethers } from "ethers";
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { FeeAmount } from '@uniswap/v3-sdk'

dotenv.config();

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
        swapRouterAddress: "0xbc153693bfae1ca202872a382aed20a1306c9200",
        feeManagerAddress: "0xcd9bc6ce45194398d12e27e1333d5e1d783104dd",
        tokenInAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        tokenOutAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    },
    sepolia: {
        rpcUrl: process.env.SEPOLIA_RPC_URL,
        swapRouterAddress: "0x13E24Cf844220a161A8b7d6c910C8C33c95BdC47",
        feeManagerAddress: "0x8544ceaB19038024A0178B8579918F7233638b61",
        tokenInAddress: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
        tokenOutAddress: "0x29f2D40B0605204364af54EC677bD022dA425d03"
    },
    mainnet: {
        rpcUrl: process.env.MAINNET_RPC_URL,
        swapRouterAddress: "0x", // Replace with the actual SwapRouter address
        feeManagerAddress: "0x", // Replace with the actual FeeManager address
        tokenInAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        tokenOutAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    }
};

async function checkUniswapPoolLiquidity(provider: ethers.Provider, tokenAAddress: string, tokenBAddress: string, fee: number): Promise<{ liquidityTokenA: bigint, liquidityTokenB: bigint }> {
  console.log(`Checking liquidity for pool: ${tokenAAddress} - ${tokenBAddress}`);
  try {
    const factory = new ethers.Contract("0x1F98431c8aD98523631AE4a59f267346ea31F984", ["function getPool(address,address,uint24) external view returns (address)"], provider);
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
    console.error("Error in checkUniswapPoolLiquidity:", error);
    throw error;
  }
}

async function estimateGas(swapRouter: ethers.Contract, method: string, params: any, value: bigint = 0n): Promise<bigint> {
    try {
        const gasEstimate = await swapRouter[method].estimateGas(...params, { value });
        console.log(`\nEstimated gas: ${gasEstimate.toString()}`);
        return gasEstimate;
    } catch (error: any) {
        console.error("Gas estimation failed:", error);
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
  fee: number,
  amountIn: bigint
): Promise<{ amountOut: bigint, priceImpact: number }> {
  const [amountOut, priceImpact] = await swapRouter.getQuote.staticCall(tokenIn, tokenOut, fee, amountIn);
  return {
      amountOut: BigInt(amountOut.toString()),
      priceImpact: Number(priceImpact) / 100  // Convert basis points to percentage
  };
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
    console.error(`\nError in getETHQuote:\n`, error);
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

    // console.log("SwapRouter ABI:", JSON.stringify(SwapRouterABI, null, 2));
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

    // swapRouter.on("LogMessage", (message, tokenOut, fee, amountIn) => {
    //   console.log("LogMessage:", message, tokenOut, fee.toString(), amountIn.toString());
    // });
  
    // swapRouter.on("LogQuoteResult", (amountOut, priceImpact) => {
    //   console.log("LogQuoteResult:", amountOut.toString(), priceImpact.toString());
    // });

    const amountIn = ethers.parseEther("0.001");
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
    const feeBasisPoints = 875;
    
    console.log(`Amount in: ${ethers.formatEther(amountIn)} ETH`);
    console.log(`Deadline: ${deadline}`);
    console.log(`Fee basis points: ${feeBasisPoints}`);

    const { amountOut, priceImpact } = await getETHQuote(swapRouter, network.tokenOutAddress, BigInt(FeeAmount.LOW), amountIn);

    console.log(`Quote for ${ethers.formatEther(amountIn)} ETH:`);
    console.log(`Expected output: ${ethers.formatUnits(amountOut, await tokenOut.decimals())} ${await tokenOut.symbol()}`);
    console.log(`Estimated price impact: ${priceImpact.toFixed(2)}%`);
    
    // Calculate minimum amount out based on slippage tolerance
    const slippageTolerance = 0.005;  // 0.5%
    const minAmountOut = amountOut * BigInt(Math.floor((1 - slippageTolerance) * 10000)) / 10000n; // Using this will state you are implementing a slippage tolerance
    // const minAmountOut = 0n; // Uncomment this line to implement NO slippage tolerance 
    
    console.log(`Minimum amount out (with ${slippageTolerance * 100}% slippage tolerance): ${ethers.formatUnits(minAmountOut, await tokenOut.decimals())} ${await tokenOut.symbol()}`);
    
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
          poolLiquidity = await checkUniswapPoolLiquidity(provider, network.tokenInAddress, network.tokenOutAddress, FeeAmount.LOW);
          console.log(`\nWETH/USDC Pool Liquidity:`);
          console.log(`WETH: ${ethers.formatEther(poolLiquidity.liquidityTokenA)} WETH`);
          console.log(`USDC: ${ethers.formatUnits(poolLiquidity.liquidityTokenB, await tokenOut.decimals())} USDC\n`);
          
          if (poolLiquidity.liquidityTokenA === 0n && poolLiquidity.liquidityTokenB === 0n) {
            console.warn("Warning: Pool liquidity appears to be very low. The swap may fail or have high slippage.");
          }

          const MINIMUM_LIQUIDITY_THRESHOLD = ethers.parseEther("10"); // Example: 10 WETH

          if (poolLiquidity.liquidityTokenA < MINIMUM_LIQUIDITY_THRESHOLD) {
              console.warn("Pool liquidity is below the minimum threshold. Swap may have high slippage.");
              // Optionally, you can throw an error here to prevent the swap
              // throw new Error("Insufficient liquidity");
          }
        } catch (error) {
          console.error(`\nError checking pool liquidity:`, error);
          if (error instanceof Error) {
            console.error("Error message:", error.message);
          }
          console.log("Continuing with swap despite liquidity check failure...");
        }

        try {
          console.log(`Checking slippage tolerance...`);
          
          // This will perform a transaction
          const expectedAmountOut = await swapRouter.getAmountOut(
            network.tokenInAddress,
            network.tokenOutAddress,
            FeeAmount.LOW,
            amountIn
          );

          console.log('Expected amount out:', expectedAmountOut);
          // console.log(`Expected amount out: ${ethers.formatUnits(expectedAmountOut, await tokenOut.decimals())} ${await tokenOut.symbol()}`);
          
          // const slippageTolerance = 0.005; // 0.5%
          // const minAmountOut = calculateMinimumAmountOut(expectedAmountOut, slippageTolerance);
          
          // console.log(`Minimum amount out: ${ethers.formatUnits(minAmountOut, await tokenOut.decimals())} ${await tokenOut.symbol()}`);

          const slippageTolerance = 0.005; // 0.5%
          const minAmountOut = amountOut * BigInt(Math.floor((1 - slippageTolerance) * 10000)) / 10000n;

          console.log(`Minimum amount out (with ${slippageTolerance * 100}% slippage tolerance): ${ethers.formatUnits(minAmountOut, await tokenOut.decimals())} ${await tokenOut.symbol()}`);

        } catch (error) {
          console.error(`\nError checking slippage:`, error);
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

        console.log("Swap parameters:", params);

        let gasEstimate: bigint = 1000n; // Use a default value for gas estimate
        try {
          // const gasEstimate = await swapRouter.swapExactETHForTokens.estimateGas(...params, {value: amountIn});
          gasEstimate = await estimateGas(swapRouter, 'swapExactETHForTokens', params, amountIn);
          console.log(`Estimated gas: ${gasEstimate.toString()}`);
        } catch (error) {
          console.error("Gas estimation failed:", error);
        }

        const uniswapRouterAddress = await swapRouter.getUniswapRouterAddress();
        console.log("Uniswap Router address:", uniswapRouterAddress);

        let nonce = await resetNonce(wallet);
        console.log(`Nonce: ${nonce}`);

        const tx = await swapRouter.swapExactETHForTokens(...params, {
          value: amountIn,
          gasLimit: gasEstimate * 120n / 100n,  //1000000 // Use a fixed gas limit for now - can also use estimateGas to get a more accurate value
          nonce: nonce
        });

        console.log(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`\nTransaction confirmed in block ${receipt?.blockNumber}`);

        const tokenOutBalance = await tokenOut.balanceOf(wallet.address);
        console.log(`\nReceived ${ethers.formatUnits(tokenOutBalance, await tokenOut.decimals())} ${await tokenOut.symbol()}`);

        const feeManagerETHBalance = await provider.getBalance("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
        console.log(`\nFee recipient balance: ${feeManagerETHBalance}`);
        // console.log(`\nFeeManager ETH balance: ${ethers.formatEther(feeManagerETHBalance)} ETH`);

    } catch (error: any) {
        console.error(`\nError performing swap:\n`, error);
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

  const amountIn = ethers.parseUnits("0.001", await tokenIn.decimals());
  const minAmountOut = 0n;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
  const feeBasisPoints = 0n;

  console.log(`Swapping ${ethers.formatUnits(amountIn, await tokenIn.decimals())} ${await tokenIn.symbol()} for ${await tokenOut.symbol()}...`);

  try {
      const tokenInBalance = await tokenIn.balanceOf(wallet.address);
      console.log(`${await tokenIn.symbol()} Balance: ${ethers.formatUnits(tokenInBalance, await tokenIn.decimals())} ${await tokenIn.symbol()}\n`);

      if (tokenInBalance < amountIn) {
          throw new Error(`Insufficient ${await tokenIn.symbol()} balance`);
      }

      const uniswapRouterAddress = await swapRouter.getUniswapRouterAddress();
      console.log("Uniswap Router address:", uniswapRouterAddress);

      // Approve SwapRouter to spend tokens
      const approveTx = await tokenIn.approve(swapRouter.address, amountIn);
      await approveTx.wait();
      console.log(`Approved SwapRouter to spend ${ethers.formatUnits(amountIn, await tokenIn.decimals())} ${await tokenIn.symbol()}`);

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

      // Estimate gas
      try {
          const gasEstimate = await swapRouter.swapExactTokensForTokens.estimateGas(...params, {value: amountIn});
          console.log(`Estimated gas: ${gasEstimate.toString()}`);
      } catch (error) {
          console.error("Gas estimation failed:", error);
      }

      const tx = await swapRouter.swapExactTokensForTokens(...params, {
          gasLimit: 1000000 // Use a fixed gas limit for now
      });

      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`\nTransaction confirmed in block ${receipt?.blockNumber}`);

      const tokenOutBalance = await tokenOut.balanceOf(wallet.address);
      console.log(`\nReceived ${ethers.formatUnits(tokenOutBalance, await tokenOut.decimals())} ${await tokenOut.symbol()}`);

      const feeManagerTokenBalance = await tokenOut.balanceOf("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
      console.log(`\nFeeManager ${await tokenOut.symbol()} balance: ${feeManagerTokenBalance}, ${await tokenOut.decimals()} ${await tokenOut.symbol()}`);

  } catch (error: any) {
      console.error(`\nError performing swap:\n`, error);
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
        console.error("Error performing swap:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error("Unhandled error:", error);
        process.exit(1);
    });
}
