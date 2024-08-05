<script lang="ts">
  import { browser as browserSvelte } from '$app/environment';
  import { goto } from '$app/navigation';
  import QR from '$lib/components/QR.svelte';
  import { truncate } from '$lib/utilities/utilities';
  import ClipboardJS from 'clipboard';
  import { PATH_EXPORT_EXPORT, PATH_WELCOME } from '$lib/common/constants';
  import { getYakklCurrentlySelected } from '$lib/common/stores';
  import Back from '$lib/components/Back.svelte';
	import { onMount } from 'svelte';
	import type { YakklCurrentlySelected } from '$lib/common';

  let error = false;
  let errorValue: any;
  // TBD - add additional button if yes/no and button listeners that do something

  let clipboard;
  let name: string;
  let address: string;
  let currentlySelected: YakklCurrentlySelected;

  onMount(async () => {
    try {
      if (browserSvelte) {
        clipboard = new ClipboardJS('.clip');
      }

      currentlySelected = await getYakklCurrentlySelected();
      name = truncate(currentlySelected.shortcuts.accountName, 20);
      address = currentlySelected.shortcuts.address;
    } catch (e) {
      error = true;
      errorValue = e;
    }
  });

</script>

<!-- <Modal bind:open={error}>
    <div class="text-center">
        <svg aria-hidden="true" class="mx-auto mb-4 w-14 h-14 text-gray-400 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400"><span class="font-bold">{msgType}</span>{errorValue}</h3>
        <Button on:click={() => {error=false}} color='red'>Close</Button>
    </div>
</Modal> -->
<div class="modal" class:modal-open={error}>
    <div class="modal-box relative">
      <!-- <label for="my-modal-3" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label> -->
      <h3 class="text-lg font-bold">ERROR</h3>
      <p class="py-4">{errorValue}</p>
      <div class="modal-action">
        <button class="btn" on:click={() => error = false}>Close</button>
      </div>
    </div>
</div>
  
<div class="flex flex-col relative justify-center left-0 ">
    <Back defaultClass="-left-3 -top-3"/>
  
    <span class="w-full px-1 mb-2 text-xl font-extrabold border-none text-base-content text-center">Export:  <span class="ml-2 font-bold">{name}</span> Account</span>
    <div class="mx-auto mt-2 items-center">
        <QR qrText={address}/>
    </div>
    
    <div class="mt-2 items-center w-full font-bold">
        <span class="text-left">Wallet Address:</span>
        <button class="clip w-4 h-4" data-clipboard-action="copy" data-clipboard-target="#yakklAddress">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>        
        </button>
        <input id="yakklAddress" value=":yakkl:{address}" type="hidden"/>

        <textarea
            class="textarea textarea-primary mb-2 mt-2 w-full"
            id="address"
            name="address"
            style="resize: none;"
            bind:value={address}
            rows="3"
            aria-label="Public key"
            readonly
        />
    </div>
    <div class="mt-1">
        <!-- <div class="flex space-x-2 justify-center">
            <a href="https://etherscan.io/address/{address}" 
                role="button" 
                target="_blank" 
                rel="noreferrer"
                aria-label="Etherscan show" 
                class="inline-block text-center px-6 py-2 border-2 border-purple-600 text-purple-600 font-medium text-xs leading-tight uppercase rounded-full hover:bg-black hover:bg-opacity-5 dark:hover:bg-white focus:outline-none focus:ring-0 transition duration-150 ease-in-out ml-2 w-[125px]">
                Etherscan
            </a>
        </div> -->
        <!-- space-x-2 -->
        <div class="flex flex-row  justify-center mt-2 mb-2">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-interactive-supports-focus -->
            <button on:click={() => goto(PATH_WELCOME)}
                aria-label="Cancel" 
                class="btn-sm btn-accent uppercase rounded-full ">
                Cancel
            </button>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-interactive-supports-focus -->
            <button on:click={() => goto(PATH_EXPORT_EXPORT)}
                class="btn-sm btn-primary uppercase rounded-full ml-2"
                aria-label="Export">
                Export
            </button>
        </div>
    </div>   
</div>

  
