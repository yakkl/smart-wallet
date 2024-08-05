<script lang="ts">
  import { browser as browserSvelte} from "$app/environment";
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { PATH_LOCK, PATH_LOGIN, PATH_REGISTER } from "$lib/common/constants";
  import Back from "$lib/components/Back.svelte";
  // import Pin from "$lib/components/Pin.svelte";
  import ComingSoon from "$lib/components/ComingSoon.svelte";
	import ErrorNoAction from "$lib/components/ErrorNoAction.svelte";
	import Welcome from "$lib/components/Welcome.svelte";
	// import ButtonGridItem from "$lib/components/ButtonGridItem.svelte";
	import ButtonGrid from "$lib/components/ButtonGrid.svelte";
	import { routeCheckWithSettings } from '$lib/common/routes';
	import { getSettings } from '$lib/common/stores';

  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
	import type { Browser } from 'webextension-polyfill';
  let browser_ext: Browser;

  let error = false;
  let errorValue: any;
  let yakklSettings; 
  let showComingSoon = false;

  // let showPin = false;
  // let pinValue = "";

  if (browserSvelte) {
    browser_ext = getBrowserExt();
  }
  onMount(() => {
    try {
      if (browserSvelte) {
        browser_ext.runtime.onMessage.addListener(handleOnMessage);
      }
    } catch (e) {
      console.log(e);
    }
  });

  onDestroy(() => {
    try {
      if (browserSvelte) {
        browser_ext.runtime.onMessage.removeListener(handleOnMessage);
      }
    } catch (e) {
      console.log(e);
    }
  });

  function handleOnMessage(request: { method: any; }, sender: any) {
    if (browserSvelte) {
      try {
        switch(request.method) {
          case 'yak_lockdown':
            goto(PATH_LOCK);
            break;
        }
      } catch (e) {
        console.log(e);
      }
    }
  }

  routeCheckWithSettings();

  function handleComingSoon() {
    showComingSoon = true;
  } 

</script>

<!-- <Pin bind:show={showPin} bind:value={pinValue} /> -->

<ErrorNoAction bind:show={error} bind:value={errorValue} />

<ComingSoon bind:show={showComingSoon} />

<Back defaultClass="left-3 top-[.8rem] absolute" href='' />

<!-- Top band on page using the bg of wherever this is - could be component but not sure we will keep it -->
<div class="bg-primary absolute top-[0.1rem] left-[.1rem] rounded-tl-xl rounded-tr-xl w-[99%] h-2"></div>

<Welcome title1='' title2='Settings' title3='' value1='' value2='' />

<ButtonGrid>
  <!-- <ButtonGridItem handle={handleComingSoon} title="Preferences">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 m-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>            
  </ButtonGridItem>

  <ButtonGridItem handle={handleComingSoon} title="Settings">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 m-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
    </svg>
  </ButtonGridItem>

  <ButtonGridItem handle={handleComingSoon} title="Misc">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 m-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 -mt-2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
    </svg>
  </ButtonGridItem> -->
</ButtonGrid>
