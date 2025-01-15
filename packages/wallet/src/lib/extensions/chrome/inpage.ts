/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-debugger */
// Inject this into any given webpage or iFrame so that it may communicate with the extension.
// You can not use browser extention only classes and methods here. You must pass events
//   back and forth to the background.js service.

import EventEmitter from "events";
import { VERSION } from "$lib/common/constants";
import { supportedChainId } from "$lib/common/utils";
import type { LegacyWalletProvider, LegacyWindowEthereum, RequestArguments } from "$lib/common";
import { ProviderRpcError } from '$lib/common';

import { getEIP6963ProviderDetail } from '$lib/plugins/providers/network/ethereum_provider/EthereumProvider';
import type { EIP6963ProviderDetail } from '$lib/plugins/providers/network/ethereum_provider/EthereumProviderTypes';

const windowOrigin = window.location.origin;

class RateLimiter {
  private maxTokens: number;
  private fillRate: number;
  private tokens: number;
  private lastTimestamp: number;

  constructor(maxTokens: number, fillRate: number) {
    this.maxTokens = maxTokens;
    this.fillRate = fillRate;
    this.tokens = maxTokens;
    this.lastTimestamp = Date.now();
  }

  consume(): boolean {
    const now = Date.now();
    const deltaTime = now - this.lastTimestamp;
    this.lastTimestamp = now;

    const refillTokens = deltaTime * this.fillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + refillTokens);

    if (this.tokens < 1) {
      return false; // rate limit exceeded
    }

    this.tokens -= 1;
    return true; // within rate limit
  }
}


class EthereumProviderManager {
  providers: Map<any, any>;
  previousProvider: any;
  currentProvider: any;

  constructor() {
    this.providers = new Map();
    this.previousProvider = undefined;
    this.currentProvider = new YakklWalletProvider();  // Defaults to yakkl

    this.providers.set('yakklwallet', new YakklWalletProvider());

    if (typeof window !== "undefined") {
      if (window.ethereum) {
        this.previousProvider = window.ethereum;

        const descriptor = Object.getOwnPropertyDescriptor(window, "ethereum");

        if (descriptor?.writable && descriptor.configurable) {
          this._replaceProvider(new YakklWalletProvider());
        } else {
          this._removeProxyAndReplaceProvider(new YakklWalletProvider());
        }

        if (!(window.ethereum instanceof YakklWalletProvider)) {
          this.addProvider('previous', window.ethereum); // Would be good if all providers provided a consist name/label to identify themselves
          this._replaceProvider(new YakklWalletProvider());
        }
      }
    }
  }

  reload() {
    if (window.location.href.includes("app.uniswap.org") ||
      window.location.href.includes("galxe.com")) {
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  addProvider(name: string, provider: LegacyWindowEthereum) {
    if (provider && name) {
      this.providers.set(name, provider);
    } else {
      throw new Error("The provider must have a name.");
    }
  }

  removeProvider(providerName: string) {
    if (this.providers.has(providerName)) {
      this.providers.delete(providerName);
    } else {
      throw new Error(`Provider with name '${providerName}' not found.`);
    }
  }

  swapProvider(providerName: string) {
    if (this.providers.has(providerName)) {
      const newProvider = this.providers.get(providerName);
      this._replaceProvider(newProvider);
    } else {
      throw new Error(`Provider with name '${providerName}' not found.`);
    }
  }

  _isProxy(obj: object) {
    try {
      Proxy.revocable(obj, {});
      return false;
    } catch (e) {
      return true;
    }
  }

  _replaceProvider(provider: YakklWalletProvider) {
    const handler = {
      get: (target: any, prop: any, receiver: unknown) => {
        return Reflect.get(target, prop, receiver);
      },
      set: (target: any, prop: any, value: any, receiver: any) => {
        return Reflect.set(target, prop, value, receiver);
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      deleteProperty: (target: any, prop: any) => {
        return true;
      },
    };

    const proxy = new Proxy(provider, handler);

    Object.defineProperty(window, 'ethereum', {
      value: proxy,
      writable: true,
      configurable: true,
    });
  }

  _removeProxyAndReplaceProvider(provider: YakklWalletProvider) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      window.ethereum.__proto__ = null;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      delete window.ethereum.__proto__;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      if (window.ethereum) window.ethereum = null;
    } catch (e) {
      console.log(e);
    }
    this._replaceProvider(provider);
  }
}


export class YakklWalletProvider extends EventEmitter {

