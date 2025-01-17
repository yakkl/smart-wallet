/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

export const prerender = false;

import { getObjectFromLocalStorage, setObjectInLocalStorage } from '$lib/common/storage';
import { writable, get } from 'svelte/store';
import {
	yakklSettings,
	profile,
	yakklPrimaryAccounts,
	yakklCurrentlySelected,
	yakklWatchList,
	yakklContacts,
	yakklAccounts,
	yakklPreferences,
	yakklChats,
	yakklBlockedList
} from '$lib/models/dataModels';
import {
	STORAGE_YAKKL_REGISTERED_DATA,
	STORAGE_YAKKL_ACCOUNTS,
	STORAGE_YAKKL_PRIMARY_ACCOUNTS,
	STORAGE_YAKKL_CURRENTLY_SELECTED,
	STORAGE_YAKKL_PROFILE,
	STORAGE_YAKKL_PREFERENCES,
	STORAGE_YAKKL_SETTINGS,
	STORAGE_YAKKL_CONTACTS,
	STORAGE_YAKKL_WATCHLIST,
	STORAGE_YAKKL_BLOCKEDLIST,
	STORAGE_YAKKL_CONNECTED_DOMAINS,
	STORAGE_YAKKL_CHATS,
	STORAGE_YAKKL_WALLET_BLOCKCHAINS,
	STORAGE_YAKKL_WALLET_PROVIDERS,
  STORAGE_YAKKL_TOKENDATA,
  STORAGE_YAKKL_TOKENDATA_CUSTOM,
  STORAGE_YAKKL_COMBINED_TOKENS,
} from '$lib/common/constants';

import { encryptData, decryptData } from '$lib/common/encryption';
import { isEncryptedData } from '$lib/common/misc';
import { type PricingStore } from '$lib/common/types';	;
import { isEqual } from 'lodash-es';

import type {
  CurrentlySelectedData,
	Preferences,
	Profile,
	Settings,
	YakklCurrentlySelected,
  YakklBlocked,
  YakklWatch,
  YakklAccount,
  YakklContact,
  YakklRegisteredData,
  YakklPrimaryAccount,
  HasData,
	YakklConnectedDomain,
	YakklChat,
	GasTransStore,
	ContractData,
  TokenData,
} from '$lib/common/interfaces';

import type { Wallet } from '$plugins/Wallet';
import { debug_log } from './debug-error';

// Svelte writeable stores
export const alert = writable({
	msg: 'Welcome to the YAKKL® Smart Wallet!',
	icon: 1,
	color: {
		background: 'bg-indigo-400',
		text: 'text-indigo-800'
	},
	opacity: 0.5,
	ms: 3000
});

// default ms = 3 seconds. To make the Alert stay until user clicks close then set ms = 0

// loadCheckCurrentlySelectedStore - Checks the $yakklCurrentlySelectedStore to see if 'data' is encrypted and it does not decrpt any contained objects attached to the 'data' object until needed
export async function loadCheckCurrentlySelectedStore(): Promise<YakklCurrentlySelected | null> {
	const currentlySelected = getYakklCurrentlySelectedStore();
	const miscStore = getMiscStore();

	if (miscStore && currentlySelected !== null) {
		if (isEncryptedData(currentlySelected.data)) {
			decryptData(currentlySelected.data, miscStore).then((result) => {
				currentlySelected.data = result as CurrentlySelectedData;
				// setYakklCurrentlySelectedStore(currentlySelected);
				return currentlySelected; //true;
			});
		} else {
			return currentlySelected; //true;
		}
	}
	return null;
}

export async function verifyEncryption<T extends HasData<any>>(value: T | T[]): Promise<T | T[]> {
  const miscStore = getMiscStore();

  if (miscStore) {
    // Helper function to process each item
    const processItem = async (item: T) => {
      if (!isEncryptedData(item.data)) {
        const result = await encryptData(item.data, miscStore);
        item.data = result as any;
      }
      return item;
    };

    // If the input value is an array, process each item in the array
    if (Array.isArray(value)) {
      return Promise.all(value.map(processItem));
    } else {
      // If the input value is a single item, process it directly
      return processItem(value);
    }
  }

  return value;
}


//
// NOTE: getYakkl... or setYakkl... represents both a storage and store. If there is no Yakkl prefix like 'getMiscStore' then it is only in memory and not stored
//

