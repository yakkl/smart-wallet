/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

/* eslint-disable no-debugger */

export const prerender = true;

import { browserSvelte } from '$lib/utilities/browserSvelte';
import { YAKKL_INTERNAL } from "$lib/common/constants";
import { wait } from "$lib/common/utils";
import type { Browser, Runtime } from 'webextension-polyfill';
import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
import { handleLockDown } from '$lib/common/handlers';

let browser_ext: Browser | null = null;
if (browserSvelte) {
  browser_ext = getBrowserExt();
}

type RuntimePort = Runtime.Port;
let port: RuntimePort | undefined = undefined;

async function initializeExtension() {
  try {
    if (browserSvelte) {
      port = browser_ext.runtime.connect({name: YAKKL_INTERNAL});
      if (port) {
        port.onDisconnect.addListener(async (event: any) => {
          handleLockDown();
          port = undefined;
          if (event?.error) {
            console.log(event.error?.message);
          }
        });
      } else {
        console.log('[INFO]: Port is trying again 1 second...');
        wait(1000).then();
        port = browser_ext.runtime.connect({name: YAKKL_INTERNAL}); // Can look at being more efficient later here!
        if (port) {
          port.onDisconnect.addListener(async (event: any) => {
            handleLockDown();
            port = undefined;
            if (event?.error) {
              console.log('[ERROR]:', event.error?.message);
            }
          });
        } else {
          console.log('Internal port was unable to connect and is exiting...');
          browser_ext.runtime.reload(); // This is here to try and fix the issue of the port not connecting
        }
      }
    }
  } catch(e) {
    console.log(e);
  }
}

if (browserSvelte) initializeExtension();
