<script lang="ts">
  import { goto } from "$app/navigation";

  export let path = ''; // If path === '' then handle is used instead of goto
  export let title = '';
  export let btn = 'btn-primary';
  export let contentClass = 'p-0';
  export let titleClass = 'p-0 m-0';
  export let handle = () => {};
  
</script>


<div class="rounded-md shadow h-24">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-interactive-supports-focus -->
  {#if path !== ''}
  <div role="button" on:click={() => goto(path)} class="btn {btn} flex-nowrap w-full h-full flex flex-col items-center justify-center border border-transparent font-medium rounded-md {contentClass}">
    <slot/>
    <span class="text-sm mt-1 text-center">{title}</span>
  </div>
  {:else}
  <div role="button"  on:click={handle} class="btn {btn} flex-nowrap w-full h-full flex flex-col items-center justify-center border border-transparent font-medium rounded-md {contentClass}">
    <slot/>
    <span class="text-sm text-center {titleClass}">{title}</span>
  </div>
  {/if}
</div>
