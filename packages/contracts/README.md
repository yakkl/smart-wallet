## YAKKL Contracts

This is the smart contract repository for the YAKKL project. The contracts are written in Solidity and tested using the Foundry testing framework.

We use remappings.txt instead of adding them to the foundry.toml file. Also, do not attempt to add comments but follow the format of the file.

.env.example shows example environment variables that can be used in the project. Rename to .env and fill in the values.

### Contracts

Contracts are located in the src directory. Each contract is in its own file and the tests are in the tests directory. Also, the contract's ABI is in the 'out' directory. The ABI is used for interfacing with the contracts on the blockchain.

Contract scripts are located in the scripts directory. These scripts are used to deploy the contracts to the blockchain.

## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**


Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
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
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
