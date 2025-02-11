// WalletManager.ts
// GPT Added //
import { Wallet, walletStore } from '$lib/plugins/Wallet';
import { get } from 'svelte/store';

class WalletManager {
  private static instance: Wallet | null = null;

  public static getInstance(providerNames: string[], blockchainNames: string[] = ['Ethereum'], chainId: number = 1, apiKey: string | null = null, privateKey: string | null = null): Wallet {
    try {
      if (!WalletManager.instance) {
        console.log("[DEBUG] Creating new Wallet instance - privateKey:", privateKey);
        WalletManager.instance = new Wallet(providerNames, blockchainNames, chainId, apiKey, privateKey);
        walletStore.set(WalletManager.instance);
      } else {
        console.log("[DEBUG] Wallet instance already exists - privateKey:", privateKey);
        if (!WalletManager.instance.getSigner() && privateKey) {
          console.log("[DEBUG] Setting signer for existing Wallet instance");
          WalletManager.instance.setSigner(privateKey);
          walletStore.set(WalletManager.instance);
        }
      }
      console.log("[DEBUG] Returning Wallet instance");
      return WalletManager.instance;
    } catch (error) {
      console.log("[ERROR]: Failed to get Wallet instance:", error);
      throw error;
    }
  }

  public static clearInstance(): void {
    WalletManager.instance = null;
    walletStore.set(null); // Ensure the store is in sync
  }

  public static setInstance(instance: Wallet): void {
    this.clearInstance();
    WalletManager.instance = instance;
    walletStore.set(instance);
  }

  public static get wallet(): Wallet | null {
    return get(walletStore);
  }

}

export default WalletManager;
