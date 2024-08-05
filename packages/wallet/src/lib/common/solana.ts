import type { BaseTransaction } from '$lib/common';

export interface SolanaTransaction extends BaseTransaction {
  // Solana-specific properties
  recentBlockhash?: string;
  instructions?: Array<SolanaInstruction>;
}

interface SolanaInstruction {
  programId: string;
  data: string;
  keys: Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }>;
}



// Example:
// const solTransaction: SolanaTransaction = {
//   from: 'your-solana-address',
//   to: 'recipient-solana-address',
//   value: ethers.utils.bigNumberify('1000000000'), // 1 SOL in lamports
//   nonce: 0,
//   fee: ethers.utils.bigNumberify('5000'), // Fee in lamports
//   recentBlockhash: 'recent-blockhash',
//   instructions: [{
//     programId: 'program-id',
//     keys: [{ pubkey: 'key-pubkey', isSigner: true, isWritable: true }],
//     data: 'instruction-data'
//   }]
// };
