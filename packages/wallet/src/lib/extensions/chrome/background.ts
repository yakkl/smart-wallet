
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Background actions for the extension...

// command to debug output
// npx tsc src/lib/extensions/chrome/background.ts src/lib/extensions/chrome/content.ts src/lib/extensions/chrome/inpage.ts --noEmit --skipLibCheck

import { getObjectFromLocalStorage, setObjectInLocalStorage } from '$lib/common/storage';
import { STORAGE_YAKKL_PREFERENCES, YAKKL_INTERNAL, YAKKL_SPLASH, YAKKL_ETH, VERSION, YAKKL_EXTERNAL, YAKKL_DAPP, YAKKL_PROVIDER_EIP6963 } from '$lib/common/constants';
import { yakklStoredObjects } from '$lib/models/dataModels';
import { detect } from 'detect-browser';
import { supportedChainId  } from "$lib/common/utils";
import { upgrade, updateVersion } from '$lib/upgrades/upgrades';
import { Alchemy, Network, type TransactionRequest, type BlockTag } from 'alchemy-sdk';
import Dexie from 'dexie';
import type { Deferrable } from '@ethersproject/properties';
import type { YakklBlocked, YakklCurrentlySelected, Preferences, Settings, YakklWallet} from '$lib/common/interfaces';
// import browser from 'webextension-polyfill';

import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
import type { Runtime, Windows, Alarms, Tabs, Browser } from 'webextension-polyfill';
import { loadDefaultTokens } from '$lib/plugins/tokens/loadDefaultTokens';
import { dateString } from '$lib/common/datetime';
import { handleLockDown } from '$lib/common/handlers';
// import type { Yakkl } from '$lib/plugins/providers';
// import { yakklPreferences } from '../../models/dataModels';

type RuntimePort = Runtime.Port;
type WindowsWindow = Windows.Window;
type AlarmsAlarm = Alarms.Alarm;
type RuntimePlatformInfo = Runtime.PlatformInfo;
type RuntimeSender = Runtime.MessageSender;

let browser_ext: Browser | null = null;

function initializeBrowserExt() {
  browser_ext = getBrowserExt();
}

// (() => {
  initializeBrowserExt();
// })();

// Example: const browser_ext = ensureBrowserExt();
//  browser_ext.runtime.onInstalled.addListener(handleOnInstalledUpdated);
// function ensureBrowserExt(): Browser {
//   const ext = getBrowserExt();
//   if (!ext) {
//     throw new Error('Browser extension API not available');
//   }
//   return ext;
// }

// Another option:
// function isBrowserExtAvailable(ext: any): ext is Browser {
//   return ext && typeof ext.runtime !== 'undefined';
// }

// const browser_ext = getBrowserExt();
// if (isBrowserExtAvailable(browser_ext)) {
//   browser_ext.runtime.onInstalled.addListener(handleOnInstalledUpdated);
// } else {
//   console.log('Browser extension API not available');
// }

let lockIconTimer: ReturnType<typeof setInterval> | null = null;

function startLockIconTimer() {
  if (!lockIconTimer) {
    lockIconTimer = setInterval(async () => {
      const yakklSettings = await getObjectFromLocalStorage('settings') as Settings;
      if (yakklSettings?.isLocked) {
        await setIconLock();
      } else {
        await setIconUnlock();
      }
    }, 10000); // Check every 10 seconds
  }
}

async function stopLockIconTimer() {
  await setIconLock();
  const yakklSettings = await getObjectFromLocalStorage('settings') as Settings;
  if (yakklSettings) {
    yakklSettings.isLocked = true;
    await setObjectInLocalStorage('settings', yakklSettings);
  }
  if (lockIconTimer) {
    clearInterval(lockIconTimer);
    lockIconTimer = null;
  }
}

try {
  browser_ext!.runtime.onMessage.addListener((message: any, sender: RuntimeSender, sendResponse) => {
    handleOnMessage(message, sender, sendResponse);
    // Returning true ensures the response can be asynchronous
    return true;
  }); // For onetime messages
} catch (error) {
  console.log('background.js - onMessage error',error);
}


