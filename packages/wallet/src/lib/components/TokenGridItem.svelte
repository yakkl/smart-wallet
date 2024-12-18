<script lang="ts">
  import type { TokenData } from '$lib/common/interfaces';

  interface Props {
    token: TokenData;
    isLarge?: boolean;
  }

  let { token, isLarge = false }: Props = $props();
</script>

<div
  class="flex flex-col items-center justify-center p-2 w-full h-full rounded-lg border shadow-md"
  class:bg-purple-100={isLarge}
>
<!-- w-16 h-16-->
  <img src={token.logoURI} alt="{token.symbol}" class={isLarge ? 'w-16 h-16' : 'w-12 h-12'} />
  <h3 class="text-lg font-bold mt-2">{token.symbol}</h3>
  <p class="text-gray-600 mt-1">${token.currentPrice}</p>
  {#if isLarge}
    <p class="text-gray-500 mt-1">Quantity: {token.balance}</p>
    <p class="text-gray-500 mt-1">Value: ${token.value}</p>
  {/if}
</div>
