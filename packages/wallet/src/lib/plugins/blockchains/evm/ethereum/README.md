## Contract

In $plugins directory there are ContractManager.ts and Contract.ts files. ContractManager.ts is a class that manages all the contracts. It has a method called `getContract` that returns a Contract instance. Contract.ts is a class that represents a contract. It has a method called `call` that calls a contract method. It also has a method called `send` that sends a transaction to a contract method.

Blockchain specific code is here in the 'ethereum' directory. It has a file called EthereumContracts.ts that implements the Contract.ts abstract class. There is another file called TokenService.ts that is only here for a simple service example. Please do not use it in production! It will most likely be changed or removed in the future.
