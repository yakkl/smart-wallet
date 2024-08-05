<script lang="ts">
  import { browser as browserSvelte} from "$app/environment";
  import { goto } from "$app/navigation";
  import { PATH_LOCK, PATH_LOGIN, PATH_REGISTER, PATH_SECURITY_PASSWORD, PATH_SECURITY_USERNAME } from "$lib/common/constants";
  import { Button, Modal } from 'flowbite-svelte';
	import { getSettings } from '$lib/common/stores';

  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
	import type { Browser } from 'webextension-polyfill';
  let browser_ext: Browser; 
  if (browserSvelte) browser_ext = getBrowserExt();


  let error = false;
  let errorValue: any;
  let msgType = 'ERROR! - ';

  let yakklSettings; 

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

  if (browserSvelte) {    
    getSettings().then(result => {
      yakklSettings = result;

      if (yakklSettings.init === false) {
        goto(PATH_REGISTER);
      }
      if (yakklSettings.isLocked === true) {
        goto(PATH_LOGIN);
      }
    });

    if (window.navigator.onLine === false) {
      // Maybe let user know their connection is not working and some actions will not work...
      
    }

    // window.addEventListener('message', (event) => {
    //   console.log(event);
    // });

  }
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
        Security
      </p>
    </div>
    <div class="grid grid-cols-2 gap-4 ">
        <div class="rounded-md shadow h-24">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-interactive-supports-focus -->
          <div role="button" on:click={() => goto(PATH_SECURITY_USERNAME)} class="w-full h-full flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mb-2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
            <span class="text-sm mt-2">Change Username</span>
          </div>
        </div>

        <div class="rounded-md shadow h-24">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-interactive-supports-focus -->
          <div role="button" on:click={() => goto(PATH_SECURITY_PASSWORD)} class="w-full h-full flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mb-2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span class="text-sm mt-2">Change Password</span>
          </div>
        </div>

        <!-- <hr class="w-full bg-gray-300 dark:bg-white h-1 mt-1 col-span-2"/>

        <div class="rounded-md shadow h-24 col-span-2">
          <div role="button" on:click={() => goto(PATH_SECURITY_RESET)}
            class="w-full h-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mr-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span class="text-md mt-1">RESET YAKKL® WALLET (WARNING!)</span>
          </div>
        </div> -->
    </div>
  </main>
</div>
