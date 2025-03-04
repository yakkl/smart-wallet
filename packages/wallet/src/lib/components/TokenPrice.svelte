<script lang="ts">
  import type { PriceProvider } from '$lib/common/interfaces';
  import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';
  import { CoingeckoPriceProvider } from '$lib/plugins/providers/price/coingecko/CoingeckoPriceProvider';
  import { onMount } from 'svelte';
  import PriceTracker from './PriceTracker.svelte';
  import { formatPrice } from '$lib/utilities';
  import { formatDate } from '$lib/common/datetime';
	import { log } from '$lib/plugins/Logger';


  interface Props {
    // import { getCurrencyCodeForUserLocale } from '$lib/utilities';
    symbol: string;
    currency?: string; //getCurrencyCodeForUserLocale() ?? 'USD';
    showLastUpdated?: boolean;
    quantity?: number;
    customClass?: string;
    useProviders?: string[];
  }

  let {
    symbol,
    currency = 'USD',
    showLastUpdated = false,
    quantity = 1,
    customClass = '',
    useProviders = ['Coinbase', 'Coingecko']
  }: Props = $props();

  let providersMap = new Map<string, PriceProvider>();
  let activeProviders: PriceProvider[] = $state([]);

  onMount(async () => {
    try {
      providersMap.set('Coinbase', new CoinbasePriceProvider());
      providersMap.set('Coingecko', new CoingeckoPriceProvider());

      activeProviders = useProviders
        .map(name => providersMap.get(name))
        .filter((provider): provider is PriceProvider => provider !== undefined);
    } catch(error) {
      log.error('TokenPrice:', false, error);
    }
  });

</script>

<PriceTracker {symbol} {currency} providers={activeProviders} >
  {#snippet children({ price })}
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
  {/snippet}
</PriceTracker>
