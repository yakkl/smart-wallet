<!-- ImportPhrase.svelte -->
<script lang="ts">
  import { browser as browserSvelte } from '$app/environment';
  import { ethers as ethersv6 } from 'ethers-v6';
  import { createForm } from 'svelte-forms-lib';
  import * as yup from 'yup';
  import { onMount } from 'svelte';
  import { incrementProperty } from '$lib/utilities';
  import { getWallet } from '$lib/utilities/ethereum';
  import { deepCopy, getSymbol } from '$lib/utilities';
  import { setSettingsStorage, getSettings, yakklMiscStore, setProfileStorage, setYakklCurrentlySelectedStorage, setYakklPrimaryAccountsStorage, getYakklPrimaryAccounts, getYakklAccounts, setYakklAccountsStorage, getProfile } from '$lib/common/stores';
  import { encryptData, decryptData } from '$lib/common/encryption';
  import { DEFAULT_DERIVED_PATH_ETH, VERSION } from '$lib/common/constants';
  import { AccountTypeCategory, isEncryptedData, type CurrentlySelectedData, type PrimaryAccountData, type Profile, type ProfileData, type YakklAccount, type YakklCurrentlySelected, type YakklPrimaryAccount } from '$lib/common';
  import { dateString } from '$lib/common/datetime';
  import PincodeVerify from './PincodeVerify.svelte';
  import Modal from './Modal.svelte';

  interface Props {
    show?: boolean;
    className?: string;
    onComplete?: () => void; // May want to add parameters to show what imported but not currently needed
    onCancel?: () => void;
  }

  let {
    show = $bindable(false),
    className = 'text-gray-600 z-[999]',
    onComplete = () => {showPincodeModal = false; show = false;},
    onCancel = $bindable(() => {showPincodeModal = false; show = false;})
  }: Props = $props();

  let currentlySelected: YakklCurrentlySelected;
  let error = $state('');
  let elements: NodeListOf<HTMLInputElement>;
  let selected = $state('24');
  let subAccounts = $state(true);
  let showPincodeModal = $state(false);
  let index = 0;

  async function processSecretPhraseRecovery(secretPhrase: string) {
    if (browserSvelte) {
      try {
        const selectedWords = secretPhrase.split(' ').slice(0, parseInt(selected));
        const yakklPrimaryAccount = await createPortfolioAccount(selectedWords.join(' '));
        onComplete();

        // Create subAccounts if enabled
        if (subAccounts) {
          let derivedIndex = 0;

          while (true) {
            const dPath = `${DEFAULT_DERIVED_PATH_ETH}${index}'/0/${derivedIndex}`;

            const randomMnemonic = (yakklPrimaryAccount.data as PrimaryAccountData).mnemonic as string;
            const ethWallet = ethersv6.HDNodeWallet.fromPhrase(randomMnemonic, dPath);
            const wallet = getWallet(ethWallet.privateKey);

            const balance = await wallet.getBalance();

            if (balance.isZero()) {
              break;
            }

            let addressDerived = wallet.address;
            incrementProperty(yakklPrimaryAccount, 'subIndex');

            let yakklAccount: YakklAccount = {
              id: yakklPrimaryAccount.id,
              index: (yakklPrimaryAccount.subIndex ?? 0 > 0 ? (yakklPrimaryAccount.subIndex ?? 1) - 1 : 0),
              blockchain: currentlySelected!.shortcuts.network.blockchain,
              smartContract: false,
              address: addressDerived,
              alias: '',
              accountType: AccountTypeCategory.SUB,
              name: `Account ${yakklPrimaryAccount.subIndex}`,
              description: '',
              primaryAccount: yakklPrimaryAccount,
              data: {
                extendedKey: ethWallet.extendedKey,
                privateKey: ethWallet.privateKey,
                publicKey: ethWallet.publicKey,
                publicKeyUncompressed: ethWallet.publicKey,
                path: dPath,
                pathIndex: ethWallet.index,
                fingerPrint: ethWallet.fingerprint,
                parentFingerPrint: ethWallet.parentFingerprint,
                chainCode: ethWallet.chainCode,
                assignedTo: [],
              },
              value: balance,
              class: "Default",
              level: 'L1',
              isSigner: true,
              avatar: '',
              tags: [currentlySelected!.shortcuts.network.blockchain, 'sub'],
              includeInPortfolio: true,
              connectedDomains: [],
              createDate: dateString(),
              updateDate: dateString(),
              version: VERSION,
            };

            let yakklAccountEnc = deepCopy(yakklAccount) as YakklAccount;
            await encryptData(yakklAccount.data, $yakklMiscStore).then(result => {
              yakklAccountEnc.data = result;
            });
            if (yakklPrimaryAccount.subAccounts) {
              yakklPrimaryAccount.subAccounts.push(yakklAccountEnc);
            }

            let profile = await getProfile();
            if (profile) {
              (profile.data as ProfileData).primaryAccounts = (profile.data as ProfileData).primaryAccounts || [];
              (profile.data as ProfileData).primaryAccounts[yakklPrimaryAccount.index] = yakklPrimaryAccount;
              await setYakklPrimaryAccountsStorage((profile.data as ProfileData).primaryAccounts);

              let profileEnc = deepCopy(profile);
              await encryptData(profile.data, $yakklMiscStore).then(result => {
                profileEnc.data = result;
              });
              await setProfileStorage(profileEnc);
            }

            derivedIndex++;
          }
        }

        show = false;
      } catch (e) {
        error = `Your Wallet did not initialize for the following reason: ${e}`;
      }
    }
  }

  async function createPortfolioAccount(mnemonic: string): Promise<YakklPrimaryAccount> {
    try {
      if (browserSvelte) {
        let yakklSettings = await getSettings();
        if (!yakklSettings) {
          throw 'The settings data has not been initialized. This could be due to not yet registered or data could be incomplete which requires registering again. If unable to re-register then uninstall and reinstall. No Ethereum data will be impacted.';
        }

        let profile = await getProfile();
        if (!profile) {
          throw 'Profile was not found.';
        }

        if (!profile.data || !$yakklMiscStore) {
          throw 'Profile data does not appear to be encrypted. Please register or re-register. Thank you.';
        }

        if (isEncryptedData(profile.data)) {
          await decryptData(profile.data, $yakklMiscStore).then(result => {
            profile.data = result as ProfileData;
          });
        }

        (profile.data as ProfileData).meta = {};
        let preferences = profile.preferences;

        index = (profile.data as ProfileData).accountIndex ?? 0;
        let derivedPath = `${DEFAULT_DERIVED_PATH_ETH}${index}'/0/0`;

        const mnemonicObject = ethersv6.Mnemonic.fromPhrase(mnemonic);
        const ethWallet = ethersv6.HDNodeWallet.fromMnemonic(mnemonicObject, derivedPath);

        if (!ethWallet) {
          throw "The Ethereum Wallet (Portfolio Account) was not able to be created. Please try again.";
        }

        let currentDate = dateString();

        (profile.data as ProfileData).accountIndex = index + 1;

        let yakklAccount: YakklAccount = {
          id: profile.id,
          index: index,
          blockchain: currentlySelected!.shortcuts.network.blockchain,
          smartContract: false,
          address: ethWallet.address,
          alias: '',
          accountType: AccountTypeCategory.PRIMARY,
          name: `Top Level Account ${index + 1}`,
          description: '',
          primaryAccount: null,
          data: {
            extendedKey: ethWallet.extendedKey,
            privateKey: ethWallet.privateKey,
            publicKey: ethWallet.publicKey,
            publicKeyUncompressed: ethWallet.publicKey,
            path: ethWallet.path ? ethWallet.path : derivedPath,
            pathIndex: index,
            fingerPrint: ethWallet.fingerprint,
            parentFingerPrint: ethWallet.parentFingerprint,
            chainCode: ethWallet.chainCode,
            assignedTo: [],
          },
          value: 0n,
          class: "Default",
          level: 'L1',
          isSigner: true,
          avatar: '',
          tags: [currentlySelected!.shortcuts.network.blockchain, 'primary'],
          includeInPortfolio: true,
          connectedDomains: [],
          createDate: currentDate,
          updateDate: currentDate,
          version: VERSION,
        };

        let yakklPrimaryAccount: YakklPrimaryAccount = {
          id: yakklAccount.id,
          name: yakklAccount.name,
          address: yakklAccount.address,
          value: yakklAccount.value,
          index: index,
          data: {
            privateKey: ethWallet.privateKey,
            publicKey: ethWallet.publicKey,
            path: ethWallet.path ? ethWallet.path : derivedPath,
            pathIndex: index,
            fingerPrint: ethWallet.fingerprint,
            parentFingerPrint: ethWallet.parentFingerprint,
            chainCode: ethWallet.chainCode,
            extendedKey: ethWallet.extendedKey,
            mnemonic: ethWallet.mnemonic?.phrase,
            entropy: undefined,
            password: ethWallet.mnemonic?.password,
            publicKeyUncompressed: ethWallet.publicKey,
            wordCount: ethWallet.mnemonic?.phrase.split(" ").length,
            wordListLocale: ethWallet.mnemonic?.wordlist.locale,
          },
          account: yakklAccount,
          subIndex: 0,
          subAccounts: [],
          createDate: yakklAccount.createDate,
          updateDate: yakklAccount.updateDate,
          version: VERSION,
        };

        let yakklPrimaryAccountEnc = deepCopy(yakklPrimaryAccount) as YakklPrimaryAccount;

        await encryptData(yakklPrimaryAccount.data, $yakklMiscStore).then(result => {
          yakklPrimaryAccountEnc.data = result;
        });

        yakklPrimaryAccountEnc.account = yakklAccount;

        await encryptData(yakklAccount.data, $yakklMiscStore).then(result => {
          yakklPrimaryAccountEnc.account.data = result;
        });

        let yakklPrimaryAccounts: YakklPrimaryAccount[] = [];
        let primaryAccountsStorage = await getYakklPrimaryAccounts();

        if (primaryAccountsStorage?.length > 0) {
          yakklPrimaryAccounts = primaryAccountsStorage;
        }

        if (yakklPrimaryAccountEnc) {
          yakklPrimaryAccounts.push(yakklPrimaryAccountEnc);
          await setYakklPrimaryAccountsStorage(yakklPrimaryAccounts);
        }

        let yakklAccounts: any[] = [];
        let accountsStorage = await getYakklAccounts();

        if (accountsStorage?.length > 0) {
          yakklAccounts = accountsStorage;
        }

        yakklPrimaryAccountEnc.account.primaryAccount = null;

        yakklAccounts.push(yakklPrimaryAccountEnc.account);
        await setYakklAccountsStorage(yakklAccounts);

        await ethWallet.signMessage($yakklMiscStore).then(result => {
          (profile.data as ProfileData).sig = result;
        });

        let profileEnc: Profile = deepCopy(profile);

        await encryptData(profileEnc.data, $yakklMiscStore).then(result => {
          profileEnc.data = result;
        });

        if (profileEnc) {
          await setProfileStorage(profileEnc);
          yakklSettings.init = currentlySelected!.shortcuts.init = true;
          yakklSettings.isLocked = currentlySelected!.shortcuts.isLocked = false;
          await setSettingsStorage(yakklSettings);

          let accountName = yakklAccount.name;

          let yakklCurrentlySelected = currentlySelected;

          yakklCurrentlySelected!.version = VERSION;
          yakklCurrentlySelected!.id = profile.id;
          yakklCurrentlySelected!.preferences.locale = preferences.locale;
          yakklCurrentlySelected!.preferences.currency = preferences.currency;

          yakklCurrentlySelected!.shortcuts.blockchain = yakklAccount.blockchain;
          yakklCurrentlySelected!.shortcuts.symbol = getSymbol(yakklAccount.blockchain);
          yakklCurrentlySelected!.shortcuts.isLocked = false;
          yakklCurrentlySelected!.shortcuts.showTestNetworks = preferences.showTestNetworks as boolean;
          yakklCurrentlySelected!.shortcuts.profile.name = (profile.data as ProfileData).name;
          yakklCurrentlySelected!.shortcuts.profile.email = (profile.data as ProfileData).email;
          yakklCurrentlySelected!.shortcuts.primary = yakklPrimaryAccountEnc;
          yakklCurrentlySelected!.shortcuts.address = yakklAccount.address;
          yakklCurrentlySelected!.shortcuts.accountName = accountName;
          yakklCurrentlySelected!.shortcuts.accountType = AccountTypeCategory.PRIMARY;
          yakklCurrentlySelected!.shortcuts.alias = yakklAccount.alias;
          yakklCurrentlySelected!.shortcuts.smartContract = false;

          (yakklCurrentlySelected!.data as CurrentlySelectedData).primaryAccount = yakklPrimaryAccountEnc;
          (yakklCurrentlySelected!.data as CurrentlySelectedData).account = yakklAccount;

          yakklCurrentlySelected!.createDate = yakklAccount.createDate;
          yakklCurrentlySelected!.updateDate = yakklAccount.updateDate;

          let currentDeepCopy = deepCopy(yakklCurrentlySelected);
          await setYakklCurrentlySelectedStorage(yakklCurrentlySelected!);
          currentlySelected = currentDeepCopy;

          return yakklPrimaryAccountEnc;
        } else {
          throw new Error('Failed to create profile encryption');
        }
      } else {
        throw new Error('Browser environment not available');
      }
    } catch (e) {
      console.log(`Your Wallet did not initialize for the following reason: ${e}`);
      throw e;
    }
  }


  const { form, errors, handleChange, handleSubmit, updateInitialValues } = createForm({
    initialValues: {
      secretPhrase: '',
    },
    validationSchema: yup.object().shape({
      secretPhrase: yup.string().required('Please enter your secret recovery phrase'),
    }),
    onSubmit: (data) => {
      try {
        const elements = document.querySelectorAll<HTMLInputElement>('[data-id]');
        let secretPhrase = '';
        if (elements) {
          elements.forEach((el) => {
            secretPhrase += el.value + ' ';
          });
          secretPhrase = secretPhrase.trim();
          const selectedWords = secretPhrase.split(' ').slice(0, parseInt(selected));
          processSecretPhraseRecovery(selectedWords.join(' '));
        } else {
          throw new Error('Your Secret Phrase does not seem to be correct. Check the formatting. You can enter each word and it MUST BE IN ORDER -OR- paste the whole phrase after copying from your backup into any field.');
        }
      } catch (e) {
        console.error(e);
        error = String(e);
        resetForm();
      }
    },
  });

  function resetForm() {
    updateInitialValues({
      secretPhrase: '',
    });
    const elements = document.querySelectorAll<HTMLInputElement>('[data-id]');
    elements.forEach((el) => {
      el.value = '';
    });
  }

  function hideShowWords() {
    let count = parseInt(selected);

    let element: HTMLElement | null;
    let element_text: HTMLElement | null;

    for (let wordCount = 13; wordCount <= 24; wordCount++) {
      element_text = document.getElementById(`word_text_${wordCount}`);
      element = document.getElementById(`word_${wordCount}`);

      if (element_text && element) {
        // Show and then toggle - this covers fringe cases
        element_text.style.display = "block";
        element.style.display = "block";
      }
    }

    for (let wordCount = 24; wordCount > count; wordCount--) {
      element_text = document.getElementById(`word_text_${wordCount}`);
      element = document.getElementById(`word_${wordCount}`);

      if (element_text && element) {
        if (element_text.style.display === "none") {
          element_text.style.display = "block";
        } else {
          element_text.style.display = "none";
        }

        if (element.style.display === "none") {
          element.style.display = "block";
        } else {
          element.style.display = "none";
        }
      }
    }

    let mtop: string;
    switch (count) {
      case 12:
        mtop = '-mt-[9rem]';
        break;
      case 15:
        mtop = '-mt-[6.5rem]';
        break;
      case 18:
        mtop = '-mt-[4.25rem]';
        break;
      case 21:
        mtop = '-mt-[2.5rem]';
        break;
      case 24: // Our default
        mtop = '';
        break;
      default:
        mtop = '';
        break;
    }
  }

  function toggleWordsVisibility() {
    elements = document.querySelectorAll('[data-id]') as NodeListOf<HTMLInputElement>;
    elements.forEach((el) => {
      if (el.type === 'password') {
        el.type = 'text';
      } else {
        el.type = 'password';
      }
    });
  }

  // Custom paste logic - Always becareful with custom paste logic and make sure not to do it on global basis unless that is desired.
  function handlePaste(e: ClipboardEvent) {
    const data = e.clipboardData?.getData('Text');
    const words = data?.split(' ');

    if (words && words.length > 1) {
      // If multiple words are being pasted, prevent default and handle custom logic
      e.preventDefault();
      const nodes = document.querySelectorAll<HTMLInputElement>('[data-id]');
      nodes.forEach((node, index) => {
        node.value = words[index] || '';
      });
    }
    // Otherwise, let the default paste behavior happen
  }

  onMount(() => {
    hideShowWords();
    // document.addEventListener('paste', handlePaste);
  });

  function handleSubaccounts() {
    subAccounts = !subAccounts;
  }

  async function verifyPincode(pincode: string) {
    showPincodeModal = false;
    show = true;
  }
