<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
	// import { log } from '$plugins/Logger';
	// import { onMessageUnloadAdd, onMessageUnloadRemove } from '$lib/common/listeners/ui/windowListeners';

  let { children } = $props();

  onMount(async () => {

    // onMessageUnloadAdd(); // Not for background script items. That is handled by another listener in handlersListeners.ts
    // return () => {
    //   onMessageUnloadRemove();
    // };
  });
</script>

{@render children?.()}
