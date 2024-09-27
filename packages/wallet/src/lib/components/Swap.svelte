<script lang="ts">
  import { onMount } from 'svelte';
  import { ethers } from 'ethers';
  import type { SwapToken as Token } from '$lib/common/interfaces';
  import TokenDropdown from './TokenDropdown.svelte';
  import Modal from './Modal.svelte';
  
  // Props
  export let currentlySelected: string;
  export let initialFromToken: Token | null = null;
  export let initialToToken: Token | null = null;
  export let show = false;
  export let onSwap: (fromToken: Token, toToken: Token, fromAmount: number, toAmount: number) => void = () => {};
  export let className = 'text-gray-600 z-[999]';

  // State
  let fromToken: Token | null = initialFromToken;
  let toToken: Token | null = null;
  let fromAmount = 0;
  let toAmount = 0;
  let fromBalance = 0;
  let toBalance = 0;
  let tokens: Token[] = [];
  let preferredTokens: Token[] = [];
  let selectedFromToken: Token | null = null;
  let selectedToToken: Token | null = null;

  const VITE_ALCHEMY_API_KEY_PROD = import.meta.env.VITE_ALCHEMY_API_KEY_PROD;
  const alchemyProvider = new ethers.AlchemyProvider('mainnet', VITE_ALCHEMY_API_KEY_PROD);

  const preferredTokenSymbols = ["WETH", "USDC", "ETH", "WBTC"];

  async function fetchTokenList(): Promise<Token[]> {
    try {
      const response = await fetch('https://tokens.uniswap.org');
      const data = await response.json();
      return data.tokens;
    } catch (error) {
      console.error('Error fetching token list:', error);
      return [];
    }
  }

  async function fetchBalance(token: Token, walletAddress: string): Promise<number> {
    if (token.address === ethers.ZeroAddress) {
      // If the token is ETH (zero address), fetch the ETH balance
      const balance = await alchemyProvider.getBalance(walletAddress);
      return Number(ethers.formatEther(balance));
    } else {
      // If the token is an ERC20 token, fetch the token balance
      const tokenContract = new ethers.Contract(token.address, ['function balanceOf(address) view returns (uint256)'], alchemyProvider);
      const balance = await tokenContract.balanceOf(walletAddress);
      const decimals = token.decimals || 18; // Use token.decimals if available, otherwise default to 18
      return Number(ethers.formatUnits(balance, decimals));
    }
  }

  async function swapTokens() {
    if (fromToken && toToken) {
      onSwap(fromToken, toToken, fromAmount, toAmount);
    }
  }

  function switchTokens() {
    [fromToken, toToken] = [toToken, fromToken];
    [fromAmount, toAmount] = [toAmount, fromAmount];
    [fromBalance, toBalance] = [toBalance, fromBalance];
    [selectedFromToken, selectedToToken] = [selectedToToken, selectedFromToken];
  }

  async function updateBalance(token: Token, isFromToken: boolean, walletAddress: string) {
    const balance = await fetchBalance(token, walletAddress);
    if (isFromToken) {
      fromBalance = balance;
    } else {
      toBalance = balance;
    }
  }

  async function handleTokenSelect(token: Token | null, isFromToken: boolean) {
    if (isFromToken) {
      fromToken = token;
      selectedFromToken = token;
    } else {
      toToken = token;
      selectedToToken = token;
    }
    if (token) {
      await updateBalance(token, isFromToken, currentlySelected);
    }
  }

  function close() {
    show = false;
  }

  function sortTokens(a: Token, b: Token) {
    return a.symbol.localeCompare(b.symbol);
  }

  onMount(async () => {
    tokens = await fetchTokenList();

    preferredTokens = preferredTokenSymbols.map(symbol => tokens.find(token => token.symbol === symbol)).filter(Boolean) as Token[];

    const uniqueTokens: Token[] = [];
    const tokenSet = new Set(preferredTokens.map(token => token.symbol));

    for (const token of tokens) {
      if (!tokenSet.has(token.symbol)) {
        uniqueTokens.push(token);
        tokenSet.add(token.symbol);
      }
    }

    tokens = uniqueTokens.sort(sortTokens);

    if (fromToken) {
      await updateBalance(fromToken, true, currentlySelected);
    }
    if (toToken) {
      await updateBalance(toToken, false, currentlySelected);
    }
  });

