<script lang="ts">

  import { browser as browserSvelte } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';
	// // import browser from 'webextension-polyfill';
  
  export let show = false;
  export let badgeColor = 'badge-secondary';
  export let defaultClass = '';
  
  let dapp = '';
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

	function handleOnMessage(request: { method: any; }, sender: any) {
    if (browserSvelte) {
      try {
        switch(request.method) {
          case 'yak_dappsite':
            console.log(request)
            dapp = 'DAPP';
            show = true;
            break;
        }
      } catch (e) {
        console.log(e);
      }
    }
  }

</script>

{#if show === true}
<!-- class="indicator"> indicator-item -->
<div class="tooltip {defaultClass}" data-tip="Connected to {dapp}"> 
  <span class="badge {badgeColor}">DAPP</span> 
</div>
{/if}
