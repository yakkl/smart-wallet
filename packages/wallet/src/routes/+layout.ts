/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

/* eslint-disable no-debugger */

export const prerender = true;

import { storageChange, yakklSettingsStore } from "$lib/common/stores";
import {browser as browserSvelte} from '$app/environment';
import { getObjectFromLocalStorage, setObjectInLocalStorage } from "$lib/common/storage";
import { setIconLock } from '$lib/utilities/utilities.js';
import { YAKKL_INTERNAL } from "$lib/common/constants";
import { wait } from "$lib/common/utils";
import type { Settings } from '$lib/common/interfaces';


import type { Browser, Runtime } from 'webextension-polyfill';
import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
import { dateString } from '$lib/common/datetime';

let browser_ext: Browser;
if (browserSvelte) {
  browser_ext = getBrowserExt();
}

type RuntimePort = Runtime.Port;
let port: RuntimePort | undefined = undefined;

async function initializeExtension() {  try {
    if (browserSvelte) {   // Don't add a listener if already exists
      if (browser_ext.storage.local.onChanged.hasListener(storageChange) === false) {
        browser_ext.storage.local.onChanged.addListener(storageChange);
      }
      
      port = browser_ext.runtime.connect({name: YAKKL_INTERNAL});
      if (port) {
        port.onDisconnect.addListener((event: any) => {
          setIconLock();
          port = undefined;
          if (event?.error) {
            console.log(event.error?.message);
          }
        });
      } else {
        console.log('Port is trying again 1 second...');
        wait(1000).then();
        port = browser_ext.runtime.connect({name: YAKKL_INTERNAL}); // Can look at being more efficient later here!
        if (port) {
          port.onDisconnect.addListener((event: any) => {
            setIconLock();
            port = undefined;
            if (event?.error) {
              console.log(event.error?.message);
            }
          });
        } else { 
          console.log('Internal port was unable to connect and is exiting...');
          browser_ext.runtime.reload(); // This is here to try and fix the issue of the port not connecting
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      window.addEventListener('beforeunload', async function () { 
        try {
          if (port) {
            port.postMessage('close');
            port.disconnect();
          }        
          setIconLock();

          const yakklSettings: Settings | null | string = await getObjectFromLocalStorage("settings") as Settings;
          yakklSettings.isLocked = true;
          yakklSettings.isLockedHow = 'window_exit';
          yakklSettings.updateDate = dateString();
          yakklSettingsStore.set(yakklSettings);
          await setObjectInLocalStorage('settings', yakklSettings);

        } catch (e) {
          console.log(e);          
        } finally {
          setIconLock();
        }
      });                    
    }
  } catch(e) {
    console.log(e);
  }
}

if (browserSvelte) initializeExtension();
