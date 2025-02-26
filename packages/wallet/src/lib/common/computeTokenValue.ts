import type { TokenData } from './interfaces';
import { log } from "$plugins/Logger";

/**
 * Computes the balance and value of a token.
 * @param token The token data object
 * @returns { balance: number, value: number }
 */

export function computeTokenValue(token: TokenData): { balance: number, value: number } {
  let balance = token?.balance ? Number(token.balance) : 0; // Direct conversion

  const price = token?.price?.price ?? 0;
  const value = balance * price;

  return { balance, value };
}
