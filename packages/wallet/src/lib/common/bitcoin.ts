import type { BaseTransaction } from '$lib/common/';

// Interface for Bitcoin transactions

export interface BitcoinTransaction extends BaseTransaction {
  // Bitcoin-specific properties
  lockTime?: number;
  inputs?: Array<BitcoinInput>;
  outputs?: Array<BitcoinOutput>;
}

interface BitcoinInput {
  txid: string;
  vout: number;
  scriptSig: string;
  sequence?: number;
}

interface BitcoinOutput {
  value: bigint;
  scriptPubKey: string;
}



// Example:

// const btcTransaction: BitcoinTransaction = {
//   from: 'your-btc-address',
//   to: 'recipient-btc-address',
//   value: ethers.utils.bigNumberify('100000000'), // 1 BTC in satoshis
//   nonce: 0,
//   fee: ethers.utils.bigNumberify('10000'), // Fee in satoshis
//   inputs: [{ txId: 'previous-txid', index: 0, amount: ethers.utils.bigNumberify('100000000') }],
//   outputs: [{ address: 'recipient-btc-address', amount: ethers.utils.bigNumberify('99900000') }] // Minus fee
// };
