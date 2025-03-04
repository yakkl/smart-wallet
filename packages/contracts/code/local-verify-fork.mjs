import { ethers } from "ethers";

async function verifyFork() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  try {
      const network = await provider.getNetwork();
      console.log('Connected to network:', network.name);
      console.log('Chain ID:', network.chainId);
      
      // Mainnet has a chain ID of 1
      if (network.chainId === 1n) {
          console.log('This appears to be a fork of mainnet');
      } else {
          console.log('This does not appear to be a mainnet fork');
      }
  } catch (error) {
      console.error('Error verifying fork:', false, error);
  }
}

verifyFork();


// Example usage:
// node --experimental-modules local-verify-fork.mjs
// OR
// ts-node 
