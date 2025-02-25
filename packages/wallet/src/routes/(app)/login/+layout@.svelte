<script lang="ts">
	import { debug_log } from '$lib/common';

  // import { onMount } from 'svelte';
	// import { onMessageUnloadAdd, onMessageUnloadRemove } from '$lib/common/listeners/ui/windowListeners';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  // onMount(() => {
  //   onMessageUnloadAdd(); // Not for background script items. That is handled by another listener in handlersListeners.ts
  //   return () => {
  //     onMessageUnloadRemove();
  //   };
  // });
</script>

<div class="print:hidden bg-base-100  m-2 rounded-xl border border-gray-900 overflow-hidden">
  {@render children?.()}
</div>
