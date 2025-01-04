// File: stores.ts
import { writable } from 'svelte/store';

export const transaction = writable({
  toAddress: '',
  amount: '',
  gasPrice: 'market',
});
