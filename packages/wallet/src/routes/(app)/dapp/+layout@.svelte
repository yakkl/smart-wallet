<script lang="ts">
  import { blockContextMenu, blockWindowResize } from "$lib/utilities";
  import { DEFAULT_POPUP_WIDTH, DEFAULT_POPUP_HEIGHT } from "$lib/common";
  // import { onMount } from 'svelte';

  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
  import type { Browser } from 'webextension-polyfill';
	import { browserSvelte } from '$lib/utilities/browserSvelte';

  let browser_ext: Browser;
  if (browserSvelte) browser_ext = getBrowserExt();

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

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

