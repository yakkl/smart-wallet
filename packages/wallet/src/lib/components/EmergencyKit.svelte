<script lang="ts">
  //
  // NOTE: This for the Bulk Emergency Kit. The single EmergencyKit is only for YakklAccount or yakklPrimaryAccount.
  //

  import { EmergencyKitManager } from '$lib/plugins/EmergencyKitManager';
  import {
    getProfile, getPreferences, getSettings, getYakklCurrentlySelected,
    getYakklContacts, getYakklChats, getYakklAccounts, getYakklPrimaryAccounts,
    getYakklWatchList, getYakklBlockedList, getYakklConnectedDomains, getMiscStore,
    setProfileStorage, setPreferencesStorage, setSettingsStorage, setYakklCurrentlySelectedStorage,
    setYakklContactsStorage, setYakklChatsStorage, setYakklAccountsStorage, setYakklPrimaryAccountsStorage,
    setYakklWatchListStorage, setYakklBlockedListStorage, setYakklConnectedDomainsStorage,
    profileStore, yakklPreferencesStore, yakklSettingsStore, yakklCurrentlySelectedStore,
    yakklContactsStore, yakklChatsStore, yakklAccountsStore, yakklPrimaryAccountsStore,
    yakklWatchListStore, yakklBlockedListStore, yakklConnectedDomainsStore
  } from '$lib/common/stores';
  import type { EmergencyKitMetaData } from '$lib/common';
  import Confirmation from './Confirmation.svelte';

  interface Props {
    mode?: 'import' | 'export';
    onComplete: (success: boolean, message: string) => void;
    onCancel?: () => void;
  }

  let { mode = 'export', onComplete, onCancel = () => {} }: Props = $props();

  let file: File | null = $state(null); // File name to export to or import from
  let metadata: EmergencyKitMetaData | null = $state(null);
  let loading = $state(false);
  let error = $state('');
  let showConfirmation = $state(false);

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      file = target.files[0];
      try {
        metadata = await EmergencyKitManager.readBulkEmergencyKitMetadata(file);
      } catch (err) {
        error = 'Failed to read emergency kit metadata';
        console.log(err);
      }
    }
  }

  async function handleExport() {
    loading = true;
    error = '';
    try {
      const preferences = await getPreferences();
      const settings = await getSettings();
      const profile = await getProfile();
      const currentlySelected = await getYakklCurrentlySelected();
      const contacts = await getYakklContacts();
      const chats = await getYakklChats();
      const accounts = await getYakklAccounts();
      const primaryAccounts = await getYakklPrimaryAccounts();
      const watchList = await getYakklWatchList();
      const blockedList = await getYakklBlockedList();
      const connectedDomains = await getYakklConnectedDomains();
      const passwordOrSaltedKey = getMiscStore();

      if (!preferences || !settings || !profile || !currentlySelected || !passwordOrSaltedKey) {
        throw new Error('Missing required data for export');
      }

      const bulkEmergencyKit = await EmergencyKitManager.createBulkEmergencyKit(
        preferences,
        settings,
        profile,
        currentlySelected,
        contacts ?? [],
        chats ?? [],
        accounts ?? [],
        primaryAccounts ?? [],
        watchList ?? [],
        blockedList ?? [],
        connectedDomains ?? [],
        passwordOrSaltedKey
      );

      const fileName = await EmergencyKitManager.downloadBulkEmergencyKit(bulkEmergencyKit);
      onComplete(true, 'Emergency kit exported successfully as ' + fileName);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to export emergency kit';
      console.log(err);
      onComplete(false, error);
    } finally {
      loading = false;
    }
  }

  async function handleImport() {
    if (!file) {
      error = 'Please select a file to import';
      return;
    }
    showConfirmation = true;
  }

  async function confirmImport() {
    showConfirmation = false;
    loading = true;
    error = '';
    try {
      const passwordOrSaltedKey = getMiscStore();
      const { newData, existingData } = await EmergencyKitManager.importBulkEmergencyKit(file!, passwordOrSaltedKey);

      // Update local storage and Svelte stores
      await updateStorageAndStores(newData, existingData);

      onComplete(true, `Emergency kit imported successfully for: ${file!.name}`);
    } catch (err) {
      error = `Failed to import emergency kit for: ${file!.name}`;
      console.log(err);
      onComplete(false, `Failed to import emergency kit for: ${file!.name}`);
    } finally {
      loading = false;
    }
  }

  async function updateStorageAndStores(newData: any, existingData: any) {
    const updateFunctions = [
      { key: 'yakklPreferencesStore', setStorage: setPreferencesStorage, store: yakklPreferencesStore },
      { key: 'yakklSettingsStore', setStorage: setSettingsStorage, store: yakklSettingsStore },
      { key: 'profileStore', setStorage: setProfileStorage, store: profileStore },
      { key: 'yakklCurrentlySelectedStore', setStorage: setYakklCurrentlySelectedStorage, store: yakklCurrentlySelectedStore },
      { key: 'yakklContactsStore', setStorage: setYakklContactsStorage, store: yakklContactsStore },
      { key: 'yakklChatsStore', setStorage: setYakklChatsStorage, store: yakklChatsStore },
      { key: 'yakklAccountsStore', setStorage: setYakklAccountsStorage, store: yakklAccountsStore },
      { key: 'yakklPrimaryAccountsStore', setStorage: setYakklPrimaryAccountsStorage, store: yakklPrimaryAccountsStore },
      { key: 'yakklWatchListStore', setStorage: setYakklWatchListStorage, store: yakklWatchListStore },
      { key: 'yakklBlockedListStore', setStorage: setYakklBlockedListStorage, store: yakklBlockedListStore },
      { key: 'yakklConnectedDomainsStore', setStorage: setYakklConnectedDomainsStorage, store: yakklConnectedDomainsStore },
    ];

    for (const { key, setStorage, store } of updateFunctions) {
      const data = newData[key] || existingData[key];
      if (data) {
        if ( key === 'yakklPreferencesStore') {
          data['version'] = existingData[key]['version']; // Keep the latest version number metadata
        }
        await setStorage(data);
        store.set(data);
      }
    }
  }

