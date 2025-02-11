<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import type { MarketPriceData, PriceProvider } from '$lib/common/interfaces';
  import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';
	import { debug_log } from '$lib/common/debug-error';

  interface Props {
    symbol: string; // In a swap this would be the fromToken
    currency: string; // In a swap this would be the toToken
    providers?: PriceProvider[];
    updateInterval?: number;
    children?: import('svelte').Snippet<[any]>;
  }

  let {
    symbol,
    currency,
    providers = $bindable([new CoinbasePriceProvider()]),  // Defaults to Coinbase but the passed in providers should have priority with more than one
    updateInterval = 10000,
    children
  }: Props = $props();

  const priceStore = writable<MarketPriceData | null>(null);
  let interval: NodeJS.Timeout;

  async function updatePrice() {
    try {
      debug_log('PriceTracker: providers:', providers);
      
      for (const provider of providers) {
        try {
          debug_log('PriceTracker: fetching price from', provider.getName());

          const priceData = await provider.getMarketPrice(`${symbol}-${currency}`);
          if (priceData === null) {
            console.log(`PriceTracker failed to fetch price from ${provider.getName()}: ${symbol}-${currency}`);
            continue;
          }
          priceStore.set(priceData);
          break;
        } catch (error) {
          console.log(`Error fetching price from ${provider.getName()}:`, error);
        }
      }
    } catch (error) {
      console.log('PriceTracker:', error);
    }
  }

  onMount(() => {
    try {
      if (providers.length === 0) {
        providers = [new CoinbasePriceProvider()]; // Fallback to Coinbase if no providers are passed
      }

      updatePrice();
      interval = setInterval(updatePrice, updateInterval);
    } catch (error) {
      console.log('PriceTracker:', error);
    }
  });

  onDestroy(() => {
    clearInterval(interval);
    priceStore.set(null);
  });
</script>

{@render children?.({ price: $priceStore, })}
