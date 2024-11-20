// src/lib/security/SecurityManager.ts

import type { User } from '$lib/common/interfaces';

export abstract class SecurityManager {
  abstract signIn(token?: string): Promise<User>;
  abstract signOut(): Promise<void>;
  abstract getUser(): User | null;
  abstract encryptWallet(walletData: string): Promise<string>;
  abstract decryptWallet(encryptedData: string): Promise<string>;
  abstract deriveEncryptionKey(): Promise<CryptoKey>;
  abstract verifyPin(pin: string): Promise<boolean>;
  abstract changePin(oldPin: string, newPin: string): Promise<boolean>;
}
