// utils.ts
import type { Blockchain } from '$lib/plugins/Blockchain';
import { Ethereum } from '$plugins/blockchains/evm/ethereum/Ethereum';

export function isEthereum(blockchain: Blockchain): blockchain is Ethereum {
  return blockchain instanceof Ethereum;
}

