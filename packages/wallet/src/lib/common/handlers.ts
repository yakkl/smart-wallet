// src/utils/handlers.ts
import { goto } from '$app/navigation';
import { PATH_LOCK } from './constants';
import type { Runtime } from 'webextension-polyfill';  // Correct Type Import

// Centralized message handler function
export function handleOnMessage(
  request: any,
  sender: Runtime.MessageSender
): true | Promise<unknown> {
  try {
    if (request?.method === 'yak_lockdown') {
      goto(PATH_LOCK);  // Assuming PATH_LOCK is correctly defined
      return true;  // Correct return type
    }
    return Promise.resolve();  // Return a valid Promise if nothing is handled
  } catch (e) {
    console.log('Error handling message:', e);
    return Promise.resolve();  // Fallback on error
  }
}