</script>

<Modal bind:show title="Token Swap" className={className}>
  <div class="p-6">
    <div class="space-y-4 mt-6">
      <!-- From Token -->
      <div class="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-lg p-4">
        <div class="flex justify-between items-center">
          <input
            type="number"
            bind:value={fromAmount}
            class="bg-transparent text-2xl font-bold focus:outline-none w-1/2 mr-4"
            placeholder="0"
          />
          <TokenDropdown
            tokens={[...preferredTokens, ...tokens]}
            selectedToken={selectedFromToken}
            onTokenSelect={(token) => handleTokenSelect(token, true)}
          />
        </div>
        {#if fromToken}
          <div class="text-sm text-gray-700 dark:text-gray-200 mt-2">Balance: {fromBalance} {fromToken.symbol}</div>
        {/if}
      </div>

      <!-- Switch button -->
      <button
        on:click={switchTokens}
        class="mx-auto block bg-purple-100 p-2 rounded-full transform transition-transform hover:rotate-180"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </button>

      <!-- To Token -->
      <div class="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-lg p-4">
        <div class="flex justify-between items-center">
          <input
            type="number"
            bind:value={toAmount}
            class="bg-transparent text-2xl font-bold focus:outline-none w-1/2 mr-4"
            placeholder="0"
            readonly
          />
          <TokenDropdown
            tokens={[...preferredTokens, ...tokens]}
            selectedToken={selectedToToken}
            onTokenSelect={(token) => handleTokenSelect(token, false)}
          />
        </div>
        {#if toToken}
          <div class="text-sm text-gray-600 mt-2">Balance: {toBalance} {toToken.symbol}</div>
        {/if}
      </div>
    </div>
    <div class="mt-12 flex justify-end space-x-4">
      <button
        on:click={close}
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Cancel
      </button>
      <button
        on:click={swapTokens}
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={!fromToken || !toToken || fromAmount <= 0}
      >
        Review Swap
      </button>
    </div>
  </div>
</Modal>









<!-- <script lang="ts">
  import { onMount } from 'svelte';
  // import { fade } from 'svelte/transition';
  import { ethers } from 'ethers';
  import type { SwapToken as Token } from '$lib/common/interfaces';
  import TokenDropdown from './TokenDropdown.svelte';
	
  // Props
  export let currentlySelected: string;
  export let initialFromToken: Token | null = null;
  export let initialToToken: Token | null = null;
  export let show = false;

  // State
  let fromToken: Token | null = initialFromToken;
  let toToken: Token | null = null;
  let fromAmount = 0;
  let toAmount = 0;
  let fromBalance = 0;
  let toBalance = 0;
  let tokens: Token[] = [];
  let preferredTokens: Token[] = [];
  let selectedFromToken: Token | null = null;
  let selectedToToken: Token | null = null;

  const VITE_ALCHEMY_API_KEY_PROD = import.meta.env.VITE_ALCHEMY_API_KEY_PROD;
  const alchemyProvider = new ethers.AlchemyProvider('mainnet', VITE_ALCHEMY_API_KEY_PROD);

  const preferredTokenSymbols = ["WETH", "USDC", "ETH", "WBTC"];

  async function fetchTokenList(): Promise<Token[]> {
    try {
      const response = await fetch('https://tokens.uniswap.org');
      const data = await response.json();
      return data.tokens;
    } catch (error) {
      console.error('Error fetching token list:', error);
      return [];
    }
  }

  async function fetchBalance(token: Token, walletAddress: string): Promise<number> {
    if (token.address === ethers.ZeroAddress) {
      // If the token is ETH (zero address), fetch the ETH balance
      const balance = await alchemyProvider.getBalance(walletAddress);
      return Number(ethers.formatEther(balance));
    } else {
      // If the token is an ERC20 token, fetch the token balance
      const tokenContract = new ethers.Contract(token.address, ['function balanceOf(address) view returns (uint256)'], alchemyProvider);
      const balance = await tokenContract.balanceOf(walletAddress);
      const decimals = token.decimals || 18; // Use token.decimals if available, otherwise default to 18
      return Number(ethers.formatUnits(balance, decimals));
    }
  }

  async function swapTokens() {
    // TODO: Implement token swapping logic
    console.log('Swapping tokens:', fromToken, toToken, fromAmount, toAmount);
  }

  function switchTokens() {
    [fromToken, toToken] = [toToken, fromToken];
    [fromAmount, toAmount] = [toAmount, fromAmount];
    [fromBalance, toBalance] = [toBalance, fromBalance];
    [selectedFromToken, selectedToToken] = [selectedToToken, selectedFromToken];
  }

  async function updateBalance(token: Token, isFromToken: boolean, walletAddress: string) {
    const balance = await fetchBalance(token, walletAddress);
    if (isFromToken) {
      fromBalance = balance;
    } else {
      toBalance = balance;
    }
  }

  async function handleTokenSelect(token: Token | null, isFromToken: boolean) {
    if (isFromToken) {
      fromToken = token;
      selectedFromToken = token;
    } else {
      toToken = token;
      selectedToToken = token;
    }
    if (token) {
      await updateBalance(token, isFromToken, currentlySelected);
    }
  }

  function close() {
    console.log("Tokens", tokens);

    show = false;
  }

  function sortTokens(a: Token, b: Token) {
    return a.symbol.localeCompare(b.symbol);
  }

  onMount(async () => {
    tokens = await fetchTokenList();

    preferredTokens = preferredTokenSymbols.map(symbol => tokens.find(token => token.symbol === symbol)).filter(Boolean) as Token[];

    const uniqueTokens: Token[] = [];
    const tokenSet = new Set(preferredTokens.map(token => token.symbol));

    for (const token of tokens) {
      if (!tokenSet.has(token.symbol)) {
        uniqueTokens.push(token);
        tokenSet.add(token.symbol);
      }
    }

    tokens = uniqueTokens.sort(sortTokens);

    if (fromToken) {
      await updateBalance(fromToken, true, currentlySelected);
    }
    if (toToken) {
      await updateBalance(toToken, false, currentlySelected);
    }
  });

</script>

<div class="modal" class:modal-open={show}>
  <div class="bg-white rounded-lg shadow-lg p-4 max-w-md mx-auto">
    <div class="space-y-4">
      <div class="bg-gray-100 rounded-lg p-4">
        <div class="flex justify-between items-center">
          <input
            type="number"
            bind:value={fromAmount}
            class="bg-transparent text-2xl font-bold focus:outline-none w-1/2 mr-4"
            placeholder="0"
          />
          <TokenDropdown
            tokens={[...preferredTokens, ...tokens]}
            selectedToken={selectedFromToken}
            onTokenSelect={(token) => handleTokenSelect(token, true)}
          />
        </div>
        {#if fromToken}
          <div class="text-sm text-gray-500 mt-2">Balance: {fromBalance} {fromToken.symbol}</div>
        {/if}
      </div>

      <button
        on:click={switchTokens}
        class="mx-auto block bg-purple-100 p-2 rounded-full transform transition-transform hover:rotate-180"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </button>

      <div class="bg-gray-100 rounded-lg p-4">
        <div class="flex justify-between items-center">
          <input
            type="number"
            bind:value={toAmount}
            class="bg-transparent text-2xl font-bold focus:outline-none w-1/2 mr-4"
            placeholder="0"
            readonly
          />
          <TokenDropdown
            tokens={[...preferredTokens, ...tokens]}
            selectedToken={selectedToToken}
            onTokenSelect={(token) => handleTokenSelect(token, false)}
          />
        </div>
        {#if toToken}
          <div class="text-sm text-gray-500 mt-2">Balance: {toBalance} {toToken.symbol}</div>
        {/if}
      </div>
    </div>

    <button
      on:click={swapTokens}
      class="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg mt-6 hover:bg-purple-700 transition-colors"
      disabled={!fromToken || !toToken || fromAmount <= 0}
    >
      Review Swap
    </button>

    <button
      on:click={close}
      class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors"
    >
      Cancel
    </button>
  </div>
</div>

 -->
