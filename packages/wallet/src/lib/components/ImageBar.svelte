<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

</script>
<!-- inset-x-0 -->
<!-- 40px is small bar and 100px is for larger view -->
<div id="imgHeader" class="visible print:hidden relative top-0 h-[65px] bg-cover bg-[url('/images/imagebar.png')] mx-2 mt-2 rounded-lg"> <!-- border-b border-gray-300">-->
  {@render children?.()}
</div>
