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

async function monitorEvents(contractAddress: string) {
    const filter = {
        address: contractAddress,
        fromBlock: 'latest',
    };

    provider.on(filter, (log) => {
        try {
            const decodedEvent = contractInterface.parseLog(log);
            if (!decodedEvent) {
                console.log("Unable to decode log.");
                return;
            }
            console.log(`New event detected:\nEvent: ${decodedEvent.name}`);
            decodedEvent.args.forEach((arg, i) => {
                console.log(`  Arg ${i}: ${arg}`);
            });
        } catch (error: any) {
            console.log("Error decoding log:", error.message);
        }
    });

    console.log(`Monitoring events for contract at address ${contractAddress}...`);
}

// Check for command-line arguments
const contractAddress = process.argv[2];
if (!contractAddress) {
    console.log("Please provide a contract address as an argument.");
    process.exit(1);
}

monitorEvents(contractAddress).catch(console.error);
