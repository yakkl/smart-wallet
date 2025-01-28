// environment.ts
import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
import type { Browser } from 'webextension-polyfill';

export const browser_ext: Browser | null = getBrowserExt();
export const browserSvelte: boolean = !!browser_ext;

// Export utility functions for validation
export function isBrowserEnv(): boolean {
  return !!browserSvelte;
}
