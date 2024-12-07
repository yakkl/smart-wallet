<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  // This file remains due to pre-render dependency
</script>

{@render children?.()}
