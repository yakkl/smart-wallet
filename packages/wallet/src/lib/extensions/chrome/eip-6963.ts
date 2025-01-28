import { getBrowserExt } from "$lib/browser-polyfill-wrapper";
import { debug_log } from "$lib/common/debug-error";
import type { Runtime } from "webextension-polyfill";

type RuntimePort = Runtime.Port;

let browser_ext = getBrowserExt();

export function initializeEIP6963() {
  try {
    browser_ext.runtime.onConnect.addListener((port: RuntimePort) => {
      port.onMessage.addListener((message: any) => {
        debug_log('EIP-6963 - Received message from content script:', message);

        // Handle the message from the content script
        if (message.type === 'YAKKL_REQUEST:EIP6963') {
          const { id, method, params } = message;

          debug_log('Received EIP-6963 request:', method, params);

          // Process the request or forward it to the Ethereum node
          requestEIP6963(method, params).then((result) => {
            debug_log('Sending EIP-6963 response:', result);

            port.postMessage({ id, result, type: 'YAKKL_RESPONSE:EIP6963' });
          }).catch((error) => {
            port.postMessage({ id, error: error.message, type: 'YAKKL_RESPONSE:EIP6963' });
          });
        }
      });
    });
  } catch (error) {
    console.log('background.js - EIP6963 error',error);
  }
}

export function onEIP6963Listener(event: any) {
  try {
    debug_log('background.js -', `yakkl-eip6963 port: ${event}`);
  } catch (error) {
    console.log(error);
  }
}

export async function requestEIP6963(method: string, params: any) {
  // Implement your request handling logic here
  // For example, you can call the Ethereum node or perform other actions

  debug_log('Handling request for method:', method, 'with params:', params);

  return { success: true };
}

