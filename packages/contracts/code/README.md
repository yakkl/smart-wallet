# Setting up local development environment for contracts

This document will guide you through setting up a local development environment for the contracts. The contracts are written in Solidity and are deployed to the Ethereum network. The contracts are tested using the forge-cli and the tests are written in TypeScript. The contracts are deployed to the Ethereum network using the forge-cli. The forge-cli is a command-line tool that allows you to interact with the Ethereum network using a simple command-line interface. The forge-cli is written in TypeScript and can be run using the ts-node command.

## Foundry

Foundry is a tool that allows you to fork the Ethereum mainnet locally. This is useful for testing smart contracts in a local environment that mirrors the mainnet. You can find out more at <https://book.getfoundry.sh>

## Installation

- Foundry - `curl -L https://foundry.paradigm.xyz | bash` - You may need to install it a different way if not on a Mac or Linux based system.
- Make sure you have Node.js installed on your machine. You can download it from [here](https://nodejs.org/en/download/).
- Install ts-node globally by running `npm install -g ts-node`. This wi
- Run the ./deploy-local.sh script to deploy the contracts to your local network.

## Starting a local network

Foundry will fork the Ethereum mainnet locally to test the contracts. You can use the following command to start a local network:

```shell
./local-mainnet.sh
```

By default, the script will look at the environment variable `ETH_RPC_URL` to determine the RPC URL of the network. If the environment variable is not set, it will default to `http://localhost:8545`. You can set the environment variable to point to a different network if needed. The script will also check to see if anvil-state exists. If it does not exist, it will create a new one. If it does exist, it will use the existing state found in the anvil-state file. When the script exits it will write out the current state of the network to the anvil-state file. This allows you to start and stop the network without losing the state of the network.

## Deploying contracts

### Example using deploy.ts

```shell
ts-node deploy.ts
```

NOTE: ts-node may not allow the the .ts extension to run. There are a few ways to get around this.

1. Make sure the `tsconfig.json` is setup like the following:

```typescript
{
  "compilerOptions": {
    "target": "es6",                      // Use ES6 syntax (you can use a more modern target if needed).
    "module": "commonjs",                 // CommonJS module resolution.
    "moduleResolution": "node",           // Node module resolution.
    "allowSyntheticDefaultImports": true, // Allow default imports from modules without a default export.
    "esModuleInterop": true,              // Compatibility with CommonJS modules.
    "strict": true,                       // Enable strict type checking options.
    "resolveJsonModule": true,            // Allow importing JSON files.
    "outDir": "./dist",                   // Optional: Output directory for compiled JavaScript files.
    "skipLibCheck": true,                 // Skip type checking of declaration files.
    "sourceMap": true                     // Optional: Generate source maps for debugging.
  },
  "include": ["**/*.ts"],                  // Include all TypeScript files in the directory.
  "exclude": ["node_modules", "dist"]      // Exclude node_modules and build directory.
}
```

And make sure that "type": "module" is not setup in the package.json file of this given project.

2. You can also use the following command to run the script:

```shell
tsc <whatever script>.ts && node <whatever script>.js
```

3. You can also experiment with other ways that may fit your needs.

> Contract addresses: `contract_address = keccak256(rlp_encode(sender_address, nonce))[12:]` this is how contract addresses are created. The nonce is the number of transactions sent from the account. The sender_address is the address of the account that is deploying the contract. The keccak256 function is a cryptographic hash function that takes an input and produces a fixed-size string of bytes. The rlp_encode function is a serialization function that encodes data in a compact binary format. The [12:] is a slice operation that takes the last 20 bytes of the hash. This is the address of the contract.
>
> The contract address is deterministic and can be calculated before the contract is deployed. This is useful for interacting with the contract before it is deployed. You can use the contract address to interact with the contract using the forge-cli or other tools. You can also use the contract address to verify that the contract was deployed correctly by comparing the address to the one that was calculated before deployment. However, the nonce **MUST** be the same as the one used to calculate the address. If the nonce is different, the address will be different.
>
> This all means that on Anvil, if you restart it and it is reset (default unless using --state) then your contract address could be the same on each initial deploy (assuming the nonce is the same as before). This does not occur on the normal mainnet. This is useful for testing and development purposes.

### Key Points to Consider

1. Same Sender and Nonce:

- If you deploy the contract using the same account and the account's nonce is the same, you will get the same contract address. This would typically occur if the network is reset to the same state before each deployment, or if no other transactions have been sent from that account between deployments.

2. Different Nonce:

- If the account's nonce changes between deployments (e.g., if you've sent other transactions from the same account before the second deployment), the contract address will be different. This is because the nonce is incremented with each transaction.

3. Anvil’s State:

