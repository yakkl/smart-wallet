import { ethers } from "ethers";
import * as dotenv from 'dotenv';

dotenv.config();

const FORK_RPC_URL = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(FORK_RPC_URL);

async function getTransactionLogs(txHash: string) {
    const receipt = await provider.getTransactionReceipt(txHash);

    if (receipt && receipt.logs.length > 0) {
        console.log(`Logs found in transaction ${txHash}:`);
        receipt.logs.forEach((log, index) => {
            console.log(`Log ${index + 1}:`);
            console.log(log);
        });
    } else {
        console.log(`No logs found in transaction ${txHash}.`);
    }
}

// Replace with your actual transaction hash
const txHash = "0x2d759868c67411a20068f64d79a7761c1f43ea30a7310cde4692a248593f3b7a";

getTransactionLogs(txHash);
