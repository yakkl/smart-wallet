<script lang="ts">
  import { goto } from "$app/navigation";
  import { PATH_ETHEREUM_TRANSACTIONS_SWAP } from "$lib/common";

  export let show = false;
  
  function handleSwap(_e: any) {
    show = false;
    goto(PATH_ETHEREUM_TRANSACTIONS_SWAP);
  }

</script>


<div class="modal" class:modal-open={show}>
  <div class="modal-box relative justify-center">
    <h3 class="text-lg font-bold">Swap Crypto</h3>
    <p class="py-4">Swapping is in testing and we're excited to release it soon...</p>
    <div class="modal-action">
      <button class="btn" on:click={() => {show=false}}>Cancel</button>
      <button class="btn" on:click={handleSwap}>Continue 
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </button>
    </div>
  </div>
</div>

