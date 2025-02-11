<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { loadTokens } from '$lib/common/stores/tokens';
	import { syncStoresToStorage } from '$lib/common/stores';
	import { debug_log } from '$lib/common/debug-error';
	// import { onMessageUnloadAdd, onMessageUnloadRemove } from '$lib/common/listeners/ui/windowListeners';

  let { children } = $props();

  onMount(async () => {
    debug_log('Root (route) +layout.svelte onMount');

    // onMessageUnloadAdd(); // Not for background script items. That is handled by another listener in handlersListeners.ts
    // return () => {
    //   onMessageUnloadRemove();
    // };
  });
</script>

{@render children?.()}
