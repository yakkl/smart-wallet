import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const FORK_RPC_URL = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.LOCAL_PRIVATE_KEY;  // Your private key should be securely stored
if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is required");
}
const provider = new ethers.JsonRpcProvider(FORK_RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Global array of contracts to deploy with their parameters
const contractsToDeploy = [
    { name: "IFeeManager", params: [], existingAddress: '' },
    { name: "FeeManager", params: ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"], existingAddress: '' },
    { name: "SwapRouter", params: ["0xE592427A0AEce92De3Edee1F18E0157C05861564", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "FeeManager"], existingAddress: '' }, // Placeholder for FeeManager address and an option for existing address so it does not attempt to deploy again at a different address
    // Add more contracts here as needed
];

// Deploy the contract if it doesn't already exist - Optional
async function getExistingContractAddress(name: string, knownAddress?: string): Promise<string | null> {
    if (knownAddress) {
        const code = await provider.getCode(knownAddress);
        if (code !== "0x") {
            console.log(`${name} contract already deployed at address: ${knownAddress}`);
            return knownAddress;
        }
    }
    return null;
}

async function deployContract(
    name: string, 
    params: any[], 
    ownerAddress: string, 
    userName?: string, 
    existingAddress?: string
) {
    try {
        // Check if we already have an existing address and use it if available
        if (existingAddress) {
            console.log(`${name} contract already exists at: ${existingAddress}`);
            logDeploymentDetails(name, existingAddress, params, ownerAddress, userName, existingAddress);
            return existingAddress;
        }

        const contractABIPath = path.join(__dirname, `../out/${name}.sol/${name}.json`);
        const contractJson = JSON.parse(fs.readFileSync(contractABIPath, "utf8"));

        const factory = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet);
        const contract = await factory.deploy(...params);

        console.log(`Deploying ${name}...`);
        const tx = await contract.deploymentTransaction();  // Get the deployment transaction receipt
        if (!tx) {
            throw new Error(`Failed to deploy ${name}`);
        }

        const receipt = await tx.wait();
        const transactionHash = receipt?.hash;
        const blockNumber = receipt?.blockNumber;
        console.log(`Deployment completed successfully! ${name} Contract`, transactionHash, blockNumber);

        const contractAddress = await contract.getAddress();
        console.log(`${name} deployed to: ${contractAddress}`);

        // Log the deployment details
        logDeploymentDetails(name, contractAddress, params, ownerAddress, userName, transactionHash, blockNumber);

        return contractAddress;
    } catch (error) {
        console.error(`Error deploying ${name}:`, error);
        throw error;
    }
}

function logDeploymentDetails(
    name: string, 
    address: string, 
    params: any[], 
    ownerAddress: string, 
    userName?: string, 
    transactionHash?: string,
    blockNumber?: number,
    existingAddress?: string
) {
    const logFilePath = path.join(__dirname, "deployed_contracts.json");

    // Get the current date
    const date = new Date().toISOString();

    // Prepare the log entry
    const logEntry = {
        name,
        address,
        date,
        ownerAddress,
        userName: userName || null,
        hash: transactionHash || null,
        block: blockNumber || null,
        existingAddress: existingAddress || null,
        params: params.map(param => param.toString())  // Convert params to strings for logging
    };

    // Define the type of logs explicitly
    let logs: Array<{
        name: string; 
        address: string; 
        date: string; 
        ownerAddress: string; 
        userName: string | null; 
        hash: string | null;
        block: number | null;
        existingAddress: string | null; 
        params: string[];
    }> = [];

    // Read the existing log file, if it exists
    if (fs.existsSync(logFilePath)) {
        const existingLogs = fs.readFileSync(logFilePath, "utf8");
        logs = JSON.parse(existingLogs) as typeof logs;
    }

    // Append the new entry to the log
    logs.push(logEntry);

    // Write the updated logs back to the file
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));

    console.log(`Logged deployment of ${name} to ${logFilePath}`);
}

async function main() {
    try {
        const ownerAddress = wallet.address;  // Assuming the owner address is the wallet's address
        const userName = "someUserName";  // Optional: Replace with actual userName logic if needed

        const deployedAddresses: Record<string, string> = {};

        for (const contract of contractsToDeploy) {
            const { name, params, existingAddress } = contract;

            // Check if the contract is already deployed at the existing address
            if (existingAddress) {
                const address = await getExistingContractAddress(name, existingAddress);
                if (address) {
                    // If already deployed, store the address and continue
                    deployedAddresses[name] = address;
                    continue;
                }
            } 

            // Replace any placeholders with actual deployed addresses
            const resolvedParams = params.map(param => {
                if (typeof param === 'string' && deployedAddresses[param]) {
                    return deployedAddresses[param];
                }
                return param;
            });

            // Deploy the contract
            const contractAddress = await deployContract(name, resolvedParams, ownerAddress, userName, existingAddress);

            // Store the deployed address for future use
            deployedAddresses[name] = contractAddress;
        }
    } catch (error) {
        console.error("Error in main deployment flow:", error);
        process.exit(1);
    }
}

main();



// Example usage:
// ts-node deploy.ts

// Output:
// Deploying IFeeManager...
// IFeeManager deployed to: 0xC54051689e0931FdCF3e708b665f521f7ab42Fb0
// Deploying FeeManager...
// FeeManager deployed to: 0x00436c9F57dfFd96cECd129c04D9E488c57266cF
// Deploying SwapRouter...
// SwapRouter deployed to: 0xe4a4B3Bc2787aA913e5b4bbce907e8b213250BDe
// Deployment completed successfully! 
// SwapRouter Contract  BaseContract {
//   target: '0xe4a4B3Bc2787aA913e5b4bbce907e8b213250BDe',
//   interface: Interface {
//     fragments: [
//       [ConstructorFragment], [FallbackFragment],
//       [FunctionFragment],    [FunctionFragment],
//       [FunctionFragment],    [FunctionFragment],
//       [FunctionFragment],    [FunctionFragment],
//       [FunctionFragment],    [FunctionFragment],
//       [FunctionFragment],    [FunctionFragment],
//       [FunctionFragment],    [FunctionFragment],
//       [FunctionFragment],    [EventFragment],
//       [EventFragment],       [EventFragment],
//       [EventFragment],       [EventFragment],
//       [EventFragment],       [EventFragment],
//       [ErrorFragment],       [ErrorFragment],
//       [ErrorFragment],       [ErrorFragment],
//       [ErrorFragment],       [ErrorFragment],
//       [ErrorFragment],       [ErrorFragment],
//       [ErrorFragment]
//     ],
//     deploy: ConstructorFragment {
//       type: 'constructor',
//       inputs: [Array],
//       payable: false,
//       gas: null
//     },
//     fallback: null,
//     receive: true
//   },
//   runner: Wallet {
//     provider: JsonRpcProvider {},
//     address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
//   },
//   filters: {},
//   fallback: [AsyncFunction: method] {
//     _contract: [Circular *1],
//     estimateGas: [AsyncFunction: estimateGas],
//     populateTransaction: [AsyncFunction: populateTransaction],
//     send: [AsyncFunction: send],
//     staticCall: [AsyncFunction: staticCall]
//   },
//   [Symbol(_ethersInternal_contract)]: {}
// }
