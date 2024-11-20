<script lang="ts">
  import type { PriceProvider } from '$lib/common/interfaces';
  import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';
  import { CoingeckoPriceProvider } from '$lib/plugins/providers/price/coingecko/CoingeckoPriceProvider';
  import { onMount } from 'svelte';
  import PriceTracker from './PriceTracker.svelte';
  import { formatPrice } from '$lib/utilities';
  import { formatDate } from '$lib/common/datetime';
	// import { getCurrencyCodeForUserLocale } from '$lib/utilities';

  export let symbol: string; 
  export let currency: string = 'USD';//getCurrencyCodeForUserLocale() ?? 'USD'; 
  export let showLastUpdated: boolean = false;
  export let quantity: number = 1;
  export let customClass: string = '';
  export let useProviders: string[] = ['Coinbase', 'Coingecko'];

  let providersMap = new Map<string, PriceProvider>();
  let activeProviders: PriceProvider[] = [];

  onMount(async () => {
    try {
      providersMap.set('Coinbase', new CoinbasePriceProvider());
      providersMap.set('Coingecko', new CoingeckoPriceProvider());

      activeProviders = useProviders
        .map(name => providersMap.get(name))
        .filter((provider): provider is PriceProvider => provider !== undefined);
    } catch(error) {
      console.log('TokenPrice:', error);
    }
  });

</script>

<PriceTracker {symbol} {currency} providers={activeProviders} let:price>
  <div class={`flex flex-col items-start ${customClass}`}>
    {#if price !== null}
      <span class="text-xl font-bold">{formatPrice(price.price * quantity)}</span>
      <span class="text-xs text-gray-600">{symbol}-{currency}</span>
      <span class="text-xs text-gray-500">Price: {formatPrice(price.price)}</span>
      {#if showLastUpdated && price.lastUpdated}
        <span class="text-xs text-gray-500">Last updated: {formatDate(price.lastUpdated)}</span>
      {/if}
    {:else}
      <span class="text-xl font-bold">{formatPrice(0)}</span>
      <span class="text-xs text-gray-600">{symbol ? symbol : ' -- ' }-{currency ? currency : ' -- '}</span>
      <span class="text-xs text-gray-500">Price: -- </span>
      {#if showLastUpdated}
        <span class="text-xs text-gray-500">Last updated: -- </span>
      {/if}
    {/if}
  </div>
</PriceTracker>
