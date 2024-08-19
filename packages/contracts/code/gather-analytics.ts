#!/usr/bin/env ts-node

import { ethers } from "ethers";
import * as dotenv from 'dotenv';

dotenv.config();

const FORK_RPC_URL = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(FORK_RPC_URL);

// Replace this with the ABI of the contract you're interested in
const contractAbi = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

const contractInterface = new ethers.Interface(contractAbi);

async function gatherAnalytics(contractAddress: string, fromBlock: number, toBlock: string | number) {
    const filter = {
        address: contractAddress,
        fromBlock,
        toBlock,
    };

    const logs = await provider.getLogs(filter);
    logs.forEach((log, index) => {
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

    console.log(`Total logs gathered: ${logs.length}`);
}

// Check for command-line arguments
const contractAddress = process.argv[2];
const fromBlock = parseInt(process.argv[3], 10);
const toBlock: string | number = process.argv[4] === 'latest' ? 'latest' : parseInt(process.argv[4], 10);

if (!contractAddress || isNaN(fromBlock) || (!toBlock && toBlock.toString() !== 'latest')) {
    console.error("Please provide a contract address, fromBlock, and toBlock as arguments.");
    process.exit(1);
}

gatherAnalytics(contractAddress, fromBlock, toBlock).catch(console.error);