- If Anvil is reset (i.e., the state is cleared or a new instance is started) and you deploy the contract in the exact same way (same account and nonce), you will get the same contract address.
- If you don't reset Anvil and the account's nonce has incremented due to other transactions, the contract address will be different.

### Practical Example

- First Deployment:

  - Deploy a contract using an EOA (e.g., 0x123...) with nonce 0.
  - Contract address = keccak256(rlp_encode(0x123..., 0)).

- Second Deployment (Without Reset):

  - If you've sent a transaction after the first deployment, the nonce is now 1.
  - Deploy the same contract again; the contract address will be keccak256(rlp_encode(0x123..., 1)), which is different from the first.

- Second Deployment (With Reset or Identical State):

  - If you reset Anvil or start with the same state (same nonce and no other transactions), the contract address will be the same as the first deployment.

Deploy the contracts to your local network by running the deploy.ts script. The script will deploy the contracts to the network specified in the script.

contractsToDeploy is an array of objects that contain the contract name, constructor parameters, and an optional existing address if the contract has already been deployed. The script will deploy the contracts in the order they are listed in the array. If you enter an existing address for a contract, the script will not attempt to deploy that contract again. If you leave the existing address empty, the script will deploy the contract to a new address. It will also print out and log the deployed contracts which includes their addresses, names, hashes, block number, and timestamp. The name of the log files is deployed_contracts.json. You can use this information to interact with the contracts using the forge-cli or other tools if needed.

If you need the address of a deployed contract, you can find it in the deployed_contracts.json file. Or, if you need it during deployment such as SwapRouter contract, you can use any parameter and simply add an alias name instead of a value or address. SwapRouter needs, as the last parameter, the address of the FeeManager contract after it is deployed. By simply put "FeeManager" in the script will attempt to look the address up and use it. If it is not found then it will fail.

```typescript
const contractsToDeploy = [
    { name: "IFeeManager", params: [], existingAddress: '' },
    { name: "FeeManager", params: ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"], existingAddress: '' },
    { name: "SwapRouter", params: ["0xE592427A0AEce92De3Edee1F18E0157C05861564", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "FeeManager", "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6", "0x1F98431c8aD98523631AE4a59f267346ea31F984"], existingAddress: '' }, // Placeholder for FeeManager address and an option for existing address so it does not attempt to deploy again at a different address
    // Add more contracts here as needed
];
```

>NOTE: If you are on the local anvil fork of mainnet and you shutdown anvil and start it again and call deploy.ts, it may give you a nounce not high enough error. Delete the anvi-state and anvil-initialized files and restart the network. This will reset the nounce and allow you to deploy the contracts again. Don't forget to copy the address to your swap-test.ts array.

### Example using the forge-cli

This is an example of doing a manual command line deployment to your local network using the forge-cli. You can find more information on the forge-cli.

```shell
forge create src/SwapRouter.sol:SwapRouter --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --constructor-args 0xE592427A0AEce92De3Edee1F18E0157C05861564 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 0xb354ecf032e9e14442be590d9eaee37d2924b67a
```

--private-key - is the private key of the account that will deploy the contract. In this case, it is the private key of the account that is used by Foundry
--constructor-args - are the arguments that are passed to the constructor of the contract. In this case, the constructor of the SwapRouter contract takes 3 arguments.

## Scripts

There are a number of other scripts that can be used to interact with the contracts. These scripts can be found here. The scripts are written in TypeScript and can be run using the ts-node command. The scripts are:

- swap-test.ts - Main script to test the SwapRouter contract
- deploy.ts - Script to deploy the contracts
- deploy-local.sh - Script to start the local network
- list-accounts.ts - Script to list the accounts on the local network and their balances
- audit-transaction.ts
- decode-log.ts
- gather-analytics.ts
- get-logs.ts
- get-transaction-logs.ts
- local-contract-check.js
- local-verify-fork.mjs - This is an example of node method to verify a fork
- local-verify-fork.ts - This is an example of a typescript method to verify a fork
- lookup-contracts.ts
- monitor-events.ts

## Testing the contracts

