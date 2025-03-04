import { ethers } from 'ethers';

// Your contract ABI
const contractABI = [{"type":"constructor","inputs":[{"name":"_uniswapRouter","type":"address","internalType":"address"},{"name":"_WETH9","type":"address","internalType":"address"},{"name":"_feeManager","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"receive","stateMutability":"payable"},{"type":"function","name":"WETH9","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"feeManager","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IFeeManager"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"pause","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"paused","inputs":[],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"rescueETH","inputs":[{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"rescueTokens","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"swapExactETHForTokensWithFee","inputs":[{"name":"tokenOut","type":"address","internalType":"address"},{"name":"amountOutMin","type":"uint256","internalType":"uint256"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"},{"name":"feeBasisPoints","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"swapExactTokensForTokensWithFee","inputs":[{"name":"tokenIn","type":"address","internalType":"address"},{"name":"amountIn","type":"uint256","internalType":"uint256"},{"name":"tokenOut","type":"address","internalType":"address"},{"name":"amountOutMin","type":"uint256","internalType":"uint256"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"},{"name":"feeBasisPoints","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"uniswapRouter","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract ISwapRouter"}],"stateMutability":"view"},{"type":"function","name":"unpause","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"ETHRescued","inputs":[{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"FeeAdjusted","inputs":[{"name":"adjustedFee","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"Paused","inputs":[{"name":"account","type":"address","indexed":false,"internalType":"address"}],"anonymous":false},{"type":"event","name":"SwapCompleted","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"amountIn","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"amountOut","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"fee","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"TokensRescued","inputs":[{"name":"token","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"Unpaused","inputs":[{"name":"account","type":"address","indexed":false,"internalType":"address"}],"anonymous":false},{"type":"error","name":"AddressEmptyCode","inputs":[{"name":"target","type":"address","internalType":"address"}]},{"type":"error","name":"AddressInsufficientBalance","inputs":[{"name":"account","type":"address","internalType":"address"}]},{"type":"error","name":"EnforcedPause","inputs":[]},{"type":"error","name":"ExpectedPause","inputs":[]},{"type":"error","name":"FailedInnerCall","inputs":[]},{"type":"error","name":"OwnableInvalidOwner","inputs":[{"name":"owner","type":"address","internalType":"address"}]},{"type":"error","name":"OwnableUnauthorizedAccount","inputs":[{"name":"account","type":"address","internalType":"address"}]},{"type":"error","name":"ReentrancyGuardReentrantCall","inputs":[]},{"type":"error","name":"SafeERC20FailedOperation","inputs":[{"name":"token","type":"address","internalType":"address"}]}];

// Your contract address
const contractAddress = '0x...'; // Replace with your contract's address

// Set up provider (e.g., using Infura)
const provider = new ethers.JsonRpcProvider('');

// Create contract instance
const contract = new ethers.Contract(contractAddress, contractABI, provider);

// Example: Call a view function
async function getOwner() {
    try {
        const owner = await contract.owner();
        console.log('Contract owner:', owner);
    } catch (error) {
        console.error('Error getting owner:', false, error);
    }
}

getOwner();

// Example: Call a state-changing function (requires a signer)
async function pauseContract() {
    const privateKey = ''; // Be very careful with private keys!
    const signer = new ethers.Wallet(privateKey, provider);
    const contractWithSigner = contract.connect(signer);

    try {
        const tx = await contractWithSigner.pause();
        console.log('Pause transaction sent:', tx.hash);
        await tx.wait();
        console.log('Contract paused');
    } catch (error) {
        console.error('Error pausing contract:', false, error);
    }
}

// Be cautious when calling state-changing functions
// pauseContract();