// ---------------------------------
// Svelte memory stores

export const yakklPreferencesStore = writable<Preferences>(yakklPreferences);
export const yakklSettingsStore = writable(yakklSettings);
export const profileStore = writable(profile);
export const yakklCurrentlySelectedStore = writable<YakklCurrentlySelected | null>(yakklCurrentlySelected);
export const yakklContactsStore = writable<YakklContact[]>(yakklContacts);
export const yakklChatsStore = writable<YakklChat[]>(yakklChats);
export const yakklAccountsStore = writable<YakklAccount[]>(yakklAccounts);
export const yakklPrimaryAccountsStore = writable<YakklPrimaryAccount[]>(yakklPrimaryAccounts);
export const yakklWatchListStore = writable<YakklWatch[]>(yakklWatchList);
export const yakklBlockedListStore = writable<YakklBlocked[]>(yakklBlockedList);
export const yakklConnectedDomainsStore = writable<YakklConnectedDomain[]>(undefined); // Move to null since these do not need to be pre-seeded
export const yakklMiscStore = writable<string>(undefined); // Misc items so formats will change
export const yakklVeryStore = writable<any>(undefined); // Misc items so formats will change
export const yakklVersionStore = writable<string>(undefined);
export const yakklUserNameStore = writable<string>(undefined);
export const yakklPricingStore = writable<PricingStore>(undefined); // {provider: '', pair: '', price: 1 }  - This is for the trading pairs that change every so often
export const yakklGasTransStore = writable<GasTransStore | undefined>(undefined); // Currently this is only used as a reactive store for the gas or transaction fees
export const yakklContactStore = writable<YakklContact | null>(undefined); // The single selcted contact from the yakklContactsStore list
export const yakklAccountStore = writable<YakklAccount>(undefined); // The single selcted account from the yakklAccountsStore list
export const yakklWalletProvidersStore = writable<string[]>([]);
export const yakklWalletBlockchainsStore = writable<string[]>( [] );
export const yakklTokenDataStore = writable<TokenData[]>([]);  // This is the official list of default tokens that we check to see if the user has any positions in
export const yakklTokenDataCustomStore = writable<TokenData[]>([]);  // This is the official list of user added tokens that we check to see if the user has any positions in
export const yakklCombinedTokenStore = writable<TokenData[]>([]);  // This is the combined list of default and custom tokens. We use this instead of derived so we can control the reactiveness better

// yakklGPTRunningStore and yakklGPTKeyStore are used for the GPT API
export const yakklGPTRunningStore = writable(false); // Single indicator for GPT running or not
export const yakklGPTKeyStore = writable<string>(undefined); // Single indicator for GPT Key

export const yakklConnectionStore = writable<boolean>(true); // All fetch or api calls need to validate that the yakklConnectionStore is true before accessing the internet
export const yakklDappConnectRequestStore = writable<string | null>(undefined);

export const wallet = writable<Wallet | null>(null);
export const yakklContractStore = writable<ContractData>({
  address: '',
  abi: '',
  functions: []
});
// --------------------------------

// Generic error logger
export function onError(e: any) {
	console.log(e);
}

// Anytime any local storage changes then we set the Svelte memory stores to keep things in sync
export function storageChange(changes: any) {
	try {
		if (changes.yakklPreferences) {
			setPreferencesStore(changes.yakklPreferences.newValue);
		}
		if (changes.yakklSettings) {
			setSettingsStore(changes.yakklSettings.newValue);
		}
		if (changes.profile) {
			setProfileStore(changes.profile.newValue);
		}
		if (changes.yakklCurrentlySelected) {
			setYakklCurrentlySelectedStore(changes.yakklCurrentlySelected.newValue);
		}
		if (changes.yakklWatchList) {
			setYakklWatchListStore(changes.yakklWatchList.newValue);
		}
		if (changes.yakklAccounts) {
			setYakklAccountsStore(changes.yakklAccounts.newValue);
		}
		if (changes.yakklPrimaryAccounts) {
			setYakklPrimaryAccountsStore(changes.yakklPrimaryAccounts.newValue);
		}
		if (changes.yakklContacts) {
			setYakklContactsStore(changes.yakklContacts.newValue);
		}
		if (changes.yakklChats) {
			setYakklChatsStore(changes.yakklChats.newValue);
		}
		if (changes.yakklConnectedDomains) {
			setYakklConnectedDomainsStore(changes.yakklConnectedDomains.newValue);
		}
		if (changes.yakklBlockedList) {
			setYakklBlockedListStore(changes.yakklBlockedList.newValue);
		}
    if (changes.yakklTokenDataCustom) {
      // debug_log('storageChange yakklTokenDataCustom', changes.yakklTokenDataCustom.newValue);
			// setYakklTokenDataCustomStore(changes.yakklTokenDataCustom.newValue);
		}
    if (changes.yakklTokenData) {
      // debug_log('storageChange yakklTokenData', changes.yakklTokenData.newValue);
			// setYakklTokenDataStore(changes.yakklTokenData.newValue);
		}
	} catch (error) {
		console.log(error);
	}
}

