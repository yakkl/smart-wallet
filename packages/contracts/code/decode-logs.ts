import { ethers } from "ethers";
import * as dotenv from 'dotenv';

dotenv.config();

const FORK_RPC_URL = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(FORK_RPC_URL);

// Replace this with the ABI of the contract you're interested in
const contractAbi = [
  // Example ABI snippet for reference
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  // Add the ABI definitions for the events you're working with
];

const contractInterface = new ethers.Interface(contractAbi);

async function decodeLogs(logs: ethers.Log[]) {
    logs.forEach((log, index) => {
        console.log(`\nLog ${index + 1}:`);
        console.log(log);

        // Decode the event
        try {
            const decodedEvent = contractInterface.parseLog(log);

            console.log(`Decoded Event: ${decodedEvent.name}`);
            decodedEvent.args.forEach((arg, i) => {
                console.log(`  Arg ${i}: ${arg}`);
            });
        } catch (error) {
            console.log("Error decoding log:", error);
        }
    });
}

// Example function to gather logs and decode them
async function gatherAndDecodeLogs(txHash: string) {
    const receipt = await provider.getTransactionReceipt(txHash);

    if (receipt && receipt.logs.length > 0) {
        console.log(`Logs found in transaction ${txHash}:`);
        decodeLogs(receipt.logs);
    } else {
        console.log(`No logs found in transaction ${txHash}.`);
    }
}

// Replace with your actual transaction hash
const txHash = "0x218b632d932371478d1ae5a01620ebab1a2030f9dad6f8fba4a044ea6335a57e";

gatherAndDecodeLogs(txHash);
