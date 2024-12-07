
<script lang="ts">
  import "$base/app.css";
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  // These numbers will drive the size of the splash screens only
  let containerWidth = "428"; 
  let containerHeight = "600"; // Make sure to have the image set to 600px and it will fit fine. The popup can be any size that is supported

</script>
<div style="width: {containerWidth}px; height: {containerHeight}px"  class="min-w-[{containerWidth}px] min-h-[{containerHeight}px] max-w-[{containerWidth}px] max-h-[{containerHeight}px] bg-indigo-900 content-center">
  {@render children?.()}
</div>
