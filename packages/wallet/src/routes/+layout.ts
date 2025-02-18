export const prerender = true;

import { browserSvelte, browser_ext } from '$lib/common/environment';
import { YAKKL_INTERNAL } from '$lib/common/constants';
import { wait } from '$lib/common/utils';
import type { Runtime } from 'webextension-polyfill';
import { handleLockDown } from '$lib/common/handlers';
import { log } from '$plugins/Logger';

let port: Runtime.Port | undefined;

async function connectPort(): Promise<boolean> {
  if (!browser_ext) return false;

  try {
    port = browser_ext.runtime.connect({ name: YAKKL_INTERNAL });

    if (port) {
      port.onDisconnect.addListener(async (event) => {
        handleLockDown();
        port = undefined;
        if (event?.error) {
          log.error('Port disconnect:', event.error?.message);
        }
      });
      return true;
    }
  } catch (error) {
    log.error('Port connection failed:', error);
  }
  return false;
}

async function initializeExtension() {
  if (!browserSvelte) return;

  try {
    let connected = await connectPort();

    log.info('ROOT: (route) +layout.ts - Port connected:', connected);

    if (!connected) {
      log.info('Port connection failed, retrying in 1 second...');
      await wait(1000);
      connected = await connectPort();
    }

    if (!connected) {
      log.info('Internal port was unable to connect, reloading...');
      browser_ext?.runtime.reload();
    }
  } catch (error) {
    log.error('Extension initialization failed:', error);
  }
}

initializeExtension();