async function setIconLock(): Promise<void> {
  try {
    if (!browser_ext) {
      console.log("background: setIconLock - browser_ext is not initialized");
      return;
    }
    await browser_ext.action.setIcon({
      path: {
        16: "/images/logoBullLock16x16.png",
        32: "/images/logoBullLock32x32.png",
        48: "/images/logoBullLock48x48.png",
        128: "/images/logoBullLock128x128.png"
      }
    });
  } catch (e) {
    console.log("Error setting lock icon:", e);
  }
}

async function setIconUnlock(): Promise<void> {
  try {
    if (!browser_ext) {
      console.log("background: setIconUnLock - browser_ext is not initialized");
      return;
    }
    await browser_ext.action.setIcon({
      path: {
        16: "/images/logoBull16x16.png",
        32: "/images/logoBull32x32.png",
        48: "/images/logoBull48x48.png",
        128: "/images/logoBull128x128.png"
      }
    });
  } catch (e) {
    console.log("Error setting unlock icon:", e);
  }
}

// NOTE: Any console.log output only shows up in the YAKKL® Smart Wallet console and NOT the dApp. Inpagejs and content.js will show up in the dApp only!

// There can be multiple browser tabs attempting to communicate with the backend service. Use the sender.tab.id as an index so the communication is with the correct
// tab

// eslint-disable-next-line prefer-const
let requestsExternal = new Map<
  string,
  {
    data: unknown;
  }
  >();

// let dappParams = []; // Handles actual params passed from dapps
// let metaDataParams = []; // Handles metadata passed from dapps
// let dappPort;

// eslint-disable-next-line prefer-const
let portsDapp = [];
// eslint-disable-next-line prefer-const
let portsInternal = [];
// eslint-disable-next-line prefer-const
let providers = new Map();
const portsExternal = new Map();
const openWindows = new Map();
const openPopups = new Map();
// let favIconDapp: string;
// let domainDapp: string;
// let titleDapp: string;
// let messageDapp: string;
// let contextDapp: string;
// let transactionDapp;
// let mainWindowId;

let mainPort: RuntimePort | undefined;
let idleAutoLockCycle = 3; // 3 (default) 'idle' counter ticks before being able to lock the account

interface DomainEntry {
  domain: string;
}

class BlacklistDatabase extends Dexie {
  domains: Dexie.Table<DomainEntry, string> | undefined;

  constructor() {
      super("BlacklistDatabase");
      this.version(1).stores({
          domains: 'domain'
      });
  }
}

const db = new BlacklistDatabase();
db.version(1).stores({
    domains: 'domain'
});

// Extract the domain from a URL
function extractDomain(url: string | URL) {
    const domain = new URL(url).hostname;
    if (domain.startsWith('www.')) {  // May want to be more flexible and check number of '.', if more than one then reverse domain string and travers until second '.' and remove from that point onward, and then reverse the string back
        return domain.slice(4);
    }
    return domain;
}


async function initializeDatabase(override: boolean) {
  try {
    // Check if the database is already populated
    if (override === true) {
      await db.domains?.clear();
    }
    const count = await db.domains?.count();
    // If not populated, load the data from lists.json and populate
    if (count === 0) {
      // Fetch the lists.json bundled with the extension
      const response = await fetch(browser_ext!.runtime.getURL("/data/lists.json"));
      const data = await response.json();
      // Bulk add to Dexie
      await db.domains?.bulkAdd(data.blacklist.map((domain: unknown) => ({ domain })));
    }
  } catch(e) {
    console.log(e);
  }
}


// Check if domain is blacklisted
async function isBlacklisted(domain: string) {
  const found = await db.domains?.get({ domain });
  return !!found;
}


try {
  browser_ext!.tabs.onUpdated.addListener(async (tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType, tab: Tabs.Tab) => {
    if (changeInfo.url) {
      const domain = extractDomain(changeInfo.url);

      if (await isBlacklisted(domain)) {
        if (changeInfo.url.endsWith('yid=' + tab.id?.toString())) {
          // The user said 'continue to site'
          console.log('Phishing warning but user elected to proceed to:', changeInfo.url);
          // Bypasses check since it has already been done. If the yid=<whatever the id is> is at the end then it will bypass
        } else {
          console.log('Warning: Attempting to navigate to a known or potential phishing site.', changeInfo.url);
          const url = browser_ext!.runtime.getURL('/phishing.html?flaggedSite=' + changeInfo.url + '&yid=' + tab.id);
          browser_ext!.tabs.update(tabId, { url: url });
        }
      }
    }
  });
} catch (e) {
  console.log(e);
}


