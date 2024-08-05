/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BaseTransaction } from '$lib/common';

export interface AptosTransaction extends BaseTransaction {
  // gasLimit: BigNumberish;
  // gasPrice: BigNumberish;
  expirationTimestamp: number;
  payload: any; // Specific to Aptos
}


// Example:
// const aptosTransaction: AptosTransaction = {
//   from: 'your-aptos-address',
//   to: 'recipient-aptos-address',
//   value: ethers.utils.bigNumberify('1000000000'), // 1 APTOS in the smallest unit
//   nonce: 0,
//   gasLimit: ethers.utils.bigNumberify('1000000'), // Gas limit
//   gasPrice: ethers.utils.bigNumberify('1'), // Gas price per unit
//   expirationTimestamp: Date.now() + 60000, // 1 minute from now
//   payload: { /* specific Aptos transaction payload */ }
// };
