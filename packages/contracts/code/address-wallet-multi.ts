import { ethers } from "ethers";

const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const YAKKL_ADDRESS = "0x36B81ebd01C31643BAF132240C8Bc6874B329c4C";

// Basic ERC20 ABI (you might need more functions depending on your needs)
const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

const provider = new ethers.JsonRpcProvider("http://localhost:8545");

// Create contract instances
const weth = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider);
const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
const dai = new ethers.Contract(DAI_ADDRESS, ERC20_ABI, provider);
const yakkl = new ethers.Contract(YAKKL_ADDRESS, ERC20_ABI, provider);

// Check balances
async function checkBalances(address: string) {
    const ethBalance = await provider.getBalance(address);
    const wethBalance = await weth.balanceOf(address);
    const usdcBalance = await usdc.balanceOf(address);
    const daiBalance = await dai.balanceOf(address);
    const yakklBalance = await yakkl.balanceOf(address);

    console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
    console.log(`WETH Balance: ${ethers.formatEther(wethBalance)} WETH`);
    console.log(`USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`); // USDC has 6 decimals
    console.log(`DAI Balance: ${ethers.formatEther(daiBalance)} DAI`);
    console.log(`YAKKL Balance: ${ethers.formatEther(yakklBalance)} YAKKL`);
}

// Use it like this:
checkBalances("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266").then(); // One of anvil's standard test address

// 1st test account - 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
// 3rd test account - 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc
// NOTE: Ethereum address such as 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 is the address of ETH by default so there is no need to specifically create a contract instance for ETH (assuming using a provider). However, there are large number of EVM based token smart contracts. This address will get stored in the contract the first time any value is sent to it. This is how the contract knows who the owner is. Most of the current wallets like YAKKL Smart Wallet, Metamask, and others support a number of ERC20 tokens by default. Because of this, they manage the contract instances for you so it shows that you have a balance of the token in your wallet. 
