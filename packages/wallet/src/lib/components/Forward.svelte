<script lang="ts">

  interface Props {
    // import { Button } from "flowbite-svelte";
    defaultClass?: string;
  }

  let { defaultClass = "right-0 top-0" }: Props = $props();

</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- <div role="button" class="absolute z-10 {defaultClass}" on:click={() => {history.forward()}}>
  <Button pill={true} outline={true} btnClass="btn btn-primary font-medium focus:ring-4 focus:outline-none inline-flex items-center justify-center px-5 py-2.5 text-sm hover:text-white border border-gray-100 hover:bg-primary-400 focus:ring-primary-300 rounded-full !p-1"  size="md">
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="stroke-gray-100 w-5 h-5">
    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
  </Button>
</div> -->

<!-- svelte-ignore a11y_consider_explicit_label -->
<button class="btn btn-sm btn-circle btn-outline absolute z-10 {defaultClass}" onclick={() => {history.forward()}}>
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
</button>
