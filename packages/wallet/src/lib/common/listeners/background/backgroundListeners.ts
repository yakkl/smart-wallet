// listeners/backgroundListeners.ts
import { ListenerManager } from '$lib/plugins/ListenerManager';
import { browser_ext, browserSvelte } from '$lib/common/environment';
import type { Runtime } from 'webextension-polyfill';
import { openPopups, openWindows } from '$lib/common/reload';
import { initializeDatabase } from '$lib/extensions/chrome/database';
import { yakklStoredObjects } from '$lib/models/dataModels';
import { setObjectInLocalStorage } from '$lib/common/storage';
import { setLocalObjectStorage } from '$lib/extensions/chrome/storage';
import { loadDefaultTokens } from '$lib/plugins/tokens/loadDefaultTokens';
import { VERSION } from '$lib/common/constants';
import { onRuntimeMessageListener } from './runtimeListeners';
import { onAlarmListener } from './alarmListeners';
import { onStateChangedListener } from './stateListeners';
import { onPortConnectListener, onPortDisconnectListener } from './portListeners';
import { onTabRemovedListener, onTabUpdatedListener } from './tabListeners';
import { globalListenerManager } from '$lib/plugins/GlobalListenerManager';
import { log } from '$lib/plugins/Logger';

type RuntimePlatformInfo = Runtime.PlatformInfo;

export const backgroundListenerManager = new ListenerManager();

export async function onInstalledUpdatedListener( details: Runtime.OnInstalledDetailsType ): Promise<void> {
  try {
    if (browserSvelte) {
      const platform: RuntimePlatformInfo = await browser_ext.runtime.getPlatformInfo();

      openWindows.clear();
      openPopups.clear();

      if ( details && details.reason === "install") {
        await initializeDatabase(false);

        // This only happens on initial install to set the defaults
        yakklStoredObjects.forEach(async (element) => {
          try {
            await setObjectInLocalStorage(element.key, element.value);
          } catch (error) {
            log.error(`Error setting default for ${element.key}:`, error);
          }
        });

        await browser_ext.runtime.setUninstallURL(encodeURI("https://yakkl.com?userName=&utm_source=yakkl&utm_medium=extension&utm_campaign=uninstall&utm_content=" + `${VERSION}` + "&utm_term=extension"));
        await setLocalObjectStorage(platform, false);
      }

      if (details && details.reason === "update") {
        if (details.previousVersion !== browser_ext.runtime.getManifest().version) {
          await initializeDatabase(true); // This will clear the db and then import again
          await setLocalObjectStorage(platform, false); //true); // Beta version to 1.0.0 will not upgrade due to complete overhaul of the extension. After 1.0.0, upgrades will be handled.
        }
      }

      // Add default tokens
      loadDefaultTokens();
    }
  } catch (e) {
    log.error(e);
  }
}

export function onEthereumListener(event: any) {
  try {
    log.debug('Background:', `yakkl-eth port: ${event}`);
  } catch (error) {
    log.error('Background: onEthereumListener', error);
  }
}

// Register backgroundListenerManager globally
globalListenerManager.registerContext('background', backgroundListenerManager);

// TODO: Review these against background.ts
export function addBackgroundListeners() {
  backgroundListenerManager.add(browser_ext.runtime.onMessage, onRuntimeMessageListener);
  backgroundListenerManager.add(browser_ext.alarms.onAlarm, onAlarmListener);
  backgroundListenerManager.add(browser_ext.runtime.onInstalled, onInstalledUpdatedListener);
  backgroundListenerManager.add(browser_ext.runtime.onConnect, onPortConnectListener);
  backgroundListenerManager.add(browser_ext.runtime.onConnect, onPortDisconnectListener);
  backgroundListenerManager.add(browser_ext.idle.onStateChanged, onStateChangedListener);
  backgroundListenerManager.add(browser_ext.tabs.onUpdated, onTabUpdatedListener);
  backgroundListenerManager.add(browser_ext.tabs.onRemoved, onTabRemovedListener);
}

export function removeBackgroundListeners() {
  backgroundListenerManager.removeAll();
}
