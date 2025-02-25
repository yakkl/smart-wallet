<script lang="ts">
  // import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
  // import type { Browser } from 'webextension-polyfill';
	// import { browserSvelte } from '$lib/utilities/browserSvelte';
  // let browser_ext: Browser;
  // if (browserSvelte) browser_ext = getBrowserExt();

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

</script>

<div class="print:hidden bg-base-100  m-2 rounded-xl border border-gray-900 overflow-hidden">
  {@render children?.()}
</div>
