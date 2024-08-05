// import { ethers } from "ethers";
// import EthCrypto from 'eth-crypto';
import { Wallet } from "alchemy-sdk";

export function getWallet(prvKey: string) {
  if (prvKey.length > 2 && (prvKey.slice(0,2) !== '0x')) {
    prvKey = '0x' + prvKey;
  }
  return new Wallet(prvKey);
}

// export function getPublicKey(prvKey) {
//   return EthCrypto.publicKeyByPrivateKey(prvKey);
// }