export async function syncStoresToStorage() {
	try {
		setPreferencesStore(await getPreferences());
		setSettingsStore(await getSettings());
		setProfileStore(await getProfile());
		setYakklCurrentlySelectedStore(await getYakklCurrentlySelected());
		setYakklWatchListStore(await getYakklWatchList());
		setYakklBlockedListStore(await getYakklBlockedList());
		setYakklAccountsStore(await getYakklAccounts());
		setYakklPrimaryAccountsStore(await getYakklPrimaryAccounts());
		setYakklContactsStore(await getYakklContacts());
		setYakklChatsStore(await getYakklChats());
    setYakklTokenDataStore(await getYakklTokenData());
    setYakklTokenDataCustomStore(await getYakklTokenDataCustom());
		setYakklConnectedDomainsStore(await getYakklConnectedDomains());
	} catch (error) {
		console.log(error);
	}
}

// Browser Extension local storage
// Returns old settings
export async function setSettings(settings: Settings) {
	return await setSettingsStorage(settings);
}

// --------------------------------
// Call these for getting memory data store only
export function getYakklPreferenceStore() {
	const store = get(yakklPreferencesStore);
	return store;
}

export function getSettingsStore() {
	const store = get(yakklSettingsStore);
	return store;
}

export function getProfileStore(values: Profile) {
	const store = get(profileStore);
	profileStore.set(values);
	return store;
}

export function getYakklCurrentlySelectedStore() {
	const store = get(yakklCurrentlySelectedStore);
	return store;
}

export function getYakklWatchListStore() {
	const store = get(yakklWatchListStore);
	return store;
}

export function getYakklBlockedListStore() {
	const store = get(yakklBlockedListStore);
	return store;
}

export function getYakklAccountsStore() {
	const store = get(yakklAccountsStore);
	return store;
}

export function getYakklPrimaryAccountsStore() {
	const store = get(yakklPrimaryAccountsStore);
	return store;
}

export function getYakklContactsStore() {
	const store = get(yakklContactsStore);
	return store;
}

export function getYakklTokenDataStore() {
	const store = get(yakklTokenDataStore);
	return store;
}

export function getYakklTokenDataCustomStore() {
	const store = get(yakklTokenDataCustomStore);
	return store;
}

export function getYakklCombinedTokenStore() {
	const store = get(yakklCombinedTokenStore);
	return store;
}

export function getYakklChatsStore() {
	const store = get(yakklChatsStore);
	return store;
}

export function getYakklWalletBlockchainsStore() {
	const store = get(yakklWalletBlockchainsStore);
	return store;
}

export function getYakklWalletProvidersStore() {
	const store = get(yakklWalletProvidersStore);
	return store;
}

export function getYakklConnectedDomainsStore() {
	const store = get(yakklConnectedDomainsStore);
	return store;
}

export function getYakklContractStore() {
  return get(yakklContractStore);
}

// Memory only
export function getMiscStore() {
	const store = get(yakklMiscStore);
	return store;
}

// Memory only
export function getVeryStore() {
	const store = get(yakklVeryStore);
	return store;
}

export function getDappConnectRequestStore() {
  const store = get(yakklDappConnectRequestStore);
  return store;
}

export function getContactStore() {
	const store = get(yakklContactStore);
	return store;
}

export function getAccountStore() {
	const store = get(yakklAccountStore);
	return store;
}

export function getVersionStore() {
	const store = get(yakklVersionStore);
	return store;
}

