<script lang="ts">
  import type { PriceProvider } from '$lib/common/interfaces';
  import { yakklCurrentlySelectedStore } from '$lib/common/stores';
  import type { Provider } from '$lib/plugins/Provider';
  import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';
  import { CoingeckoPriceProvider } from '$lib/plugins/providers/price/coingecko/CoingeckoPriceProvider';
  import { UniswapPriceProvider } from '$lib/plugins/providers/price/uniswap/UniswapPriceProvider';
  import type { Wallet } from '$lib/plugins/Wallet';
  import WalletManager from '$lib/plugins/WalletManager';
  import { onMount } from 'svelte';
  import PriceTracker from './PriceTracker.svelte';

  export let baseToken: string;
  export let quoteToken: string = 'USD';
  export let showLastUpdated: boolean = false;
  export let quantity: number = 1;
  export let customClass: string = '';
  export let useProviders: string[] = ['Coinbase', 'Coingecko', 'Uniswap'];

  let providersMap = new Map<string, PriceProvider>();
  let activeProviders: PriceProvider[] = [];

  onMount(async () => {
    try {
      providersMap.set('Coinbase', new CoinbasePriceProvider());
      providersMap.set('Coingecko', new CoingeckoPriceProvider());

      let wallet: Wallet | null = null;
      let provider: Provider | null = null;

      wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], $yakklCurrentlySelectedStore!.shortcuts.chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);
      if (wallet) {
        provider = wallet!.getProvider();
        
        // console.log('TokenPrice: Wallet initialized', wallet, provider);

        providersMap.set('Uniswap', new UniswapPriceProvider(provider!, new CoinbasePriceProvider())); // NOTE: May want to pass in a provider map so we can cycle through them if needed!
      }

      activeProviders = useProviders
        .map(name => providersMap.get(name))
        .filter((provider): provider is PriceProvider => provider !== undefined);

      // console.log('TokenPrice: Providers initialized', activeProviders);
    } catch(error) {
      console.log('TokenPrice:', error);
    }
  });

  function formatPrice(price: number): string {
    try {
      let formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD', //quoteToken,
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }).format(price);

      return formattedPrice;
    } catch (error) {
      console.log('TokenPrice:', error);
      return price.toString(); // Fallback to raw price
    }
  }

  function formatDate(date: Date): string {
    return date.toLocaleString();
  }
</script>

<PriceTracker {baseToken} {quoteToken} providers={activeProviders} let:price>
  <div class={`flex flex-col items-start ${customClass}`}>
    {#if price !== null}
      <span class="text-xl font-bold">{formatPrice(price.price * quantity)}</span>
      <span class="text-xs text-gray-600">{baseToken}/{quoteToken}</span>
      <span class="text-xs text-gray-500">Price: {formatPrice(price.price)}</span>
      {#if showLastUpdated && price.lastUpdated}
        <span class="text-xs text-gray-500">Last updated: {formatDate(price.lastUpdated)}</span>
      {/if}
    {:else}
      <span class="text-xl font-bold">{formatPrice(0)}</span>
      <span class="text-xs text-gray-600">{baseToken ? baseToken : '--' }/{quoteToken}</span>
      <span class="text-xs text-gray-500">Price: -- </span>
      {#if showLastUpdated}
        <span class="text-xs text-gray-500">Last updated: -- </span>
      {/if}
    {/if}
  </div>
</PriceTracker>
