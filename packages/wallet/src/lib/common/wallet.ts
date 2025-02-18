import type { Blockchain } from "$lib/plugins/Blockchain";
import type { Provider } from "$lib/plugins/Provider";
import type { Wallet } from "$lib/plugins/Wallet";
import WalletManager from "$lib/plugins/WalletManager";
import { getYakklCurrentlySelectedAccountKey } from "./security";
import { getMiscStore, getYakklCurrentlySelected } from "./stores";
import type { Ethereum } from "$lib/plugins/blockchains/evm/ethereum/Ethereum";
import { TokenService } from "$lib/plugins/blockchains/evm/TokenService";
import { log } from "$plugins/Logger";

export async function getInstances(): Promise<[Wallet | null, Provider | null, Blockchain | null, TokenService<any> | null]> {
  try {
    log.trace("getInstances() - Start");

    log.debug("getInstances() - Start");
    const yakklMiscStore = getMiscStore();
    if (!yakklMiscStore) {
      log.debug("getInstances() - Not logged in.");
      return [null, null, null, null];
    }

    const currentlySelected = await getYakklCurrentlySelected();
    const chainId = currentlySelected.shortcuts?.chainId ?? 1;

    let wallet: Wallet | null = null;
    wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], chainId, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);

    if (wallet) {
      if (!wallet.getSigner()) {
        log.debug("No signer found. Retrieving account key...");
        const accountKey = await getYakklCurrentlySelectedAccountKey();
        if (accountKey?.privateKey) {
          await wallet.setSigner(accountKey.privateKey);
        } else {
          log.warn("No account key found, wallet may not be functional.");
        }
      }

      const provider = wallet.getProvider();
      if (provider) {
        const signer = wallet.getSigner();
        if (signer) {
          provider.setSigner(signer);
          log.debug("Provider signer set.");
        }

        const blockchain = wallet.getBlockchain() as Ethereum;
        log.debug("Retrieved blockchain:", blockchain);

        const tokenService = new TokenService(blockchain);
        log.debug("TokenService Initialized ");

        return [wallet, provider, blockchain, tokenService];
      }
      log.debug("Provider is null.");
      return [wallet, null, null, null];
    }

    log.debug("Wallet is null.");
    return [null, null, null, null];
  } catch (error) {
    log.error("getInstances() - Failed:", error);
    return [null, null, null, null];
  }
}

