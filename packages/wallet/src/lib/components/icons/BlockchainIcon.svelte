<script lang="ts">
  import { SvelteComponent } from 'svelte';
  
  interface Props {
    icon?: typeof SvelteComponent | null;
    className?: string;
  }

  let { icon = null, className = '' }: Props = $props();
</script>

{#if icon}
  {@const SvelteComponent_1 = icon}
  <SvelteComponent_1 class={className} />
{/if}
