<script lang="ts">
  import { browser as browserSvelte} from "$app/environment";
  import { goto } from "$app/navigation";
  import { PATH_ACCOUNTS, PATH_LOCK, PATH_SECURITY } from "$lib/common/constants";
  import { Button, Modal } from 'flowbite-svelte';
	import { routeCheckWithSettings } from '$lib/common/routes';

  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
	import type { Browser } from 'webextension-polyfill';
  let browser_ext: Browser;
  if (browserSvelte) browser_ext = getBrowserExt();

  let error = false;
  let errorValue: any;
  let msgType = 'ERROR! - ';

  if (browserSvelte) {
    //@ts-ignore
    browser_ext.runtime.onMessage.addListener(handleOnMessage);
  }
  
  function handleOnMessage(request: any, sender: any) {
    console.log(request);
    console.log(sender);
    // console.log(sendResponse);
    if (browserSvelte) {
      try {
        switch(request.method) {
          case 'yak_lockdown':
            console.log(request);
            goto(PATH_LOCK);
            break;
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  routeCheckWithSettings();

</script>

<Modal bind:open={error}>
  <div class="text-center">
      <svg aria-hidden="true" class="mx-auto mb-4 w-14 h-14 text-gray-400 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400"><span class="font-bold">{msgType}</span>{errorValue}</h3>
      <Button color='red'>Close</Button>
  </div>
</Modal>

<div class="relative overflow-scroll">
  <main class="mt-1 mx-auto max-w-7xl px-4">
    <div class="text-center">
      <h1 class="text-xl tracking-tight font-extrabold text-gray-300 dark:text-white">
        <span class=" text-gray-300 xl:inline">YAKKL® Smart Wallet</span>
      </h1>
      <br>
      <p class="-mt-1 max-w-md mx-auto text-base font-bold mb-3 text-gray-300 dark:text-white">
        YAKKL® University
      </p>
    </div>
    <div class="grid grid-cols-2 gap-4 ">
        <div class="rounded-md shadow h-24">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-interactive-supports-focus -->
          <div role="button" on:click={() => goto(PATH_ACCOUNTS)} class="w-full h-full flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mb-2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>            
            <span class="text-sm mt-2">FAQs</span>
          </div>
        </div>

        <div class="rounded-md shadow h-24">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-interactive-supports-focus -->
          <div role="button" on:click={() => goto(PATH_SECURITY)}
            class="w-full h-full flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mb-2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
            </svg>
            <span class="text-sm mt-2">Documentation</span>
          </div>
        </div>

        <!-- <hr class="w-full bg-gray-300 dark:bg-white h-1 mt-1 col-span-2"/>

        <div class="rounded-md shadow h-24 col-span-2">
          <div role="button" on:click={() => goto(PATH_RESOURCES)}
            class="w-full h-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mr-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span class="text-md mt-1">Crypto Education and Resources...</span>
          </div>
        </div> -->
    </div>
  </main>
</div>