</script>

<div class="p-4">
  <h2 class="text-2xl font-bold mb-4">{mode === 'export' ? 'Export' : 'Import'} Emergency Kit</h2>

  {#if mode === 'export'}
    <button onclick={handleExport} class="bg-blue-500 text-white px-4 py-2 rounded" disabled={loading}>
      {loading ? 'Exporting...' : 'Export Emergency Kit'}
    </button>
  {:else}
    <div class="mb-4">
      <label for="importFile" class="block mb-2">Select File to Import:</label>
      <input type="file" id="importFile" onchange={handleFileSelect} accept=".json" class="w-full p-2 border rounded" />
    </div>
    {#if metadata}
      <div class="mb-4">
        <h3 class="text-lg font-semibold">Emergency Kit Metadata:</h3>
        <p>ID: {metadata.id}</p>
        <p>Created: {new Date(metadata.createDate).toLocaleString()}</p>
        <p>Version: {metadata.version}</p>
        <p>Type: {metadata.type}</p>
        <p>Files: {metadata.files}</p>
      </div>
    {/if}
    <button onclick={handleImport} class="bg-green-500 text-white px-4 py-2 rounded" disabled={loading || !file}>
      {loading ? 'Importing...' : 'Import'}
    </button>
    <button onclick={onCancel} class="bg-red-400 text-white px-4 py-2 rounded" >
      Cancel
    </button>
  {/if}

  {#if error}
    <p class="text-red-500 mt-4">{error}</p>
  {/if}
</div>

<Confirmation
  bind:show={showConfirmation}
  title="Confirm Import"
  message="Are you sure you want to continue? Doing so will override your current Smart Wallet data!"
  confirmText="Yes, Import"
  rejectText="Cancel"
  onConfirm={confirmImport}
/>

