<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { loadTokens } from '$lib/common/stores/tokens';
	import { onMessageUnloadAdd, onMessageUnloadRemove } from '$lib/common/listeners/ui/windowListeners';

  let { children } = $props();

  onMount(() => {
    loadTokens();

    onMessageUnloadAdd(); // Not for background script items. That is handled by another listener in handlersListeners.ts
    return () => {
      onMessageUnloadRemove();
    };
  });
</script>

{@render children?.()}
