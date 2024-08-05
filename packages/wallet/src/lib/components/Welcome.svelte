<script lang="ts">
  export let title1 = "WELCOME"
  export let title2 = 'Back';
  export let title3 = 'YAKKL® Smart Wallet';
  export let value1 = 'A smart wallet how you expect one to be!';
  export let value2 = 'Simple, Secure, Fast, and Powerful';

  // Calling this function will cause the modal to be shown and the caller should bind:show to a variable and pass it in.
</script>

<div class="relative text-center mb-4">
  {#if title1 || title2 || title3}
  <h1 class="text-xl tracking-tight font-extrabold">
    {#if title1}
    <span class="3xl:inline">{title1}</span>
    <br>
    {/if}
    {#if title2}
    <span class="2xl:inline">{title2}</span>
    <br>
    {/if}
    {#if title3}
    <span class="lg:inline">{title3}</span>
    {/if}
  </h1>
  {/if}
  {#if value1}
  <p class="mt-1 max-w-md mx-auto  ">
    {value1}
  </p>
  {/if}
  {#if value2}
  <p class="mt-1 max-w-md mx-auto ">
    {value2}
  </p>
  {/if}
</div>

