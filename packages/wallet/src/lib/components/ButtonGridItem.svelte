<script lang="ts">
  import { goto } from "$app/navigation";

  interface Props {
    path?: string; // If path === '' then handle is used instead of goto
    title?: string;
    btn?: string;
    contentClass?: string;
    titleClass?: string;
    handle?: any;
    children?: import('svelte').Snippet;
  }

  let {
    path = '',
    title = '',
    btn = 'btn-primary',
    contentClass = 'p-0',
    titleClass = 'p-0 m-0',
    handle = () => {},
    children
  }: Props = $props();
  
</script>


<div class="rounded-md shadow h-24">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  {#if path !== ''}
  <div role="button" onclick={() => goto(path)} class="btn {btn} flex-nowrap w-full h-full flex flex-col items-center justify-center border border-transparent font-medium rounded-md {contentClass}">
    {@render children?.()}
    <span class="text-sm mt-1 text-center">{title}</span>
  </div>
  {:else}
  <div role="button"  onclick={handle} class="btn {btn} flex-nowrap w-full h-full flex flex-col items-center justify-center border border-transparent font-medium rounded-md {contentClass}">
    {@render children?.()}
    <span class="text-sm text-center {titleClass}">{title}</span>
  </div>
  {/if}
</div>
