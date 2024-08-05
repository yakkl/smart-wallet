/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Browser } from 'webextension-polyfill';

let browser_ext: Browser;

function isBrowserExtensionEnvironment(): boolean {
  return typeof globalThis !== 'undefined' && 
         (('browser' in globalThis && 'runtime' in (globalThis as any).browser) ||
          ('chrome' in globalThis && 'runtime' in (globalThis as any).chrome));
}

export function getBrowserExt(): Browser {
  if (!browser_ext) {
    if (isBrowserExtensionEnvironment()) {
      if (typeof (globalThis as any).browser !== 'undefined') {
        browser_ext = (globalThis as any).browser as Browser;
      } else if (typeof (globalThis as any).chrome !== 'undefined') {
        browser_ext = (globalThis as any).chrome as unknown as Browser;
      } else {
        throw new Error('Unable to find browser extension API');
      }
    } else {
      console.log('Not in a browser extension environment');
    }
  }
  return browser_ext as Browser;
}

export { browser_ext };