export function getUserNameStore() {
	const store = get(yakklUserNameStore);
	return store;
}

export function getYakklGPTKeyStore() {
	const store = get(yakklGPTKeyStore);
	return store;
}

export function getYakklConnectionStore() {
	const store = get(yakklConnectionStore);
	return store;
}

// export function getYakklPriceStore() {
// 	const store = get(yakklPriceStore);
// 	return store;
// }

// --------------------------------
// Call these for setting memory data store only
// Return previous values
export function setPreferencesStore(values: Preferences | null) {
	const store = get(yakklPreferencesStore);
	yakklPreferencesStore.set(values === null ? yakklPreferences : values);
	return store;
}

export function setSettingsStore(values: Settings | null) {
	const store = get(yakklSettingsStore);
	yakklSettingsStore.set(values === null ? yakklSettings : values);
	return store;
}

// Return previous values
export function setProfileStore(values: Profile | null) {
	const store = get(profileStore);
	profileStore.set(values === null ? profile : values);
	return store;
}

// Return previous values
// Making sure the value set for currently selected is not encrypted
export function setYakklCurrentlySelectedStore(values: YakklCurrentlySelected | null) {
  const store = get(yakklCurrentlySelectedStore);
  yakklCurrentlySelectedStore.set(values !== null ? values : null); // Set here even if some items are empty. Validate items in save to storage
  return store;
}

// Return previous values
export function setYakklWatchListStore(values: YakklWatch[]) {
	const store = get(yakklWatchListStore);
	yakklWatchListStore.set(values);
	return store;
}

// Return previous values
export function setYakklBlockedListStore(values: YakklBlocked[]) {
	const store = get(yakklBlockedListStore);
	yakklBlockedListStore.set(values);
	return store;
}

// Return previous values
export function setYakklContactsStore(values: YakklContact[]) {
	const store = get(yakklContactsStore);
	yakklContactsStore.set(values);
	return store;
}

export function setYakklTokenDataStore(values: TokenData[]) {
	const store = get(yakklTokenDataStore);
	yakklTokenDataStore.set(values);
	return store;
}

export function setYakklTokenDataCustomStore(values: TokenData[]) {
	const store = get(yakklTokenDataCustomStore);
	yakklTokenDataCustomStore.set(values);
	return store;
}

export function setYakklCombinedTokenStore(values: TokenData[]) {
	const store = get(yakklCombinedTokenStore);
	yakklCombinedTokenStore.set(values);
	return store;
}

// Return previous values
export function setYakklChatsStore(values: YakklChat[]) {
	const store = get(yakklChatsStore);
	yakklChatsStore.set(values);
	return store;
}

// Return previous values
export function setYakklWalletBlockchainsStore(values: string[]) {
	const store = get(yakklWalletBlockchainsStore);
	yakklWalletBlockchainsStore.set(values);
	return store;
}

// Return previous values
export function setYakklWalletProvidersStore(values: string[]) {
	const store = get(yakklWalletProvidersStore);
	yakklWalletProvidersStore.set(values);
	return store;
}

// Return previous values
export function setYakklConnectedDomainsStore(values: YakklConnectedDomain[]) {
	const store = get(yakklConnectedDomainsStore);
	yakklConnectedDomainsStore.set(values);
	return store;
}

// Return previous values
export function setYakklAccountsStore(values: YakklAccount[]) {
	const store = get(yakklAccountsStore);
	yakklAccountsStore.set(values);
	return store;
}

// Return previous values
export function setYakklPrimaryAccountsStore(values: YakklPrimaryAccount[]) {
	const store = get(yakklPrimaryAccountsStore);
	yakklPrimaryAccountsStore.set(values);
	return store;
}

// Return previous values
export function setMiscStore(values: string) {
	const store = get(yakklMiscStore);
	yakklMiscStore.set(values);
	return store;
}

// Return previous values
export function setVeryStore(values: any) {
	const store = get(yakklVeryStore);
	yakklVeryStore.set(values);
	return store;
}

export function setDappConnectRequestStore(values: string | null) {
  const store = get(yakklDappConnectRequestStore);
  yakklDappConnectRequestStore.set(values);
  return store;
}

// Return previous values
export function setContactStore(values: YakklContact | null) {
	const store = get(yakklContactStore);
	yakklContactStore.set(values);
	return store;
}

