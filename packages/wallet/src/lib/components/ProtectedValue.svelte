<script lang="ts">
  import { visibilityStore } from '$lib/common/stores/visibilityStore';

  const { value, placeholder = '**********' } = $props<{
    value: string;
    placeholder?: string;
  }>();

  let visible = $state(false);

  $effect(() => {
    const unsubscribe = visibilityStore.subscribe(value => {
      visible = value;
    });

    return unsubscribe;
  });
</script>

<span>
  {#if visible}
    {value}
  {:else}
    {placeholder}
  {/if}
</span>
