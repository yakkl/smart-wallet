// constants-evm.ts
import ERC20_ABI from './abis/erc20.json';
// import UNISWAP_V3_FACTORY_ABI from './abis/uniswap-v3-factory.json';  // Instead, use from uniswap-v3-sdk
// import UNISWAP_V3_ROUTER_ABI from './abis/uniswap-v3-router.json';
// import UNISWAP_V3_QUOTER_ABI from './abis/uniswap-v3-quoter.json';
// import UNISWAP_V3_POOL_ABI from './abis/uniswap-v3-pool.json';

export const ABIs = {
  ERC20: ERC20_ABI,
//   UNISWAP_V3_FACTORY: UNISWAP_V3_FACTORY_ABI,
//   UNISWAP_V3_ROUTER: UNISWAP_V3_ROUTER_ABI,
//   // UNISWAP_V3_QUOTER: UNISWAP_V3_QUOTER_ABI,
//   UNISWAP_V3_POOL: UNISWAP_V3_POOL_ABI,
//   // Add more ABIs as needed
};

// Contract addresses on mainnet
export const ADDRESSES = {
  YAKKL: "0x2B64822cf4bbDd77d386F51AA2B40c5cdbeb80b5", // YAKKL token address - replace with actual address when ready!
  UNISWAP_FACTORY: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  UNISWAP_FACTORY_SEPOLIA: "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
  UNISWAP_V3_ROUTER: "0xE592427A0AEce92De3Edee1F18E0157C05861564", //0x84E44095eeBfEC7793Cd7d5b57B7e401D7f1cA2E
  UNISWAP_V3_ROUTER_SEPOLIA: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
  UNISWAP_V3_QUOTER: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e", //"0x61fFE014bA17989E743c5F6cB21bF9697530B21e", // 0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6 - V1 address
  UNISWAP_V3_QUOTER_SEPOLIA: "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3",
  UNISWAP_UNIVERSAL_ROUTER: "0xEf1c6E67703c7BD7107eed8303Fbe6EC2554BF6B",
  UNISWAP_UNIVERSAL_ROUTER_SEPOLIA: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
  SUSHISWAP_FACTORY: "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac", // Mainnet
  SUSHISWAP_FACTORY_SEPOLIA: "0x...",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH9 - most common WETH contract address
  WETH_SEPOLIA: "0xfFf9976782d46cc05630D1f6EbAB18B2324d6B14",
  WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  // Add more addresses as needed
};


// NOTE: May want to update the ADDRESSES values to support dynamic data from our servers.






// ! Danger Zone: DO NOT USE ON MAINNET NOR ANY TESTNET! Only for LOCAL testing purposes on Anvil Fork of LOCAL Mainnet Ethereum.

// Foundry test accounts to be used for testing only - DO NOT USE ON MAINNET! These are meant for Foundry's Anvil Fork of LOCAL Mainnet Ethereum.
export const EOA_TEST_ACCOUNTS = [
  "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
  "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
  "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
  "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
  "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc",
  "0x976ea74026e726554db657fa54763abd0c3a0aa9",
  "0x14dc79964da2c08b23698b3d3cc7ca32193d9955",
  "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f",
  "0xa0ee7a142d267c1f36714e4a8f75612f20a79720"
  // Add more test accounts if needed
];

// Foundry test account private keys - DO NOT USE ON MAINNET! These are meant for Foundry's Anvil Fork of LOCAL Mainnet Ethereum.
export const EOA_TEST_ACCOUNTS_PRIVATE_KEYS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
  "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
  "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
  "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6"
  // Add more test account private keys if needed
];

