<script lang="ts">
  import {browser as browserSvelte} from '$app/environment';
  import {onDestroy, onMount} from 'svelte';
  import { YAKKL_SPLASH, NUM_OF_SPLASH_IMAGES } from '$lib/common/constants';
	import { wait } from '$lib/common/utils';

  // Splash size should be maximum default browser extension size. 
  // Note: May want to look into providing a communications window for the user to see what is going on if we need to provide them with an important message.
  import type { Browser, Runtime } from 'webextension-polyfill';
  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
  let browser_ext: Browser; 
  if (browserSvelte) browser_ext = getBrowserExt();

  type RuntimePort = Runtime.Port;

  let port: RuntimePort;
  let isPortDisconnected = false;

  onMount(async () => {
    try {
      if (browserSvelte) {
        port = browser_ext.runtime.connect({name: YAKKL_SPLASH});
        if (port) {
          isPortDisconnected = false; // Mark port as connected ??

          port.onMessage.addListener((m: any) => {
            if (m.popup === "YAKKL: Launched") {
              window.close(); // Close this splash window
            }
          });

          port.onDisconnect.addListener(() => {
            isPortDisconnected = true; // Mark port as disconnected
            console.log("Port has been disconnected.");
          });
        } else {
          console.log("YAKKL: Splash: Port is trying again in 2 seconds...");
          await wait(2000);

          // Try one more time
          port = browser_ext.runtime.connect({name: YAKKL_SPLASH});
          if (port) {
            port.onMessage.addListener((m: any) => {
              if (m.popup === "YAKKL: Launched") {
                port.disconnect();
                window.close(); // Close this splash window
              }
            });

            port.onDisconnect.addListener(() => {
              isPortDisconnected = true; // Mark port as disconnected
              console.log("Port has been disconnected.");
            });   
          } else {
            browser_ext.runtime.reload(); // Reload the extension. This will exit it and apply any pending updates.
          }
        }

        browser_ext.alarms.create('yakkl-splash-alarm', {when: Date.now() + 3000}); // Change this number to reflect how much time we want the user to see the splash screen
        browser_ext.alarms.onAlarm.addListener((m: any) => {
          if (port && !isPortDisconnected) port.postMessage({popup: "YAKKL: Splash"}); // Fire when the timer ends - goes to the background.ts
        });
      }
    } catch (e) {
      console.log(e);
    }
  });


  onDestroy( () => {
    try {
      if (browserSvelte) {
        browser_ext.alarms.clearAll();
        isPortDisconnected = true;
        if (port) {
          port.disconnect();
        }
      }
    } catch (e) {
      console.log(e);
    }
  });


  function getRandomInt(max: number) {
    try {
      return Math.floor(Math.random() * max);
    } catch (e) {
      return 0;
    }
  }

</script>

<img src="/images/splash_{getRandomInt(NUM_OF_SPLASH_IMAGES)}.png" alt="Splash page with logo">

