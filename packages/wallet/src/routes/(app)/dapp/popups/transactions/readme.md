Sample code - basic

const { ethers } = require('ethers');

// Infura provider for the Ethereum network
const provider = new ethers.providers.InfuraProvider('mainnet', '<INFURA_PROJECT_ID>');

// Create a new wallet instance
const wallet = ethers.Wallet.createRandom();
const signer = wallet.connect(provider);

// Connect to the dApp using web3
window.ethereum = {
  isMetaMask: false, // replace with your wallet name or identifier
  enable: () => {
    return new Promise((resolve, reject) => {
      resolve([{
        // return the selected account
        address: signer.address,
        // return the provider URL and chain ID
        chainId: provider.chainId,
        rpcUrl: provider.connection.url
      }]);
    });
  },
  request: () => {
    // implement the web3 request method as needed
  }
};



// Another option

import { ethers } from 'ethers';

// Create a new Ethers.js provider instance
const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

// Define the Ethereum commands and their corresponding functions
const ethereumCommands = {
  eth_requestAccounts: async () => {
    const accounts = await window.myCryptoWallet.getAccounts();
    return accounts;
  },
  eth_sign: async (params) => {
    const [address, data] = params;
    const signature = await window.myCryptoWallet.signMessage(address, data);
    return signature;
  },
  eth_sendTransaction: async (params) => {
    const [tx] = params;
    const result = await window.myCryptoWallet.sendTransaction(tx);
    return result.hash;
  },
  // Add more Ethereum commands as needed
};

// Create a new window.ethereum object if it doesn't already exist
if (typeof window.ethereum === 'undefined') {
  const newEthereumObject = {
    isMetaMask: true,
    selectedAddress: null,
    networkVersion: null,
    chainId: null,
    request: async (request) => {
      const ethereumFunction = ethereumCommands[request.method];
      if (!ethereumFunction) {
        throw new Error('Invalid Ethereum command');
      }
      const result = await ethereumFunction(request.params);
      return { id: request.id, jsonrpc: '2.0', result };
    },
    on: () => {},
    enable: async () => {
      const accounts = await ethereumCommands.eth_requestAccounts();
      newEthereumObject.selectedAddress = accounts[0];
      return accounts;
    },
    autoRefreshOnNetworkChange: false,
    _provider: provider,
  };
  window.ethereum = newEthereumObject;
} else {
  // Copy the existing window.ethereum provider to an array of objects
  const existingProviders = [];
  if (Array.isArray(window.ethereum._providers)) {
    window.ethereum._providers.forEach((provider) => {
      existingProviders.push(provider);
    });
  } else if (typeof window.ethereum._provider === 'object') {
    existingProviders.push(window.ethereum._provider);
  }

  // Setup window.ethereum to interface with your wallet and make your wallet the default wallet
  const newProvider = new ethers.providers.Web3Provider(window.ethereum);
  window.myCryptoWallet = new MyCryptoWallet(newProvider); // replace this with the actual name of your wallet class
  window.ethereum._provider = window.myCryptoWallet.getProvider();
  window.ethereum._providers = existingProviders.concat([window.ethereum._provider]);
  window.ethereum.autoRefreshOnNetworkChange = false;
}

// Define the MyCryptoWallet class
class MyCryptoWallet {
  constructor(provider) {
    this.provider = provider;
    this.signer = provider.getSigner();
  }

  async getAccounts() {
    const address = await this.signer.getAddress();
    return [address];
  }

  async signMessage(address, data) {
    const signature = await this.signer.signMessage(data);
    return signature;
  }

  async sendTransaction(tx) {
    const result = await this.signer.sendTransaction(tx);
    return result;
  }

  getProvider() {
    return this.provider;
  }
}

