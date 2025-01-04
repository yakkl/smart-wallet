<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
// Nothing to this except for cleaner looking code in certain pages
</script>

<div class="grid grid-cols-3 gap-2 text-base-content mt-3">
  {@render children?.()}
</div>