// Return previous values
export function setAccountStore(values: YakklAccount) {
	const store = get(yakklAccountStore);
	yakklAccountStore.set(values);
	return store;
}

// Return previous values
export function setVersionStore(values: string) {
	const store = get(yakklVersionStore);
	yakklVersionStore.set(values);
	return store;
}

// Return previous values
export function setUserNameStore(values: string) {
	const store = get(yakklUserNameStore);
	yakklUserNameStore.set(values);
	return store;
}

export function setYakklGPTKeyStore(values: string) {
	const store = get(yakklGPTKeyStore);
	yakklGPTKeyStore.set(values);
	return store;
}

// Return previous values
export function setYakklConnectionStore(values: boolean) {
	const store = get(yakklConnectionStore);
	yakklConnectionStore.set(values);
	return store;
}

export function setYakklContractStore( values: ContractData ) {
	const store = get(yakklContractStore);
	yakklContractStore.set( values );
	return store;
}

// --------------------------------

export async function getYakklRegisteredData(): Promise<YakklRegisteredData | null> {
  try {
    const value = await getObjectFromLocalStorage<YakklRegisteredData>(STORAGE_YAKKL_REGISTERED_DATA);
		if (typeof value === 'string') {
      // Handle the case where value is a string, which shouldn't happen in this context
      throw new Error('Unexpected string value received from local storage');
    }
    return value || null; // Return an empty object or provide a default value if necessary
  } catch (error) {
    throw error;
  }
}

export async function getYakklContacts(): Promise<YakklContact[]> {
  try {
    const value = await getObjectFromLocalStorage<YakklContact[]>(STORAGE_YAKKL_CONTACTS);
		if (typeof value === 'string') {
      // Handle the case where value is a string, which shouldn't happen in this context
      throw new Error('Unexpected string value received from local storage');
    }
    return value || []; // Return an empty array or provide a default value if necessary
  } catch (error) {
    throw error;
  }
}

export async function getYakklTokenData(): Promise<TokenData[]> {
  try {
    const value = await getObjectFromLocalStorage<TokenData[]>(STORAGE_YAKKL_TOKENDATA);
		if (typeof value === 'string') {
      // Handle the case where value is a string, which shouldn't happen in this context
      throw new Error('Unexpected string value received from local storage');
    }
    return value || []; // Return an empty array or provide a default value if necessary
  } catch (error) {
    throw error;
  }
}

export async function getYakklTokenDataCustom(): Promise<TokenData[]> {
  try {
    const value = await getObjectFromLocalStorage<TokenData[]>(STORAGE_YAKKL_TOKENDATA_CUSTOM);
		if (typeof value === 'string') {
      // Handle the case where value is a string, which shouldn't happen in this context
      throw new Error('Unexpected string value received from local storage');
    }
    return value || []; // Return an empty array or provide a default value if necessary
  } catch (error) {
    throw error;
  }
}

export async function getYakklCombinedToken(): Promise<TokenData[]> {
  try {
    const value = await getObjectFromLocalStorage<TokenData[]>(STORAGE_YAKKL_COMBINED_TOKENS);
		if (typeof value === 'string') {
      // Handle the case where value is a string, which shouldn't happen in this context
      throw new Error('Unexpected string value received from local storage');
    }
    return value || []; // Return an empty array or provide a default value if necessary
  } catch (error) {
    throw error;
  }
}

export async function getYakklChats(): Promise<YakklChat[]> {
  try {
    let value = await getObjectFromLocalStorage<YakklChat[]>(STORAGE_YAKKL_CHATS);
    if (typeof value === 'string') {
      value = [];
      setYakklChatsStorage(value);
    }
    // Convert object to array if necessary
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      value = Object.values(value);
    }
    return value || [];
  } catch (error) {
    console.log('Error in getYakklChats:', error);
    return [];
  }
}

export async function getYakklWalletBlockchains(): Promise<string[]> {
  try {
    let value = await getObjectFromLocalStorage<string[]>(STORAGE_YAKKL_WALLET_BLOCKCHAINS);
		if (typeof value === 'string') {
      // Handle the case where value is a string, which shouldn't happen in this context
			value = [];
			setYakklWalletBlockchainsStorage(value);
    }
    return value || []; // Return an empty array or provide a default value if necessary
  } catch (error) {
    throw error;
  }
}

