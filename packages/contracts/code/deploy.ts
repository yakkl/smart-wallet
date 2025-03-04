import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const FORK_RPC_URL = process.env.SEPOLIA_RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = (FORK_RPC_URL === "http://127.0.0.1:8545") ? process.env.LOCAL_PRIVATE_KEY : process.env.PRIVATE_KEY;  // Your private key should be securely stored. Only local keys are different.
if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is required");
}

const NETWORK = process.env.SEPOLIA_RPC_URL ? 'sepolia' : 
                (FORK_RPC_URL.includes('localhost') || FORK_RPC_URL.includes('127.0.0.1')) ? 'local' : 
                'mainnet';

const provider = new ethers.JsonRpcProvider(FORK_RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider); // NOTE: Replace with your actual private key AND it does not have to belong to the recepient address

const OWNER_ADDRESS           = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";  // Replace with actual owner address - NOT currently used but matches the PRIVATE_KEY address
const RECEPIENT_ADDRESS       = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";  // Replace with actual recipient address
const UNISWAP_QUOTER_ADDRESS  = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";  // Uniswap Quoter address
const UNISWAP_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";  // Uniswap Factory address
const UNISWAP_ROUTER_ADDRESS  = "0xE592427A0AEce92De3Edee1F18E0157C05861564";  // Uniswap Router address
const WETH_ADDRESS            = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";  // Replace with actual WETH address

// FeeManager params: [ownerAddress]
// SwapRouter params: [UniswapRouterAddress, WETH, FeeManager Address, Quoter Address, Factory Address]

// Global array of contracts to deploy with their parameters
const contractsToDeploy = [
    // { name: "IFeeManager", params: [], existingAddress: "" },  // NOTE: IFeeManager is an interface only so it need not be deployed. This is here to show how to add more contracts
    { name: "FeeManager", params: [RECEPIENT_ADDRESS], existingAddress: "" }, 
    { name: "SwapRouter", params: [
        UNISWAP_ROUTER_ADDRESS, 
        WETH_ADDRESS, 
        "FeeManager",
        UNISWAP_QUOTER_ADDRESS, // Quoter address - mainnet or forked mainnet
        UNISWAP_FACTORY_ADDRESS  // Factory address - mainnet or forked mainnet
    ],  existingAddress: "" }, 
    { name: "YAKKL", params: [OWNER_ADDRESS], existingAddress: "" },  // NOTE: YAKKL is a WIP and only for testing
    // Add more contracts here as needed
];

// NOTE: Address examples
// 'FeeManager' is a placeholder for FeeManager address and an option for existing address so it does not attempt to deploy again at a different address
// 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 - Owner address on local
// 0xE592427A0AEce92De3Edee1F18E0157C05861564 - UniswapRouter address on mainnet??
// 0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD - UniswapRouter address on sepolia and mainnet (universal router)
// 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 - WETH address on mainnet
// 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14 - WETH address on sepolia

// Check if the provided value is a valid Ethereum address
function isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
}

// Function to check contracts' parameters for valid addresses
function checkContracts(contracts: Array<{ name: string, params: any[], existingAddress?: string }>): void {
    contracts.forEach(contract => {
        contract.params.forEach((param, index) => {
            if (typeof param === 'string' && param.startsWith('0x')) {
                if (!isValidAddress(param)) {
                    throw new Error(`Invalid address parameter detected in contract "${contract.name}" at index ${index}: ${param}`);
                }
            }
        });
    });
}

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
        // More advanced checking can be done here
        if (existingAddress) {
            console.log(`${name} contract already exists at: ${existingAddress}`);
            logDeploymentDetails(name, existingAddress, params, ownerAddress, userName, existingAddress);
            return existingAddress;
        }

        const contractABIPath = path.join(__dirname, `../out/${name}.sol/${name}.json`);
        const contractJson = JSON.parse(fs.readFileSync(contractABIPath, "utf8"));

        const factory = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet);
        const contract = await factory.deploy(...params);

        console.log(`\nDeploying ${name}...`);
        const tx = contract.deploymentTransaction();  // Get the deployment transaction receipt
        if (!tx) {
            throw new Error(`Failed to deploy ${name}`);
        }

        const receipt = await tx.wait();
        const transactionHash = receipt?.hash;
        const blockNumber = receipt?.blockNumber;
        const gasUsed = receipt?.gasUsed;
        const gasPrice = receipt?.gasPrice;
        const transactionFee = gasUsed && gasPrice ? ethers.formatEther(gasUsed * gasPrice) : null;

        console.log(`Deployment completed successfully! ${name} Contract`, transactionHash, blockNumber);
        console.log(`Gas Used: ${gasUsed}, Gas Price: ${gasPrice}, Transaction Fee: ${transactionFee} ETH`);

        const contractAddress = await contract.getAddress();
        console.log(`${name} deployed to: ${contractAddress}`);

        // Log the deployment details
        logDeploymentDetails(name, contractAddress, params, ownerAddress, userName, transactionHash, blockNumber, transactionFee, gasPrice?.toString(), gasUsed?.toString());

        return contractAddress;
    } catch (error) {
        console.error(`Error deploying ${name}:`, false, error);
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
    transactionFee?: string | null,
    gasPrice?: string | null,
    gasUsed?: string | null,
    existingAddress?: string
) {
    const logFilePath = path.join(__dirname, `deployed_${NETWORK}_contracts.json`);

    // Get the current date
    const date = new Date().toISOString();

    // Prepare the log entry
    const logEntry = {
        name,
        address,
        date,
        network: NETWORK,
        ownerAddress,
        userName: userName || null,
        hash: transactionHash || null,
        block: blockNumber || null,
        transactionFee: transactionFee || null,
        gasPrice: gasPrice || null,
        gasUsed: gasUsed || null,
        existingAddress: existingAddress || null,
        params: params.map(param => param.toString())  // Convert params to strings for logging
    };

    // Define the type of logs explicitly
    let logs: Array<{
        name: string; 
        address: string; 
        date: string; 
        network: string;
        ownerAddress: string; 
        userName: string | null; 
        hash: string | null;
        block: number | null;
        transactionFee: string | null;
        gasPrice: string | null;
        gasUsed: string | null;
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

    console.log(`Logged deployment of ${name} to ${logFilePath}\n`);
}

async function main() {
    try {
        const ownerAddress = wallet.address;  // Assuming the owner address is the wallet's address
        const userName = "someUserName";  // Optional: Replace with actual userName logic if needed

        // Check contracts for valid addresses before deploying
        checkContracts(contractsToDeploy);
        
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
        console.error("Error in main deployment flow:", false, error);
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

