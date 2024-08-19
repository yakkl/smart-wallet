import { ethers } from 'ethers';

async function main() {
    // Connect to local Anvil instance
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

    // Use a pre-funded account from Anvil
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // This is the private key of the first account Anvil creates
    const signer = new ethers.Wallet(privateKey, provider);

    // Your contract ABI and bytecode
    const abi = []; // Your contract ABI
    const bytecode = '0x...'; // Your contract bytecode

    // Create contract factory
    const factory = new ethers.ContractFactory(abi, bytecode, signer);

    // Deploy the contract
    console.log('Deploying contract...');
    const contract = await factory.deploy(/* constructor arguments if any */);

    // Wait for the contract to be mined
    await contract.waitForDeployment();

    console.log('Contract deployed to:', await contract.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
