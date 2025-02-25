import { log } from '$lib/plugins/Logger';
import type { Deferrable } from '@ethersproject/properties';
import { Alchemy, Network, type TransactionRequest, type BlockTag } from 'alchemy-sdk';


/**********************************************************************************************************************/
// This section is for the Ethereum provider - Legacy version

export async function estimateGas(chainId: any, params: Deferrable<TransactionRequest>, kval: string | undefined) {
  try {
    const provider = new Alchemy(getProviderConfig(chainId, kval));
    return await provider.transact.estimateGas(params);
  } catch (e) {
    log.error(e);
    return undefined;
  }
}

export async function getBlock(chainId: any, block: BlockTag | Promise<BlockTag>, kval: string | undefined) {
  try {
    const provider = new Alchemy(getProviderConfig(chainId, kval));
    return await provider.core.getBlock(block);
  } catch (e) {
    log.error(e);
    return undefined;
  }
}

// NOTE: These items should now come from the Wallet.provider.getConfig() function or similar
// chainId must be hex
function getProviderConfig(chainId: any, kval: any) {
  try {
    let api = kval;  // Set defaults
    let network = Network.ETH_SEPOLIA;
    switch(chainId) {
      case "0xaa36a7": // Ethereum Sepolia
      case 11155111:
        api = kval;
        network = Network.ETH_SEPOLIA;
        break;
      case "0x1": // Ethereum mainnet
      case "0x01":
      case 1:
      default:
        api = kval;
        network = Network.ETH_MAINNET;
        break;
    }
    return {
      apiKey: api,
      network: network,
    }
  } catch (e) {
    log.error(e);
    return undefined;
  }
}
