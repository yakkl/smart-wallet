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
    { name: "SwapRouter", params: ["0xE592427A0AEce92De3Edee1F18E0157C05861564", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "FeeManager"], existingAddress: '' }, // Placeholder for FeeManager address and an option for existing address so it does not attempt to deploy again at a different address
    // Add more contracts here as needed
];
```

```shell
ts-node deploy.ts
```

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

