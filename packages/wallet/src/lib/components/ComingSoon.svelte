 <script lang="ts">
//@ts-nocheck
// Confetti needs to be more typescript compliant
  import { Confetti } from "svelte-confetti";

  export let show = false;
  export let value = 'Get ready - coming soon!';
  export let title = 'YAY!';
 
</script>

<div class="modal" class:modal-open={show}>
  <div class="modal-box relative justify-center text-center">
    {#if show}
    <Confetti duration=3000 iterationCount=2 amount=100 x={[-0.5, 0.5]} y={[-0.5, -0.5]} delay={[0, 1500]} />
    {/if}
    <h3 class="text-lg font-bold">{title}</h3>
    <p class="py-4">{value}</p>
    <div class="modal-action">
      <button class="btn" on:click={() => show = false}>Close</button>
    </div>
  </div>
</div>

