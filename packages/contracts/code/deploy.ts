import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Load environment variables

// NOTE: Remove the comments to enable loading environment variables and comment out the 'const FORK_RPC_URL' line
// require('dotenv').config();
// const FORK_RPC_URL = process.env.FORK_RPC_URL || "http://127.0.0.1:8545";

// Comment the next line if uncommenting the above lines
const FORK_RPC_URL = "http://127.0.0.1:8545"; //process.env.FORK_RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(FORK_RPC_URL);

async function deployContract(name: string, ...args: any[]) {
    const signer = await provider.getSigner();  // Await the getSigner call to resolve the Promise

    const contractPath = path.join(__dirname, `../src/${name}.sol`);
    const contractABIPath = path.join(__dirname, `../out/${name}.json`);
    const contractJson = JSON.parse(fs.readFileSync(contractABIPath, "utf8"));

    const factory = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, signer);
    const contract = await factory.deploy(...args);

    await contract.waitForDeployment();  // Wait for the contract to be mined

    console.log(`${name} deployed to:`, await contract.getAddress());

    return contract;
}

async function main() {
    // Deploy your contracts - change the names and constructor args as needed
    const contract1 = await deployContract("Contract1", /* constructor args */);
    const contract2 = await deployContract("Contract2", /* constructor args */);
    const contract3 = await deployContract("Contract3", /* constructor args */);

    // If needed, interact with the deployed contracts
    // e.g., setting initial states or linking them together
}

main().catch((error) => {
    console.error("Error deploying contracts:", error);
    process.exit(1);
});