  constructor() {
    super();
    this._requestId = 0;
    this._connected = false;
    this._rateLimiter = new RateLimiter(100, 0.01);
    this.selectedAddresses = [];
    this.setMaxListeners(100);
    this.request = this.request.bind(this);
    // this.enable = this.enable.bind(this);
    // this.send = this.send.bind(this);
    // this.sendAsync = this.sendAsync.bind(this);
    this.providers = [this];

    // Event propagation causes the listener to be called multiple times for the same event. So, we need to use a flag to make sure our handlers are only called once. This happens with the handlers check.
    window.addEventListener('message', (event: MessageEvent) => {
      if (event?.data?.type === 'YAKKL_RESPONSE' && event.origin === windowOrigin) {
        try {
          const { id, error } = event.data;

          const handlers = this._pendingRequests.get(id);
          if (handlers) {
            this._pendingRequests.delete(id);
            if (error) { // General error - not a ProviderRpcError per se
              handlers.reject(new ProviderRpcError(-32603, error));
            } else {
              const result = this.handleResults(event);
              handlers.resolve(result);
            }
          }
        } catch (e) {
          console.log(e);
        }
      }
    });
    this._initialized = true;
  }

  private _pendingRequests = new Map<
  string,
  {
    resolve: (value: unknown) => void;
    reject: (value: unknown) => void;
  }
  >();
  private _rateLimiter;
  private _connected;
  private _requestId;
  private _providerError: ProviderRpcError | undefined;
  private _initialized=false;

  private _count=0;

  public chainId: number = 1;
  public networkVersion = "1";
  public icon = "https://yakkl.com/images/logoBull48x48.png?utm_source=yakkl&utm_medium=extension&utm_campaign=inpage_logo";
  public isMetaMask = true;
  public _metamask = {
    isUnlocked: () => true
  };
  public isWeb3 = true;
  public isYakkl = true;
  public label = "Web3/dApp Injected Provider - YAKKL® Smart Wallet";

  public selectedAddresses: string[];
  public version = VERSION;

  public providers: YakklWalletProvider[] = [];

  public isConnected(): boolean {
    return this._connected;
  }

  public setMaxListeners(n: number): this {
    super.setMaxListeners(n);
    return this;
  }

  // Primary request method from dApp
  public async request(request: RequestArguments): Promise<unknown> {
    try {
      if (request === undefined) {
        throw new ProviderRpcError(-32602, 'request had no value(s) passed in.');
      }

      this.validateRequest(request);
      if (!this._rateLimiter.consume()) {
        this._providerError = new ProviderRpcError(429, 'Dapp, too many requests which exceeds the default rate limit. Rate of calls will continue to be throttled or stopped unless rate slows down. Try again later.');
        throw this._providerError;
      }

      return this.handleRequest(request);
    } catch(e) {
      this.disconnect();
      return Promise.reject(e); // Must be in a ProviderRpcError format
    }
  }


  // Private methods
  private disconnect(): void {
    this._connected = false; // The dApp will need to reconnect
    this.selectedAddresses = [];
    this.emit('disconnect', this.chainId);
  }


  private async sendRequest(method: string, params: unknown[] | object): Promise<unknown> {
    let promise;
    let requestId: number = 0;
    let rejectType = 0;

    try {
      requestId = this._requestId++;
      promise = new Promise<unknown>((resolve, reject) => {
        this._pendingRequests.set(requestId.toString(), { resolve, reject });
      });
      rejectType = 1;

      window.postMessage({id: requestId.toString(), method, params, type: 'YAKKL_REQUEST'}, windowOrigin);
      this._requestId++;

      return promise;
    } catch (e) {
      console.log(e);
      if (rejectType === 1) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const { reject } = this._pendingRequests.get(requestId.toString());
        if (!reject) {
          Promise.reject(e);
        }
        this._pendingRequests.delete(requestId.toString());
        reject(e);
      } else {
        Promise.reject(e);
      }
    }
  }

