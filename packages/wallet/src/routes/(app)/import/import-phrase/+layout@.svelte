<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  // Custom layout only for import recovery using phrase
</script>

<div class="print:hidden overflow-scroll overflow-y-auto bg-base-100 text-base-content bg-center m-2 h-[95%] rounded-xl border border-gray-900"> 
  {@render children?.()}
</div>