export async function getYakklWalletProviders(): Promise<string[]> {
  try {
    let value = await getObjectFromLocalStorage<string[]>(STORAGE_YAKKL_WALLET_PROVIDERS);
		if (typeof value === 'string') {
      // Handle the case where value is a string, which shouldn't happen in this context
			value = [];
			setYakklWalletProvidersStorage(value);
    }
    return value || []; // Return an empty array or provide a default value if necessary
  } catch (error) {
    throw error;
  }
}

export async function getYakklConnectedDomains(): Promise<YakklConnectedDomain[]> {
  try {
    const value = await getObjectFromLocalStorage<YakklConnectedDomain[]>(STORAGE_YAKKL_CONNECTED_DOMAINS);
		if (typeof value === 'string') {
      // Handle the case where value is a string, which shouldn't happen in this context
      throw new Error('Unexpected string value received from local storage');
    }
    return value || []; // Return an empty array or provide a default value if necessary
  } catch (error) {
    throw error;
  }
}

export async function getPreferences(): Promise<Preferences | null> {
  try {
    const value = await getObjectFromLocalStorage<Preferences>(STORAGE_YAKKL_PREFERENCES);
		if (typeof value === 'string') {
      // Handle the case where value is a string, which shouldn't happen in this context
      throw new Error('Unexpected string value received from local storage');
    }
    return value; // Return an empty object or provide a default value if necessary
  } catch (error) {
    throw error;
  }
}

export async function getSettings(): Promise<Settings | null> {
  try {
    const value = await getObjectFromLocalStorage<Settings>(STORAGE_YAKKL_SETTINGS);
		if (typeof value === 'string') {
      // Handle the case where value is a string, which shouldn't happen in this context
      throw new Error('Unexpected string value received from local storage');
    }
    return value; // Return an empty object or provide a default value if necessary
  } catch (error) {
    throw error;
  }
}

export async function getProfile(): Promise<Profile | null> {
  try {
    const value = await getObjectFromLocalStorage<Profile>(STORAGE_YAKKL_PROFILE);
		if (typeof value === 'string') {
      // Handle the case where value is a string, which shouldn't happen in this context
      throw new Error('Unexpected string value received from local storage');
    }
    return value; // Return an empty object or provide a default value if necessary
  } catch (error) {
    throw error;
  }
}

export async function getYakklCurrentlySelected(): Promise<YakklCurrentlySelected> {
  try {
    const value = await getObjectFromLocalStorage<YakklCurrentlySelected>(STORAGE_YAKKL_CURRENTLY_SELECTED);
    if (!value || typeof value === 'string') {
      throw new Error("No currently selected Yakkl found");
    }
    return value;
  } catch (error) {
		console.log('getYakklCurrentlySelected: ', error);
    throw error;
  }
}

export async function getYakklWatchList(): Promise<YakklWatch[]> {
  // eslint-disable-next-line no-useless-catch
  try {
    const value = await getObjectFromLocalStorage<YakklWatch[]>(STORAGE_YAKKL_WATCHLIST);
		if (typeof value === 'string') {
      // Handle the case where value is a string, which shouldn't happen in this context
      throw new Error('Unexpected string value received from local storage');
    }
    return value || [];
  } catch (error) {
    throw error;
  }
}

export async function getYakklBlockedList(): Promise<YakklBlocked[]> {
  // eslint-disable-next-line no-useless-catch
  try {
    const value = await getObjectFromLocalStorage<YakklBlocked[]>(STORAGE_YAKKL_BLOCKEDLIST);
		if (typeof value === 'string') {
      // Handle the case where value is a string, which shouldn't happen in this context
      throw new Error('Unexpected string value received from local storage');
    }
    return value || [];
  } catch (error) {
    throw error;
  }
}

export async function getYakklAccounts(): Promise<YakklAccount[]> {
  // eslint-disable-next-line no-useless-catch
  try {
    const value = await getObjectFromLocalStorage<YakklAccount[]>(STORAGE_YAKKL_ACCOUNTS);
		if (typeof value === 'string') {
      // Handle the case where value is a string, which shouldn't happen in this context
      throw new Error('Unexpected string value received from local storage');
    }
    return value || [];
  } catch (error) {
    throw error;
  }
}

