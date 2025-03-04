/* eslint-disable @typescript-eslint/no-explicit-any */
export const prerender = false;

import {type SaltedKey } from "$lib/common";
import type { EncryptedData } from "$lib/common";
import { log } from "$lib/plugins/Logger";
// import { encodeJSON } from '$lib/utilities/utilities';
import { Buffer } from "buffer";


let crypto: Crypto;
if (typeof window !== 'undefined' && window.crypto) {
  crypto = window.crypto;
} else if (typeof global !== 'undefined' && global?.crypto) {
  crypto = global.crypto;
} else if (typeof require !== 'undefined') {
  // Node.js environment
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  crypto = require('crypto').webcrypto;
} else {
  throw new Error('No crypto support found');
}

function bufferToBase64(array: Uint8Array): string {
  return Buffer.from(array).toString("base64");
}

function base64ToBuffer(s: string): Uint8Array {
  return Buffer.from(s, "base64");
}

async function generateSalt(): Promise<string> {
  const saltBuffer = crypto.getRandomValues(new Uint8Array(64));
  return bufferToBase64(saltBuffer);
}


export async function digestMessage(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  return hashHex;
}


export async function deriveKeyFromPassword( password: string, existingSalt?: string ): Promise<SaltedKey> {
  const { crypto } = window; //global;

  const salt = existingSalt || (await generateSalt());
  const encoder = new TextEncoder();

  const derivationKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 1000000,
      hash: "SHA-256",
    },
    derivationKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return {
    key,
    salt,
  };
}

// Made a copy of this function from utilities.ts due to some of the dependencies were svelte specific. Need to have another file that contains non-svelte specific functions
function encodeJSON<T>(obj: T) {
  return JSON.stringify(obj, (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  })
}

export async function encryptData( data: any, passwordOrSaltedKey: string | SaltedKey ): Promise<EncryptedData> {
  try {
    if (!data) {
      throw new Error("Missing data to encrypt");
    }
    if (!passwordOrSaltedKey) {
      throw new Error("Missing password or key to encrypt data");
    }

    const { key, salt } =
      typeof passwordOrSaltedKey === "string"
        ? await deriveKeyFromPassword(passwordOrSaltedKey)
        : passwordOrSaltedKey;

    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encodedData = encoder.encode(encodeJSON(data));
    const cipherData = await crypto.subtle.encrypt(
      // note we use GCM mode to get authentication guarantees / tamper resistance
      { name: "AES-GCM", iv: iv },
      key,
      encodedData
    );

    return {
      data: bufferToBase64(new Uint8Array(cipherData)),
      iv: bufferToBase64(iv),
      salt,
    } as EncryptedData;
  } catch (error) {
    log.error('Error encrypting data:', false, error);
    throw error;
  }
}

// Return json
export async function decryptData<T>( encryptedData: EncryptedData, passwordOrSaltedKey: string | SaltedKey ): Promise<T> {
  try {
    if (!passwordOrSaltedKey) {
      throw new Error("Missing password or key to decrypt data");
    }
    const { data, iv, salt } = encryptedData;
    const { key } =
      typeof passwordOrSaltedKey === "string"
        ? await deriveKeyFromPassword(passwordOrSaltedKey, salt)
        : passwordOrSaltedKey;

    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBuffer(iv) },
      key,
      base64ToBuffer(data)
    );

    const txtDecoder = new TextDecoder().decode(plaintext);
    return JSON.parse(txtDecoder) as T;
  } catch (error) {
    log.error('Error decrypting data:', false, error);
    throw error;
  }
}
