<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { loadTokens } from '$lib/common/stores/tokens';
	import { handleLockDown } from '$lib/common/handlers';

  let { children } = $props();

  onMount(() => {
    loadTokens();

    window.addEventListener('beforeunload', handleLockDown);

    return () => {
      window.removeEventListener('beforeunload', handleLockDown);
    };
  });
</script>

{@render children?.()}
