import { ethers } from "ethers";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const FORK_RPC_URL = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(FORK_RPC_URL);

const abiCoder = new ethers.AbiCoder(); // Create an AbiCoder instance

// Array of event signatures to look up (example: FeeManagerDeployed and SwapRouterDeployed)
const contractEvents = [
    {
        name: "FeeManager",
        eventSignature: "FeeManagerDeployed(address indexed contractAddress, address indexed owner)",
        eventTopic: "0xfa045bba0aaa573c9fce1a0687c43ba8719549bb4f5a33dbc28f6f2ccc86e360"  // Directly use the topic from the logs
    },
    // {
    //     name: "SwapRouter",
    //     eventSignature: "SwapRouterDeployed(address indexed contractAddress, address indexed owner)",  // Replace with actual event signature
    //     eventTopic: "0x02c2f6b92d86ddf9d3e794726e24b6331f98a6322763cd28ca13b77ca59098b3"  // Replace with the correct topic
    // }
    // Add more contract event signatures as needed
];

async function lookupContracts() {
    try {
        // Specify the block range explicitly (e.g., from block 0 to the latest block)
        const fromBlock = 0;
        const toBlock = "latest";

        for (const contractEvent of contractEvents) {
            const eventSignatureHash = ethers.id(contractEvent.eventSignature);

            console.log('Event signature:', contractEvent.eventSignature, contractEvent.eventTopic);

            // Create a filter to search for the specific event in the specified block range
            const filter = {
                fromBlock,
                toBlock,
                topics: [
                  contractEvent.eventTopic
                ]
            };
                // eventSignatureHash // Event signature hash for the event

            // Debugging output: Display the filter being used
            console.log(`Searching for ${contractEvent.name} events with filter:`, filter);

            // Get the logs that match the filter
            const logs = await provider.getLogs(filter);

            // Debugging output: Display the number of logs found
            console.log(`Found ${logs.length} logs for ${contractEvent.name}`);

            // Decode the logs to extract contract addresses and other details
            const contractInstances = logs.map(log => {
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
          });


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
        console.error("Error looking up contracts:", error);
        process.exit(1);
    }
}

console.log(ethers.id("FeeManagerDeployed(address indexed contractAddress, address indexed owner)"));

// Execute the lookup
lookupContracts();

