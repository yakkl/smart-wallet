<script lang="ts">
  import { browserSvelte } from '$lib/utilities/browserSvelte';
  // import { browser as browserSvelte } from '$app/environment';
  import { blockContextMenu, blockWindowResize } from "$lib/utilities";
  import { DEFAULT_POPUP_WIDTH, DEFAULT_POPUP_HEIGHT } from "$lib/common";
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

