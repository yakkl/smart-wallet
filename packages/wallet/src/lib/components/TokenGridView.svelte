<script lang="ts">
  import TokenGridItem from './TokenGridItem.svelte';
  import type { TokenData } from '$lib/common/interfaces';
  import { combinedTokenStore } from '$lib/common/derivedStores';
  import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
  import { PriceManager } from '$lib/plugins/PriceManager';

  interface Props {
    tokens: TokenData[];
    onTokenClick: (token: TokenData) => void;
  }

  let { tokens = $combinedTokenStore, onTokenClick }: Props = $props();
  let priceManager = new PriceManager();
  let updatedTokens = $state<TokenData[]>([]);
  let timer: ReturnType<typeof setInterval> | null = null;

  // Initialize token prices and values on mount
  $effect(() => {
    initializeTokenPrices();

    // Set up a 60-second timer to refresh prices
    timer = setInterval(updateTokenPrices, 10000);

    return () => {
      if (timer) clearInterval(timer); // Clear timer on component destruction
    };
  });

  async function initializeTokenPrices(): Promise<void> {
    updatedTokens = await fetchTokenPrices(tokens);
  }

  async function updateTokenPrices(): Promise<void> {
    updatedTokens = await fetchTokenPrices(updatedTokens);
  }

  async function fetchTokenPrices(inputTokens: TokenData[]): Promise<TokenData[]> {
    try {
      return await Promise.all(
        inputTokens.map(async (token) => {
          if (token.symbol) {
            const pair = `${token.symbol}-USD`;
            const marketPrice = await priceManager.getMarketPrice(pair);
            const price = marketPrice?.price ?? 0;
            const value = token.balance
              ? Number(EthereumBigNumber.from(token.balance).toBigInt() * EthereumBigNumber.from(price).toBigInt())
              : 0;

            return {
              ...token,
              price: marketPrice || null,
              value,
            };
          }
          return token;
        })
      );
    } catch (error) {
      console.log('Error fetching token prices:', error);
      return inputTokens; // Return the original tokens if an error occurs
    }
  }
</script>

<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-2 h-full overflow-y-scroll">
  {#each updatedTokens as token}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="cursor-pointer hover:shadow-lg transition-all duration-200 rounded-md p-2 border border-gray-200 dark:border-gray-700">
      <TokenGridItem token={token} onClick={onTokenClick} className={'bg-white'} />
    </div>
  {/each}
</div>
