<script lang="ts">
  import { SvelteComponent } from 'svelte';
  
  export let icon: typeof SvelteComponent | null = null;
  export let className: string = '';
</script>

{#if icon}
  <svelte:component this={icon} class={className} />
{/if}
