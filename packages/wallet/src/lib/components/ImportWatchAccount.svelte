<!-- ImportWatch.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { VERSION } from '$lib/common/constants';
  import { createForm } from 'svelte-forms-lib';
  import * as yup from 'yup';
  import { setProfileStorage, getYakklWatchList, setYakklWatchListStorage, setYakklCurrentlySelectedStorage, getYakklCurrentlySelected, getMiscStore, getSettings } from '$lib/common/stores';
  import { encryptData, decryptData } from '$lib/common/encryption';
  import { deepCopy } from '$lib/utilities/utilities';
  import { isEncryptedData, type CurrentlySelectedData, type Profile, type ProfileData, type Settings, type YakklCurrentlySelected, type YakklWatch } from '$lib/common';
  import { dateString } from '$lib/common/datetime';
  import Modal from '$components/Modal.svelte';

  interface Props {
    show?: boolean;
    className?: string;
    onCancel?: () => void;
    onComplete?: (watch: YakklWatch) => void;
  }

  let {
    show = $bindable(false),
    className = 'z-[999]',
    onCancel = () => {},
    onComplete = () => {}
  }: Props = $props();

  let currentlySelected: YakklCurrentlySelected;
  let yakklMiscStore: string;
  let yakklWatchListStore: YakklWatch[];
  let yakklSettingsStore: Settings | null;
  let error = $state('');

  onMount(async () => {
    currentlySelected = await getYakklCurrentlySelected();
    yakklMiscStore = getMiscStore();
    yakklWatchListStore = await getYakklWatchList();
    yakklSettingsStore = await getSettings();
  });

  const { form, errors, handleChange, handleSubmit, updateInitialValues } = createForm({
    initialValues: {
      blockchain: 'Ethereum',
      address: '',
      addressName: '',
      includeInPortfolio: false,
      addressAlias: '',
      url: '',
    },
    validationSchema: yup.object().shape({
      blockchain: yup.string().required('Please enter the crypto account network (watch-only)'),
      address: yup.string().required('Please enter the crypto account (watch-only)'),
      addressName: yup.string().required('Please enter the account name (e.g., address alias)'),
      includeInPortfolio: yup.boolean().required('Please select if you want to include this account in your portfolio totals'),
      addressAlias: yup.string().optional(),
      url: yup.string().optional(),
    }),
    onSubmit: async (data) => {
      try {
        await handleAddWatch(data);
      } catch (e) {
        error = `Error adding watch-only account: ${e}`;
      }
    },
  });

  async function handleAddWatch(data: any) {
    let watchList: YakklWatch[] = [];

    if (isEncryptedData(currentlySelected.data)) {
      await decryptData(currentlySelected.data, yakklMiscStore).then((result) => {
        currentlySelected.data = result as CurrentlySelectedData;
      });
    }

    let profile: Profile = deepCopy((currentlySelected.data as CurrentlySelectedData).profile);
    if (isEncryptedData(profile.data)) {
      await decryptData(profile.data, yakklMiscStore).then((result) => {
        profile.data = result as ProfileData;
      });
    }

    if ((profile.data as ProfileData).watchList.length > 0) {
      if ((profile.data as ProfileData).watchList.find((watch: YakklWatch) => watch.address === data.address && watch.blockchain === data.blockchain)) {
        error = 'This account already exists for the given profile.';
        return;
      }
    }

    const currentDate: string = dateString();

    const watch: YakklWatch = {
      id: profile.id,
      blockchain: data.blockchain,
      name: data.addressName,
      tags: [],
      value: 0n,
      includeInPortfolio: data.includeInPortfolio,
      explorer: data.url,
      address: data.address,
      addressAlias: data.addressAlias,
      version: VERSION,
      createDate: currentDate,
      updateDate: currentDate,
    };

    (profile.data as ProfileData).watchList.push(watch);

    await encryptData(profile.data, yakklMiscStore).then(async (result) => {
      profile.data = result;
      await setProfileStorage(profile);
    });

    (currentlySelected.data as CurrentlySelectedData).profile = deepCopy(profile);

    await setYakklCurrentlySelectedStorage(currentlySelected);

    watchList = await getYakklWatchList();

    if (watchList?.length > 0) {
      if (watchList.find((account) => account.address === data.address && account.blockchain === data.blockchain)) {
        error = 'This account already exists.';
        return;
      }
    }

    watchList.push({
      id: profile.id,
      name: data.addressName,
      tags: [],
      value: '0.0',
      includeInPortfolio: data.includeInPortfolio,
      explorer: data.url,
      address: data.address,
      addressAlias: data.addressAlias,
      blockchain: data.blockchain,
      version: yakklSettingsStore !== null ? yakklSettingsStore.version : VERSION,
      createDate: currentDate,
      updateDate: currentDate,
    });

    await setYakklWatchListStorage(watchList);

    onComplete(watch);

    resetForm();
    show = false;
  }

  function closeModal() {
    onCancel();
    resetForm();
    show = false;
  }

  function resetForm() {
    updateInitialValues({
      blockchain: 'Ethereum',
      address: '',
      addressName: '',
      includeInPortfolio: false,
      addressAlias: '',
      url: '',
    });
  }
</script>

<div class="relative {className}">
  <Modal bind:show title="Add Watch-Only Address" onClose={closeModal}>
    <div class="p-6">
      <p class="text-sm text-green-500 mb-4">
        This is a <strong>WATCH - ONLY address</strong>. This means that you will not be able to perform any transactions with this specific address in YAKKL. You can <strong>Import</strong> this address if you have your private key using the Import option. This `watch-only` address allows you to keep track of <strong>ALL</strong> of your crypto in one wallet and have a complete portfolio view. For example, if you have an account with a centralized exchange like Coinbase, Kraken, Binance, etc. You can also use this feature to keep track of addresses belonging to others (e.g, `whales`, `market makers`) and be alerted on activities (useful for staying aware of potential market moves).
      </p>
      <form onsubmit={handleSubmit} class="space-y-4">
        <div>
          <label for="blockchain" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Blockchain</label>
          <select id="blockchain" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" bind:value={$form.blockchain} onchange={handleChange}>
            <option value="Ethereum">Ethereum</option>
            <option value="Polygon">Polygon</option>
          </select>
        </div>
        <div>
          <label for="address" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Address</label>
          <input type="text" id="address" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" bind:value={$form.address} onchange={handleChange} />
          {#if $errors.address}
            <p class="mt-2 text-sm text-red-600">{$errors.address}</p>
          {/if}
        </div>
        <div>
          <label for="addressName" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Address Name</label>
          <input type="text" id="addressName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" bind:value={$form.addressName} onchange={handleChange} />
          {#if $errors.addressName}
            <p class="mt-2 text-sm text-red-600">{$errors.addressName}</p>
          {/if}
        </div>
        <div class="flex items-center">
          <input type="checkbox" id="includeInPortfolio" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" bind:checked={$form.includeInPortfolio} onchange={handleChange} />
          <label for="includeInPortfolio" class="ml-2 block text-sm text-gray-700 dark:text-gray-200">Include this account in your portfolio totals?</label>
        </div>
        <div>
          <label for="addressAlias" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Address Alias (optional)</label>
          <input type="text" id="addressAlias" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" bind:value={$form.addressAlias} onchange={handleChange} />
        </div>
        <div>
          <label for="url" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Explorer URL - checking address data (optional)</label>
          <input type="text" id="url" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" bind:value={$form.url} onchange={handleChange} />
        </div>
        <div class="pt-5">
          <div class="flex justify-end space-x-4">
            <button type="button" class="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onclick={closeModal}>Cancel</button>
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

