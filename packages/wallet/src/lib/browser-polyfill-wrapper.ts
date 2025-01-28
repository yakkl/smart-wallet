/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Browser } from 'webextension-polyfill';

let browser_ext: Browser;

function isBrowserExtensionEnvironment(): boolean {
  try {
    return typeof globalThis !== 'undefined' &&
           (('browser' in globalThis && 'runtime' in (globalThis as any).browser) ||
            ('chrome' in globalThis && 'runtime' in (globalThis as any).chrome));
  } catch (error) {
    console.log('[ERROR]: Checking browser extension environment:', error);
    return false;
  }
}

export function getBrowserExt(): Browser | null {
  try {
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
        return null;
      }
    }
    return browser_ext as Browser;
  } catch (error) {
    console.log('[ERROR]: Getting browser extension:', error);
    return null;
  }
}

export { browser_ext };