// Call as soon as possible...
try {
  if (!browser_ext!.runtime.onInstalled.hasListener(handleOnInstalledUpdated)) {
    browser_ext!.runtime.onInstalled.addListener(handleOnInstalledUpdated);
  }
} catch (error) {
  console.log('background.js - onInstalled error',error);
}

try {
  if (!browser_ext!.runtime.onConnect.hasListener(onConnect)) {
    browser_ext!.runtime.onConnect.addListener(onConnect);
  }
} catch (error) {
  console.log('background.js - onConnect error',error);
}

try {
  if (!browser_ext!.idle.onStateChanged.hasListener(onIdleListener)) {
    browser_ext!.idle.onStateChanged.addListener(onIdleListener);
  }
} catch (error) {
  console.log('background.js - onStateChanged error',error);
}

try {
  if (!browser_ext!.alarms.onAlarm.hasListener(handleOnAlarm)) {
    browser_ext!.alarms.onAlarm.addListener(handleOnAlarm);
  }
} catch (error) {
  console.log('background.js - onAlarm error',error);
}

try {
  browser_ext!.runtime.onSuspend.addListener(handleOnSuspend);
} catch (error) {
  console.log('background.js - onSuspend error',error);
}

try {
  browser_ext!.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleOnMessage(message, sender, sendResponse);
    // Returning true ensures the response can be asynchronous
    return true;
  }); // For onetime messages
} catch (error) {
  console.log('background.js - onMessage error',error);
}

try {
  browser_ext!.tabs.onRemoved.addListener((tabId: any) => {
    try {
      if (tabId && portsExternal.size > 0) {
        portsExternal.delete(tabId);
      }
    } catch (error) {
      console.log('background.js - tab error',error);
    }
  });
} catch (error) {
  console.log('background.js - tab error',error);
}

