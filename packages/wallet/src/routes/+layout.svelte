<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { loadTokens } from '$lib/common/stores/tokens';

  let { children } = $props();

  onMount(() => {
    loadTokens();
  });
</script>

{@render children?.()}
