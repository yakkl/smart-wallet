
# YAKKL Contracts

This is the smart contract repository for the YAKKL project. The contracts are written in Solidity and tested using the Foundry testing framework.

We use remappings.txt instead of adding them to the foundry.toml file. Also, do not attempt to add comments but follow the format of the file.

.env.example shows example environment variables that can be used in the project. Rename to .env and fill in the values.

## Setup Environment

1. Follow the instructions from Foundry: `https://book.getfoundry.sh/`

2. Read the README.md file in the /code/README.md (code) directory. It goes through the setup of the project showing the examples.

### Contracts

Contracts are located in the src directory. Each contract is in its own file and the tests are in the tests directory. Also, the contract's ABI is in the 'out' directory. The ABI is used for interfacing with the contracts on the blockchain.

Contract scripts are located in the scripts directory. These scripts are used to deploy the contracts to the blockchain.

## SwapRouter.sol

### swapExactETHForTokens

This function is used to swap ETH for tokens.

### swapExactTokensForTokens

The swapExactTokensForTokens function is used when you want to swap a specific amount of one ERC20 token for another ERC20 token. This function is useful in several scenarios:

1. Token-to-Token Swaps: When users want to exchange one token for another directly, without involving ETH. For example, swapping USDC for DAI, or LINK for UNI.
2. Stablecoin Exchanges: Users might want to swap between different stablecoins (e.g., USDC to USDT, or DAI to BUSD).
3. DeFi Operations: In DeFi protocols, users often need to swap tokens to participate in various activities like yield farming, liquidity provision, or accessing specific protocol features.
4. Portfolio Rebalancing: Traders or investors might use this function to adjust their token holdings without converting to ETH first.
5. Arbitrage: Traders could use this for arbitrage opportunities between different token pairs.
6. Token Upgrades: When projects upgrade their tokens, users might need to swap old tokens for new ones.
7. Cross-Chain Bridges: Some cross-chain operations might require swapping tokens on one chain before bridging to another.
8. Automated Trading Strategies: Bots or automated systems might use this function to execute trading strategies involving multiple ERC20 tokens.

Example of how to call from typescript:

```typescript
// Assume 'tokenIn' and 'tokenOut' are the addresses of the ERC20 tokens
// 'amountIn' is the amount of tokenIn to swap
// 'swapRouter' is the instance of your SwapRouter contract

// First, approve the SwapRouter to spend tokenIn
const tokenInContract = new ethers.Contract(tokenIn, ERC20ABI, signer);
await tokenInContract.approve(swapRouter.address, amountIn);

// Then, perform the swap
const tx = await swapRouter.swapExactTokensForTokens(
    tokenIn,
    amountIn,
    tokenOut,
    minAmountOut, // Calculated based on expected price and slippage tolerance
    recipientAddress,
    deadline,
    feeBasisPoints,
    poolFee
);

await tx.wait();
```

## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

<https://book.getfoundry.sh/>

## Usage

### Build

```shell
forge build
```

### Test

```shell
forge test
```

### Debug

Regarding Foundry's debug features:

Here are some ways to use them:

- Use console.log(): You can add console.log() statements in your contracts to print values during test execution. This is already imported in the Test contract.
- Use the -vvvv flag: When running your tests, use forge test -vvvv for maximum verbosity. This will show you detailed information about each test, including gas usage and any console logs.
- Use the --debug flag: If a test is failing, you can run it with forge test --debug -vvvv --match-test testName to enter debug mode. This allows you to step through the execution of the test.
- Use vm.expectRevert(): This is useful for testing that a function reverts with a specific error message.
- Use vm.prank() and vm.startPrank(): These allow you to change the msg.sender for the next call or for a series of calls, which is useful for testing access control.
- Use vm.deal(): This allows you to give ETH to an address, which is useful for setting up test scenarios.
- Use vm.mockCall(): This allows you to mock external contract calls, which can be useful for isolating your contract's behavior.

### Format

```shell
forge fmt
```

### Gas Snapshots

```shell
forge snapshot
```

### Anvil

```shell
anvil
```

### Deploy

```shell
forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
cast <subcommand>
```

### Help

```shell
forge --help
anvil --help
cast --help
```
