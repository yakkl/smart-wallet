import { ethers } from 'ethers';

async function checkContractOnFork(contractAddress) {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    
    try {
        const code = await provider.getCode(contractAddress);
        if (code !== '0x') {
            console.log('Contract exists on the forked network');
            return true;
        } else {
            console.log('No contract found at this address on the forked network');
            return false;
        }
    } catch (error) {
        console.error('Error checking contract on fork:', error);
        return false;
    }
}

// Example usage:
const contractAddress = '0x...'; // Your contract address
checkContractOnFork(contractAddress);