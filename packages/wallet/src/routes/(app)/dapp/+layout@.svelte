<script lang="ts">
  import { blockContextMenu, blockWindowResize } from "$lib/utilities";
  import { DEFAULT_POPUP_WIDTH, DEFAULT_POPUP_HEIGHT } from "$lib/common";
  // import { onMount } from 'svelte';

  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
  import type { Browser } from 'webextension-polyfill';
	import { browserSvelte } from '$lib/utilities/browserSvelte';
	// import { onMessageUnloadAdd, onMessageUnloadRemove } from "$lib/common/listeners/ui/windowListeners";

  let browser_ext: Browser;
  if (browserSvelte) browser_ext = getBrowserExt();

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  // onMount(() => {
  //   // +layout.(ts|svelte) gets removed and the new one loaded for each sub layout so the following code is needed to ensure the listeners are added and removed correctly.
  //   // We add a remove then an add to make sure we don't have multiple listeners for windows. removeListener will be ignored if it doesn't exist.
  //   onMessageUnloadAdd(); // Not for background script items. That is handled by another listener in handlersListeners.ts
  //   return () => {
  //     onMessageUnloadRemove();
  //   };
  // });

  if (!process.env.DEV_DEBUG) {
    if (browserSvelte) {
        blockContextMenu();  // Could setup svelte:body like below with svelte if statement
        blockWindowResize(DEFAULT_POPUP_WIDTH, DEFAULT_POPUP_HEIGHT);
    }
  }

</script>

<div class="print:hidden bg-base-100 m-2 rounded-xl border border-gray-900 overflow-scroll justify-center flex">
  {@render children?.()}
</div>

