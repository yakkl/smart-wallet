 <script lang="ts">
//@ts-nocheck
// Confetti needs to be more typescript compliant
  

  interface Props {
    // import { Confetti } from "svelte-confetti";
    show?: boolean;
    value?: string;
    title?: string;
  }

  let { show = $bindable(false), value = 'Get ready - coming soon!', title = 'YAY!' }: Props = $props();
 
</script>

<div class="modal" class:modal-open={show}>
  <div class="modal-box relative justify-center text-center">
    {#if show}
    <!-- <Confetti duration=3000 iterationCount=2 amount=100 x={[-0.5, 0.5]} y={[-0.5, -0.5]} delay={[0, 1500]} /> -->
    {/if}
    <h3 class="text-lg font-bold">{title}</h3>
    <p class="py-4">{value}</p>
    <div class="modal-action">
      <button class="btn" onclick={() => show = false}>Close</button>
    </div>
  </div>
</div>

