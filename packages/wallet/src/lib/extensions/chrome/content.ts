/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-debugger */
// Content script referenced in the manifest.json file. This gets loaded automatically within the context of every web page.
// It injects a '<script>' tag with the 'src' being the '/js/inpage.js'. The inpage.js reference we be at the top of every web page.


import { Duplex } from 'readable-stream';
import { YAKKL_EXTERNAL, YAKKL_PROVIDER_EIP6963, YAKKL_PROVIDER_ETHEREUM } from '$lib/common/constants';

import type { Runtime } from 'webextension-polyfill';
import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
import { getIcon } from '$lib/common/icon';
import { extractFQDN } from '$lib/common/misc';
import type { MetaDataParams } from '$lib/common/interfaces';
const browser_ext = getBrowserExt();

// NOTE: console.log output will only show up in the dApp console. Background.js only shows up in the YAKKL® Smart Wallet console!
type RuntimePort = Runtime.Port;


// We only want to recieve events from the inpage (injected) script
const windowOrigin = window.location.origin;
let portExternal: RuntimePort | undefined = undefined;


function createPort( name: string ) {
  try {
    // Should only be one. All frames use the same port OR there should only be an injection into the top frame (one content script per tab)
    if (portExternal) {
      return;
    }
    portExternal = browser_ext.runtime.connect({
      name: name
    });
    if ( portExternal ) {
      portExternal.onMessage.addListener( onMessageListener );
      portExternal.onDisconnect.addListener( onDisconnectListener );
    }
  } catch ( error ) {
    console.log( error );
  }
}

const onMessageListener = (function() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  return function(response) {
    try {
      if (response.type === 'YAKKL_RESPONSE') {
        window.postMessage(response, windowOrigin); // This is the response back to the dApp!
      }
    } catch (error) {
      console.log(error); // General error handling
      window.postMessage({id: response.id, method: response.method, error: error, type: 'YAKKL_RESPONSE'}, windowOrigin);
    }
  };
})();


// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onDisconnectListener( event ) {
  try {
    if ( browser_ext.runtime.lastError ) {
      console.log( 'content.js - lastError:', browser_ext.runtime.lastError );
    }
    if ( portExternal ) {
      if ( portExternal.onMessage ) {
        portExternal.onMessage.removeListener( onMessageListener );
      }
      if ( portExternal.onDisconnect ) {
        portExternal.onDisconnect.removeListener( onDisconnectListener ); // Not sure of this one???????/
      }
    }
    portExternal = undefined;
    createPort(YAKKL_EXTERNAL);
    // This is here due to manifest v3+ will disconnect the background after the browser shuts down the running background code
  } catch ( error ) {
    console.log( 'content.js - error', error );
  }
}


// This is the main entry point for the content script
try {
  if ( document.contentType === "text/html" ) {
    const container = document.head || document.documentElement;
    const script = document.createElement( "script" );
    script.setAttribute( "async", "false" );
    script.src = browser_ext.runtime.getURL( "/ext/inpage.js" );  // May want to pull in inpage.js during build instead of runtime to make sure it's registered quickly and first
    script.id = YAKKL_PROVIDER_ETHEREUM;  // TODO: May want to change to something more dynamic...?
    script.onload = () => {
      script.remove();
    };
    container.prepend( script );
  }

  createPort(YAKKL_EXTERNAL);

  // View all of the message data that was sent with the global window.postMessage({data}, URI)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const requestListener = ( event ) => {
    try {
      if (event?.source !== window) return;

      if (event?.data && event?.data?.type === 'YAKKL_REQUEST' && event?.origin === windowOrigin) {
        const data = event.data;
        data.external = true;

        createPort(YAKKL_EXTERNAL); // This will return an already created port otherwise create a new one

        if ( data.params === undefined ) {
          data.params = [];
        }

        const faviconUrl = getIcon();
        const title = window.document?.title ?? '';
        const domain = extractFQDN(event?.origin);
        const context = data.method;
        const message = (data.method === 'eth_requestAccounts' || data.method === 'wallet_requestPermissions') ? 'Wanting you to approve one or more accounts the dApp can work with!' : 'Wanting you to approve the transaction or sign message. Be mindful of the request!';

        if (domain === null) {
          throw 'Domain name is not valid. This can be due to malformed URL Address of the dApp.';
        }

        const metaDataParams: MetaDataParams = { title: title, icon: faviconUrl, domain: domain, context: context, message: message};

        switch (data.method) {
          case 'wallet_switchEthereumChain':
          case 'wallet_addEthereumChain':
          case 'eth_sendTransaction':
          case 'eth_signTypedData_v3':
          case 'eth_signTypedData_v4':
          case 'eth_estimategas':
          case 'personal_sign':
            data.metaDataParams = metaDataParams.transaction = data.params;
            break;
          default:
            data.metaDataParams = metaDataParams
            break;
        }

        if (data.method && portExternal) {
          portExternal.postMessage( data );
        }
      }
    } catch (e) {
      console.log(e);
      window.postMessage({id: event.id, method: event.method, error: e, type: 'YAKKL_RESPONSE'}, windowOrigin); // General error handling
    }
  }

  window.addEventListener( 'message', requestListener);
} catch ( e ) {
  console.log( 'content.js - YAKKL: Provider injection failed. This web page will not be able to connect to YAKKL.', e );
}


// EIP-6963


class PortDuplexStream extends Duplex {
  private port: RuntimePort;

  constructor(port: RuntimePort) {
    super({ objectMode: true });

    console.log('PortDuplexStream constructor', port);
    this.port = port;
    this.port.onMessage.addListener(this._onMessage.bind(this));
    this.port.onDisconnect.addListener(() => this.destroy());
  }

  _read() {
    // No-op
  }

  _write(message: any, _encoding: string, callback: () => void) {
    this.port.postMessage(message);
    callback();
  }

  _onMessage(message: any) {
    this.push(message);
  }

  _destroy(err: Error | null, callback: (error: Error | null) => void) {
    this.port.disconnect();
    callback(err);
  }
}

const port = browser_ext.runtime.connect({ name: YAKKL_PROVIDER_EIP6963 });
const contentStream = new PortDuplexStream(port);

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source === window && event.data && event.data.type === 'YAKKL_REQUEST:EIP6963') {
    contentStream.write(event.data);
  }
});


contentStream.on('data', (data) => {
  window.postMessage(data, window.location.origin);
});

