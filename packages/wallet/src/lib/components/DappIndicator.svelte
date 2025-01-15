<script lang="ts">
  import { browserSvelte } from '$lib/utilities/browserSvelte';
  // import { browser as browserSvelte } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';
  import browser from 'webextension-polyfill';

  interface Props {
    // // import browser from 'webextension-polyfill';
    show?: boolean;
    badgeColor?: string;
    defaultClass?: string;
  }

  let { show = $bindable(false), badgeColor = 'badge-secondary', defaultClass = '' }: Props = $props();

  let dapp = $state('');
  // Need to add messaging service so that once content.ts knows it is on a page/domain that is connected to the given address, then it needs to fire a message


  onMount(async () => {
		try {
      if (browserSvelte)
				browser_ext.runtime.onMessage.addListener(handleOnMessage);
    } catch(e) {
      console.log(e);
    }
  });

  onDestroy(() => {
		try {
			if (browserSvelte)
				browser_ext.runtime.onMessage.removeListener(handleOnMessage);
      show = false;
      dapp = '';
    } catch(e) {
      console.log(e);
    }
  });

  export function handleOnMessage(
    request: any,
    sender: browser.Runtime.MessageSender
  ): true | Promise<unknown> {
    try {
      if (request?.method === 'yak_dappsite') {
        console.log(request)
        dapp = 'DAPP';
        show = true;
        return true;
      }
      return Promise.resolve(); // Correct TypeScript return type
    } catch (e) {
      console.log('Error handling message:', e);
      return Promise.resolve(); // Ensure a valid return type
    }
  }

</script>

{#if show === true}
<!-- class="indicator"> indicator-item -->
<div class="tooltip {defaultClass}" data-tip="Connected to {dapp}">
  <span class="badge {badgeColor}">DAPP</span>
</div>
{/if}
