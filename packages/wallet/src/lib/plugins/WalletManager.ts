// WalletManager.ts
// GPT Added //
import { Wallet, walletStore } from '$lib/plugins/Wallet';
import { get } from 'svelte/store';

class WalletManager {
  private static instance: Wallet | null = null;

  public static getInstance(providerNames: string[], blockchainNames: string[] = ['Ethereum'], chainId: number = 1, privateKey: string | null = null): Wallet {
    if (!WalletManager.instance) {
      WalletManager.instance = new Wallet(providerNames, blockchainNames, chainId, privateKey);
      walletStore.set(WalletManager.instance);
    }
    return WalletManager.instance;
  }

  public static clearInstance(): void {
    WalletManager.instance = null;
    walletStore.set(null); // Ensure the store is in sync
  }

  public static setInstance(instance: Wallet): void {
    WalletManager.instance = instance;
    walletStore.set(instance);
  }

  public static get wallet(): Wallet | null {
    return get(walletStore);
  }  

}

export default WalletManager;