/*********************************/
// EIP-6963
try {
  browser_ext!.runtime.onConnect.addListener((port: RuntimePort) => {
    port.onMessage.addListener((message: any) => {
      // console.log('Received message from content script:', message);

      // Handle the message from the content script
      if (message.type === 'YAKKL_REQUEST:EIP6963') {
        const { id, method, params } = message;

        // console.log('Received EIP-6963 request:', method, params);

        // Process the request or forward it to the Ethereum node
        handleRequest(method, params).then((result) => {
          // console.log('Sending EIP-6963 response:', result);

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

async function handleRequest(method: string, params: any) {
  // Implement your request handling logic here
  // For example, you can call the Ethereum node or perform other actions
  return { success: true };
}

/*********************************/

// Supposed to fire when extension is about to close but...
async function handleOnSuspend() {
  try {
    handleLockDown();
  } catch (error) {
    console.log('Error during runtime.onSuspend:', error);
  }
}

async function handleOnMessage(
  message: any,
  sender: RuntimeSender,
  sendResponse: (response?: any) => void
): Promise<boolean | void> {
  try {
    switch (message.type) {
      case 'ping': {
        sendResponse({ success: true, message: 'Pong' });
        return true; // Indicates asynchronous response
      }
      case 'createNotification': {
        const { notificationId, title, messageText } = message.payload;
        await browser_ext.notifications.create(notificationId, {
          type: 'basic',
          iconUrl: browser_ext.runtime.getURL('/images/logoBullLock48x48.png'),
          title: title || 'Notification',
          message: messageText || 'Default message.',
        });
        sendResponse({ success: true, message: 'Notification created successfully.' });
        return true; // Indicate asynchronous response
      }
      case 'startLockIconTimer': {
        startLockIconTimer();
        sendResponse({ success: true, message: 'Lock icon timer started.' });
        return true;
      }
      case 'stopLockIconTimer': {
        stopLockIconTimer();
        sendResponse({ success: true, message: 'Lock icon timer stopped.' });
        return true;
      }
      default: {
        sendResponse({ success: false, error: 'Unknown message type.' });
        return true;
      }
    }
  } catch (error: any) {
    console.log('Error handling message:', error);
    sendResponse({ success: false, error: error.message || 'Unknown error occurred.' });
    return true; // Indicate asynchronous response
  }
}


async function handleOnInstalledUpdated( details: Runtime.OnInstalledDetailsType ): Promise<void> {
  try {
    const platform: RuntimePlatformInfo = await browser_ext!.runtime.getPlatformInfo();

    openWindows.clear();
    openPopups.clear();

    if ( details && details.reason === "install") {
      await initializeDatabase(false);

      // This only happens on initial install to set the defaults
      yakklStoredObjects.forEach(async (element) => {
        try {
          await setObjectInLocalStorage(element.key, element.value);
        } catch (error) {
          console.log(`Error setting default for ${element.key}:`, error);
        }
      });

      await browser_ext!.runtime.setUninstallURL(encodeURI("https://yakkl.com?userName=&utm_source=yakkl&utm_medium=extension&utm_campaign=uninstall&utm_content=" + `${VERSION}` + "&utm_term=extension"));

      await setLocalObjectStorage(platform, false);
    }

    if (details && details.reason === "update") {

      if (details.previousVersion !== browser_ext!.runtime.getManifest().version) {
        await initializeDatabase(true); // This will clear the db and then import again
        await setLocalObjectStorage(platform, false); //true); // Beta version to 1.0.0 will not upgrade due to complete overhaul of the extension. After 1.0.0, upgrades will be handled.
      }

    }

    // This function may be removed in the future.
    // updateVersion(VERSION); // Set the initial version

    // Add default tokens
    loadDefaultTokens();

    // Just a safety catch
    const count = await db.domains?.count();
    if (count === 0) {
      await initializeDatabase(false);
    }
  } catch (e) {
    console.log(e);
  }
}


async function setLocalObjectStorage(platform: RuntimePlatformInfo | null, upgradeOption: boolean = false): Promise<void> {
  try {
    const yakklSettings = await getObjectFromLocalStorage<Settings>("settings") as Settings | null;
    const prevVersion = yakklSettings?.version ?? '0.0.0';

    if (upgradeOption) {
      upgrade(prevVersion, VERSION);
    }

    const yakklPreferences = await getObjectFromLocalStorage<Preferences>("preferences") as Preferences | null;
    if (yakklPreferences) {
      idleAutoLockCycle = yakklPreferences.idleAutoLockCycle ?? 3;
    } else {
      idleAutoLockCycle = 3;
    }

    if (yakklSettings) {
      yakklSettings.previousVersion = yakklSettings.version;
      yakklSettings.version = VERSION;
      yakklSettings.updateDate = new Date().toISOString();
      yakklSettings.upgradeDate = yakklSettings.updateDate;
      yakklSettings.lastAccessDate = yakklSettings.updateDate;

      if (platform !== null) {
        const browserPlatform = detect();
        yakklSettings.platform.arch = platform.arch;
        yakklSettings.platform.os = platform.os;
        yakklSettings.platform.browser = browserPlatform?.name ?? '';
        yakklSettings.platform.browserVersion = browserPlatform?.version ?? '';
        yakklSettings.platform.platform = browserPlatform?.type ?? '';
      }

      await setObjectInLocalStorage('settings', yakklSettings);
    }
  } catch (e) {
    console.log('setLocalObjectStorage Error', e);
    throw e;
  }
}


async function onDisconnectListener(port: RuntimePort): Promise<void> {
  try {
    if (browser_ext!.runtime.lastError) {
      console.log('background.js - lastError', browser_ext!.runtime.lastError);
    }
    if (port) {
      if (port.name === "yakkl") {
        handleLockDown();
      }
      port.onDisconnect.removeListener(onDisconnectListener);
      if (mainPort === port) {
        mainPort = undefined;
      }
    }
  } catch (error) {
    console.log('background.js - onDisconnectListener error',error);
  }
}


// TODO: Fix this to have a better type of parameters
// This section registers when the content and background services are connected.
async function onConnect(port: RuntimePort) {
  try {
    if (!port) {
      throw "Port was undefined for onConnect.";
    }
    // TBD - Think about this. Is it really the only port?????????
    mainPort = port;

    if (port.sender && port.sender.tab && port.name === YAKKL_EXTERNAL) {
      portsExternal.set(port.sender.tab.id, port);
    }
    else if (port.name === YAKKL_DAPP ) {
      portsDapp.push(port);
    } else {
      portsInternal.push(port);
    }

    // TBD - NOTE: May want to move to .sendMessage for sending popup launch messages!!!!!!!
    // May want to revist this and simplify
    if (port.onDisconnect && port.onDisconnect.hasListener && !port.onDisconnect.hasListener(onDisconnectListener)) {
      port.onDisconnect.addListener(onDisconnectListener);
    }

    switch (port.name) {
      case "yakkl":
        await setIconUnlock();
        break;
      case YAKKL_SPLASH:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        if (port.onMessage && port.onMessage.hasListener && !port.onMessage.hasListener(onPopupLaunch)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          port.onMessage.addListener(onPopupLaunch);
        }
        break;
      case YAKKL_INTERNAL:
        // Now find out the message payload
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        if (port.onMessage && port.onMessage.hasListener && !port.onMessage.hasListener(onPortInternalListener)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          port.onMessage.addListener(onPortInternalListener);
        }
        break;
      case YAKKL_EXTERNAL:
        // Now find out the message payload
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        if (port.onMessage && port.onMessage.hasListener && !port.onMessage.hasListener(onPortExternalListener)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          port.onMessage.addListener(onPortExternalListener);
        }
        break;
      case YAKKL_ETH:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        if (port.onMessage && port.onMessage.hasListener && !port.onMessage.hasListener(onEthereumListener)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          port.onMessage.addListener(onEthereumListener);
        }
      break;
      case YAKKL_DAPP:
        // dappPort = port;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        if (port.onMessage && port.onMessage.hasListener && !port.onMessage.hasListener(onDappListener)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          port.onMessage.addListener(onDappListener);
        }
      break;
      case YAKKL_PROVIDER_EIP6963:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        if (port.onMessage && port.onMessage.hasListener && !port.onMessage.hasListener(onEIP6963Listener)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          port.onMessage.addListener(onEIP6963Listener);
        }
      break;
      default:
        throw `Message ${port.name} is not supported`;
        break;
    }
  } catch(error) {
    console.log("YAKKL: " + error);
  }
}


// Onetime messages
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// function handleOnMessage(request: any, sender: any) {
//   try {
//     if (request && request.method) {
//       switch(request.method) {
//         case '':
//           break;
//       }
//     }
//   } catch (error) {
//     console.log(error);
//   }
// }

// function handleOnMessage(
//   request: any,
//   sender: browser.Runtime.MessageSender
// ): true | Promise<unknown> {
//   try {
//     if (request?.method === '<whatever>') {
//       return true;
//     }
//     return Promise.resolve(); // Correct TypeScript return type
//   } catch (e) {
//     console.log('Error handling message:', e);
//     return Promise.resolve(); // Ensure a valid return type
//   }
// }

async function onPortInternalListener(event: any): Promise<void> {
  if (event && event.method) {
    switch(event.method) {
      case 'int_screen':
        // browser_ext!.storage.local.get(STORAGE_YAKKL_PREFERENCES).then(async (result: any) => {
        //   const yakkl = result['yakklPreferences'];
        //   yakkl.preferences.screenWidth = event.data.availWidth;
        //   yakkl.preferences.screenHeight = event.data.availHeight;
        //   await browser_ext!.storage.local.set({"preferences": yakkl});
        // });
        updateScreenPreferences(event);
        break;
      // May not need this from login page
      // case 'providers':
      //   console.log('Providers:', event);

      //   if (event.params && event.params.length === 2) {
      //     providers.set(event.params[0], event.params[1]);
      //   }
      //   break;
      case 'close':
        await setIconLock();
        openPopups.clear();
        openWindows.clear();
        // browser_ext!.storage.session.clear();
        break;
      default:
        break;
    }
  }
}

async function updateScreenPreferences(event: any): Promise<void> {
  if (typeof browser_ext === 'undefined') {
    console.log('Browser extension API is not available.');
    return;
  }

  try {
    const yakklPreferences = await getObjectFromLocalStorage<any>('yakklPreferences');

    if (yakklPreferences) {
      yakklPreferences.preferences.screenWidth = event.data.availWidth;
      yakklPreferences.preferences.screenHeight = event.data.availHeight;

      await setObjectInLocalStorage('preferences', yakklPreferences);
    } else {
      console.log('yakklPreferences not found.');
    }
  } catch (error) {
    console.log('Error updating yakklPreferences:', error);
  }
}

async function checkDomain(domain: any): Promise<boolean | undefined> {
  try {
    const yakklBlockList = await getObjectFromLocalStorage("yakklBlockList") as YakklBlocked[];
    if (yakklBlockList) {
      if (yakklBlockList.find((obj: { domain: any; }) => {return obj.domain === domain;})) {
        return Promise.resolve(true);
      }
    }
    return Promise.resolve(false);
  } catch (e) {
    console.log(e);
    Promise.reject(e);
  }
}


// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
async function onPortExternalListener(event, sender): Promise<void> {
  try {
    if (event.method) {
      let yakklCurrentlySelected;
      let error = false;
      const externalData = event;
      externalData.sender = sender;

      switch (event.method) {
        case 'yak_dappsite':
          // This is a WIP. DappIndicator.svelte is done and the messaging here is complete. Content.ts needs to send the site to here!
          browser_ext!.runtime.sendMessage({method: event.method});  // This sends the message to the UI for it to display 'DAPP'. Later we can add which site if we need to.
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


async function onDappListener(event: any, sender: any): Promise<void> {
  try {
    switch(event?.method) {
      case 'get_warning':
        if (Number(event?.id) >= 0) {
          const data = requestsExternal.get(Number(event.id).toString());
          if (data) {
            sender.postMessage({method: 'get_warning', data: data});
          } else {
            // post a message to close the popup
            // send to content.ts an error!!
          }
        } else {
          throw 'No id is present - rejected';
        }
        break;
      case 'get_params':
        if (Number(event?.id) >= 0) {
          const data = requestsExternal.get(Number(event.id).toString());
          if (data) {
            sender.postMessage({method: 'get_params', data: data});
          } else {
            sender.postMessage({method: 'reject'});
          }
        } else {
          throw 'No id is present - rejected';
        }
        break;
      case 'error':
        {
          const data = requestsExternal.get(Number(event.id).toString());
          if (data) {
            const requestData = data.data;
            const sender = (requestData as { sender: any }).sender;
            if (sender) {
              sender.postMessage({id: event.id, method: event.method, type: 'YAKKL_RESPONSE', data: event.response.data});
            }
          }
        }
        break;
      default: // Relays to content.ts
        {
          const data = requestsExternal.get(Number(event.id).toString());

          if (data) {
            const requestData = data.data;
            const sender = (requestData as { sender: any }).sender;
            if (sender) {
              sender.postMessage(event);
            } else {
              throw 'Connection to port has been disconnected - rejected';
            }
          } else {
            throw 'No data is present - rejected';
          }
        }
        break;
    }

  } catch (error) {
    console.log(error);
    sender.postMessage({id: event.id, method: event.method, type: 'YAKKL_RESPONSE', data: {code: -1, message: error}});
  }
}


async function showDappPopup(request: string) {
  try {
    const popupId = openPopups.get('popupId');
    if (popupId) {
      browser_ext!.windows.get(popupId).then(async (_result: any) => {
        browser_ext!.windows.update(popupId, {focused: true}).then((__result: any) => {
          return;
        }).catch(async() => {
          showPopupDapp(request);
          });
        }).catch(async() => {
          showPopupDapp(request);
        });
    } else {
      await showPopupDapp(request);
    }
  } catch (error) {
    console.log('background.js - showDappPopup error:',error);
  }
}


// Has to check the method here too since this function gets called from different places
async function onPopupLaunch(m: { popup: string; }, p: { postMessage: ( arg0: { popup: string; } ) => void; }) {
  try {
    // try/catch should catch if m or p are undefined
    if (m.popup && m.popup === "YAKKL: Splash") {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await browser_ext!.storage.session.get('windowId').then(async (result) => {
        let windowId: number | undefined = undefined;

        if (result) {
          windowId = result.windowId as any;
        }

        if (windowId) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            browser_ext!.windows.get(windowId).then(async (_result: any) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              browser_ext!.windows.update(windowId, {focused: true}).then(() => {
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
    console.log('background.js - ',error);
  }
}


export async function showExtensionPopup(
  popupWidth = 428,
  popupHeight = 926,
  url: string  // This should be undefined, null or ''
): Promise<WindowsWindow> {
  try {
    // Uses the default 'get' here
    const pref = await browser_ext!.storage.local.get( STORAGE_YAKKL_PREFERENCES ) as { yakklPreferences: Preferences; };
    const yakkl = pref['yakklPreferences'] as Preferences;
    // eslint-disable-next-line prefer-const, @typescript-eslint/no-unused-vars
    let { left, top } = await browser_ext!.windows.getCurrent(); //w - 1920

    // Pull from settings and get pin information...
    if ( yakkl && yakkl.wallet ) {
      popupWidth = yakkl.wallet.popupWidth;
      popupHeight = yakkl.wallet.popupHeight;

      const screenWidth = yakkl.screenWidth;
      const screenHeight = yakkl.screenHeight;

      try {
        // eslint-disable-next-line no-constant-condition
        if (yakkl.wallet.pinned) {
          switch (yakkl.wallet.pinnedLocation) {
            case 'TL':
              top = 0;
              left = 0;
              break;
            case 'TR':
              top = 0;
              left = screenWidth <= popupWidth ? 0 : screenWidth - popupWidth;
              break;
            case 'BL':
              top = screenHeight <= popupWidth ? 0 : screenHeight - popupHeight;
              left = 0;
              break;
            case 'BR':
              top = screenHeight <= popupWidth ? 0 : screenHeight - popupHeight;
              left = yakkl.screenWidth - popupWidth;
              break;
            case 'M':
              top = screenHeight <= popupHeight ? 0 : screenHeight/2 - popupHeight/2;
              left = screenWidth <= popupWidth ? 0 : screenWidth/2 - popupWidth/2;
              break;
            default:
              // x,y specific location
              // eslint-disable-next-line no-case-declarations
              const coord = yakkl.wallet.pinnedLocation.split(',');
              if (coord) {
                left = parseInt(coord[0]) <= 0 ? 0 : parseInt(coord[0]);
                top = parseInt(coord[1]) <= 0 ? 0 : parseInt(coord[1]);
              } else {
                left = 0;
                top = 0;
              }
            break;
          }
        }
      } catch (error) {
        console.log(error);
        left = 0;
        top = 0;
      }
    } else {
      top = 0;
      left = 0;
    }

    return browser_ext!.windows.create({
      url: `${browser_ext!.runtime.getURL((url ? url : "index.html"))}`,
      type: "panel",
      left: left,
      top: top,
      width: popupWidth,
      height: popupHeight,
      focused: true,
    });
  } catch (error) {
    console.log(error);
    return Promise.reject(); // May want to do something else here.
  }
}


// TBD! - May need to set up a connection between UI and here
// Check the lastlogin date - todays date = days hash it using dj2 then use as salt to encrypt and send to here and send back on request where it is reversed or else login again
export async function showPopup(url: string): Promise<void> {
  try {
    showExtensionPopup(428, 926, url).then(async (result) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      browser_ext!.windows.update(result.id, {drawAttention: true});
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await browser_ext!.storage.session.set({windowId: result.id});

      openWindows.set(result.id, result);
    }).catch((error) => {
      console.log('background.js - YAKKL: ' + error);  // need to send these area back to content.ts to inpage.ts to dapp so they can respond properly
    });
  } catch (error) {
    console.log('background.js - showPopup',error); // need to send these area back to content.ts to inpage.ts to dapp so they can respond properly
  }
}


export async function showPopupDapp(url: string): Promise<void> {
  try {
    showExtensionPopup(428, 926, url).then(async (result) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      browser_ext!.windows.update(result.id, {drawAttention: true});
      openPopups.set('popupId', result.id);
    }).catch((error) => {
      console.log('background.js - YAKKL: ' + error);  // need to send these area back to content.ts to inpage.ts to dapp so they can respond properly
    });
  } catch (error) {
    console.log('background.js - showPopupDapp',error); // need to send these area back to content.ts to inpage.ts to dapp so they can respond properly
  }
}


function onEthereumListener(event: any) {
  try {
    console.log('background.js -', `yakkl-eth port: ${event}`);
  } catch (error) {
    console.log(error);
  }
}


function onEIP6963Listener(event: any) {
  try {
    console.log('background.js -', `yakkl-eip6963 port: ${event}`);
  } catch (error) {
    console.log(error);
  }
}


async function onIdleListener(state: string): Promise<void> {
  try {
    let yakklSettings;
    let yakklPreferences;

    if (state == 'active') {
      clearAlarm("yakkl-lock-alarm");
    }

    if ( state === "idle" ) {
      yakklSettings = await getObjectFromLocalStorage("settings") as Settings;
      if (!yakklSettings || yakklSettings.isLocked) {
        // May be a good idea to monitor this if yakklSettings is failing
        return;
      }

      yakklPreferences = await getObjectFromLocalStorage("preferences") as Preferences;
      if (yakklPreferences.idleAutoLock) {
        browser_ext!.alarms.create("yakkl-lock-alarm", {when: Date.now() + (60000*(idleAutoLockCycle > 0 ? idleAutoLockCycle : 1))});
      }
    }
  } catch (error) {
    console.log('background.js - idleListener',error);
  }
}


async function clearAlarm(alarmName: string | undefined): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    browser_ext!.alarms.get(alarmName).then(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      browser_ext!.alarms.clear(alarmName).then(() => {
        // Noop
      });
    });
  } catch (error) {
    console.log('background.js - clear',error);
  }
}


async function handleOnAlarm(alarm: AlarmsAlarm): Promise<void> {
  try {
    let yakklSettings;
    // try/catch should catch an invalid alarm object
    if (alarm.name === "yakkl-lock-alarm") {
      yakklSettings = await getObjectFromLocalStorage("settings") as Settings;
      if (yakklSettings) {
        yakklSettings.isLocked = true;
        yakklSettings.isLockedHow = 'idle_system';
        yakklSettings.updateDate = new Date().toISOString();
        await setObjectInLocalStorage('settings', yakklSettings);
        // send a browser notification letting the user know that yakkl locked due to timeout
        // This may need to be sent from the UI layer
        browser_ext!.notifications.create('yakkl-lock', {
          type: 'basic',
          iconUrl: browser_ext!.runtime.getURL('/images/logoBullLock48x48.png'),
          title: 'Security Notification',
          message: 'YAKKL is locked and requires a login due to idle timeout.',
        }).catch((error: any) => {
          console.log('background.js - handleOnAlarm',error);
        });

        // post a message to show login screen
        browser_ext!.runtime.sendMessage({method: 'yak_lockdown'});
        // Set the lock icon
        await setIconLock();
      }

      await clearAlarm("yakkl-lock-alarm"); // Clear the alarm so since it forwarded everything
    }
  } catch (error) {
    console.log('background.js - alarm',error);
  }
}

/**********************************************************************************************************************/
// This section is for the Ethereum provider - Legacy version

export async function estimateGas(chainId: any, params: Deferrable<TransactionRequest>, kval: string | undefined) {
  try {
    const provider = new Alchemy(getProviderConfig(chainId, kval));
    return await provider.transact.estimateGas(params);
  } catch (e) {
    console.log(e);
    return undefined;
  }
  return undefined;
}

async function getBlock(chainId: any, block: BlockTag | Promise<BlockTag>, kval: string | undefined) {
  try {
    const provider = new Alchemy(getProviderConfig(chainId, kval));
    return await provider.core.getBlock(block);
  } catch (e) {
    console.log(e);
    return undefined;
  }
}


// TODO: These items should now come from the Wallet.provider.getConfig() function or similar

// chainId must be hex
function getProviderConfig(chainId: any, kval: any) {
  try {
    let api = kval;  // Set defaults
    let network = Network.ETH_SEPOLIA;
    switch(chainId) {
      case "0xaa36a7": // Ethereum Sepolia
      case 11155111:
        api = kval;
        network = Network.ETH_SEPOLIA;
        break;
      case "0x1": // Ethereum mainnet
      case "0x01":
      case 1:
      default:
        api = kval;
        network = Network.ETH_MAINNET;
        break;
    }
    return {
      apiKey: api,
      network: network,
    }
  } catch (e) {
    console.log(e);
    return undefined;
  }
}
