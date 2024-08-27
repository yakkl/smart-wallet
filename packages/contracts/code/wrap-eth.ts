import { ethers } from 'ethers';

// NOTE: If you are using a local fork of the Ethereum mainnet, you can wrap ETH to WETH using the following code snippet:

async function wrapETH(amount: string) {
  const provider = new ethers.JsonRpcProvider('http://localhost:8545'); // Your Anvil URL
  const signer = await provider.getSigner();

  // WETH contract address (this is the mainnet address, it should be the same on your fork)
  const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

  // WETH contract ABI (we only need the deposit function)
  const WETH_ABI = [
    'function deposit() public payable',
    'function balanceOf(address account) public view returns (uint256)'
  ];

  const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, signer);

  // Convert the amount to Wei
  const amountInWei = ethers.parseEther(amount);

  console.log(`Wrapping ${amount} ETH to WETH...`);

  // Deposit ETH to get WETH
  const tx = await wethContract.deposit({ value: amountInWei });
  await tx.wait();

  console.log(`Successfully wrapped ${amount} ETH to WETH`);

  // Check WETH balance
  const wethBalance = await wethContract.balanceOf(await signer.getAddress());
  console.log(`New WETH balance: ${ethers.formatEther(wethBalance)} WETH`);
}

// Usage
wrapETH('1.0'); // Wrap 1 ETH to WETH