  private async handleRequest(request: RequestArguments): Promise<unknown> {
    try {
      const { method, params } = request;

      switch (method) {
        case 'eth_chainId':
          return this.handleChainId(); // Automatically wraps this in a Promise

        case 'net_version':
          return this.handleNetworkVersion(); // Automatically wraps this in a Promise

        case 'eth_accounts':
          return this.handleAccounts(); // Automatically wraps this in a Promise

        case 'eth_requestAccounts':
          return this.requestAccounts(params ?? []);

        case 'eth_sendTransaction':
          return this.sendTransaction(params ?? []);

        case 'eth_signTypedData_v3':
          return this.signTypedData_v3(params ?? []);

        case 'eth_signTypedData_v4':
          return this.signTypedData_v4(params ?? []);

        case 'personal_sign':
          return this.personal_sign(params ?? []);

        case 'wallet_getPermissions':
          return this.getPermissions(params ?? []);

        case 'wallet_requestPermissions':
          return this.requestPermissions(params ?? []);

        case 'wallet_switchEthereumChain':
          return this.switchEthereumChain(params ?? []);

        case 'wallet_addEthereumChain':
          return this.addEthereumChain(params ?? []);

        case 'eth_getBlockByNumber':
          return this.getBlockByNumber(params ?? []);

        case 'eth_estimateGas':
          return this.estimateGas(params ?? []);

        default:
          throw new ProviderRpcError(4200, `The requested method ${method} is not supported by this Ethereum provider.`);
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  // Review these methods to see if they need to be implemented
  //   case "eth_blockNumber":
  //   case "eth_call":
  //   case "eth_estimateGas":
  //   case "eth_feeHistory":
  //   case "eth_gasPrice":
  //   case "eth_getBalance":
  //   case "eth_getBlockByHash":
  //   case "eth_getBlockByNumber":
  //   case "eth_getBlockTransactionCountByHash":
  //   case "eth_getBlockTransactionCountByNumber":
  //   case "eth_getCode":
  //   case "eth_getFilterChanges":
  //   case "eth_getFilterLogs":
  //   case "eth_getLogs":
  //   case "eth_getProof":
  //   case "eth_getStorageAt":
  //   case "eth_getTransactionByBlockHashAndIndex":
  //   case "eth_getTransactionByBlockNumberAndIndex":
  //   case "eth_getTransactionByHash":
  //   case "eth_getTransactionCount":
  //   case "eth_getTransactionReceipt":
  //   case "eth_getUncleByBlockHashAndIndex":
  //   case "eth_getUncleByBlockNumberAndIndex":
  //   case "eth_getUncleCountByBlockHash":
  //   case "eth_getUncleCountByBlockNumber":
  //   case "eth_maxPriorityFeePerGas":
  //   case "eth_newBlockFilter":
  //   case "eth_newFilter":
  //   case "eth_newPendingTransactionFilter":
  //   case "eth_protocolVersion":
  //   case "eth_sendRawTransaction":
  //   case "eth_subscribe":
  //   case "eth_syncing":
  //   case "eth_uninstallFilter":
  //   case "eth_unsubscribe":
  //   case "net_listening":
  //   case "net_version":
  //   case "web3_clientVersion":
  //   case "web3_sha3":


  // All of these methods do not flow through to the background.js service
  private handleChainId(): number {
    try {
      this.handleChainIdChange(this.chainId);
      return this.chainId;
    } catch (e) {
      console.log(e);
      return 0;
    }
  }

  private handleNetworkVersion(): string {
    this.handleChainIdChange(this.chainId);
    return this.networkVersion;
  }

  private handleAccounts(): string[] {
    return this.selectedAddresses;
  }

  // All of these methods flow through to the background.js service
  private async requestAccounts(params: unknown[] | object): Promise<unknown> {
    return this.sendRequest('eth_requestAccounts', params);
  }

  private async sendTransaction(params: unknown[] | object): Promise<unknown> {
    return this.sendRequest('eth_sendTransaction', params);
  }

  private async signTypedData_v3(params: unknown[] | object): Promise<unknown> {
    return this.sendRequest('eth_signTypedData_v3', params);
  }

  private async signTypedData_v4(params: unknown[] | object): Promise<unknown> {
    return this.sendRequest('eth_signTypedData_v4', params);
  }

  private async personal_sign(params: unknown[] | object): Promise<unknown> {
    return this.sendRequest('personal_sign', params);
  }

  private async getPermissions(params: unknown[] | object): Promise<unknown> {
    return this.sendRequest('eth_getPermissions', params);
  }

  private async requestPermissions(params: unknown[] | object): Promise<unknown> {
    return this.sendRequest('eth_requestPermissions', params);
  }

  private async switchEthereumChain(params: unknown[] | object): Promise<unknown> {
    return this.sendRequest('eth_switchEthereumChain', params);
  }

  private async addEthereumChain(params: unknown[] | object): Promise<unknown> {
    return this.sendRequest('eth_addEthereum', params);
  }

  private async getBlockByNumber(params: unknown[] | object): Promise<unknown> {
    // It is getting the block info so no account is needed
    return this.sendRequest('eth_getBlockByNumber', params);
  }

  private async estimateGas(params: unknown[] | object): Promise<unknown> {
    // It is getting the block info so no account is needed
    return this.sendRequest('eth_estimateGas', params);
  }


  // Result handler
  private handleResults(event: MessageEvent): unknown {
    try {
      let result = event?.data?.result;

      switch(event?.data?.method) {
        case 'eth_requestAccounts':
          {
            const addresses = result as string[];
            const chainId = event.data.chainId;

            if (!this._connected && addresses && addresses.length > 0) {
              this._connected = true;
              this.emit('connect', { chainId: chainId });
            }

            this.handleChainIdChange(chainId);
            this.handleAddressChange(addresses);
          }
          break;
        case 'eth_switchEthereumChain':
        case 'eth_addEthereumChain':
          {
            // const chainId = result;
            const chainId = event.data.chainId;
            const supported = supportedChainId(chainId);
            if (!supported) {
              throw new ProviderRpcError(4901, 'The provider is disconnected from the specified chain.');
            }
            this.handleChainIdChange(chainId);
          }
          break;
        case 'error':
          result = event.data.data;
          break;
      }
      return result;
    } catch (e) {
        console.log(e); // Must be in a ProviderRpcError format
        if (!(e as ProviderRpcError)?.code) {
          throw new ProviderRpcError(-32603, (e as string)); // Assume a string if not a ProviderRpcError
      } else {
        throw e;
      }
    }
  }

  private checkConnection(): void {
    if (!this._connected) {
      throw new ProviderRpcError(4900, 'The Provider is disconnected from all chains.');
    }
  }

  private validateRequest(request: RequestArguments): void {
    // eslint-disable-next-line no-useless-catch
    try{
      const { method } = request;

      if (!this._rateLimiter.consume()) {
        throw new ProviderRpcError(429, 'Too many requests which exceeds the default rate limit. Rate of calls will continue to be throttled or stopped unless rate slows down. Try again later.');
      }

      if (request === undefined) {
        throw new ProviderRpcError(-32603, 'request had no value(s) passed in.');
      }

      const validMethods = [
        'eth_requestAccounts',
        'eth_accounts',
        'eth_chainId',
        'eth_sendTransaction',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
        'eth_getBlockByNumber',
        'eth_estimateGas',
        'personal_sign',
        'wallet_getPermissions',
        'wallet_requestPermissions',
        'wallet_switchEthereumChain',
        'wallet_addEthereumChain',
        'net_version'
      ];

      if (!validMethods.includes(method)) {
        throw new ProviderRpcError(4200, `The requested method ${method} is not supported by this Ethereum provider.`);
      }
    } catch (e) {
      throw e;
    }
  }

  private handleChainIdChange(chainId: number): void {
    try {
      this.chainId = chainId;
      this.emit("chainChanged", chainId);
      this.emit("networkChanged", chainId);
    } catch (e) {
      console.log(e);
    }
  }

  private handleAddressChange(addresses: Array<string>): void {
    try {
      if (this.selectedAddresses !== addresses) {
        this.selectedAddresses = addresses;
        this.emit("accountsChanged", addresses);
      }
    } catch (e) {
      console.log(e);
    }
  }

  // ---- Deprecated methods ----:
//   public async enable(): Promise<unknown> {
//     console.log('enable: dApp is using a deprecated method. Please use send() instead.');

//     return await this.request({method: 'eth_requestAccounts'});
//   };

//   public async send(request: RequestArguments): Promise<unknown> {
//     console.log('send: dApp is using a deprecated method. Please use send() instead.');

//     return await this.request(request);
//   }

//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   public async sendAsync(request: RequestArguments, callback: unknown): Promise<unknown> {
//     try {
//       console.log('sendAsync: dApp is using a deprecated method. Please use send() instead.');

//       this.checkConnection();
//       const result = await this.request(request);
//       return result;
//     } catch (e) {
//       console.log(e);
//       throw e;
//     }
//   }

}


// Initial setting of window.ethereum before the proxy
export const windowProvider = {
  value:  new YakklWalletProvider(),
  configurable: true,
}

// Base code has yakkl__2 and web3__2 defined. The build system changes the name of the provider to yakkl__2 to yakkl and web3__2 to web3 to keep linting happy. Quick and dirty fix for now.
declare global {
  interface Window {
    yakklLegacy: YakklWalletProvider,
    ethereumProviderManager?: EthereumProviderManager,
    ethereum?: LegacyWindowEthereum,  // Set this so that we can remove a provider that is not playing well because writable and configurable are set to true so no modifications!
    web3?: YakklWalletProvider
  }
}

let cachedEthereumProviderProxy: LegacyWindowEthereum;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let cachedCurrentProvider: LegacyWalletProvider;


// Default - YakklWalletProvider is passed here...
function setGlobalProvider(windowProvider: PropertyDescriptor & ThisType<any>) {
  try {
    if (!window.yakklLegacy) {
      Object.defineProperty(window, 'yakklLegacy', windowProvider); // set this with no proxy

      Object.defineProperty(window, "ethereumProviderManager", {
        value: new EthereumProviderManager,
        writable: false,
        configurable: false,
      });

      Object.defineProperty(window, "ethereum", {
        get() {
          if (!window.ethereumProviderManager) {
            throw new Error("window.ethereumProviderManager is expected to be set to change the injected provider on window.ethereum.");
          }
          if (cachedEthereumProviderProxy && cachedCurrentProvider === window.ethereumProviderManager.currentProvider) return cachedEthereumProviderProxy;

          cachedEthereumProviderProxy = new Proxy(window.ethereumProviderManager.currentProvider, {
            get(target, prop, receiver) {
              if (
                window.ethereumProviderManager &&
                !(prop in window.ethereumProviderManager.currentProvider) &&
                prop in window.ethereumProviderManager
              ) {
                // Uniswap MM connector checks the providers array for the MM provider and forces to use that
                // https://github.com/Uniswap/web3-react/blob/main/packages/metamask/src/index.ts#L57
                // as a workaround we need to remove this list for uniswap so the actual provider change can work after reload.
                // The same is true for `galaxy.eco`
                if (
                  (window.location.href.includes("app.uniswap.org") ||
                    window.location.href.includes("kwenta.io") ||
                    window.location.href.includes("galxe.com")) &&
                  prop === "providers"
                ) {
                  return null;
                }
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-ignore
                return window.ethereumProviderManager[prop];
              }
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              //@ts-ignore
              return Reflect.get(window.ethereumProviderManager.currentProvider ?? target, prop, receiver);
            },
            deleteProperty: () => true,
          })
          cachedCurrentProvider = window.ethereumProviderManager.currentProvider;
          return cachedEthereumProviderProxy;
        },
        set(newProvider) {
          try {
            window.ethereumProviderManager?.addProvider('epm',newProvider);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            window.ethereum.providers = [...window.ethereumProviderManager.providers.values()] ?? [];
            // window.ethereumProviderManager?.reload(); // This will check for certain sites that require a reload to work properly
          } catch (e) {
            console.log(e); // Nothing else
          }
        },
        configurable: false, // true
      })
    }
    window.dispatchEvent(new Event('ethereum#initialized'));
  } catch (e) {
    console.log(e);
  }
}

// EIP6963 Provider. Above is the legacy provider which will be removed in the future.
const eip6963ProviderDetail: EIP6963ProviderDetail = getEIP6963ProviderDetail();
eip6963ProviderDetail.provider.announce(); // Made 'announce' a public method part of EIP1193

window.yakkl = eip6963ProviderDetail;


window.addEventListener('DOMContentLoaded', () => {
  try {
    // Legacy - EIP-1193 provider
    setGlobalProvider(windowProvider);
    // EIP-6963 provider
    eip6963ProviderDetail.provider.announce();
    } catch (e) {
    console.log('YAKKL: Provider injection failed. This web page will not be able to connect to YAKKL.', e);
  }
});


