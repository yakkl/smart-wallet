import { YAKKL_DAPP, YAKKL_ETH, YAKKL_EXTERNAL, YAKKL_INTERNAL, YAKKL_PROVIDER_EIP6963, YAKKL_SPLASH } from "$lib/common/constants";
import { debug_log } from "$lib/common/debug-error";
import { handleLockDown } from "$lib/common/handlers";
import type { YakklCurrentlySelected } from "$lib/common/interfaces";
import { getObjectFromLocalStorage, setObjectInLocalStorage } from "$lib/common/storage";
import { checkDomain } from "$lib/extensions/chrome/database";
import { setIconUnlock } from "$lib/utilities/utilities";
import type { Runtime } from "webextension-polyfill";
import { showDappPopup, showPopup } from "$lib/extensions/chrome/ui";
import { estimateGas, getBlock } from "$lib/extensions/chrome/legacy";
import { supportedChainId } from "$lib/common/utils";
import { onPortInternalListener } from "$lib/common/listeners/ui/portListeners";
import { onEthereumListener } from "$lib/common/listeners/background/backgroundListeners";
import { onEIP6963Listener } from "$lib/extensions/chrome/eip-6963";
import { onDappListener } from "$lib/extensions/chrome/dapp";
import { browser_ext } from "$lib/common/environment";

export let requestsExternal = new Map< string, { data: unknown; } >();

type RuntimePort = Runtime.Port;
// type RuntimeSender = Runtime.MessageSender;
// type RuntimePlatformInfo = Runtime.PlatformInfo;

const portsExternal = new Map();
let portsDapp: RuntimePort[] = [];
let portsInternal: RuntimePort[] = [];

// Port Listeners...

// This section registers when the content and background services are connected.
export async function onPortConnectListener(port: RuntimePort) {
  try {
    if (!port) {
      throw "Port was undefined for onConnect.";
    }
    if (port.sender && port.sender.tab && port.name === YAKKL_EXTERNAL) {
      portsExternal.set(port.sender.tab.id, port);
    }
    else if (port.name === YAKKL_DAPP ) {
      if (!portsDapp.includes(port)) {
        portsDapp.push(port);
      }
    } else {
      if (!portsInternal.includes(port)) {
        portsInternal.push(port);
      }
    }

    // debug_log('portListeners - onPortConnectListener', portsExternal, portsDapp, portsInternal, port);

    // TBD - NOTE: May want to move to .sendMessage for sending popup launch messages!!!!!!!
    // May want to revist this and simplify
    if (!port.onDisconnect.hasListener(onPortDisconnectListener)) {
      port.onDisconnect.addListener(onPortDisconnectListener);
    }

    switch (port.name) {
      case "yakkl":
        await setIconUnlock();
        break;
      case YAKKL_SPLASH:
        //@ts-ignore
        if (!port.onMessage.hasListener(onPopupLaunchListener)) {
          //@ts-ignore
          port.onMessage.addListener(onPopupLaunchListener);
        }
        break;
      case YAKKL_INTERNAL:
        // Now find out the message payload
        //@ts-ignore
        if (!port.onMessage.hasListener(onPortInternalListener)) {
          //@ts-ignore
          port.onMessage.addListener(onPortInternalListener);
        }
        break;
      case YAKKL_EXTERNAL:
        // Now find out the message payload
        //@ts-ignore
        if (!port.onMessage.hasListener(onPortExternalListener)) {
          //@ts-ignore
          port.onMessage.addListener(onPortExternalListener);
        }
        break;
      case YAKKL_ETH:
        //@ts-ignore
        if (!port.onMessage.hasListener(onEthereumListener)) {
          //@ts-ignore
          port.onMessage.addListener(onEthereumListener);
        }
      break;
      case YAKKL_DAPP:
        //@ts-ignore
        if (!port.onMessage.hasListener(onDappListener)) {
          //@ts-ignore
          port.onMessage.addListener(onDappListener);
        }
      break;
      case YAKKL_PROVIDER_EIP6963:
        //@ts-ignore
        if (!port.onMessage.hasListener(onEIP6963Listener)) {
          //@ts-ignore
          port.onMessage.addListener(onEIP6963Listener);
        }
      break;
      default:
        throw `Message ${port.name} is not supported`;
    }
  } catch(error) {
    console.log("[ERROR]: onPortConnectListener:", error);
  }
}

