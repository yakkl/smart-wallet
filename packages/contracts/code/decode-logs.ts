#!/usr/bin/env ts-node

import { ethers } from "ethers";
import * as dotenv from 'dotenv';

dotenv.config();

const FORK_RPC_URL = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(FORK_RPC_URL);

// Replace this with the ABI of the contract you're interested in
const contractAbi = [
    // Example ABI for an ERC20 contract
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
    // Add more event signatures as required
];

const contractInterface = new ethers.Interface(contractAbi);

async function decodeLogs(txHash: string) {
    const receipt = await provider.getTransactionReceipt(txHash);

    if (receipt && receipt.logs.length > 0) {
        console.log(`Logs found in transaction ${txHash}:`);
        receipt.logs.forEach((log, index) => {
            try {
                const decodedEvent = contractInterface.parseLog(log);
                console.log(`\nLog ${index + 1}:`);
                if (!decodedEvent) {
                    console.log("Unable to decode log.");
                    return;
                }
                console.log(`Event: ${decodedEvent.name}`);
                decodedEvent.args.forEach((arg, i) => {
                    console.log(`  Arg ${i}: ${arg}`);
                });
            } catch (error) {
                console.log(`Error decoding log ${index + 1}:`, error.message);
            }
        });
    } else {
        console.log(`No logs found in transaction ${txHash}.`);
    }
}

// Check for command-line arguments
const txHash = process.argv[2];
if (!txHash) {
    console.error("Please provide a transaction hash as an argument.");
    process.exit(1);
}

decodeLogs(txHash).catch(console.error);
