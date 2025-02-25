/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Browser } from 'webextension-polyfill';
import { log } from '$plugins/Logger';

let browser_ext: Browser;

function isBrowserExtensionEnvironment(): boolean {
  try {
    return typeof globalThis !== 'undefined' &&
           (('browser' in globalThis && 'runtime' in (globalThis as any).browser) ||
            ('chrome' in globalThis && 'runtime' in (globalThis as any).chrome));
  } catch (error) {
    log.error('Checking browser extension environment:', error);
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
        log.info('Not in a browser extension environment');
        return null;
      }
    }
    return browser_ext as Browser;
  } catch (error) {
    log.error('Getting browser extension:', error);
    return null;
  }
}

export { browser_ext };
