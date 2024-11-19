<script lang="ts">
  import { debug_log } from '$lib/common/debug';
  import { onDestroy, onMount } from 'svelte';
  import type { SwapParams, SwapPriceData, SwapToken } from '$lib/common/interfaces';
  import SellTokenPanel from './SellTokenPanel.svelte';
  import BuyTokenPanel from './BuyTokenPanel.svelte';
  import SwapSettings from './SwapSettings.svelte';
  import SwapSummary from './SwapSummary.svelte';
  import Modal from './Modal.svelte';
  import { BigNumber, parseAmount, YAKKL_FEE_BASIS_POINTS, type BigNumberish } from '$lib/common';
  import { ethers } from 'ethers';
  import { UniswapSwapManager } from '$lib/plugins/UniswapSwapManager';
  import { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
  import { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
  import { Token } from '$lib/plugins/Token';
  import type { Provider } from '$lib/plugins/Provider';
  import { writable } from 'svelte/store';
  import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
  import { getTokenBalance } from '$lib/utilities/balanceUtils';
  import debounce from 'lodash/debounce';
  import { ADDRESSES } from '$lib/plugins/contracts/evm/constants-evm';
  import { toBigInt } from '$lib/common/math';

  // Props
  export let fundingAddress: string;
  export let provider: Provider;
  export let blockchain: Ethereum;
  export let url: string;
  export let swapManager: UniswapSwapManager;
  export let tokenService: TokenService<any>;
  export let show = false;
  export let onSwap: (fundingAddress: string, tokenIn: SwapToken, tokenOut: SwapToken, fromAmount: BigNumberish, toAmount: BigNumberish) => void = () => {};
  export let className = 'text-gray-600 z-[999]';

  // Initial token values
  let initialToken: SwapToken = {
    chainId: 1,
    address: '',
    name: '',
    symbol: '',
    decimals: 0,
    logoURI: '',
    isNative: false
  };

  // Central store for swap price data
  const initialSwapPriceData: SwapPriceData = {
    provider: 'Uniswap V3',
    lastUpdated: new Date(),
    chainId: 1,
    tokenIn: initialToken,
    tokenOut: initialToken,
    quoteAmount: 0n,
    fundingAddress: '',
    feeAmount: 0n,
    amountAfterFee: 0n,
    amountIn: 0n,
    amountOut: 0n,
    exchangeRate: 0n,
    marketPriceIn: 0,
    marketPriceOut: 0,
    priceImpactRatio: 0,
    path: [],
    fee: 0,
    feeBasisPoints: YAKKL_FEE_BASIS_POINTS,
    feeAmountPrice: 0,
    feeAmountInUSD: '',
    gasEstimate: 0n,
    gasEstimateInUSD: '',
    tokenOutPriceInUSD: '',
    error: null,
    isLoading: false,
  };

  // Create stores
  const swapPriceDataStore = writable<SwapPriceData>(initialSwapPriceData);
  const insufficientBalanceStore = writable(false);

  // State
  let tokenIn: SwapToken = initialToken;
  let tokenOut: SwapToken = initialToken;
  let fromAmount = '';
  let toAmount = '';
  let tokens: SwapToken[] = [];
  let preferredTokens: SwapToken[] = [];
  let fromBalance = '0';
  let slippageTolerance = 0.5;
  let deadline = 10;
  let poolFee = 3000; // 0.3% fee default
  let error: string | null = null;
  let isLoading = false;
  let ethersProvider: ethers.JsonRpcProvider | undefined;
  let lastModifiedPanel: 'sell' | 'buy' = 'sell';
  let resetValues = false;

  // Reactive statements
  $: {
    if (deadline || slippageTolerance || poolFee) {
      debouncedGetQuote();
    }
  }

  $: if (tokenIn && fundingAddress && fromAmount) {
    checkBalance();
  }

  // Initialize
  onMount(async () => {
    try {
      const chainId = 1;
      const wethAddress = chainId === 1 ? ADDRESSES.WETH : ADDRESSES.WETH_SEPOLIA;
      ethersProvider = new ethers.JsonRpcProvider(url);
      tokens = await fetchTokenList();
      
      let eth: SwapToken = {
        chainId: 1,
        address: wethAddress,
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        isNative: true,
        logoURI: '/images/ethereum.svg',
      };
      
      tokens.unshift(eth);
      preferredTokens = getPreferredTokens(tokens);
      tokens = tokens
        .filter(token => !preferredTokens.includes(token))
        .sort((a, b) => a.symbol.localeCompare(b.symbol));
      reset();
    } catch (err) {
      console.error('Error initializing swap:', err);
      error = 'Failed to initialize swap. Please try again.';
    }
  });

  onDestroy(() => {
    debouncedGetQuote.cancel();
    reset();
  });

  // Debounced quote handler
  const debouncedGetQuote = debounce(() => {
    getQuote();
  }, 300);

  // Handler functions
  async function handleSellAmountChange(amount: string) {
    error = '';
    fromAmount = amount;
    lastModifiedPanel = 'sell';
    
    if (!amount || amount === '.' || isNaN(parseFloat(amount))) {
      toAmount = '';
      updateSwapPriceData({
        amountIn: 0n,
        amountOut: 0n
      });
      return;
    }

    if (tokenIn && tokenOut) {
      try {
        const parsedAmount = parseAmount(amount, tokenIn.decimals);
        updateSwapPriceData({
          amountIn: parsedAmount
        });
        await getQuote(true);
      } catch (err) {
        console.error('Error handling sell amount change:', err);
        error = 'Failed to process sell amount';
      }
    }
  }

  async function handleBuyAmountChange(amount: string) {
    error = '';
    toAmount = amount;
    lastModifiedPanel = 'buy';
    
    if (!amount || amount === '.' || isNaN(parseFloat(amount))) {
      fromAmount = '';
      updateSwapPriceData({
        amountIn: 0n,
        amountOut: 0n
      });
      return;
    }

    if (tokenIn && tokenOut) {
      try {
        const parsedAmount = parseAmount(amount, tokenOut.decimals);
        updateSwapPriceData({
          amountOut: parsedAmount
        });
        await getQuote(false);
      } catch (err) {
        console.error('Error handling buy amount change:', err);
        error = 'Failed to process buy amount';
      }
    }
  }

  function handleTokenSelect(token: SwapToken, type: 'sell' | 'buy') {
    error = '';
    if (type === 'sell') {
      tokenIn = token;
      updateSwapPriceData({ tokenIn: token });
    } else {
      tokenOut = token;
      updateSwapPriceData({ tokenOut: token });
    }

    if (tokenIn && tokenOut) {
      if (lastModifiedPanel === 'sell' && fromAmount) {
        handleSellAmountChange(fromAmount);
      } else if (lastModifiedPanel === 'buy' && toAmount) {
        handleBuyAmountChange(toAmount);
      }
    }
  }

  function switchTokens() {
    [tokenIn, tokenOut] = [tokenOut, tokenIn];
    [fromAmount, toAmount] = [toAmount, fromAmount];
    
    updateSwapPriceData({
      tokenIn,
      tokenOut,
      amountIn: toAmount ? parseAmount(toAmount, tokenIn.decimals) : 0n,
      amountOut: fromAmount ? parseAmount(fromAmount, tokenOut.decimals) : 0n
    });

    if (tokenIn && tokenOut) {
      if (fromAmount) handleSellAmountChange(fromAmount);
      else if (toAmount) handleBuyAmountChange(toAmount);
    }
  }

  // Helper functions
  function updateSwapPriceData(newData: Partial<SwapPriceData>) {
    swapPriceDataStore.update(currentData => ({ ...currentData, ...newData }));
  }

  async function checkBalance() {
    try {
      if (!tokenIn || !fromAmount || !fundingAddress) {
        insufficientBalanceStore.set(false);
        return false;
      }      
      const balance = await getTokenBalance(tokenIn, fundingAddress, provider, tokenService);
      fromBalance = ethers.formatUnits(balance, tokenIn.decimals);
      const requiredAmount = parseAmount(fromAmount, tokenIn.decimals);
      const isInsufficient = balance < requiredAmount;
      insufficientBalanceStore.set(isInsufficient);      
      return isInsufficient;
    } catch (err) {
      insufficientBalanceStore.set(false);
      return false;
    }
  }

  // Add these functions to your Swap.svelte

async function fetchTokenList(): Promise<SwapToken[]> {
  try {
    const response = await fetch('https://tokens.uniswap.org');
    const data = await response.json();
    return data.tokens.filter((token: SwapToken) => token.chainId === blockchain?.getChainId());
  } catch (error) {
    console.error('Error fetching token list:', error);
    return [];
  }
}

function getPreferredTokens(tokens: SwapToken[]): SwapToken[] {
  const preferredTokenSymbols = ["ETH", "WETH", "USDC", "WBTC"];
  return preferredTokenSymbols
    .map(symbol => tokens.find(token => token.symbol === symbol))
    .filter((token): token is SwapToken => token !== undefined);
}

async function validateBalance(): Promise<boolean> {
  try {
    if (!tokenIn || !fromAmount || !fundingAddress) return false;    
    // Get token or native balance
    const balance = await getTokenBalance(tokenIn, fundingAddress, provider, tokenService);
    // Parse amounts
    const swapAmount = ethers.parseUnits(fromAmount, tokenIn.decimals);
    
    // If native token (ETH), account for gas
    if (tokenIn.isNative) {
      const gasEstimate = $swapPriceDataStore.gasEstimate || 0n;
      const totalRequiredAmount = swapAmount + (BigNumber.toBigInt(gasEstimate) || 0n);
      if (balance < totalRequiredAmount) {
        error = `Insufficient ${tokenIn.symbol} balance. Need ${ethers.formatUnits(totalRequiredAmount, tokenIn.decimals)} ${tokenIn.symbol}, but have ${ethers.formatUnits(balance, tokenIn.decimals)} ${tokenIn.symbol}`;
        return false;
      }
    } else {
      // For ERC20 tokens, check swap amount
      const feeAmount = $swapPriceDataStore.feeAmount || 0n;
      const totalRequiredAmount = swapAmount;
      if (balance < totalRequiredAmount) {
        error = `Insufficient ${tokenIn.symbol} balance. Need ${ethers.formatUnits(totalRequiredAmount, tokenIn.decimals)} ${tokenIn.symbol}, but have ${ethers.formatUnits(balance, tokenIn.decimals)} ${tokenIn.symbol}`;
        return false;
      }
    }      
    return true;
  } catch (err) {
    console.log('Error validating balance:', err);
    error = 'Failed to validate balance. Please try again.';
    return false;
  }
}

async function checkAllowance(token: Token): Promise<bigint> {
  if (!provider || !swapManager) return 0n;

  const tokenContract = new ethers.Contract(
    token.address,
    ['function allowance(address,address) view returns (uint256)'],
    ethersProvider
  );
  
  return await tokenContract.allowance(
    fundingAddress,
    swapManager.getRouterAddress()
  );
}

async function approveToken(token: Token, amount: string) {
  if (!provider || !swapManager || !blockchain) throw new Error('Provider, Blockchain, or swap manager not initialized');
  
  const tokenContract = blockchain.createContract(
    token.address,
    ['function approve(address,uint256) returns (bool)']
  );
  if (!tokenContract) throw new Error('Token contract not initialized');

  const tx = await tokenContract.sendTransaction(
    'approve',
    swapManager.getRouterAddress(),
    ethers.parseUnits(amount, token.decimals)
  );
  if (!tx) throw new Error('Failed to approve token');
  return await tx.wait();
}

// Fix for the quote formatting issue
async function getQuote(isExactIn: boolean = true) {
  if (!tokenIn || !tokenOut || (!fromAmount && !toAmount)) return;

  try {
    isLoading = true;
    const amount = isExactIn 
      ? parseAmount(fromAmount, tokenIn.decimals)
      : parseAmount(toAmount, tokenOut.decimals);

    const quote = await swapManager.getQuote(
      Token.fromSwapToken(tokenIn, blockchain, provider),
      Token.fromSwapToken(tokenOut, blockchain, provider),
      amount,
      fundingAddress,
      isExactIn
    );

    // Handle the BigNumberish type safely
    if (isExactIn) {
      const amountOut = quote.amountOut ?? 0n;
      toAmount = ethers.formatUnits(toBigInt(amountOut), tokenOut.decimals);
    } else {
      const amountIn = quote.amountIn ?? 0n;
      fromAmount = ethers.formatUnits(toBigInt(amountIn), tokenIn.decimals);
    }

    updateSwapPriceData(quote);
  } catch (err) {
    console.error('Quote Error:', err);
    error = `Failed to get quote: ${err}`;
    toAmount = '';
  } finally {
    isLoading = false;
  }
}

  // ... rest of your existing helper functions (fetchTokenList, getPreferredTokens, etc.)

  async function swapTokens() {
    try {
      if (!tokenIn || !tokenOut || !fromAmount || !toAmount || !fundingAddress || !swapManager) {
        error = 'Invalid swap parameters';
        return;
      }

      if (!await validateBalance()) {
        console.log('Insufficient balance for the given swap');
        return;
      }

      const tokenInInstance = Token.fromSwapToken(tokenIn, blockchain, provider);
      const tokenOutInstance = Token.fromSwapToken(tokenOut, blockchain, provider);

      if (!tokenIn.isNative) {
        const allowance = await checkAllowance(tokenInInstance);
        if (EthereumBigNumber.from(allowance).toBigInt()! < EthereumBigNumber.from(ethers.parseUnits(fromAmount, tokenIn.decimals)).toBigInt()!) {
          await approveToken(tokenInInstance, fromAmount);
        }
      }

      const params: SwapParams = {
        tokenIn: tokenInInstance,
        tokenOut: tokenOutInstance,
        amount: ethers.parseUnits(fromAmount, tokenIn.decimals),
        slippage: slippageTolerance,
        deadline,
        recipient: fundingAddress
      };

      const tx = await swapManager.executeSwap(params);
      debug_log('Swap transaction:', tx);

      onSwap(
        fundingAddress,
        tokenIn,
        tokenOut,
        ethers.parseUnits(fromAmount, tokenIn.decimals),
        ethers.parseUnits(toAmount, tokenOut.decimals)
      );

      error = null;
      reset();
      show = false;
    } catch (err: any) {
      console.error('Error executing swap:', err);
      error = `Failed to execute swap: ${err.message}`;
    }
  }

  function reset() {
    tokenIn = initialToken;
    tokenOut = initialToken;
    fromAmount = '';
    toAmount = '';
    fromBalance = '0';
    error = '';
    lastModifiedPanel = 'sell';
    insufficientBalanceStore.set(false);
    swapPriceDataStore.set(initialSwapPriceData);
    resetValues = true;
  }
</script>

<Modal bind:show title="Swap" {className}>
  <div class="p-6 space-y-4">
    <!-- Sell Section -->
    <span>Sell</span>
    <SellTokenPanel
      swapPriceDataStore={swapPriceDataStore}
      tokens={[...preferredTokens, ...tokens]}
      disabled={false}
      insufficientBalance={$insufficientBalanceStore}
      balance={fromBalance}
      bind:resetValues
      onTokenSelect={(token) => handleTokenSelect(token, 'sell')}
      onAmountChange={handleSellAmountChange}
    />

    <!-- Switch Button -->
    <button 
      on:click={switchTokens} 
      class="mx-auto block bg-gray-200 p-2 rounded-full transform transition-transform hover:rotate-180"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    </button>

    <!-- Buy Section -->
    <span>Buy</span>
    <BuyTokenPanel
      swapPriceDataStore={swapPriceDataStore}
      tokens={[...preferredTokens, ...tokens]}
      disabled={false}
      bind:resetValues
      onTokenSelect={(token) => handleTokenSelect(token, 'buy')}
      onAmountChange={handleBuyAmountChange}
    />

    <!-- Settings -->
    <SwapSettings
      {slippageTolerance}
      {deadline}
      {poolFee}
      onSlippageChange={(value) => slippageTolerance = value}
      onDeadlineChange={(value) => deadline = value}
      onPoolFeeChange={(value) => poolFee = value}
    />

    <!-- Summary -->
    <SwapSummary swapPriceDataStore={swapPriceDataStore} />

    <!-- Error Message -->
    {#if error}
      <div class="w-full bg-red-50 border border-red-200 rounded-lg p-3">
        <div class="flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div class="text-red-500 text-center overflow-x-auto max-w-full">
            <span class="whitespace-nowrap">{error}</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Reset Button -->
    <button 
      on:click={reset} 
      class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Reset Swap
    </button>

    <!-- Swap Button -->
    <button 
      on:click={swapTokens} 
      class="w-full px-4 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      disabled={!tokenIn || !tokenOut || !fromAmount || !toAmount || isLoading || !!error}
    >
      {isLoading ? 'Loading...' : 'Swap'}
    </button>
  </div>
</Modal>

















<!-- <script lang="ts">
  import { debug_log } from '$lib/common/debug';
  import { onDestroy, onMount } from 'svelte';
  import type { SwapParams, SwapPriceData, SwapToken } from '$lib/common/interfaces';
  import SwapTokenPanel from './SwapTokenPanel.svelte';
  import SwapSettings from './SwapSettings.svelte';
  import SwapSummary from './SwapSummary.svelte';
  import Modal from './Modal.svelte';
  import { BigNumber, parseAmount, YAKKL_FEE_BASIS_POINTS, type BigNumberish } from '$lib/common';
  import { ethers } from 'ethers';
  import { UniswapSwapManager } from '$lib/plugins/UniswapSwapManager';
  import { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
  import { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
  import { Token } from '$lib/plugins/Token';
  import type { Provider } from '$lib/plugins/Provider';
  import { writable } from 'svelte/store';
	import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
	import { getTokenBalance } from '$lib/utilities/balanceUtils';
	import debounce from 'lodash/debounce';
	import { ADDRESSES } from '$lib/plugins/contracts/evm/constants-evm';
	import { toBigInt } from '$lib/common/math';

  // Props
  export let fundingAddress: string;
  export let provider: Provider;
  export let blockchain: Ethereum;
  export let url: string;
  export let swapManager: UniswapSwapManager;
  export let tokenService: TokenService<any>;
  // export let gasProvider: any; // Assuming proper gas provider type
  export let show = false;
  export let onSwap: (fundingAddress: string, tokenIn: SwapToken, tokenOut: SwapToken, fromAmount: BigNumberish, toAmount: BigNumberish) => void = () => {};
  export let className = 'text-gray-600 z-[999]';

  // Initial token values
  let initialToken: SwapToken = {
    chainId: 1,
    address: '',
    name: '',
    symbol: '',
    decimals: 0,
    logoURI: '',
    isNative: false
  };

  // Central store for swap price data specific to this component
  const initialSwapPriceData: SwapPriceData = {
    provider: 'Uniswap V3',
    lastUpdated: new Date(),
    chainId: 1,
    tokenIn: initialToken,
    tokenOut: initialToken,
    quoteAmount: 0n,
    fundingAddress: '',
    feeAmount: 0n,
    amountAfterFee: 0n,
    amountIn: 0n,
    amountOut: 0n,
    exchangeRate: 0n,
    marketPriceIn: 0,
    marketPriceOut: 0,
    priceImpactRatio: 0,
    path: [],
    fee: 0,
    feeBasisPoints: YAKKL_FEE_BASIS_POINTS,
    feeAmountPrice: 0,
    feeAmountInUSD: '',
    gasEstimate: 0n,
    gasEstimateInUSD: '',
    tokenOutPriceInUSD: '',
    error: null,
    isLoading: false,
  };

  // Create the writable store with the initial value
  const swapPriceDataStore = writable<SwapPriceData>(initialSwapPriceData);
  const insufficientBalanceStore = writable(false);

  // State
  let tokenIn: SwapToken = initialToken;
  let tokenOut: SwapToken = initialToken;
  let selectedFromToken: SwapToken = tokenIn;
  let selectedToToken: SwapToken = tokenOut;
  let fromAmount = '';
  let toAmount = '';
  let tokens: SwapToken[] = [];
  let preferredTokens: SwapToken[] = [];

  let exchangeRate: number = 0;
  let gasEstimateInUSD = "";
  let feeAmountInUSD = "";
  let slippageTolerance = 0.5;
  let deadline = 10;
  let poolFee = 3000; // 0.3% fee default
  let error: string | null = null;
  let isLoading = false;
  let ethersProvider: ethers.JsonRpcProvider | undefined;

  let fromBalance: string = '0';
  let toBalance: string = '0';
  let userEnteredFrom = false;
  let userEnteredTo = false;

  let swapState: 'initial' | 'from_amount_entered' | 'to_amount_entered' | 'from_token_selected' | 'ready_to_quote' = 'initial';
  let resetValues = false;

  $: {
    if ((tokenIn && tokenIn.symbol) && (tokenOut && tokenOut.symbol) && fromAmount && parseFloat(fromAmount) > 0) {
      swapState = 'ready_to_quote';
      triggerQuote();
    }
  }

  $: {
    if ((tokenIn && tokenIn.symbol) && (tokenOut && tokenOut.symbol) && toAmount && parseFloat(toAmount) > 0) {
      swapState = 'ready_to_quote';
      triggerQuote();
    }
  }

  $: if (deadline || slippageTolerance || poolFee) {
    debouncedGetQuote();
  }

  // New reactive variable for balance validation
  $: if (tokenIn && fundingAddress && fromAmount) {
    checkBalance(); // Check balance when token, address, and amount are set - updates store
  }

  // Fetch tokens and initialize state
  onMount(async () => {
    try {
      const chainId = 1; //provider.getChainId();
      const wethAddress = chainId === 1 ? ADDRESSES.WETH : ADDRESSES.WETH_SEPOLIA;
      ethersProvider = new ethers.JsonRpcProvider(url);
      tokens = await fetchTokenList();
      // Need to be able to specify the native token for the blockchain
      let eth: SwapToken = {
        chainId: 1,
        address: wethAddress,
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        isNative: true,
        logoURI: '/images/ethereum.svg',
      };
      tokens.unshift(eth);
      preferredTokens = getPreferredTokens(tokens);
      tokens = tokens
        .filter(token => !preferredTokens.includes(token))
        .sort((a, b) => a.symbol.localeCompare(b.symbol));
      reset();
    } catch (err) {
      console.error('Error initializing swap:', err);
      error = 'Failed to initialize swap. Please try again.';
    }
  });

  onDestroy(() => {
    debouncedGetQuote.cancel();
    reset();
  });

  const debouncedGetQuote = debounce(() => {
    getQuote();
  }, 300);

  // Updates should funnel through here to ensure reactivity
  function updateSwapPriceData(newData: Partial<SwapPriceData>) {
    swapPriceDataStore.update(currentData => {
      return { ...currentData, ...newData };
    });
  }

  function triggerQuote() {
    // Only trigger quote when all conditions are met
    if (swapState === 'ready_to_quote') { 
      getQuote();
    }
  }

  async function checkBalance() {
    try {
      if (!tokenIn || !fromAmount || !fundingAddress) {
        insufficientBalanceStore.set(false);
        return false;
      }      
      const balance = await getTokenBalance(tokenIn, fundingAddress, provider, tokenService);
      fromBalance = ethers.formatUnits(balance, tokenIn.decimals);
      const requiredAmount = parseAmount(fromAmount, tokenIn.decimals);
      const isInsufficient = balance < requiredAmount;
      insufficientBalanceStore.set(isInsufficient);      
      return isInsufficient;
    } catch (err) {
      insufficientBalanceStore.set(false);
      return false;
    }
  }

  function handleFromAmountInput(amount: string) {
    error = ''; // Clear any previous errors now that the selection has changed
    const sanitizedAmount = amount.replace(/[^0-9.]/g, '');
    
    if (sanitizedAmount === '' || sanitizedAmount === '.' || isNaN(parseFloat(sanitizedAmount))) {
      // Reset state if input is invalid
      fromAmount = '';
      toAmount = '';
      tokenIn = initialToken;
      tokenOut = initialToken;
      swapState = 'initial';
      
      updateSwapPriceData({
        amountIn: 0n,
        amountOut: 0n,
        tokenIn: tokenIn,
        tokenOut: tokenOut
      });
      return;
    }

    fromAmount = sanitizedAmount;
    toAmount = ''; // Clear to amount
    // tokenOut = initialToken; // Reset buy token
    
    updateSwapPriceData({
      amountIn: parseAmount(fromAmount, tokenIn.decimals),
      tokenIn,
      amountOut: 0n,
      tokenOut: initialToken
    });

    swapState = 'ready_to_quote';
    triggerQuote();
  }

  function handleToAmountInput(amount: string) {
    error = ''; // Clear any previous errors now that the selection has changed
    const sanitizedAmount = amount.replace(/[^0-9.]/g, '');
      
    if (sanitizedAmount === '' || sanitizedAmount === '.' || isNaN(parseFloat(sanitizedAmount))) {
      // Reset state if input is invalid
      toAmount = '';
      fromAmount = '';
      tokenIn = initialToken;
      tokenOut = initialToken;
      swapState = 'initial';
      
      updateSwapPriceData({ 
        amountIn: 0n,
        amountOut: 0n,
        tokenIn: tokenIn,
        tokenOut: tokenOut
      });
      return;
    }

    try {
      const parsedAmount = parseAmount(
        sanitizedAmount, 
        $swapPriceDataStore.tokenOut.decimals
      );
      
      // Clear fromAmount when entering to amount
      fromAmount = '';
      toAmount = sanitizedAmount;
      
      updateSwapPriceData({ 
        amountOut: parsedAmount,
        // tokenOut: $swapPriceDataStore.tokenOut,
        amountIn: 0n
      });

      // Trigger quote to calculate input amount
      swapState = 'ready_to_quote';
      triggerQuote();

    } catch (error) {
      console.log('Error parsing to amount:', error);
      
      swapState = 'initial'; // Reset state on parsing failure

      // Reset state on parsing failure
      toAmount = '';
      fromAmount = '';
      
      updateSwapPriceData({ 
        amountIn: 0n,
        amountOut: 0n,
        tokenIn: initialToken,
        tokenOut: initialToken
      });
    }
  }

  function handleTokenSelect(token: SwapToken, type: 'from' | 'to') {
    error = ''; // Clear any previous errors now that the selection has changed
    if (type === 'from') {
      // From token selection
      tokenIn = token;
      selectedFromToken = token;
      
      // Reset buy side completely
      // tokenOut = initialToken;
      toAmount = '';
      
      updateSwapPriceData({
        tokenIn: token,
        // tokenOut: initialToken,
        amountOut: 0n
      });      
    } else {
      tokenOut = token;
      // To token selection
      selectedToToken = token;
      
      updateSwapPriceData({
        // tokenIn: initialToken,
        tokenOut: token,
        amountIn: 0n
      });      
    }
    swapState = 'ready_to_quote';
    triggerQuote();
  }

  function switchTokens() {
    [tokenIn, tokenOut] = [tokenOut, tokenIn];
    [fromBalance, toBalance] = [toBalance, fromBalance];
    [selectedFromToken, selectedToToken] = [selectedToToken, selectedFromToken];
    
    // Preserve user input direction when switching
    if (userEnteredFrom) {
      [fromAmount, toAmount] = [fromAmount, ''];
    } else if (userEnteredTo) {
      [fromAmount, toAmount] = ['', toAmount];
    }
    
    updateSwapPriceData({
        tokenIn,
        tokenOut,
        amountIn: fromAmount ? BigInt(fromAmount) : 0n,
        amountOut: toAmount ? BigInt(toAmount) : 0n,
    });

    if (tokenIn && tokenOut) {
      debouncedGetQuote();
    }
  }

  async function validateBalance(): Promise<boolean> {
    try {
      if (!tokenIn || !fromAmount || !fundingAddress) return false;    
      // Get token or native balance
      const balance = await getTokenBalance(tokenIn, fundingAddress, provider, tokenService);
      // Parse amounts
      const swapAmount = ethers.parseUnits(fromAmount, tokenIn.decimals);
      
      // If native token (ETH), account for gas
      if (tokenIn.isNative) {
        const gasEstimate = $swapPriceDataStore.gasEstimate || 0n;
        const totalRequiredAmount = swapAmount + (BigNumber.toBigInt(gasEstimate) || 0n); // Made a higher adjustment to the gasEstimate to account for native too. No need to multiply * ethers.parseUnits('20', 'gwei')); // Estimate gas cost. The '20' is an example only
        if (balance < totalRequiredAmount) {
          error = `Insufficient ${tokenIn.symbol} balance. Need ${ethers.formatUnits(totalRequiredAmount, tokenIn.decimals)} ${tokenIn.symbol}, but have ${ethers.formatUnits(balance, tokenIn.decimals)} ${tokenIn.symbol}`;
          return false;
        }
      } else {
        // For ERC20 tokens, check swap amount
        const feeAmount = $swapPriceDataStore.feeAmount || 0n;
        const totalRequiredAmount = swapAmount;
        if (balance < totalRequiredAmount) {
          error = `Insufficient ${tokenIn.symbol} balance. Need ${ethers.formatUnits(totalRequiredAmount, tokenIn.decimals)} ${tokenIn.symbol}, but have ${ethers.formatUnits(balance, tokenIn.decimals)} ${tokenIn.symbol}`;
          return false;
        }
      }      
      return true;
    } catch (err) {
      console.log('Error validating balance:', err);
      error = 'Failed to validate balance. Please try again.';
      return false;
    }
  }

  // Toggle how we want to distribute the platform fee
  async function distributeFee(useSmartContract: boolean = false) {
    try {
      if (!tokenOut || !swapManager) {
        throw new Error('Invalid token or swap manager');
      }

      const feeAmount = $swapPriceDataStore.feeAmount;
      const feeRecipient = import.meta.env.VITE_FEE_RECIPIENT;

      const tokenOutInstance = Token.fromSwapToken(tokenOut, blockchain, provider);

      if (useSmartContract) {
        await swapManager.distributeFeeThroughSmartContract(
          tokenOutInstance, 
          feeAmount, 
          feeRecipient
        );
      } else {
        await swapManager.distributeFeeManually(
          tokenOutInstance, 
          feeAmount, 
          feeRecipient
        );
      }
    } catch (error) {
      console.log('Fee distribution failed:', error);
      // Optionally show an error or send a notification
    }
  }

  async function swapTokens() {
    try {
      if (!tokenIn || !tokenOut || !fromAmount || !toAmount || !fundingAddress || !swapManager || !blockchain || !provider) {
        error = 'Invalid swap parameters';
        return;
      }

      if (!await validateBalance()) {
        console.log('Insufficient balance for the given swap');
        return;
      }

      const tokenInInstance = Token.fromSwapToken(tokenIn, blockchain, provider);
      const tokenOutInstance = Token.fromSwapToken(tokenOut, blockchain, provider);

      // Check allowance first if not native token
      if (!tokenIn.isNative) {
        const allowance = await checkAllowance(tokenInInstance);

        if (EthereumBigNumber.from(allowance).toBigInt()! < EthereumBigNumber.from(ethers.parseUnits(fromAmount, tokenIn.decimals)).toBigInt()!) {
          await approveToken(tokenInInstance, fromAmount); // Approve token if allowance is not enough. Returns tx receipt
        }
      }

      const quote = await swapManager.getQuote(tokenInInstance, tokenOutInstance, ethers.parseUnits(fromAmount, tokenIn.decimals), fundingAddress);
      const isMultiHop = quote.multiHop;

      const params: SwapParams = {
        tokenIn: tokenInInstance,
        tokenOut: tokenOutInstance,
        amount: ethers.parseUnits(fromAmount, tokenIn.decimals),
        slippage: slippageTolerance,
        deadline,
        recipient: fundingAddress
      };

      let tx;
      if (isMultiHop) {
        // Multi-hop swap
        tx = await swapManager.populateMultiHopSwapTransaction(
          tokenInInstance,
          tokenOutInstance,
          ethers.parseUnits(fromAmount, tokenIn.decimals),
          quote.amountOut,
          fundingAddress,
          Math.floor(Date.now() / 1000) + (deadline * 60)
        );
      } else {
        // Single-hop swap
        tx = await swapManager.executeSwap(params);
      }

      debug_log('Swap transaction:', tx);
      await distributeFee();

      onSwap(
        fundingAddress,
        tokenIn,
        tokenOut,
        ethers.parseUnits(fromAmount, tokenIn.decimals),
        ethers.parseUnits(toAmount, tokenOut.decimals)
      );

      error = null;
      reset();
      close();
    } catch (err: any) {
      console.error('Error executing swap:', err);
      error = `Failed to execute swap: ${err.message}`;
    }
  }

  async function checkAllowance(token: Token): Promise<bigint> {
    if (!provider || !swapManager) return 0n;

    const tokenContract = new ethers.Contract(
      token.address,
      ['function allowance(address,address) view returns (uint256)'],
      ethersProvider
    );
    
    return await tokenContract.allowance(
      fundingAddress, //await signer.getAddress(),
      swapManager.getRouterAddress()
    );
  }

  async function approveToken(token: Token, amount: string) {
    if (!provider || !swapManager || !blockchain) throw new Error('Provider, Blockchain, or swap manager not initialized');
    
    const tokenContract = blockchain.createContract(
      token.address,
      ['function approve(address,uint256) returns (bool)']
    );
    if (!tokenContract) throw new Error('Token contract not initialized');

    const tx = await tokenContract.sendTransaction(
      'approve',
      swapManager.getRouterAddress(),
      ethers.parseUnits(amount, token.decimals)
    );
    if (!tx) throw new Error('Failed to approve token');
    return await tx.wait();
  }

  async function fetchTokenList(): Promise<SwapToken[]> {
    try {
      const response = await fetch('https://tokens.uniswap.org');
      const data = await response.json();
      return data.tokens.filter((token: SwapToken) => token.chainId === blockchain?.getChainId());
    } catch (error) {
      console.error('Error fetching token list:', error);
      return [];
    }
  }

  function getPreferredTokens(tokens: SwapToken[]): SwapToken[] {
    const preferredTokenSymbols = ["ETH", "WETH", "USDC", "WBTC"];
    return preferredTokenSymbols
      .map(symbol => tokens.find(token => token.symbol === symbol))
      .filter((token): token is SwapToken => token !== undefined);
  }

  async function prepareToken(token: SwapToken): Promise<Token> {
    // If token is native (ETH)
    if (token.isNative || token.address === ethers.ZeroAddress) {
      // Get WETH token for the current chain
      const wethToken = await swapManager.getWETHToken();
      
      // For quote and swap, we need to use WETH address
      return Token.fromSwapToken(
        {
          ...wethToken,
          isNative: false,  // Ensure it's not marked as native for routing
          symbol: 'WETH'
        }, 
        blockchain!, 
        provider!
      );
    }
    
    // Regular token conversion
    return Token.fromSwapToken(token, blockchain!, provider!);
  }

  async function getQuote() {
    try {
      // Prepare tokens for swap routing, converting native to WETH
      const actualTokenIn = await prepareToken(tokenIn);
      const actualTokenOut = await prepareToken(tokenOut);

      // debug_log('Quote Tokens:', {
      //   originalTokenIn: {
      //     address: tokenIn.address,
      //     symbol: tokenIn.symbol,
      //     isNative: tokenIn.isNative
      //   },
      //   actualTokenIn: {
      //     address: actualTokenIn.address,
      //     symbol: actualTokenIn.symbol,
      //     isNative: actualTokenIn.isNative
      //   },
      //   originalTokenOut: {
      //     address: tokenOut.address,
      //     symbol: tokenOut.symbol,
      //     isNative: tokenOut.isNative
      //   },
      //   actualTokenOut: {
      //     address: actualTokenOut.address,
      //     symbol: actualTokenOut.symbol,
      //     isNative: actualTokenOut.isNative
      //   }
      // });

      const amount = parseAmount(fromAmount, tokenIn.decimals);

      const quote = await swapManager.getQuote(
        actualTokenIn,
        actualTokenOut,
        amount,
        fundingAddress,
        true // Always exact input from sell side
      );

      // Update buy amount
      toAmount = ethers.formatUnits(
        toBigInt(quote.amountOut), 
        tokenOut.decimals
      );

      // Update price data store
      updateSwapPriceData({
        ...quote,
        amountIn: amount,
        amountOut: quote.amountOut
      });
    } catch (err) {
      console.log('Quote Error:', err);
      // Handle quote failure
      toAmount = '';
      error = `Failed to get quote: ${err}`;
    }
  }

  function reset() {
    // Reset tokens
    selectedFromToken = tokenIn = initialToken;
    selectedToToken = tokenOut = initialToken;
    
    // Reset amounts
    fromAmount = '';
    toAmount = '';
    
    // Reset calculation-related states
    exchangeRate = 0;
    gasEstimateInUSD = '';
    feeAmountInUSD = '';
    
    // Reset user interaction flags
    userEnteredFrom = false;
    userEnteredTo = false;

    swapState = 'initial';
    
    error = '';
    // Reset store to initial state
    insufficientBalanceStore.set(false);
    swapPriceDataStore.set(initialSwapPriceData);
    resetValues = true;
  }

</script> -->

<!-- <Modal bind:show title="Swap" {className}>
  <div class="p-6 space-y-4">
    <span>Sell</span>
    <SwapTokenPanel
      swapPriceDataStore={swapPriceDataStore}
      type="sell"
      tokens={[...preferredTokens, ...tokens]}
      disabled={false} 
      insufficientBalance={$insufficientBalanceStore}
      balance={fromBalance}
      bind:resetValues
      onTokenSelect={(token) => handleTokenSelect(token, 'from')}
      onAmountChange={(amount) => handleFromAmountInput(amount)}
    />
    
    <button on:click={() => switchTokens()} class="mx-auto block bg-gray-200 p-2 rounded-full transform transition-transform hover:rotate-180">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    </button>

    <span>Buy</span>
    <SwapTokenPanel
      swapPriceDataStore={swapPriceDataStore}
      type="buy"
      tokens={[...preferredTokens, ...tokens]}
      disabled={false} 
      readOnly={false}
      bind:resetValues
      onTokenSelect={(token) => handleTokenSelect(token, 'to')}
      onAmountChange={(amount) => handleToAmountInput(amount)}
    />

    <SwapSettings {slippageTolerance} {deadline} {poolFee}
      onSlippageChange={(value) => slippageTolerance = value}
      onDeadlineChange={(value) => deadline = value}
      onPoolFeeChange={(value) => poolFee = value}
    />

    <SwapSummary swapPriceDataStore={swapPriceDataStore} />

  {#if error}
    <div class="w-full bg-red-50 border border-red-200 rounded-lg p-3">
      <div class="flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <div class="text-red-500 text-center overflow-x-auto max-w-full">
          <span class="whitespace-nowrap">{error}</span>
        </div>
      </div>
    </div>
  {/if}

    <button 
      on:click={reset} 
      class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Reset Swap
    </button>

    <button on:click={() => swapTokens()} class="w-full px-4 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      disabled={!tokenIn || !tokenOut || !fromAmount || !toAmount || isLoading || !!error}>
      {isLoading ? 'Loading...' : 'Swap'}
    </button>
  </div>
</Modal> -->