</script>

<PincodeVerify bind:show={showPincodeModal} onVerified={verifyPincode} />

<div class="relative {className}">
  <Modal bind:show={show} onCancel={onCancel} title="Import - Secret Recovery Phrase" className={className}>
    <div class="p-6 text-gray-700 dark:text-gray-200">
      <p class="text-sm text-red-500 mb-4">
        Please be careful! <strong>This Secret Recovery Phrase is important!</strong>
        A bad actor could take the content of your wallet if they have access to your Private Key or Secret Recovery Phrase!
        This process will restore all of the accounts that were created by YAKKL only! If you imported existing private keys from another wallet then you will need to do so again.
      </p>
      <form onsubmit={handleSubmit} class="space-y-4">
        <div>
          <label for="words" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Secret Recovery Phrase Length</label>
          <select id="words" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" bind:value={selected} onchange={hideShowWords}>
            <option value="12">12 Word Secret Phrase</option>
            <option value="15">15 Word Secret Phrase</option>
            <option value="18">18 Word Secret Phrase</option>
            <option value="21">21 Word Secret Phrase</option>
            <option value="24" selected>24 Word Secret Phrase</option>
          </select>
        </div>
        <div>
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Secret Recovery Phrase Words</label>
          <div class="mt-1 grid grid-cols-2 gap-2">
            {#each Array(parseInt(selected)) as _, index (index)}
              <div class="flex items-center">
                <span class="w-8 text-sm text-gray-700 dark:text-gray-200">{index + 1}.</span>
                <input type="password" class="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" data-id={index + 1} aria-label={`Word ${index + 1}`} onpaste={handlePaste} />
              </div>
            {/each}
          </div>
        </div>
        <div class="flex items-center">
          <input type="checkbox" id="showWords" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" onclick={toggleWordsVisibility} />
          <label for="showWords" class="ml-2 block text-sm text-gray-700 dark:text-gray-200">Show Secret Recovery Phrase Words</label>
        </div>
        <div class="flex items-center">
          <input type="checkbox" id="subaccounts" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" bind:checked={subAccounts} onchange={handleSubaccounts} />
          <label for="subaccounts" class="ml-2 block text-sm text-gray-700 dark:text-gray-200">Recover Subportfolio Accounts</label>
        </div>
        <div class="pt-5">
          <div class="flex justify-end space-x-4">
            <button type="button" class="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onclick={onCancel}>Cancel</button>
            <button type="button" class="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onclick={resetForm}>Reset</button>
            <button type="submit" class="rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Import</button>
          </div>
        </div>
      </form>
      {#if error}
        <p class="mt-4 text-sm text-red-600">{error}</p>
      {/if}
    </div>
  </Modal>
</div>
