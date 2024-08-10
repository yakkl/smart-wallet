import { ethers } from "ethers";

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL); // <Your RPC URL>
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY : '<your private key if not set in environments>', provider);

    const swapRouterAddress = "<DeployedContractAddress>";

    const swapRouterAbi = [ 
      { type: "constructor", inputs: [{ name: "_uniswapRouter", type: "address", internalType: "address" }, { name: "_WETH9", type: "address", internalType: "address" }, { name: "_feeRecipient", type: "address", internalType: "address" }, { name: "_feeBasisPoints", type: "uint256", internalType: "uint256" }], stateMutability: "nonpayable" },
      { type: "receive", stateMutability: "payable" },
      { type: "function", name: "MAX_FEE_BASIS_POINTS", inputs: [], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
      { type: "function", name: "WETH9", inputs: [], outputs: [{ name: "", type: "address", internalType: "address" }], stateMutability: "view" },
      { type: "function", name: "accumulatedFees", inputs: [], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
      { type: "function", name: "feeBasisPoints", inputs: [], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
      { type: "function", name: "feeRecipient", inputs: [], outputs: [{ name: "", type: "address", internalType: "address" }], stateMutability: "view" },
      { type: "function", name: "owner", inputs: [], outputs: [{ name: "", type: "address", internalType: "address" }], stateMutability: "view" },
      { type: "function", name: "renounceOwnership", inputs: [], outputs: [], stateMutability: "nonpayable" },
      { type: "function", name: "rescueETH", inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }], outputs: [], stateMutability: "nonpayable" },
      { type: "function", name: "rescueTokens", inputs: [{ name: "token", type: "address", internalType: "address" }, { name: "amount", type: "uint256", internalType: "uint256" }], outputs: [], stateMutability: "nonpayable" },
      { type: "function", name: "setFeeBasisPoints", inputs: [{ name: "_feeBasisPoints", type: "uint256", internalType: "uint256" }], outputs: [], stateMutability: "nonpayable" },
      { type: "function", name: "setFeeRecipient", inputs: [{ name: "_feeRecipient", type: "address", internalType: "address" }], outputs: [], stateMutability: "nonpayable" },
      { type: "function", name: "swapExactETHForTokensWithFee", inputs: [{ name: "tokenOut", type: "address", internalType: "address" }, { name: "amountOutMin", type: "uint256", internalType: "uint256" }, { name: "to", type: "address", internalType: "address" }, { name: "deadline", type: "uint256", internalType: "uint256" }], outputs: [], stateMutability: "payable" },
      { type: "function", name: "swapExactTokensForTokensWithFee", inputs: [{ name: "tokenIn", type: "address", internalType: "address" }, { name: "amountIn", type: "uint256", internalType: "uint256" }, { name: "tokenOut", type: "address", internalType: "address" }, { name: "amountOutMin", type: "uint256", internalType: "uint256" }, { name: "to", type: "address", internalType: "address" }, { name: "deadline", type: "uint256", internalType: "uint256" }], outputs: [], stateMutability: "nonpayable" }
    ];

    const swapRouter = new ethers.Contract(swapRouterAddress, swapRouterAbi, wallet);

    const usdcAddress = "MOCK_USDC_ADDRESS";
    const recipientAddress = "YOUR_ADDRESS";
    const feeAmt = 0.003;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

    // Call contract's functions, for example:
    const tx = await swapRouter.swapExactETHForTokensWithFee(
        usdcAddress,
        ethers.parseUnits("1.0", 18), // Minimum amount of tokens out
        recipientAddress,
        deadline, // Deadline: 20 minutes from now
        { value: ethers.parseEther(feeAmt.toString()) } // Sending 0.003 ETH
    );

    console.log("Swap result:", tx);
    console.log("Transaction submitted:", tx.hash);
    
    const receipt = await tx.wait();

    console.log("Transaction confirmed:", receipt.status);
}

main().catch(console.error);
