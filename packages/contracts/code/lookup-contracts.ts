import { ethers } from "ethers";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const FORK_RPC_URL = process.env.SEPOLIA_RPC_URL || "http://127.0.0.1:8545";

const NETWORK = process.env.SEPOLIA_RPC_URL ? 'sepolia' : 
                (FORK_RPC_URL.includes('localhost') || FORK_RPC_URL.includes('127.0.0.1')) ? 'local' : 
                'mainnet';

console.log(`Network: ${NETWORK}`);                
const provider = new ethers.JsonRpcProvider(FORK_RPC_URL);

const abiCoder = new ethers.AbiCoder(); // Create an AbiCoder instance

// Array of event signatures to look up (example: FeeManagerDeployed and SwapRouterDeployed)
const contractEvents = [
    {
        name: "FeeManager",
        eventSignature: "FeeManagerDeployed(address indexed contractAddress, address indexed owner)",
        address: "0xe8c3F27D20472e4f3C546A3f73C04B54DD72871d",
        eventTopic: ethers.id("FeeManagerDeployed(address indexed contractAddress, address indexed owner)")  // Directly use the topic from the logs
    },
    // {
    //     name: "SwapRouter",
    //     eventSignature: "SwapRouterDeployed(address indexed contractAddress, address indexed owner)",  // Replace with actual event signature
    //     eventTopic: "0x02c2f6b92d86ddf9d3e794726e24b6331f98a6322763cd28ca13b77ca59098b3"  // Replace with the correct topic
    // }
    // Add more contract event signatures as needed
];

async function getLogsInChunks(provider: ethers.Provider, filter: any, chunkSize: number) {
  let allLogs: ethers.Log[] = [];
  const latestBlock = await provider.getBlockNumber();
  let fromBlock = filter.fromBlock;
  let toBlock = Math.min(fromBlock + chunkSize, latestBlock);

  while (fromBlock <= latestBlock) {
    const chunkFilter = { ...filter, fromBlock, toBlock };
    const logs = await provider.getLogs(chunkFilter);
    allLogs = allLogs.concat(logs);
    fromBlock = toBlock + 1;
    toBlock = Math.min(fromBlock + chunkSize, latestBlock);
  }

  return allLogs;
}

async function checkTransactionReceipts() {
  const latestBlock = await provider.getBlockNumber();
  console.log(`Checking transaction receipts from block 0 to ${latestBlock}`);
  let count = 2;
  for (let i = latestBlock; count > 0; count--, i--) { 
    const block = await provider.getBlock(i, true);
    if (block && block.transactions) {
      console.log(`Checking block: ${block.number} - ${block.transactions.length} transactions`);
      for (const tx of block.transactions) {
        console.log(`Checking transaction: ${tx}`);
        const receipt = await provider.getTransactionReceipt(tx);
        if (receipt && receipt.contractAddress) {
          console.log(`Contract deployed at: ${receipt.contractAddress}`);
          console.log(`In transaction: ${receipt}`);
          console.log('---');
        }
      }
    }
  }
}

async function lookupContracts() {
    try {
      // await checkTransactionReceipts(); // Comment out this line if you don't want to check transaction receipts (it's slow for large block ranges)

      // Specify the block range explicitly (e.g., from block 0 to the latest block)
        const fromBlock = 0;
        const toBlock = "latest";

        // Get the list of accounts on the network
        const accounts = await provider.send('eth_accounts', []);
        console.log('All accounts:', accounts);

        for (const contractEvent of contractEvents) {
            const eventSignatureHash = ethers.id(contractEvent.eventSignature);

            console.log('Event signature:', contractEvent.eventSignature, contractEvent.address); //.eventTopic);

            // Create a filter to search for the specific event in the specified block range
            const filter = {
                fromBlock,
                toBlock,
                // address: contractEvent.address,
                topics: [
                  contractEvent.eventTopic
                ]
            };
                // eventSignatureHash // Event signature hash for the event

            // Debugging output: Display the filter being used
            console.log(`Searching for ${contractEvent.name} events with filter:`, filter);

            // Get the logs that match the filter
            // const logs = await provider.getLogs(filter);
            const logs = await getLogsInChunks(provider, filter, 0x6d9af); // 0x6d9ae is about 450,000 blocks

            // Debugging output: Display the number of logs found
            console.log(`Found ${logs.length} logs for ${contractEvent.name}`);

            // Decode the logs to extract contract addresses and other details
            const contractInstances = logs.map(log => {
              console.log('log:', log);
              // Extract the indexed parameters from the topics array
              const contractAddress = log.topics[1].length === 66 
                ? ethers.getAddress(`0x${log.topics[1].slice(26)}`) 
                : ethers.getAddress(log.topics[1]);

              const ownerAddress = log.topics[2].length === 66 
                ? ethers.getAddress(`0x${log.topics[2].slice(26)}`) 
                : ethers.getAddress(log.topics[2]);

              let nonIndexedData = {};
              if (log.data !== "0x") {
                  const eventABI = contractEvent.eventSignature.replace(/indexed /g, '');
                  const decodedData = abiCoder.decode(
                      eventABI.match(/\((.*)\)/)?.[1]?.split(",").filter(Boolean) || [],
                      log.data
                  );
                  nonIndexedData = { ...decodedData };
              }

              return {
                  contractAddress,
                  ownerAddress,
                  transactionHash: log.transactionHash
              };
            }).filter(contract => contract.contractAddress !== '0x0000000000000000000000000000000000000000');


            // Output the results for this contract type
            const contractCount = contractInstances.length;
            console.log(`\nFound ${contractCount} ${contractEvent.name} Contracts:`);

            contractInstances.forEach((contract, index) => {
                console.log(`\nContract ${index + 1}:`);
                console.log(`Contract Address: ${contract.contractAddress}`);
                console.log(`Owner Address: ${contract.ownerAddress}`);
                console.log(`Transaction Hash: ${contract.transactionHash}`);
            });
        }
    } catch (error) {
        console.error("Error looking up contracts:", false, error);
        process.exit(1);
    }
}

console.log(ethers.id("FeeManagerDeployed(address indexed contractAddress, address indexed owner)"));

// Execute the lookup
lookupContracts();

