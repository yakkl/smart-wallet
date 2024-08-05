# Primary code for Browser Extention version

# Inpage.ts

## Overview
The `inpage.ts` file provides the main functionality for injecting the YakklWalletProvider into a webpage. This allows the webpage to communicate with the Yakkl extension and perform Ethereum transactions.

## Classes

### `YakklWalletProvider`
The `YakklWalletProvider` class extends the `EventEmitter` class and implements the WalletProvider interface. It handles Ethereum requests from a webpage and communicates with the Yakkl extension to perform these requests.

#### Methods

- `request(request: RequestArguments): Promise<unknown>`: Handles an Ethereum request from a webpage. The request is sent to the Yakkl extension, and the result is returned as a Promise. The rate of requests is limited by a rate limiter to prevent spamming the extension.

- `enable(): Promise<unknown>`: Requests the Yakkl extension to enable the wallet.

- `send(request: RequestArguments): Promise<unknown>`: Sends a request to the Yakkl extension. This method is deprecated and will be removed in a future version.

- `sendAsync(request: RequestArguments, callback: unknown): Promise<unknown>`: Sends a request to the Yakkl extension and handles the response asynchronously. This method is deprecated and will be removed in a future version.

### `EthereumProviderManager`
The `EthereumProviderManager` class manages multiple Ethereum providers. It keeps track of the current provider and provides methods to add, remove, and switch providers.

#### Methods

- `addProvider(name, provider)`: Adds a provider to the manager.

- `removeProvider(providerName)`: Removes a provider from the manager.

- `swapProvider(providerName)`: Swaps the current provider with a new provider.

## Interfaces

- `ProviderRpcError`: Defines the structure of a provider RPC error.

- `ProviderMessage`: Defines the structure of a provider message.

- `RequestArguments`: Defines the structure of a request argument.

- `Caveat`: Defines the structure of a caveat.

- `PermissionRequest`: Defines the structure of a permission request.

- `WalletProvider`: Defines the structure of a wallet Provider.

## Constants

- `errorCodes`: Defines the error codes for the RPC and provider.

- `errorValues`: Defines the error values for the RPC and provider.

## Events
- `connect`: Fired when the provider connects to the extension.
- `disconnect`: Fired when the provider disconnects from the extension.
- `chainChanged`: Fired when the current chain is changed.
- `accountsChanged`: Fired when the selected accounts are changed.



Move this to code...


/**
 * @class YakklWalletProvider
 * @extends {EventEmitter}
 * 
 * @description
 * The YakklWalletProvider class extends the EventEmitter class and implements the WalletProvider interface. 
 * It handles Ethereum requests from a webpage and communicates with the Yakkl extension to perform these requests.
 */
export class YakklWalletProvider extends EventEmitter {
  // ...
  
  /**
   * @method request
   * @param {RequestArguments} request - The Ethereum request from a webpage.
   * @returns {Promise<unknown>}
   * 
   * @description
   * Handles an Ethereum request from a webpage. The request is sent to the Yakkl extension, and the result is returned as a Promise. 
   * The rate of requests is limited by a rate limiter to prevent spamming the extension.
   */
  public async request(request: RequestArguments): Promise<unknown> {
    // ...
  }
  
  // Other methods...
}

/**
 * @class EthereumProviderManager
 * 
 * @description
 * The EthereumProviderManager class manages multiple Ethereum providers. 
 * It keeps track of the current provider and provides methods to add, remove, and switch providers.
 */
class EthereumProviderManager {
  // ...

  /**
   * @method addProvider
   * @param {string} name - The name of the provider.
   * @param {WalletProvider} provider - The provider to add.
   * 
   * @description
   * Adds a provider to the manager.
   */
  addProvider(name, provider) {
    // ...
  }

  // Other methods...
}

/**
 * @interface ProviderRpcError
 * @description Defines the structure of a provider RPC error.
 */
interface ProviderRpcError extends Error {
  code: number;
  data?: unknown;
}

// Other interfaces...

/**
 * @constant errorCodes
 * @description Defines the error codes for the RPC and provider.
 */
export const errorCodes = {
  // ...
};

// Other constants...
