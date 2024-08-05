<script lang="ts">
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";

  let popupActive = false;
  let loadedAt: Date | null = null;

  export let storageKey = "popup.fired";


  onMount(() => {
      loadedAt = new Date();
  })


  function showPopup() {
      popupActive = true;
      window.localStorage.setItem(storageKey, new Date().toISOString());
  }


  function hidePopup() {
      popupActive = false;
  }


  function isPending() {
      if (! loadedAt) return true;

      const now = Date.now();
      console.log(now - loadedAt.getDate());
      return (now - loadedAt.getTime()) < 10_000; // ready after 10 seconds
  }


  function isAlreadyFired() {
      const alreadyFired = window.localStorage.getItem(storageKey);
      if (! alreadyFired) return false;

      const now = Date.now();
      const then = Date.parse(alreadyFired);
      const oneDayAgo = 1000 * 60 * 60 * 24;

      return ((now - then) < oneDayAgo); // prompted 24 hours ago
  }


  function handleMouseLeave(e: MouseEvent) {
      if (isAlreadyFired() || isPending() || e.clientY > 200) return;

      showPopup();
  }

</script>



<svelte:body on:mouseleave={handleMouseLeave} />



{#if popupActive}

  <div transition:fade class="fixed inset-0 bg-base-200 bg-opacity-95 overflow-y-auto h-full w-full z-20 flex 

  justify-center items-center">

      <slot />


      <!-- Pin to top right corner -->

      <div class="absolute top-6 right-6 h-16 w-16">

          <button class="btn !btn-circle btn-outline" on:click={hidePopup}>

              <!-- Heroicons close button -->

              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />

              </svg>

          </button>

      </div>

  </div>

{/if}
