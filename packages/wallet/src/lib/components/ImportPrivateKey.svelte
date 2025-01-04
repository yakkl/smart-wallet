<!-- ImportPrivateKey.svelte -->
<script lang="ts">
  import { browser as browserSvelte } from '$app/environment';
  import { setYakklAccountsStorage, setYakklCurrentlySelectedStorage, setProfileStorage, getYakklAccounts, getProfile, getYakklCurrentlySelected, getMiscStore } from '$lib/common/stores';
  import { yakklAccount as yakklAccountDefault } from '$lib/models/dataModels';
  import { getWallet } from '$lib/utilities/ethereum';
  import { encryptData, decryptData } from '$lib/common/encryption';
  import { deepCopy, getSymbol } from '$lib/utilities/utilities';
  import { VERSION } from '$lib/common/constants';
  import { createForm } from 'svelte-forms-lib';
  import * as yup from 'yup';
  // import { Confetti } from 'svelte-confetti';
  import { confetti } from '@neoconfetti/svelte';
  import { AccountTypeCategory, isEncryptedData, NetworkType, type AccountData, type CurrentlySelectedData, type Profile, type ProfileData, type YakklAccount, type YakklCurrentlySelected } from '$lib/common';
  import WalletManager from '$lib/plugins/WalletManager';
  import type { Wallet } from '$lib/plugins/Wallet';
  import { onMount } from 'svelte';
  import { dateString } from '$lib/common/datetime';
  import Modal from './Modal.svelte';

  let wallet: Wallet;
  let currentlySelected: YakklCurrentlySelected;
  let yakklMiscStore: string;
  let chainId: number = 1;
  let error = $state('');
  let showConfetti = $state(false);

  interface Props {
    show?: boolean;
    className?: string;
    onComplete?: (account: YakklAccount) => void;
    onCancel?: () => void;
  }

  let {
    show = $bindable(false),
    className = 'text-gray-600 z-[999]',
    onComplete = () => {show = false},
    onCancel = $bindable(() => {show = false})
  }: Props = $props();

  onMount(async () => {
    try {
      currentlySelected = await getYakklCurrentlySelected();
      yakklMiscStore = getMiscStore();
      wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], currentlySelected.shortcuts.chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);
    } catch (e) {
      console.log(`Error decrypting data: ${e}`);
    }
  });

  const { form, errors, handleChange, handleSubmit, updateInitialValues } = createForm({
    initialValues: { accountName: '', alias: '', prvKey: '' },
    validationSchema: yup.object().shape({
      accountName: yup.string().required('Please enter your account name for the address'),
      alias: yup.string(),
      prvKey: yup.string().required('Please paste or enter your Private Key for the address you are importing'),
    }),
    onSubmit: async (data) => {
      try {
        await handleImport(data.accountName, data.alias, data.prvKey);
      } catch (e) {
        error = `Following error occurred: ${e}`;
        console.log(error);
      }
    },
  });

  async function checkIfAccountExists(name: string, address: string, alias: string) {
    const yakklAccounts = await getYakklAccounts();
    const result = yakklAccounts.find((x) => {
      if (x.address === address || x.name === name || (alias && x.alias === alias)) return true;
    });
    return !!result;
  }

  async function handleImport(accountName: string, alias: string, prvKey: string) {
    if (browserSvelte) {
      if (!prvKey.trim()) {
        error = 'Please enter a valid private key.';
        return;
      }

      if (!accountName.trim()) {
        error = 'Please enter a valid account name.';
        return;
      }

      // EVM private key
      if (prvKey.startsWith('0x')) {
        prvKey = prvKey.substring(2);
      }

      if (await checkIfAccountExists(accountName, await getWallet(prvKey).getAddress(), alias)) {
        error = 'Account already exists. Please enter a different account name, alias, or private key.';
        return;
      }

      showConfetti = true;

      if (!currentlySelected) currentlySelected = await getYakklCurrentlySelected();
      if (isEncryptedData(currentlySelected.data)) {
        await decryptData(currentlySelected.data, yakklMiscStore).then((result) => {
          currentlySelected.data = result as CurrentlySelectedData;
        });
      }

      let profile: Profile = (currentlySelected.data as CurrentlySelectedData).profile as Profile;
      const yakklAccount = yakklAccountDefault;

      if (profile) {
        profile = deepCopy((currentlySelected.data as CurrentlySelectedData).profile);
      } else {
        profile = (await getProfile()) as Profile;
        (currentlySelected.data as CurrentlySelectedData).profile = profile;
      }

      if (isEncryptedData(profile.data)) {
        await decryptData(profile.data, yakklMiscStore).then((result) => {
          profile.data = result as ProfileData;
        });
      }

      if (profile.data !== undefined && (profile.data as ProfileData).meta) {
        (profile.data as ProfileData).meta = {}; // Clear meta data
      }

      currentlySelected.shortcuts.type = 'Mainnet'; // Force mainnet for provider
      currentlySelected.shortcuts.chainId = chainId; // Force mainnet for provider

      // Alchemy wallet
      const walletNew = getWallet(prvKey);

      yakklAccount.id = currentlySelected.id;
      yakklAccount.blockchain = currentlySelected.shortcuts.network.blockchain;

      (yakklAccount.data as AccountData).privateKey = prvKey;
      (yakklAccount.data as AccountData).path = ''; // Imported accounts are not derived
      yakklAccount.value = 0n; // Default
      yakklAccount.address = await walletNew.getAddress();
      yakklAccount.name = accountName;
      yakklAccount.alias = alias;
      yakklAccount.description = 'Imported account using private key';
      yakklAccount.value = 0n; // Default

      await wallet
        .getBalance(yakklAccount.address)
        .then((result) => {
          if (result) yakklAccount.value = result;
        })
        .catch((e) => {
          console.log(`Import: error getting balance: ${e}`);
        });

      yakklAccount.index = -1;
      yakklAccount.accountType = AccountTypeCategory.IMPORTED;
      yakklAccount.primaryAccount = null; // Imported accounts do not have primary accounts
      yakklAccount.class = 'Default';
      yakklAccount.includeInPortfolio = true;
      yakklAccount.createDate = dateString();
      yakklAccount.updateDate = dateString();
      yakklAccount.version = VERSION;

      if (!isEncryptedData(yakklAccount.data)) {
        await encryptData(yakklAccount.data, yakklMiscStore)
          .then((result) => {
            yakklAccount.data = result;
          })
          .catch((e) => {
            console.log(`Import: error encrypting account data: ${e}`);
          });
      }

      (currentlySelected.data as CurrentlySelectedData).account = yakklAccount;
      (currentlySelected.data as CurrentlySelectedData).primaryAccount = null; // Imported accounts do not have a primary account

      let yakklAccounts: YakklAccount[] = await getYakklAccounts();

      if (!Array.isArray(yakklAccounts)) {
        yakklAccounts = [];
      }

      if (profile.data) {
        if (
          (profile.data as ProfileData).importedAccounts === undefined ||
          (profile.data as ProfileData).importedAccounts === null ||
          !Array.isArray((profile.data as ProfileData).importedAccounts)
        ) {
          (profile.data as ProfileData).importedAccounts = [];
        }
      }

      (profile.data as ProfileData).importedAccounts.push(yakklAccount);

      if (!isEncryptedData(profile.data)) {
        await encryptData(profile.data, yakklMiscStore).then((result) => {
          profile.data = result;
        });
      }

      (currentlySelected.data as CurrentlySelectedData).profile = profile;

      currentlySelected.shortcuts.value = !yakklAccount.value ? '0.0' : yakklAccount.value;
      currentlySelected.shortcuts.address = yakklAccount.address;
      currentlySelected.shortcuts.accountName = accountName;
      currentlySelected.shortcuts.alias = alias;
      currentlySelected.shortcuts.accountType = AccountTypeCategory.IMPORTED;
      currentlySelected.shortcuts.primary = null;

      currentlySelected.shortcuts.network.blockchain = yakklAccount.blockchain;
      currentlySelected.shortcuts.network.chainId = chainId; // Defaults to mainnet
      currentlySelected.shortcuts.network.name = 'Mainnet'; // Defaults to mainnet - should change to read from getNetworkName(chainId)
      currentlySelected.shortcuts.network.explorer = 'https://etherscan.io'; // Defaults to etherscan
      currentlySelected.shortcuts.network.type = NetworkType.MAINNET; // Defaults to mainnet
      currentlySelected.shortcuts.network.decimals = 18; // Defaults to 18
      currentlySelected.shortcuts.network.symbol = getSymbol(yakklAccount.blockchain);

      yakklAccounts.push(yakklAccount);

      await setProfileStorage(profile);
      await setYakklAccountsStorage(yakklAccounts);
      await setYakklCurrentlySelectedStorage(currentlySelected);

      onComplete(yakklAccount);

      show = false;
    }
  }

  function closeModal() {
    show = false;
  }

  function resetForm() {
    updateInitialValues({
      accountName: '',
      alias: '',
      prvKey: '',
    });
  }
