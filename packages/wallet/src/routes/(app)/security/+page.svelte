<script lang="ts">
  import { browserSvelte } from '$lib/utilities/browserSvelte';
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { PATH_IMPORT_EMERGENCYKIT, PATH_LOCK, PATH_LOGIN, PATH_REGISTER } from "$lib/common/constants";
  import Back from "$lib/components/Back.svelte";
  import Pincode from "$lib/components/Pincode.svelte";
  import ComingSoon from "$lib/components/ComingSoon.svelte";
	import ErrorNoAction from "$lib/components/ErrorNoAction.svelte";
	import Welcome from "$lib/components/Welcome.svelte";
	import ButtonGridItem from "$lib/components/ButtonGridItem.svelte";
	import ButtonGrid from "$lib/components/ButtonGrid.svelte";
	import { getSettings } from "$lib/common/stores";

  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
	import type { Browser } from 'webextension-polyfill';
  import { handleOnMessage } from "$lib/common/handlers";
	import EmergencyKitModal from "$lib/components/EmergencyKitModal.svelte";

  let browser_ext: Browser;
  if (browserSvelte) browser_ext = getBrowserExt();

  let error = $state(false);
  let errorValue: any = $state();
  let yakklSettings;
  let showComingSoon = $state(false);
  let showPin = $state(false);
  let showEmergencyKit = $state(false);


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

  if (browserSvelte) {
    getSettings().then(result => {
      yakklSettings = result;

      if (yakklSettings!.init === false) {
        goto(PATH_REGISTER);
      }
      if (yakklSettings!.isLocked === true) {
        goto(PATH_LOGIN);
      }
    });
  }

  function handleComingSoon() {
    showComingSoon = true;
  }

  function handleEmergencyKit(e: any) {
    showEmergencyKit = true;
  }

</script>

<Back defaultClass="left-3 top-[.8rem] absolute" href='' />
<Pincode bind:show={showPin}/>
<ErrorNoAction bind:show={error} value={errorValue} />
<ComingSoon bind:show={showComingSoon} />
<EmergencyKitModal bind:show={showEmergencyKit} mode='export' />

<!-- Top band on page using the bg of wherever this is - could be component but not sure we will keep it -->
<div class="bg-secondary absolute top-[0.1rem] left-[.1rem] rounded-tl-xl rounded-tr-xl w-[99%] h-2"></div>

<Welcome title1='' title2='Security' title3='' value1='' value2='' />

<ButtonGrid>
  <ButtonGridItem handle={() => {showPin=true}} title="Pincode">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 m-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  </ButtonGridItem>

  <!-- <ButtonGridItem handle={handleComingSoon} title="Password">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 m-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
    </svg>
  </ButtonGridItem> -->
  <!-- handleEmergencyKit -->
  <ButtonGridItem handle={handleEmergencyKit} title="Emergency Kit Export">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 m-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  </ButtonGridItem>
</ButtonGrid>