export async function onPortDisconnectListener(port: RuntimePort): Promise<void> {
  try {
    // debug_log('background - onDisconnectListener', port);

    if (browser_ext.runtime.lastError) {
      console.log('[ERROR]: background - portListeners - lastError', browser_ext.runtime.lastError);
    }
    if (port) {
      if (port.name === "yakkl") {
        await handleLockDown();
        port.onDisconnect.removeListener(onPortDisconnectListener);
      }

      if (port.sender && port.sender.tab && port.name === YAKKL_EXTERNAL) {
        portsExternal.delete(port.sender.tab.id);
      }
      else if (port.name === YAKKL_DAPP ) {
        const index = portsDapp.indexOf(port);
        if (index !== -1) {
          portsDapp.splice(index, 1);
        }
      } else {
        const index = portsInternal.indexOf(port);
        if (index !== -1) {
          portsInternal.splice(index, 1);
        }
      }
    }
  } catch (error) {
    console.log('[ERROR]: onDisconnectListener:',error);
  }
}

//@ts-ignore
export async function onPortExternalListener(event, sender): Promise<void> {
  try {
    // debug_log('yakkl - background - onPortExternalListener', event, sender);

    if (event.method) {
      let yakklCurrentlySelected;
      let error = false;
      const externalData = event;
      externalData.sender = sender;

      switch (event.method) {
        case 'yak_dappsite':
          // This is a WIP. DappIndicator.svelte is done and the messaging here is complete. Content.ts needs to send the site to here!
          browser_ext.runtime.sendMessage({method: event.method});  // This sends the message to the UI for it to display 'DAPP'. Later we can add which site if we need to.
          return;

        case 'yak_checkdomain':
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          checkDomain(event.params[0]).then(result => {
          // WIP - Need to update the background.ts in yakkl to build the db from the json file and then have the inpage.ts send the domain to content.ts which will ask background.ts to check it. If it's flagged, then we'll redirect to this page. My concern is the performance of this. We'll need to test it.
          });
          break;
      }

      // This needs to be checked. If the user has never selected a default account then the needed values will not be present and errors will occur.
      // If this occurs, close the approval popup, launch Yakkl Extension, select a default account and a default network type (default is mainnet), close Yakkl and then connect the Dapp.

      yakklCurrentlySelected = await getObjectFromLocalStorage("yakklCurrentlySelected") as YakklCurrentlySelected;
      if (!yakklCurrentlySelected || yakklCurrentlySelected.shortcuts?.accountName?.trim().length === 0 || yakklCurrentlySelected.shortcuts?.address?.trim().length === 0) {
        if (error) return;
        if (!error) {
          error = true;

          requestsExternal.set(event.id.toString(),{data: 'It appears that your currently selected account in Yakkl has not been set or initialized. After this window closes, login to the Yakkl Browser Extension as normal. If no account is showing on the card then select an account from the account list. Then select which network to use. By default this is the `LIVE - Mainnet` but you can also select from the `SIM` types if you only want to simulate/test first before allow this dApp to have access to any account. Once you have selected the account and network type simply logout or close the window. Now, re-run the dApp request again. If there is still an issue then please open a ticket detailing with this information. Thank you!'});

          showDappPopup('/dapp/popups/warning.html?requestId=' + Number(event.id).toString());
          return;
        }
      }

      requestsExternal.set(Number(event.id).toString(),{data: externalData});

      if (externalData?.metaDataParams) {
        // favIconDapp = externalData.metaDataParams.icon;
        // domainDapp = externalData.metaDataParams.domain;
        // titleDapp = externalData.metaDataParams.title;
        // messageDapp = externalData.metaDataParams.message;
        // contextDapp = externalData.metaDataParams.context;

        switch (event.method) {
          case 'eth_sendTransaction':
          case 'eth_estimateGas':
          case 'eth_signTypedData_v3':
          case 'eth_signTypedData_v4':
          case 'personal_sign':
          case 'wallet_addEthereumChain':
            // transactionDapp = externalData.metaDataParams.transaction;
            break;
        }
      }

      // wallet_getPermissions
      switch(event.method) {
        case 'eth_requestAccounts':
        case 'wallet_requestPermissions':
          showDappPopup('/dapp/popups/approve.html?requestId=' + Number(event.id).toString());
          break;
        case 'eth_sendTransaction':
          showDappPopup('/dapp/popups/transactions.html?requestId=' + Number(event.id).toString());
          break;
        case 'eth_signTypedData_v3':
        case 'eth_signTypedData_v4':
        case 'personal_sign':
          showDappPopup('/dapp/popups/sign.html?requestId=' + Number(event.id).toString());
          break;
        case 'eth_estimateGas':
          if (yakklCurrentlySelected?.shortcuts?.chainId) {
            const response = await estimateGas(yakklCurrentlySelected.shortcuts.chainId, event.params, process.env.VITE_ALCHEMY_API_KEY_PROD);
            sender.postMessage({id: event.id, method: event.method, type: 'YAKKL_RESPONSE', result: response});
          }
        break;
        case 'eth_getBlockByNumber':
          if (yakklCurrentlySelected?.shortcuts?.chainId) {
            const block = event?.params[0] ?? 'latest';
            let value;
            getBlock(yakklCurrentlySelected.shortcuts.chainId, block, process.env.VITE_ALCHEMY_API_KEY_PROD).then(result => {
              value = result;
              sender.postMessage({id: event.id, method: event.method, type: 'YAKKL_RESPONSE', result: value});
            });
          }
          break;
        case 'wallet_addEthereumChain':
          sender.postMessage({id: event.id, method: event.method, type: 'YAKKL_RESPONSE', result: null});
          break;
        case 'wallet_switchEthereumChain':
          {
            let value = null;
            if ( event?.params?.length > 0) {
              const chainId: number = event.params[0];
              const supported = supportedChainId(chainId);
              if (supported) {
                yakklCurrentlySelected = await getObjectFromLocalStorage("yakklCurrentlySelected") as YakklCurrentlySelected;
                if (yakklCurrentlySelected?.shortcuts?.chainId) {
                  value = yakklCurrentlySelected.shortcuts.chainId === chainId ? null : chainId;
                  if (value) {
                    yakklCurrentlySelected.shortcuts.chainId = chainId;
                    await setObjectInLocalStorage('yakklCurrentlySelected', yakklCurrentlySelected);
                  }
                }
              }
            }
            sender.postMessage({id: event.id, method: event.method, type: 'YAKKL_RESPONSE', result: value});
          }
          break;
        // These next two here in the event that the methods get through the content.ts and inpage.js
        case 'eth_chainId':
          yakklCurrentlySelected = await getObjectFromLocalStorage("yakklCurrentlySelected") as YakklCurrentlySelected;
          if (yakklCurrentlySelected?.shortcuts?.chainId) {
            const value = yakklCurrentlySelected.shortcuts.chainId;
            sender.postMessage({id: event.id, method: event.method, type: 'YAKKL_RESPONSE', result: value});
          } else {
            sender.postMessage({id: event.id, method: event.method, type: 'YAKKL_RESPONSE', result: 1}); // Default to mainnet
          }
          break;
        case 'net_version':
          yakklCurrentlySelected = await getObjectFromLocalStorage("yakklCurrentlySelected") as YakklCurrentlySelected;
          if (yakklCurrentlySelected?.shortcuts?.chainId) {
            const value = yakklCurrentlySelected.shortcuts.chainId.toString();
            sender.postMessage({id: event.id, method: event.method, type: 'YAKKL_RESPONSE', result: value});
          }
          break;
        default:
          break;
      }
    } else {
      sender.postMessage({id: event.id, method: event.method, type: 'YAKKL_RESPONSE', error: {code: 4200, message: 'The requested method is not supported by this Ethereum provider.'}});
    }
  } catch (error) {
    sender.postMessage({id: event.id, method: event.method, type: 'YAKKL_RESPONSE', error: {code: -1, message: error}});
  }
}

// Has to check the method here too since this function gets called from different places
export async function onPopupLaunchListener(m: { popup: string; }, p: { postMessage: ( arg0: { popup: string; } ) => void; }) {
  try {
    // try/catch should catch if m or p are undefined
    if (m.popup && m.popup === "YAKKL: Splash") {
      // @ts-ignore
      await browser_ext.storage.session.get('windowId').then(async (result) => {
        let windowId: number | undefined = undefined;

        if (result) {
          windowId = result.windowId as any;
        }

        if (windowId) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          browser_ext.windows.get(windowId).then(async (_result: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            browser_ext.windows.update(windowId, {focused: true}).then(() => {
              // result not currently used
            }).catch((error: any) => {console.log(error)});

            p.postMessage({popup: "YAKKL: Launched"}); // Goes to +page@popup.svelte
            return;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          }).catch(async () => {
            showPopup('');
            p.postMessage({popup: "YAKKL: Launched"});
          });
        } else {
          // TBD - Maybe look for any existing popup windows before creating a new one...
          // Maybe register a popup
          showPopup('');
          p.postMessage({popup: "YAKKL: Launched"});
        }
      });
    }
  } catch (error) {
    console.log('[ERROR]: onPopupLaunchListener:',error);
  }
}
