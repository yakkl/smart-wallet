/* eslint-disable prefer-const */

import { ethers as ethersv6 } from 'ethers-v6';
import { setSettingsStorage, getSettings, setProfileStorage, getYakklCurrentlySelected, setYakklCurrentlySelectedStorage, setYakklPrimaryAccountsStorage, getYakklPrimaryAccounts, getYakklAccounts, setYakklAccountsStorage } from '$lib/common/stores';
import { encryptData, decryptData } from '$lib/common/encryption';
import { DEFAULT_DERIVED_PATH_ETH } from '$lib/common/constants';
import type { CurrentlySelectedData, MetaData, ProfileData, YakklAccount, Profile, YakklPrimaryAccount, AccountData, PrimaryAccountData } from '$lib/common/interfaces';
import { deepCopy, getSymbol } from '$lib/utilities';
import { isEncryptedData, isMetaData, isProfileData, isString } from '$lib/common/misc';
import { dateString } from '$lib/common/datetime';
import { AccountTypeCategory, NetworkType } from '$lib/common/types';
import { VERSION } from '$lib/common/constants';
import { log } from '$lib/plugins/Logger';

export async function createPortfolioAccount(yakklMiscStore: string, profile: Profile) {
  try {
    if (!yakklMiscStore) {
      throw 'The User was not defined.';
    }

    let yakklSettings = await getSettings();
    if (!yakklSettings) {
      // noop but could load the defaults. For now we will error out!
      throw 'The settings data has not been initialized. This could be due to not yet registered or data could be incomplete which requires registering again. If unable to re-register then uninstall and reinstall. No Ethereum data will be impacted.';
    }

    let yakklCurrentlySelected = await getYakklCurrentlySelected();
    if (!yakklCurrentlySelected) {
      throw 'No currently selected account found.';
    }

    if (isEncryptedData(yakklCurrentlySelected.data)) {
      await decryptData(yakklCurrentlySelected.data, yakklMiscStore).then(result => {
        yakklCurrentlySelected.data = result as CurrentlySelectedData;
      });
    }

    let currentlySelectedData: CurrentlySelectedData = yakklCurrentlySelected.data as CurrentlySelectedData;
    let derivedPath = DEFAULT_DERIVED_PATH_ETH; // Account gets created with '/0/0' appended to represent the first
    let chainId = yakklCurrentlySelected.shortcuts.chainId; // Was 1
    if (!chainId) {
      chainId = 1;
    }

    const preferences = profile.preferences;
    let accountName: string | null = null;

    if (isEncryptedData(profile.data)) {
      await decryptData(profile.data, yakklMiscStore).then(result => {
        profile.data = result as ProfileData;
      });
    }

    if (isProfileData(profile.data) && isMetaData(profile.data.meta)) {
      const meta = profile.data.meta as MetaData;
      if (isString(meta.accountName)) {
        accountName = meta.accountName;
      }
    }

    let index: number = 0;

    if (isProfileData(profile.data)) {
      index = profile.data.accountIndex ?? 0;
    } else {
      index = 0;
    }

    derivedPath = `${DEFAULT_DERIVED_PATH_ETH}${index}'/0/0`;
    if (accountName === null) {
      accountName = `Portfolio Level Account ${index+1}`;
    }

    const entropy = ethersv6.randomBytes(32);
    const randomMnemonic = ethersv6.Mnemonic.fromEntropy(entropy);
    const ethWallet = ethersv6.HDNodeWallet.fromMnemonic(randomMnemonic, derivedPath);

    if ( !ethWallet ) {
      throw "The Ethereum Wallet (Portfolio Account) was not able to be created. Please try again.";
    }

    const currentDate = dateString();
    const address = ethWallet.address;
    (profile.data as ProfileData).accountIndex = index+1;  // PortfolioAccount index for path

    const accountData: AccountData = {
      extendedKey: ethWallet.extendedKey,
      privateKey: ethWallet.privateKey,
      publicKey: ethWallet.publicKey,
      publicKeyUncompressed: ethWallet.publicKey,
      path: derivedPath, // ethWallet.path,
      pathIndex: index,
      fingerPrint: ethWallet.fingerprint,
      parentFingerPrint: ethWallet.parentFingerprint,
      chainCode: ethWallet.chainCode,
      assignedTo: [],    // Who are the parties that have responsibility for this account
    };

    const yakklAccount: YakklAccount = {
      id: profile.id,
      index: index,
      blockchain: 'Ethereum',
      smartContract: false,
      address: address,
      alias: '',
      accountType: AccountTypeCategory.PRIMARY,
      name: accountName,
      description: '',
      primaryAccount: null,  // If subaccount then it must be a valid primaryaccount else undefined
      data: accountData,
      value: 0n,
      class: "Default",  // This is only used for enterprise like environments. It can be used for departments like 'Finance', 'Accounting', '<whatever>'
      level: 'L1',
      isSigner: true,
      avatar: '', // Default is identityicon but can be changed to user/account avatar
      tags: ['Ethereum', 'primary'],
      includeInPortfolio: true,   // This only applys to the value in this primary account and not any of the derived accounts from this primary account
      connectedDomains: [],
      version: VERSION,
      createDate: currentDate,
      updateDate: currentDate,
    };

    const yakklPrimaryAccountData: PrimaryAccountData = {
      privateKey: ethWallet.privateKey,
      publicKey: ethWallet.publicKey,
      path: derivedPath, //ethWallet.path ? ethWallet.path : derivedPath,
      pathIndex: index,
      fingerPrint: ethWallet.fingerprint,
      parentFingerPrint: ethWallet.parentFingerprint,
      chainCode: ethWallet.chainCode,
      extendedKey: ethWallet.extendedKey,
      mnemonic: ethWallet.mnemonic?.phrase,
      entropy: entropy,
      password: ethWallet.mnemonic?.password,
      publicKeyUncompressed: ethWallet.publicKey,
      wordCount: ethWallet.mnemonic?.phrase.split(" ").length,
      wordListLocale: ethWallet.mnemonic?.wordlist.locale
    };

    const yakklPrimaryAccount = {
      id: yakklAccount.id,
      name: yakklAccount.name,
      address: yakklAccount.address,
      value: yakklAccount.value,
      index: index,  // for the primary account path index
      data: yakklPrimaryAccountData,
      account: yakklAccount,  // yakklAccount.primaryAccount is always undefined here since it is the primary account
      subIndex: 0,  // for the subaccount derived path index
      subAccounts: [] as YakklAccount[], // Always empty since the primary account is the start of the tree
      createDate: yakklAccount.createDate,
      updateDate: yakklAccount.updateDate,
      version: VERSION,
    }

    let yakklPrimaryAccountEnc = deepCopy(yakklPrimaryAccount) as YakklPrimaryAccount;
    if (!isEncryptedData(yakklPrimaryAccountEnc.data)) {
      await encryptData(yakklPrimaryAccountEnc.data, yakklMiscStore).then(result => {
        yakklPrimaryAccountEnc.data = result;
      });
    }

    if (!isEncryptedData(yakklPrimaryAccountEnc.data)) {
      throw new Error("Primary Account Data is not of type EncryptedData");
    }

    yakklPrimaryAccountEnc.account = yakklAccount;
    if (!isEncryptedData(yakklPrimaryAccountEnc.account.data)) {
      await encryptData(yakklPrimaryAccountEnc.account.data, yakklMiscStore).then(result => {
        yakklPrimaryAccountEnc.account.data = result;
      });
      yakklAccount.data = yakklPrimaryAccountEnc.account.data;
    }

    let yakklPrimaryAccounts: YakklPrimaryAccount[] = await getYakklPrimaryAccounts();
    if (!yakklPrimaryAccounts) {
      yakklPrimaryAccounts = [];
    }
    yakklPrimaryAccounts.push(yakklPrimaryAccountEnc);

    if (isProfileData(profile.data)) {
      if (!isEncryptedData(profile.data)) {
        if (!profile.data.primaryAccounts) {
          profile.data.primaryAccounts = [];
        }
        profile.data.primaryAccounts.push(yakklPrimaryAccountEnc);
      } else {
        throw new Error("Profile Data is of type EncryptedData and should be of type ProfileData");
      }
    }

    let yakklAccounts: YakklAccount[] = await getYakklAccounts();
    if (!yakklAccounts) {
      yakklAccounts = [];
    }

    yakklPrimaryAccountEnc.account.primaryAccount = null; // Indicates that this is the primary account since it has no parent

    yakklAccounts.push(yakklPrimaryAccountEnc.account);

    // TODO: May want to remove this - no longer needed
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    await ethWallet.signMessage(yakklMiscStore).then(result => {
      if (isProfileData(profile.data) && !isEncryptedData(profile.data)) {
        profile.data.sig = result;
      } else {
        // Need to maybe error out here
      }
    });

    const profileEnc: Profile = deepCopy(profile); // Need deep copy...

    if (!isEncryptedData(profileEnc.data)) {
      await encryptData(profileEnc.data, yakklMiscStore).then(result => {
        profileEnc.data = result;
      });
    }

    yakklSettings.init = true;
    yakklSettings.isLocked = false;

    yakklCurrentlySelected.version = VERSION;
    yakklCurrentlySelected.preferences.locale = preferences.locale;
    yakklCurrentlySelected.preferences.currency = preferences.currency;

    yakklCurrentlySelected.shortcuts.init = true;
    yakklCurrentlySelected.shortcuts.isLocked = false;
    yakklCurrentlySelected.shortcuts.blockchain = yakklAccount.blockchain;
    yakklCurrentlySelected.shortcuts.symbol = getSymbol(yakklAccount.blockchain);
    yakklCurrentlySelected.shortcuts.chainId = chainId;

    // May want to set to the default network and set the networks and then change the values as needed
    yakklCurrentlySelected.shortcuts.network.blockchain = yakklAccount.blockchain;
    yakklCurrentlySelected.shortcuts.network.chainId = chainId; // Defaults to mainnet
    yakklCurrentlySelected.shortcuts.network.name = 'Mainnet'; // Defaults to mainnet - should change to read from getNetworkName(chainId)
    yakklCurrentlySelected.shortcuts.network.explorer = 'https://etherscan.io'; // Defaults to etherscan
    yakklCurrentlySelected.shortcuts.network.type = NetworkType.MAINNET; // Defaults to mainnet
    yakklCurrentlySelected.shortcuts.network.decimals = 18; // Defaults to 18
    yakklCurrentlySelected.shortcuts.network.symbol = getSymbol(yakklAccount.blockchain);

    yakklCurrentlySelected.shortcuts.profile.name = (profile.data as ProfileData).name;  // Name type
    yakklCurrentlySelected.shortcuts.profile.email = (profile.data as ProfileData).email;
    yakklCurrentlySelected.shortcuts.primary = yakklPrimaryAccountEnc;
    yakklCurrentlySelected.shortcuts.address = yakklPrimaryAccountEnc.address;
    yakklCurrentlySelected.shortcuts.accountName = yakklPrimaryAccountEnc.account.name;
    yakklCurrentlySelected.shortcuts.accountType = AccountTypeCategory.PRIMARY;
    yakklCurrentlySelected.shortcuts.alias = yakklPrimaryAccountEnc.account.alias;
    yakklCurrentlySelected.shortcuts.smartContract = false;

    currentlySelectedData.primaryAccount = yakklPrimaryAccountEnc;
    (currentlySelectedData as CurrentlySelectedData).account = yakklPrimaryAccountEnc.account;

    yakklCurrentlySelected.id = profile.id;
    yakklCurrentlySelected.createDate = yakklPrimaryAccountEnc.account.createDate;
    yakklCurrentlySelected.updateDate = yakklPrimaryAccountEnc.account.updateDate;

    yakklCurrentlySelected.data = currentlySelectedData;

    if (!isEncryptedData(yakklCurrentlySelected.data)) {
      await encryptData(yakklCurrentlySelected.data, yakklMiscStore).then(result => {
        yakklCurrentlySelected.data = result;
      });
    }

    await setYakklAccountsStorage(yakklAccounts);
    await setYakklPrimaryAccountsStorage(yakklPrimaryAccounts);
    await setSettingsStorage(yakklSettings);
    await setProfileStorage(profileEnc); // Note: Calling function will need to refresh the profile data to be current with these changes
    await setYakklCurrentlySelectedStorage(yakklCurrentlySelected);

    // PrimaryAccountReturnValues
    return Promise.resolve({ currentlySelected: yakklCurrentlySelected,
                            primaryAccount: yakklPrimaryAccountEnc
    });

  } catch (e) {
    log.error('The Portfolio Account was not able to be created.', false, e);
    return Promise.reject(e);
  }
}

