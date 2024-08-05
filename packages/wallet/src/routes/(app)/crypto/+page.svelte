<script lang="ts">
  import { browser as browserSvelte} from "$app/environment";
  import { goto } from "$app/navigation";
  import { PATH_LOCK, PATH_LOGIN, PATH_REGISTER } from "$lib/common/constants";
  import Back from "$lib/components/Back.svelte";
	import { getSettings } from '$lib/common/stores';
  
  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
	import type { Browser } from 'webextension-polyfill';
	import { routeCheckWithSettings } from '$lib/common/routes';
  let browser_ext: Browser; 
  if (browserSvelte) browser_ext = getBrowserExt();

  let error = false;
  let errorValue: any;
  let msgType = 'ERROR! - ';
  let showComingSoon = false;
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

  routeCheckWithSettings();

  function handleComingSoon() {
    showComingSoon = true;
  } 

</script>

<!-- <ComingSoon showMsg={showComingSoon}/> -->
<!-- <div class="modal" class:modal-open={showComingSoon}>
  <div class="modal-box relative justify-center text-center">
    <h3 class="text-lg font-bold">YAY!</h3>
    <p class="py-4">Get ready - coming soon!</p>
    <div class="modal-action">
      <button class="btn" on:click={() => showComingSoon = false}>Close</button>
    </div>
  </div>
</div> -->

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

<Back defaultClass="left-3 top-[.8rem]" href='' />

<div class="text-center">
  
  <!-- top bar -->
  <div class="bg-secondary absolute top-[0.1rem] left-[.1rem] rounded-tl-xl rounded-tr-xl w-[99%] h-2"></div>

  <h1 class="text-xl tracking-tight font-extrabold text-base-content">
    <span class="2xl:inline">Crypto</span>
    <!-- <br>
    <span class=" text-gray-300 lg:inline">Manage your crypto</span> -->
  </h1>
  <br>
  
  <div class="grid grid-cols-3 gap-2 text-base-content">

    <!-- <div class="rounded-md shadow h-24"> -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-interactive-supports-focus -->
      <!-- <div role="button" on:click={handleComingSoon} class="btn btn-secondary w-full h-full flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mb-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
        </svg>            
        <span class="text-sm mt-2">Buy</span>
      </div>
    </div> -->

    <!-- <div class="rounded-md shadow h-24"> -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-interactive-supports-focus -->
      <!-- <div role="button" on:click={handleComingSoon}
        class="btn btn-secondary w-full h-full flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mb-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
        </svg>
        <span class="text-sm mt-2">Sell</span>
      </div>
    </div> -->

    <!-- <div class="rounded-md shadow h-24">
      <div role="button" on:click={handleComingSoon}
        class="btn btn-secondary w-full h-full flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 -mb-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mb-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
        </svg>
        <span class="text-sm mt-2">Crypto Send/Receive</span>
      </div>
    </div> -->

    <!-- <div class="rounded-md shadow h-24">
      <div role="button" on:click={handleComingSoon}
        class="btn btn-secondary w-full h-full flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 -mb-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mb-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>            
        <span class="text-sm mt-2">Crypto Trading</span>
      </div>
    </div> -->

    <!-- <div class="rounded-md shadow h-24"> -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-interactive-supports-focus -->
      <!-- <div role="button" on:click={handleComingSoon}
        class="btn btn-secondary w-full h-full flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mb-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
        </svg>
        <span class="text-sm mt-2">Crypto Swapping</span>
      </div>
    </div> -->

  </div>

</div>

