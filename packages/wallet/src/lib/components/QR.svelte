<script lang="ts">
  import { onMount } from 'svelte';
  import QRCode from 'easyqrcodejs';
  
  let { qrText } = $props();
  export const width = 220;
  export const height = 220;
  // export const radius = 1;
  let node: HTMLDivElement = $state();
  
  onMount(() => {    
    const options = {
      text: qrText,
      // ... other options
      width: 220,
      height: 220,
      quietZone: 20,
      logo: '/images/logoBullFav48x48.png',
      logoBackgroundTransparent: true,
    };
    new QRCode(node, options)
  });
</script>

<div class="flex mx-auto justify-center w-full h-full" bind:this={node}></div>

<style>
    /* make QR-wrapper squared */
    /* div {
     width: 100%;
     position: relative;
     padding: 50%;
     z-index: 1;
   } */

   /* fit QR to wrapper */
   div :global(canvas) {
     border-radius: 1rem;
   }
 </style>
