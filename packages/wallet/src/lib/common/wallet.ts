import type { Blockchain } from "$lib/plugins/Blockchain";
import type { Provider } from "$lib/plugins/Provider";
import type { Wallet } from "$lib/plugins/Wallet";
import WalletManager from "$lib/plugins/WalletManager";
import { getYakklCurrentlySelectedAccountKey } from "./security";
import { getYakklCurrentlySelected } from "./stores";
import type { Ethereum } from "$lib/plugins/blockchains/evm/ethereum/Ethereum";
import { TokenService } from "$lib/plugins/blockchains/evm/TokenService";

export async function getInstances(): Promise<[Wallet | null, Provider | null, Blockchain | null, TokenService<any> | null]> {
  try {
    const currentlySelected = await getYakklCurrentlySelected();
    const chainId = currentlySelected.shortcuts?.chainId ?? 1;

    let wallet: Wallet | null = null;
    wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], chainId, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);

    if (wallet) {
      if (!wallet.getSigner()) {
        const accountKey = await getYakklCurrentlySelectedAccountKey();
        if (accountKey?.privateKey) {
          await wallet.setSigner(accountKey.privateKey); // Set signer if accountKey exists
        }
      }

      const provider = wallet.getProvider(); // Optional chaining is unnecessary here because WalletManager should ensure existence
      if (provider) {
        const signer = wallet.getSigner();
        if (signer) {
          provider.setSigner(signer);
        }

        const blockchain = wallet.getBlockchain() as Ethereum;
        const tokenService = new TokenService(blockchain);

        return [wallet, provider, blockchain, tokenService];
      }
      return [wallet, null, null, null]; // Provider is null, so other components are too
    }

    return [null, null, null, null]; // No wallet, everything else is null
  } catch (error) {
    console.log('Error getting instances:', error);
    return [null, null, null, null];  // No wallet, everything else is null
  }
}
