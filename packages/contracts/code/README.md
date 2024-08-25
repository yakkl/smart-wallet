## Setting up local development environment for contracts

- Make sure you have Node.js installed on your machine. You can download it from [here](https://nodejs.org/en/download/).
- Run the ./deploy-local.sh script to deploy the contracts to your local network.

## Starting a local network
Foundry will fork the Ethereum mainnet locally to test the contracts. You can use the following command to start a local network:

```shell
./deploy-local.sh
```

By default, the script will look at the environment variable `ETH_RPC_URL` to determine the RPC URL of the network. If the environment variable is not set, it will default to `http://localhost:8545`. You can set the environment variable to point to a different network if needed. The script will also check to see if anvil-state exists. If it does not exist, it will create a new one. If it does exist, it will use the existing state found in the anvil-state file. When the script exits it will write out the current state of the network to the anvil-state file. This allows you to start and stop the network without losing the state of the network.

## Deploying contracts
### Example using deploy.ts:

Deploy the contracts to your local network by running the deploy.ts script. The script will deploy the contracts to the network specified in the script.

contractsToDeploy is an array of objects that contain the contract name, constructor parameters, and an optional existing address if the contract has already been deployed. The script will deploy the contracts in the order they are listed in the array. If you enter an existing address for a contract, the script will not attempt to deploy that contract again. If you leave the existing address empty, the script will deploy the contract to a new address. It will also print out and log the deployed contracts which includes their addresses, names, hashes, block number, and timestamp. The name of the log files is deployed_contracts.json. You can use this information to interact with the contracts using the forge-cli or other tools if needed.

If you need the address of a deployed contract, you can find it in the deployed_contracts.json file. Or, if you need it during deployment such as SwapRouter contract, you can use any parameter and simply add an alias name instead of a value or address. SwapRouter needs, as the last parameter, the address of the FeeManager contract after it is deployed. By simply put "FeeManager" in the script will attempt to look the address up and use it. If it is not found then it will fail.

```typescript
const contractsToDeploy = [
    { name: "IFeeManager", params: [], existingAddress: '' },
    { name: "FeeManager", params: ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"], existingAddress: '' },
    { name: "SwapRouter", params: ["0xE592427A0AEce92De3Edee1F18E0157C05861564", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "FeeManager", "quote address", "factory address"], existingAddress: '' }, // Placeholder for FeeManager address and an option for existing address so it does not attempt to deploy again at a different address
    // Add more contracts here as needed
];
```

```shell
ts-node deploy.ts
```

>NOTE: If you are on the local anvil fork of mainnet and you shutdown anvil and start it again and call deploy.ts, it may give you a nounce not high enough error. Delete the anvi-state and anvil-initialized files and restart the network. This will reset the nounce and allow you to deploy the contracts again. Don't forget to copy the address to your swap-test.ts array.

### Example using the forge-cli:

```shell
forge create src/SwapRouter.sol:SwapRouter --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --constructor-args 0xE592427A0AEce92De3Edee1F18E0157C05861564 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 0xb354ecf032e9e14442be590d9eaee37d2924b67a
```
--private-key - is the private key of the account that will deploy the contract. In this case, it is the private key of the account that is used by Foundry
--constructor-args - are the arguments that are passed to the constructor of the contract. In this case, the constructor of the SwapRouter contract takes 3 arguments.

## Scripts

There are a number of other scripts that can be used to interact with the contracts. These scripts can be found here. The scripts are written in TypeScript and can be run using the ts-node command. The scripts are:
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

## More information
Information will be added as needed.

## Deploying contracts to a testnet vs operating contracts

Let's clarify how fees work for contract creation versus subsequent contract interactions:

### Contract Creation Costs:

The fees of (0.104842712349120526 ETH) were indeed for contract deployment. This was an example of contract creation costs on the Ethereum Sepolia testnet. The cost of deploying a contract can vary based on the network and the complexity of the contract. The contract is the SwapRouter contract, which is a complex contract with multiple functions and state variables. The FeeManager contract was half the cost and IFeeManger was even less. The cost of deploying a contract is a one-time fee that is paid when the contract is deployed to the network. This fee is paid to the miners who process the transaction and add the contract to the blockchain.

Contract deployment is typically one of the most expensive operations on Ethereum because it involves:
a) Storing the entire contract bytecode on the blockchain.
b) Initializing contract storage.
c) Executing the constructor function.
This is a one-time cost for deploying the contract.


### Subsequent Contract Executions:

Future interactions with the deployed contract will generally cost much less.
The fees for calling contract functions depend on:
a) The complexity of the function (how much computation it requires).
b) The amount of data being sent or modified.
c) The current gas price on the network.


### Function Call Costs:

Simple read operations (view/pure functions) that don't modify state are free when called off-chain.
State-changing functions will have varying costs based on what they do:

A simple transfer might cost around 21,000 gas.
More complex operations like updating mappings or arrays will cost more.

These costs are typically much lower than the initial deployment cost.

### Examples of Typical Costs:

A basic ETH transfer: ~21,000 gas
A standard ERC20 token transfer: ~65,000 gas
More complex operations: Can range from 100,000 to 1,000,000+ gas, but still usually less than deployment


### Factors Affecting Ongoing Costs:

Gas price fluctuations: The cost in ETH will vary based on network congestion.
Contract optimization: Well-optimized contracts cost less to interact with.
Function complexity: More complex functions will cost more to execute.


### Estimating Future Costs:

You can use the estimateGas function in ethers.js to get an estimate of how much gas a function call will use.
Multiply this by the current gas price to get an ETH cost estimate.

Example of estimating gas for a function call:

```typescript
const contract = new ethers.Contract(contractAddress, abi, provider);
const gasEstimate = await contract.someFunction.estimateGas(arg1, arg2);
console.log(`Estimated gas: ${gasEstimate}`);
```

In summary, while contract deployment is expensive, subsequent interactions are generally much cheaper. The exact cost will depend on what the function does, but it's typically a fraction of the deployment cost. Always monitor and optimize your contract interactions to keep ongoing costs as low as possible, especially when moving to mainnet where real ETH is used.
