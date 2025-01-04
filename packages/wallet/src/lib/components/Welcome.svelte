<script lang="ts">
  interface Props {
    title1?: string;
    title2?: string;
    title3?: string;
    value1?: string;
    value2?: string; // Calling this function will cause the modal to be shown and the caller should bind:show to a variable and pass it in.
  }

  let {
    title1 = "WELCOME",
    title2 = 'Back',
    title3 = 'YAKKL® Smart Wallet',
    value1 = 'A smart wallet how you expect one to be!',
    value2 = 'Simple, Secure, Fast, and Powerful'
  }: Props = $props();

  
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