- Create the contract.
- Create the test contract.
- Run `forge test -vv` to run the tests (-vv is for verbose output). This will compile and put the ABI output in the /out directory (this is important since these are needed inside any client code like typescript, etc.).
- If you need to run a specific test, you can use the `--test` flag. For example, `forge test --test test/SwapRouter.test.ts` will run the SwapRouter tests.
- If you need to only compile the contracts, you can use `forge build` to compile the contracts.
- deploy.sh will deploy the contracts to the local network. This is useful for testing the contracts in a local environment. You can modify the variable inside the script to deploy the contracts to a different network. Also, you will need to adjust the `owner address` in the FeeManager element of the array in the script to match the address of the account that will deploy the contracts. You can find the address of the account in the `list-accounts.ts` script. Leave the others alone, they are specific to Uniswap. You will see one array element called `FeeManager`. This represents a placeholder for dynamically created address. In this case it is for the FeeManager. The name must match the contract name in the array. The script will attempt to find the address of the contract and use it. If it is not found, it will fail. If you need to deploy the contract again, you can simply remove the address from the script and it will deploy a new contract. The script will also log the deployed contracts to a file called `deployed_local_contracts.json`. You can use this information to interact with the contracts using the forge-cli or other tools if needed.
- The contracts are deployed to the local network using the deploy.ts script. The script will deploy the contracts to the network specified in the script. The script will deploy the contracts in the order they are listed in the array. If you enter an existing address for a contract, the script will not attempt to deploy that contract again (this can use a little work to support proxy contracts). If you leave the existing address empty, the script will deploy the contract to a new address. It will also print out and log the deployed contracts which includes their addresses, names, hashes, block number, timestamp, and more in a JSON format for later use if needed. The name of the log files is deployed_<whatever network>_contracts.json (e.g., 'deployed_local_contracts.json, deployed_mainnet_contracts.json'). You can use this information to interact with the contracts using the forge-cli or other tools if needed.
- The swap-test.ts script is the main script to test the SwapRouter contract. It will test the SwapRouter contract by calling various functions on the contract. The script will print out the results of the tests and log the results to a file. The name of the log file is swap-test.log (not currently implemented - swap-test.log). You can use this information to verify that the contract is working as expected.
- Before running swap-test.ts (`ts-node swap-test.ts`) you need to copy the swapRouter contract address that was created when it was deployed (use the correct one). Do the same for FeeManager. These are updated in the variable `network`. The other addresses can remain as long as you only want to test WETH and USDC swaps. Change the addresses as needed for other tokens.

## More information

Information will be added as needed.

## Deploying contracts to a testnet vs operating contracts

Let's clarify how fees work for contract creation versus subsequent contract interactions:

### Contract Creation Costs

The fees of (0.104842712349120526 ETH) were indeed for contract deployment. This was an example of contract creation costs on the Ethereum Sepolia testnet. The cost of deploying a contract can vary based on the network and the complexity of the contract. The contract is the SwapRouter contract, which is a complex contract with multiple functions and state variables. The FeeManager contract was half the cost and IFeeManger was even less. The cost of deploying a contract is a one-time fee that is paid when the contract is deployed to the network. This fee is paid to the miners who process the transaction and add the contract to the blockchain.

Contract deployment is typically one of the most expensive operations on Ethereum because it involves:
a) Storing the entire contract bytecode on the blockchain.
b) Initializing contract storage.
c) Executing the constructor function.
This is a one-time cost for deploying the contract.

### Subsequent Contract Executions

Future interactions with the deployed contract will generally cost much less.
The fees for calling contract functions depend on:
a) The complexity of the function (how much computation it requires).
b) The amount of data being sent or modified.
c) The current gas price on the network.

### Function Call Costs

Simple read operations (view/pure functions) that don't modify state are free when called off-chain.
State-changing functions will have varying costs based on what they do:

A simple transfer might cost around 21,000 gas.
More complex operations like updating mappings or arrays will cost more.

These costs are typically much lower than the initial deployment cost.

### Examples of Typical Costs

A basic ETH transfer: ~21,000 gas
A standard ERC20 token transfer: ~65,000 gas
More complex operations: Can range from 100,000 to 1,000,000+ gas, but still usually less than deployment

### Factors Affecting Ongoing Costs

Gas price fluctuations: The cost in ETH will vary based on network congestion.
Contract optimization: Well-optimized contracts cost less to interact with.
Function complexity: More complex functions will cost more to execute.

### Estimating Future Costs

You can use the estimateGas function in ethers.js to get an estimate of how much gas a function call will use.
Multiply this by the current gas price to get an ETH cost estimate.

Example of estimating gas for a function call:

```typescript
// We use the latest version of ethers.js so our examples may differ from any examples you find online
const contract = new ethers.Contract(contractAddress, abi, provider);
const gasEstimate = await contract.someFunction.estimateGas(arg1, arg2);
console.log(`Estimated gas: ${gasEstimate}`);
```

In summary, while contract deployment is expensive, subsequent interactions are generally much cheaper. For example, if you call some function on a contract that only returns a value in memory or calculated then it most likely will be no cost since a state hasn't changed. However, there are certain types of functions that look like simple get like calls but end up creating and executing a transaction that will cost gas fees. The exact cost will depend on what the function does, but it's typically a fraction of the deployment cost. Always monitor and optimize your contract interactions to keep ongoing costs as low as possible, especially when moving to mainnet where real ETH is used.
