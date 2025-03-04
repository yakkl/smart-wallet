<!-- Receive.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import QR from './QR.svelte';
  import { YAKKL_ZERO_ADDRESS } from '$lib/common/constants';
  import { yakklCurrentlySelectedStore } from '$lib/common/stores';
  import Modal from './Modal.svelte';
	import Copy from './Copy.svelte';

  interface Props {
    show?: boolean;
    address?: string;
    title?: string;
  }

  let { show = $bindable(false), address = $bindable(''), title = 'Receive' }: Props = $props();

  onMount(() => {
    if ($yakklCurrentlySelectedStore && $yakklCurrentlySelectedStore.shortcuts.address !== YAKKL_ZERO_ADDRESS) {
      address = $yakklCurrentlySelectedStore.shortcuts.address;
    }
  });

  // function copyAddress() {
  //   navigator.clipboard.writeText(address);
  // }
</script>

<Modal bind:show={show} title={title}>
  <div class="text-center prose p-6 border-t border-b border-gray-200">
    {#if $yakklCurrentlySelectedStore && $yakklCurrentlySelectedStore.shortcuts.address !== YAKKL_ZERO_ADDRESS}
      <div class="mb-4">
        <QR qrText={address} />
      </div>
      <div class="border border-base-300 rounded-lg w-full mb-2 p-2">
        <p class="text-xs font-semibold text-gray-700 dark:text-gray-200 break-all" data-bs-toggle="tooltip" data-bs-placement="top" title={address}>
          {address}
          <Copy target={{ value: address }} className="ml-2" />
          <!-- <button class="ml-2 focus:outline-none" onclick={copyAddress} data-bs-toggle="tooltip" data-bs-placement="top" title="Copy Address">
            <ClipboardIcon class="h-4 w-4 stroke-base-300 hover:stroke-base-100 dark:stroke-white" />
          </button> -->
        </p>
      </div>
    {:else}
      <p class="text-lg font-bold text-gray-700 dark:text-gray-200">There are no Portfolio Accounts to display! Create at least one Portfolio account!</p>
    {/if}
  </div>
  {#snippet footer()}

      <p class="text-sm font-normal text-gray-700 dark:text-gray-200">Scan the barcode for your mobile device or click the copy button so you can paste it.</p>

  {/snippet}
</Modal>
