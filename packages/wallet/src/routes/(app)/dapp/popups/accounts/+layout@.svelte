<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="print:hidden bg-base-100  m-2 rounded-xl border border-gray-900 overflow-scroll"> 
  {@render children?.()}
</div>

