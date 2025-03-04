<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { PriceProvider } from '$lib/common/interfaces';
  import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';
	import { timerManager } from '$lib/plugins/TimerManager';
	import { priceStore } from '$lib/common/stores';
  import { log } from "$plugins/Logger";
	import { TIMER_PRICE_INTERVAL_TIME } from '$lib/common';

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
    updateInterval = TIMER_PRICE_INTERVAL_TIME, // milliseconds
    children
  }: Props = $props();

  // priceStore is passed to the children layout below - export is not needed but adding it for clarity and possible clean up
  // export const priceStore = writable<MarketPriceData | null>(null);
  // let interval: NodeJS.Timeout;

  async function updatePrice() {
    try {
      for (const provider of providers) {
        try {
          const priceData = await provider.getMarketPrice(`${symbol}-${currency}`);
          if (priceData === null) {
            log.info(`PriceTracker - fetched no price from ${provider.getName()}: ${symbol}-${currency}`);
            continue;
          }
          priceStore.set(priceData);
          break;
        } catch (error) {
          log.error(`Error fetching price from ${provider.getName()}:`, false, error);
        }
      }
    } catch (error) {
      log.error('PriceTracker:', false, error);
    }
  }

  onMount(() => {
    try {
      if (providers.length === 0) {
        providers = [new CoinbasePriceProvider()]; // Fallback to Coinbase if no providers are passed
      }

      updatePrice();
      // Add and start timer
      timerManager.addTimer("priceTracker_updatePrice", updatePrice, updateInterval);
      timerManager.startTimer("priceTracker_updatePrice");

    } catch (error) {
      log.error(error);
    }
  });

  onDestroy(() => {
    timerManager.stopTimer("priceTracker_updatePrice");
    priceStore.set(null);
  });
</script>

{@render children?.({ price: $priceStore, })}
