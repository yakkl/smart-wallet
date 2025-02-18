/* eslint-disable @typescript-eslint/no-explicit-any */
import { decryptData, digestMessage } from '$lib/common/encryption';
import type { AccountData, CurrentlySelectedData, Profile, ProfileData } from '$lib/common/interfaces';
import { isEncryptedData } from '$lib/common/misc';
import { getProfile, setMiscStore, getYakklCurrentlySelected, getMiscStore } from '$lib/common/stores';
import { log } from '$plugins/Logger';

export interface AccountKey {
  address: string;
  privateKey: string;
}

export async function verify(id: string): Promise<Profile | undefined> {
  try {
    if (!id) {
      return undefined;
    }
    const profile = await getProfile();
    const digest = await digestMessage(id);
    if (!profile || !digest) {
      return undefined; // Don't set the store to anything here
    } else {
      if (isEncryptedData(profile.data)) {
        const profileData = await decryptData(profile.data, digest) as ProfileData;
        if (profileData) {
          setMiscStore(digest);
        } else {
          throw 'Verification failed!';
        }
      }
      return profile;
    }
  } catch(e) {
    // console.log('[ERROR]:', e);
    log.error(e);
    throw `Verification failed! - ${e}`;
  }
}

export async function getYakklCurrentlySelectedAccountKey(): Promise<AccountKey | null> {
  try {
    const currentlySelected = await getYakklCurrentlySelected();
    const yakklMiscStore = getMiscStore();
    let accountKey: AccountKey | null = null;
    let address: string | null = null;
    let privateKey: string | null | undefined = null;

    if (!yakklMiscStore || !currentlySelected) {
      return null;
    }
    // May want to put this in a function
    if ( isEncryptedData( currentlySelected.data ) ) {
      const result = await decryptData( currentlySelected.data, yakklMiscStore );
      const data = result as CurrentlySelectedData;
      address = data?.account?.address || null;
      if ( isEncryptedData( data?.account?.data ) ) {
        const result = await decryptData( data.account.data, yakklMiscStore );
        const accountData = result as AccountData;
        privateKey = accountData.privateKey;
      } else {
        privateKey = data ? data.account?.data.privateKey : null;
      }
    } else {
      privateKey = currentlySelected.data ? ( ( currentlySelected.data as CurrentlySelectedData ).account?.data as AccountData )?.privateKey ?? null : null;
    }

    if ( privateKey && address) {
      accountKey = {
        address: address,
        privateKey: privateKey
      };
    }
    return accountKey;
  } catch(e: any) {
    // error_log(e);
    log.errorStack(e);
    throw `Error getting account key - ${e}`;
  }
}
