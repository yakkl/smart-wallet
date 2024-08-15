## Setting up local development environment for contracts

- Make sure you have Node.js installed on your machine. You can download it from [here](https://nodejs.org/en/download/).
- Run the ./deploy-local.sh script to deploy the contracts to your local network.



example:
forge create src/SwapRouter.sol:SwapRouter --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --constructor-args 0xE592427A0AEce92De3Edee1F18E0157C05861564 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 0xb354ecf032e9e14442be590d9eaee37d2924b67a