export async function getYakklPrimaryAccounts(): Promise<YakklPrimaryAccount[]> {
  // eslint-disable-next-line no-useless-catch
  try {
    const value = await getObjectFromLocalStorage<YakklPrimaryAccount[]>(STORAGE_YAKKL_PRIMARY_ACCOUNTS);
		if (typeof value === 'string') {
      // Handle the case where value is a string, which shouldn't happen in this context
      throw new Error('Unexpected string value received from local storage');
    }
    return value || [];
  } catch (error) {
    throw error;
  }
}

// --------------------------------
// Call these storage functions when you need to update both persistent and memory stores
export async function setYakklContactsStorage(values: YakklContact[]) {
	try {
		yakklContactsStore.set( values );
    await setObjectInLocalStorage( 'yakklContacts', values );
	} catch (error) {
		console.log(error);
	}
}

export async function setYakklTokenDataStorage(values: TokenData[]) {
	try {
		const current = get(yakklTokenDataStore);

		// Only update if the values are different
		if (!isEqual(current, values)) {
			yakklTokenDataStore.set(values);
			await setObjectInLocalStorage('yakklTokenData', values);
		}
	} catch (error) {
		console.log(error);
	}
}

export async function setYakklTokenDataCustomStorage(values: TokenData[]) {
	try {
		const current = get(yakklTokenDataCustomStore);

		// Only update if the values are different
		if (!isEqual(current, values)) {
			yakklTokenDataCustomStore.set(values);
			await setObjectInLocalStorage('yakklTokenDataCustom', values);
		}
	} catch (error) {
		console.log(error);
	}
}

export async function setYakklCombinedTokenStorage(values: TokenData[]) {
	try {
		const current = get(yakklCombinedTokenStore);

		// Only update if the values are different
		if (!isEqual(current, values)) {
			yakklCombinedTokenStore.set(values);
			await setObjectInLocalStorage('yakklCombinedTokens', values);
		}
	} catch (error) {
		console.log(error);
	}
}

export async function setYakklChatsStorage(values: YakklChat[]) {
	try {
		const current = get(yakklChatsStore);
		if (!isEqual(current, values)) {
			yakklChatsStore.set(values);
			await setObjectInLocalStorage('yakklChats', values);
		}
	} catch (error) {
		console.log(error);
	}
}

export async function setYakklWalletBlockchainsStorage(values: string[]) {
	try {
		const current = get(yakklWalletBlockchainsStore);
		if (!isEqual(current, values)) {
			yakklWalletBlockchainsStore.set(values);
			await setObjectInLocalStorage('yakklWalletBlockchains', values);
		}
	} catch (error) {
		console.log(error);
	}
}

export async function setYakklWalletProvidersStorage(values: string[]) {
	try {
		const current = get(yakklWalletProvidersStore);
		if (!isEqual(current, values)) {
			yakklWalletProvidersStore.set(values);
			await setObjectInLocalStorage('yakklWalletProviders', values);
		}
	} catch (error) {
		console.log(error);
	}
}

export async function setYakklConnectedDomainsStorage(values: YakklConnectedDomain[]) {
	try {
		const current = get(yakklConnectedDomainsStore);
		if (!isEqual(current, values)) {
			yakklConnectedDomainsStore.set(values);
			await setObjectInLocalStorage('yakklConnectedDomains', values);
		}
	} catch (error) {
		console.log(error);
	}
}

export async function setSettingsStorage(values: Settings) {
	try {
		const current = get(yakklSettingsStore);
		if (!isEqual(current, values)) {
			yakklSettingsStore.set(values);
			await setObjectInLocalStorage('settings', values);
		}
	} catch (error) {
		console.log(error);
		throw new Error("Error in setSettingsStorage: " + error);
	}
}

export async function setPreferencesStorage(values: Preferences) {
	try {
		const current = get(yakklPreferencesStore);
		if (!isEqual(current, values)) {
			yakklPreferencesStore.set(values);
			await setObjectInLocalStorage('preferences', values);
		}
	} catch (error) {
		console.log(error);
		throw new Error("Error in setPreferencesStorage: " + error);
	}
}

