/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-debugger */
// Upgrades for the app...
import { DEFAULT_TITLE } from '$lib/common/constants';
import { getObjectFromLocalStorage, removeObjectFromLocalStorage, setObjectInLocalStorage } from '$lib/common/storage';
import type { Preferences } from '$lib/common';
import { log } from '$lib/plugins/Logger';

// TODO: Review and update where needed due to global changes for typescript conversion!!

// This list gets updated with each new version
const yakklUpdateStorage = [
  'yakklAccounts',
  'yakklChats',
  'yakklConnectedDomains',
  'yakklContacts',
  'yakklCurrentlySelected',
  'preferences',
  'yakklPrimaryAccounts',
  'profile',
  'yakklRegisteredData',
  'yakklSecurity',
  'settings',
  'yakklWatchList',

// NOTE: Add new storage areas here

];

// NOTE: This file changes with each version upgrade!!

export function upgrade(fromVersion: string, toVersion: string) {
  try {
    // This should cycle through all the versions and upgrade each one or return if already upgraded
    // if (checkVersion(toVersion)) {
    //   console.log(`Already upgraded to ${toVersion}`);
    //   return
    // }

    latest(toVersion);
    log.info(`Upgraded from ${fromVersion} to ${toVersion}`);

  } catch (e) {
    log.error(e);
  }
}

// This function will be archived on the next upgrade and new one will be created!!!
async function latest(toVersion: string) {
  // Upgrade latest
  // We need to change networks from integer to hex values
  // yakklAccount - change chainId to number
  // yakklCurrentlySelected - change all chainId values to number
  // yakklConnectedDomains - change the addresses array to hold objects with chainId, network, and address

  const yakklPreferences: Preferences = await getObjectFromLocalStorage('preferences') as Preferences;
  // Create backup!
  setObjectInLocalStorage('preferencesBackup', yakklPreferences );

  const yakklUpdatedPreferences = yakklPreferences;

  // Update if needed
  if (yakklPreferences.wallet !== undefined) {
    yakklUpdatedPreferences.wallet = yakklPreferences.wallet;
    yakklUpdatedPreferences.wallet.title = DEFAULT_TITLE;
    // delete yakklUpdatedPreferences.wallet; // TODO: this is temporary until we can update the wallet object
    setObjectInLocalStorage('preferences', yakklUpdatedPreferences );
  }

  // Now remove the backups
  removeBackups();

  updateVersion(toVersion);
}

// All have to be true to not be upgraded
export async function checkVersion(toVersion: string) {
  try {
    for (let index = 0; index < yakklUpdateStorage.length; index++) {
      const dataFile = yakklUpdateStorage[index];
      const data = await getObjectFromLocalStorage(dataFile);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      if (data?.version && data.version !== toVersion) {
        return false;
      }
    }
    return true;
  } catch (e) {
    log.error(e);
  }
}

// tmp - these storage areas are listed in the array above. However, during a registration event, the following data models are not yet created so an error may occur. This is a temporary fix until the data models are created.
// #yakklChats, #yakklConnectDomains, #yakklContacts, #yakklRegisteredData
export async function updateVersion(toVersion: string) {
  try {
    // Below did not work only because these or most are [] and not {}
    if (!toVersion) return;

    // console.log('Updating version to 1:', toVersion, yakklUpdateStorage);

    for (let index = 0; index < yakklUpdateStorage.length; index++) {
      const dataFile = yakklUpdateStorage[index].toString();
      let data: any = await getObjectFromLocalStorage(dataFile);

      // console.log('Updating version for 2:', dataFile, data);

      if (data) {
        if (Array.isArray(data)) {
          data = data.map(item => {
            return {
              ...item,
              version: toVersion
            };
          });
        } else {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          data.version = toVersion; // Created issue #YB-64 due to upgrade from 0.29.5 to 0.30.5 see for more details
        }

        // console.log('Updating version for 3:', dataFile, data);

        await setObjectInLocalStorage(dataFile, data);
      } else {
        log.info(`No data found for ${dataFile}. May not have been initialized yet.`);
      }
    }
  } catch (e) {
    log.error(e);
  }
}


// Can optimize this by using a loop later
export async function removeBackups() {
  try {
    removeObjectFromLocalStorage('preferencesBackup');
    // removeObjectFromLocalStorage('yakklNetworksBackup');
    // removeObjectFromLocalStorage('yakklCurrentlySelectedBackup');
    // removeObjectFromLocalStorage('yakklAccountsBackup');
    // removeObjectFromLocalStorage('yakklProvidersBackup');
    // removeObjectFromLocalStorage('yakklConnectedDomainsBackup');
  } catch (e) {
    log.error(e);
  }
}
