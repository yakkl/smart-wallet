import { ethers } from "ethers";
import * as dotenv from 'dotenv';

dotenv.config();

const FORK_RPC_URL = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(FORK_RPC_URL);

async function getAllLogsPaginated(startBlock: number, endBlock: number, blockStep: number = 2000, maxLogs: number = 5000) {
    let allLogs: ethers.Log[] = [];
    
    try {
        for (let currentBlock = startBlock; currentBlock <= endBlock; currentBlock += blockStep) {
            if (allLogs.length >= maxLogs) {
                console.log(`Reached the maximum log limit of ${maxLogs}. Stopping.`);
                break;
            }

            const fromBlock = currentBlock;
            const toBlock = Math.min(currentBlock + blockStep - 1, endBlock);

            console.log(`Fetching logs from block ${fromBlock} to ${toBlock}...`);

            const filter = {
                fromBlock,
                toBlock,
            };

            const logs = await provider.getLogs(filter);
            console.log(`Found ${logs.length} logs in block range ${fromBlock} to ${toBlock}.`);
            allLogs = allLogs.concat(logs);

            if (allLogs.length >= maxLogs) {
                allLogs = allLogs.slice(0, maxLogs); // Ensure we do not exceed maxLogs
            }
        }

        console.log(`Total logs gathered: ${allLogs.length}`);
        allLogs.forEach((log, index) => {
            console.log(`\nLog ${index + 1}:`);
            console.log(log);
        });

    } catch (error) {
        console.error("Error gathering logs:", false, error);
    }
}

async function getLatestBlockInfo() {
    try {
        const latestBlockNumber = await provider.getBlockNumber();
        const latestBlock = await provider.getBlock(latestBlockNumber);

        if (!latestBlock || latestBlock.transactions.length === 0) {
            console.log("No transactions found in the latest block.");
            return { latestBlockNumber, logCount: 0 };
        }

        let logCount = 0;
        console.log(`Processing ${latestBlock.transactions.length} transactions from block ${latestBlockNumber}...`);

        for (let i = 0; i < latestBlock.transactions.length; i++) {
            const txHash = latestBlock.transactions[i];
            const receipt = await provider.getTransactionReceipt(txHash);

            if (receipt) {
                logCount += receipt.logs.length;
            } else {
                console.log(`Receipt for transaction ${txHash} is not yet available.`);
            }

            if (i % 10 === 0) {
                console.log(`Processed ${i + 1} of ${latestBlock.transactions.length} transactions...`);
            }
        }

        console.log(`Finished processing block ${latestBlockNumber}. Total logs found: ${logCount}`);
        return { latestBlockNumber, logCount };
    } catch (error) {
        console.error("Error getting latest block info:", false, error);
        return undefined;
    }
}

// Replace with the block range you want to search
const startBlock = 0;
const maxLogs = 10;
const blockStep = 2000;

getLatestBlockInfo().then((result) => {
    if (result) {
        const { latestBlockNumber } = result;
        getAllLogsPaginated(startBlock, latestBlockNumber, blockStep, maxLogs);
    } else {
        console.log("Could not retrieve latest block information.");
    }
});
