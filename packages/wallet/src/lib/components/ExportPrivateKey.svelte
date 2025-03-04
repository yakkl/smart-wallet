<!-- ExportPrivateKey.svelte -->
<script lang="ts">
  import { browserSvelte } from '$lib/utilities/browserSvelte';
  import { getYakklCurrentlySelected, yakklMiscStore } from '$lib/common/stores';
  import { onMount } from 'svelte';
  import { decryptData } from '$lib/common/encryption';
  import { isEncryptedData, type AccountData, type CurrentlySelectedData, type EncryptedData, type YakklCurrentlySelected } from '$lib/common';
  import PincodeVerify from './PincodeVerify.svelte';
  import Modal from './Modal.svelte';
	import { log } from '$lib/plugins/Logger';
	import Copy from './Copy.svelte';

  interface Props {
    show?: boolean;
    className?: string;
    onVerify?: () => void;
  }

  let { show = $bindable(false), className = 'z-[999]', onVerify = () => {} }: Props = $props();

  let privateKey = $state('');
  let address: string = $state();
  let showPincodeModal = $state(false);
  let showPrivateKeyModal = $state(false);
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
      show = false;

      onVerify(); // Call the onVerify callback - currently does not do anything except set the modal to false
    } catch (e) {
      log.error('Error verifying pincode:', e);
    }
  }

  function closeModal() {
    show = false;
  }

</script>

<div class="relative {className}">
  <PincodeVerify bind:show={showPincodeModal} onVerified={verifyPincode} />

  <Modal bind:show={showPrivateKeyModal} title="Private Key" onClose={() => showPrivateKeyModal = false}>
    <div class="p-6">
      <p class="text-sm text-red-500 mb-4">
        Please be careful! <strong>Your PRIVATE KEY should remain PRIVATE</strong>.
        A bad actor could take the content of your wallet if they have access to the PRIVATE KEY! Copy the PRIVATE KEY and store it somewhere safe!!
      </p>
      <div class="mb-4">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Address</label>
        <input type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100 text-gray-700 cursor-not-allowed" value={address} readonly />
      </div>
      <div class="mb-4">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Private Key</label>
        <div class="mt-1 flex">
          <input type="text" class="flex-1 block w-full rounded-none rounded-l-md border-gray-300 bg-gray-100 cursor-not-allowed focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" value={privateKey} readonly />
          <Copy
            className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            target={{
              value: privateKey,
              timeout: 20000,
              redactText: "PRIVATE-KEY-REDACTED"
            }}
          />
        </div>
      </div>

      <div class="mt-6 flex justify-end space-x-4">
        <button type="button" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" onclick={() => {showPrivateKeyModal=false}}>Close</button>
      </div>

    </div>
  </Modal>

  <Modal bind:show={show} title="Export Private Key" onClose={closeModal}>
    <div class="p-6">
      <p class="text-sm text-gray-700 dark:text-gray-200 mb-4">
        To export the private key of your account, please verify your pincode first.
      </p>
      <div class="mt-6 flex justify-end space-x-4">
        <button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" onclick={closeModal}>Cancel</button>
        <button type="button" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" onclick={() => {show=false; showPincodeModal=true}}>Continue</button>
      </div>
    </div>
  </Modal>
</div>
