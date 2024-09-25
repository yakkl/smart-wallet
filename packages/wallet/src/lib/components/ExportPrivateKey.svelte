<!-- ExportPrivateKey.svelte -->
<script lang="ts">
  import { browser as browserSvelte } from '$app/environment';
  import { getYakklCurrentlySelected, yakklMiscStore } from '$lib/common/stores';
  import { onMount } from 'svelte';
  import { decryptData } from '$lib/common/encryption';
  import { isEncryptedData, type AccountData, type CurrentlySelectedData, type EncryptedData, type YakklCurrentlySelected } from '$lib/common';
  import PincodeModal from './PincodeVerify.svelte';
  import Modal from './Modal.svelte';

  export let show = false;
  export let className = 'z-[999]';
  export let onVerify: () => void = () => {};

  let clipboard;
  let privateKey = '';
  let address: string;
  let showPincodeModal = false;
  let showPrivateKeyModal = false;
  let currentlySelected: YakklCurrentlySelected;

  onMount(async () => {
    if (browserSvelte) {
      currentlySelected = await getYakklCurrentlySelected();
      address = currentlySelected.shortcuts.address;
    }
  });

  async function verifyPincode(pincode: string) {
    try {
      let account;

      if (isEncryptedData(currentlySelected.data)) {
        await decryptData(currentlySelected.data, $yakklMiscStore).then(result => {
          currentlySelected.data = result as CurrentlySelectedData;
        });
      }
      account = (currentlySelected.data as CurrentlySelectedData).account;

      if (isEncryptedData(account && account.data)) {
        await decryptData(account!.data as EncryptedData, $yakklMiscStore).then(result => {
          account!.data = result as AccountData;
        });
      }

      privateKey = (account!.data as AccountData).privateKey;
      showPincodeModal = false;
      showPrivateKeyModal = true;

      // Set a timer for 12 seconds and then hide the private key modal
      setTimeout(() => {
        showPrivateKeyModal = false;
        privateKey = '';
        initClipboard(); // Clear clipboard
      }, 12000);

      onVerify();
    } catch (e) {
      console.error('Error verifying pincode:', e);
    }
  }

  function closeModal() {
    show = false;
  }

  function closePincodeModal() {
    showPincodeModal = false;
  }

  function initClipboard() {
    navigator.clipboard.writeText(privateKey);
  }
</script>

<div class="relative {className}">
  <PincodeModal bind:show={showPincodeModal} onVerify={verifyPincode} on:close={closePincodeModal} />

  <Modal bind:show={showPrivateKeyModal} title="Private Key" on:close={() => showPrivateKeyModal = false}>
    <div class="p-6">
      <p class="text-sm text-red-500 mb-4">
        Please be careful! <strong>Your PRIVATE KEY should remain PRIVATE</strong>.
        A bad actor could take the content of your wallet if they have access to the PRIVATE KEY! Copy the PRIVATE KEY and store it somewhere safe!!
      </p>
      <div class="mb-4">
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="block text-sm font-medium text-gray-700">Address</label>
        <input type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100 cursor-not-allowed" value={address} readonly />
      </div>
      <div class="mb-4">
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="block text-sm font-medium text-gray-700">Private Key</label>
        <div class="mt-1 flex">
          <input type="text" class="flex-1 block w-full rounded-none rounded-l-md border-gray-300 bg-gray-100 cursor-not-allowed focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" value={privateKey} readonly />
          <button class="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 clipboard-btn" data-clipboard-text={privateKey} on:click={initClipboard}>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Modal>

  <Modal bind:show={show} title="Export Private Key" on:close={closeModal}>
    <div class="p-6">
      <p class="text-sm text-gray-500 mb-4">
        To export the private key of your account, please verify your pincode first.
      </p>
      <div class="mt-6 flex justify-end space-x-4">
        <button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" on:click={closeModal}>Cancel</button>
        <button type="button" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" on:click={() => {show=false; showPincodeModal=true}}>Verify Pincode</button>
      </div>
    </div>
  </Modal>
</div>