</script>

{#if showConfetti}
  <!-- <Confetti /> -->
  <div use:confetti></div>
{/if}

<div class="relative {className}">
  <Modal bind:show={show} title="Import Account" onClose={closeModal} onCancel={onCancel} className={className}>
    <div class="p-6 border-t border-gray-500 dark:border-gray-300">
      <p class="text-sm text-red-500 dark:text-red-300 mb-4">
        Please be careful! <strong>This private key is important!</strong>
        A bad actor could take the content of your wallet if they have access to your private key!
      </p>
      <form onsubmit={handleSubmit} class="space-y-4">
        <div>
          <label for="accountName" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Account Name</label>
          <input
            type="text"
            id="accountName"
            class="mt-1 block w-full rounded-md border-gray-500 dark:border-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-700 sm:text-sm"
            bind:value={$form.accountName}
            onchange={handleChange}
          />
          {#if $errors.accountName}
            <p class="mt-2 text-sm text-red-600">{$errors.accountName}</p>
          {/if}
        </div>
        <div>
          <label for="alias" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Alias (Optional)</label>
          <input
            type="text"
            id="alias"
            class="mt-1 block w-full rounded-md border-gray-500 dark:border-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-700 sm:text-sm"
            bind:value={$form.alias}
            onchange={handleChange}
          />
        </div>
        <div>
          <label for="prvKey" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Private Key</label>
          <textarea
            id="prvKey"
            rows="3"
            class="mt-1 block w-full rounded-md border-gray-500 dark:border-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-700 sm:text-sm"
            bind:value={$form.prvKey}
            onchange={handleChange}
          ></textarea>
          {#if $errors.prvKey}
            <p class="mt-2 text-sm text-red-600">{$errors.prvKey}</p>
          {/if}
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
