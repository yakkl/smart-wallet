/* eslint-disable prefer-const */

import { ethers } from "ethers"; // Just need to call a few non-blockchain access functions
import { setSettings, getSettings, setProfileStorage, setYakklCurrentlySelectedStorage, getYakklPrimaryAccounts, setYakklPrimaryAccountsStorage, getYakklAccounts, setYakklAccountsStorage, getMiscStore, getYakklCurrentlySelected, getProfile } from '$lib/common/stores';
import { encryptData, decryptData, isEncryptedData } from '$lib/common';
import { DEFAULT_DERIVED_PATH_ETH } from '$lib/common/constants';
import { deepCopy, getSymbol } from '$lib/utilities';
import type { AccountData, CurrentlySelectedData, EncryptedData, PrimaryAccountData, ProfileData, YakklAccount, YakklPrimaryAccount, Profile, Preferences, Settings, YakklCurrentlySelected } from '$lib/common';
import { AccountTypeCategory, NetworkType } from '$lib/common/types';
import { dateString } from '$lib/common/datetime';

// TODO: May want to have all of the .data encrypted in the catch block or final block to ensure that the data is encrypted before returning it. This requires moving the variables to here instead of the try block.

// Note: profile is not encrypted when passed in. Also, profile.data.primaryAccounts?.length === 0 should be done before calling this function
export async function createSubportfolioAccount(yakklMiscStore: string, currentlySelected: YakklCurrentlySelected, profile: Profile | null) {
  try {
    if (!yakklMiscStore) {
      yakklMiscStore = getMiscStore();
    }

    if (!currentlySelected) {
      currentlySelected = await getYakklCurrentlySelected();
      if (isEncryptedData(currentlySelected.data)) {
        await decryptData(currentlySelected.data, yakklMiscStore).then(result => {
          currentlySelected.data = result as CurrentlySelectedData;
        });
      }
    }

    if (!profile) {
      profile = await getProfile();
      if (isEncryptedData(profile!.data)) {
        await decryptData(profile!.data, yakklMiscStore).then(result => {
          profile!.data = result as ProfileData;
        });
      }
    }
    if (!profile || !profile.data) {
      throw "Profile data does not appear to be encrypted. Please register or re-register. Thank you.";
    }
    // If profile is null then bail.

    let yakklSettings: Settings | null = await getSettings();
    if (!yakklSettings || yakklSettings?.init === false || yakklSettings?.isLocked === true) {
      throw 'createSubportfolioAccount: The settings data has not been initialized. This could be due to not yet registered or data could be incomplete which requires registering again. If unable to re-register then uninstall and reinstall. No Ethereum data will be impacted.';
    }

    let addressDerived: string ='';
    let yakklPrimaryAccount: YakklPrimaryAccount;
    let derivedPath = DEFAULT_DERIVED_PATH_ETH; //Index at end is dynamically created
    let currentDate: string;
    let preferences: Preferences;
    const chainId = 1;

    let profileData: ProfileData | null = null;

    profileData = profile.data as ProfileData;
    if (profileData.primaryAccounts?.length === 0) {
      throw "You cannot derive a new account unless a primary account has been created through the registration process. Please register. Thank you.";
    }

    let currentlySelectedData: CurrentlySelectedData = currentlySelected.data as CurrentlySelectedData;
    // yakklPrimaryAccount = profileData.primaryAccounts.find(account => account.name === currentlySelectedData.primaryAccount!.name) as YakklPrimaryAccount;   
    yakklPrimaryAccount = currentlySelectedData.primaryAccount as YakklPrimaryAccount; 

    let index = profileData.primaryAccounts.indexOf(yakklPrimaryAccount);
    
    if (isEncryptedData(yakklPrimaryAccount.data)) {
      await decryptData(yakklPrimaryAccount.data, yakklMiscStore).then(result => {
        yakklPrimaryAccount.data = result as PrimaryAccountData;
      });
    }

    preferences = profile.preferences;
    derivedPath = `${DEFAULT_DERIVED_PATH_ETH}${yakklPrimaryAccount.index}'/0/${yakklPrimaryAccount.subIndex+1}`;

    // Data outside profile - now that we making all 'data' properties encrypted, may not need an external 'safe' list if accounts
    let yakklPrimaryAccounts = await getYakklPrimaryAccounts();
    if (!yakklPrimaryAccounts || yakklPrimaryAccounts?.length < 1) {
      throw "There should be at least one primary account to add a derived account. You must first create a new primary/portfolio account. Thank you.";
    }

    const mnemonic = (yakklPrimaryAccount.data as PrimaryAccountData).mnemonic;
    let ethWallet = ethers.HDNodeWallet.fromPhrase(mnemonic as string, undefined, derivedPath); 

    if ( !ethWallet ) {
      throw "The subportfolio account was not able to be created. Please try again.";
    }

    addressDerived = ethWallet.address;

    yakklPrimaryAccount.subIndex += 1;
    yakklPrimaryAccount.updateDate = currentDate = dateString();
    if (!isEncryptedData(yakklPrimaryAccount.data)) {
      await encryptData(yakklPrimaryAccount.data, yakklMiscStore).then(result => {
        yakklPrimaryAccount.data = result;
      });
    }

    const accountData: AccountData = {
      extendedKey: ethWallet.extendedKey,
      privateKey: ethWallet.privateKey,
      publicKey: ethWallet.publicKey,
      publicKeyUncompressed: ethWallet.publicKey,//ethWallet.signingKey.publicKey,
      path: derivedPath, //ethWallet.path ? ethWallet.path : derivedPath,     
      pathIndex: ethWallet.index,
      fingerPrint: ethWallet.fingerprint,
      parentFingerPrint: ethWallet.parentFingerprint,
      chainCode: ethWallet.chainCode,
      assignedTo: [],    // Who are the parties that have responsibility for this account
    };

    let yakklAccount: YakklAccount = {
      id: profile.id,
      index: (yakklPrimaryAccount.subIndex > 0 ? yakklPrimaryAccount.subIndex-1 : 0),
      blockchain: currentlySelected.shortcuts.network.blockchain,
      smartContract: false,
      address: addressDerived,
      alias: '',
      accountType: AccountTypeCategory.SUB,
      name:`Sub-Portfolio ${yakklPrimaryAccount.subIndex}`,
      description: '',
      primaryAccount: yakklPrimaryAccount,  // If subaccount then it must be a valid primaryaccount else undefined
      data: accountData,
      value: 0n, 
      class: "Default",  // This is only used for enterprise like environments. It can be used for departments like 'Finance', 'Accounting', '<whatever>'
      level: 'L1',
      isSigner: true,
      avatar: '', // Default is identityicon but can be changed to user/account avatar
      tags: [currentlySelected.shortcuts.network.blockchain, 'sub'],
      includeInPortfolio: true,   // This only applys to the value in this primary account and not any of the derived accounts from this primary account
      connectedDomains: [], 
      createDate: currentDate,
      updateDate: currentDate,
      version: '1.0.0',
    };

    const yakklAccountEnc: YakklAccount = deepCopy(yakklAccount);
    if (!isEncryptedData(yakklAccountEnc.data)) {
      await encryptData(yakklAccountEnc.data, yakklMiscStore).then(result => {
        yakklAccountEnc.data = result as EncryptedData;
      });
    }

    if (!Array.isArray(yakklPrimaryAccount.subAccounts)) {
      yakklPrimaryAccount.subAccounts = [];
    }

    yakklPrimaryAccount.subAccounts.push(yakklAccountEnc);
    profileData.primaryAccounts[index] = yakklPrimaryAccount;

    setYakklPrimaryAccountsStorage(profileData.primaryAccounts);  // It was updated and not added 

    const profileEnc = deepCopy(profile);

    profile.data = profileData;
    profileEnc.data = deepCopy(profileData);
    if (!isEncryptedData(profileEnc.data)) {
      await encryptData(profileEnc.data, yakklMiscStore).then(result => {
        profileEnc.data = result;
      });
    }

    yakklSettings.isLocked = false;

    currentlySelected.preferences.locale = preferences.locale;
    currentlySelected.preferences.currency = preferences.currency;

    currentlySelected.shortcuts.network.blockchain = yakklAccountEnc.blockchain;
    currentlySelected.shortcuts.network.chainId = chainId; // Defaults to mainnet
    currentlySelected.shortcuts.network.name = 'Mainnet'; // Defaults to mainnet - should change to read from getNetworkName(chainId)
    currentlySelected.shortcuts.network.explorer = 'https://etherscan.io'; // Defaults to etherscan
    currentlySelected.shortcuts.network.type = NetworkType.MAINNET; // Defaults to mainnet
    currentlySelected.shortcuts.network.decimals = 18; // Defaults to 18
    currentlySelected.shortcuts.network.symbol = getSymbol(yakklAccountEnc.blockchain);

    currentlySelected.shortcuts.chainId = chainId;
    currentlySelected.shortcuts.blockchain = yakklAccountEnc.blockchain;
    currentlySelected.shortcuts.symbol = getSymbol(yakklAccountEnc.blockchain);
    currentlySelected.shortcuts.showTestNetworks = preferences.showTestNetworks as boolean;
    currentlySelected.shortcuts.profile.name = (profile.data as ProfileData).name;
    currentlySelected.shortcuts.profile.email = (profile.data as ProfileData).email;
    currentlySelected.shortcuts.value = 0n;
    currentlySelected.shortcuts.address = yakklAccountEnc.address;
    currentlySelected.shortcuts.primary = yakklPrimaryAccount;
    currentlySelected.shortcuts.accountName = yakklAccountEnc.name;
    currentlySelected.shortcuts.accountType = AccountTypeCategory.SUB;
    currentlySelected.shortcuts.smartContract = false;

    (currentlySelected.data as CurrentlySelectedData).primaryAccount = yakklPrimaryAccount;
    (currentlySelected.data as CurrentlySelectedData).account = yakklAccountEnc;

    currentlySelected.createDate = yakklAccount.createDate;
    currentlySelected.updateDate = yakklAccount.updateDate;

    if (!isEncryptedData(currentlySelected.data)) {
      await encryptData(currentlySelected.data, yakklMiscStore).then(result => {
        currentlySelected.data = result;
      });
    }

    let accounts = [];
    accounts = await getYakklAccounts();
    accounts.push(yakklAccountEnc);

    await setSettings(yakklSettings);
    await setProfileStorage(profileEnc);
    await setYakklAccountsStorage(accounts);
    await setYakklCurrentlySelectedStorage(currentlySelected);

    return Promise.resolve(currentlySelected);
  } catch (e) {
    return Promise.reject(e);
  }
}