export async function setProfileStorage(values: Profile) {
	try {
		const current = get(profileStore);
		const newValues = await verifyEncryption(values) as Profile;

		if (!isEqual(current, newValues)) {
			profileStore.set(newValues);
			await setObjectInLocalStorage('profile', newValues);
		}
	} catch (error) {
		console.log(error);
		throw new Error("Error in setProfileStorage: " + error);
	}
}

export async function setYakklCurrentlySelectedStorage(values: YakklCurrentlySelected) {
	try {
		if (
			values.shortcuts.address.trim().length === 0 ||
			values.shortcuts.accountName.trim().length === 0) {
			throw new Error(
				'Attempting to save yakklCurrentlySelected with no address or no account name. Select a default account and retry.'
			);
		}

    // Get current store value
		const current = get(yakklCurrentlySelectedStore);

		// Avoid unnecessary updates by checking for equality
		if (!isEqual(current, values)) {
			// Update the store with the new value
			setYakklCurrentlySelectedStore(values);

			// Verify encryption (ensures the value is encrypted correctly before storing)
			const newValues = await verifyEncryption(values);

			// Update localStorage only if the encrypted data differs
			const currentEncrypted = await verifyEncryption(current); // Encrypt current for comparison
			if (!isEqual(currentEncrypted, newValues)) {
				await setObjectInLocalStorage('yakklCurrentlySelected', newValues);
			}
		}
		// setYakklCurrentlySelectedStore(values);
		// const newValues = await verifyEncryption(values); // We put this after the store since data.<whatever> holds already encrypted data
		// await setObjectInLocalStorage('yakklCurrentlySelected', newValues);
	} catch (error) {
		console.log(error);
	}
}

export async function setYakklWatchListStorage(values: YakklWatch[]) {
	try {
		yakklWatchListStore.set(values);
		await setObjectInLocalStorage('yakklWatchList', values);
	} catch (error) {
		console.log(error);
	}
}

export async function setYakklBlockedListStorage(values: YakklBlocked[]) {
	try {
		yakklBlockedListStore.set(values);
		await setObjectInLocalStorage('yakklBlockedList', values);
	} catch (error) {
		console.log(error);
	}
}

// No need for memory store since only being held in persistent storage
export async function setYakklAccountsStorage(values: YakklAccount[]) {
	try {
		const newValues = await verifyEncryption(values) as unknown as YakklAccount[];
		yakklAccountsStore.set(newValues);
		await setObjectInLocalStorage<YakklAccount[]>('yakklAccounts', newValues);
	} catch (error) {
		console.log(error);
	}
}

// No need for memory store since only being held in persistent storage
export async function setYakklPrimaryAccountsStorage(values: YakklPrimaryAccount[]) {
	try {
		const newValues = await verifyEncryption(values) as unknown as YakklPrimaryAccount[];
		yakklPrimaryAccountsStore.set(newValues);
		await setObjectInLocalStorage('yakklPrimaryAccounts', newValues);
	} catch (error) {
		console.log(error);
	}
}

export async function updateYakklTokenData(updater: (token: TokenData) => TokenData) {
	try {
		// Get the current token data from the store
		const currentData = get(yakklTokenDataStore);
		// Update the token data using the updater function
		const updatedData = currentData.map((token) => updater(token));
		// Update the store
		yakklTokenDataStore.set(updatedData);
		// Persist the updated data in local storage
		await setObjectInLocalStorage('yakklTokenData', updatedData);
	} catch (error) {
		console.log('Error updating token data:', error);
		throw error;
	}
}

export async function updateYakklTokenDataCustom(updater: (token: TokenData) => TokenData) {
	try {
		// Get the current token data from the store
		const currentData = get(yakklTokenDataCustomStore);
		// Update the token data using the updater function
		const updatedData = currentData.map((token) => updater(token));
		// Update the store
		yakklTokenDataCustomStore.set(updatedData);
		// Persist the updated data in local storage
		await setObjectInLocalStorage('yakklTokenDataCustom', updatedData);
	} catch (error) {
		console.log('Error updating token data custom:', error);
		throw error;
	}
}

// Function to update the combined store
export function updateCombinedTokenStore() {
  const combinedTokens = [...get(yakklTokenDataStore), ...get(yakklTokenDataCustomStore)];
  yakklCombinedTokenStore.set(combinedTokens); // Single reactive update for the combined tokens
}

