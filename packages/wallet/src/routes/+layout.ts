export const prerender = true;

import { browserSvelte, browser_ext } from '$lib/common/environment';
import { YAKKL_INTERNAL } from '$lib/common/constants';
import { wait } from '$lib/common/utils';
import type { Runtime } from 'webextension-polyfill';
import { handleLockDown } from '$lib/common/handlers';
import { debug_log } from '$lib/common/debug-error';
import { syncStoresToStorage } from '$lib/common/stores';
import { loadTokens } from '$lib/common/stores/tokens';

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
          console.log('[ERROR]: Port disconnect:', event.error?.message);
        }
      });
      return true;
    }
  } catch (error) {
    console.log('[ERROR]: Port connection failed:', error);
  }
  return false;
}

async function initializeExtension() {
  if (!browserSvelte) return;

  // debug_log('Root (route) +layout.ts - Syncing storage and stores + loading tokens ...');
  // await syncStoresToStorage();
  // loadTokens();

  try {
    let connected = await connectPort();

    debug_log('ROOT: (route) +layout.ts - Port connected:', connected);

    if (!connected) {
      console.log('[INFO]: Port connection failed, retrying in 1 second...');
      await wait(1000);
      connected = await connectPort();
    }

    if (!connected) {
      console.log('[INFO]: Internal port was unable to connect, reloading...');
      browser_ext?.runtime.reload();
    }
  } catch (error) {
    console.log('[ERROR]: Extension initialization failed:', error);
  }
}

initializeExtension();

