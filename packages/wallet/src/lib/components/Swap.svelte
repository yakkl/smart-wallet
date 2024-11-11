<script lang="ts">
  import { debug_log } from '$lib/common/debug';
  import { onDestroy, onMount } from 'svelte';
  import type { SwapParams, SwapPriceData, SwapToken } from '$lib/common/interfaces';
  import SwapTokenPanel from './SwapTokenPanel.svelte';
  import SwapSettings from './SwapSettings.svelte';
  import SwapSummary from './SwapSummary.svelte';
  import Modal from './Modal.svelte';
  import { BigNumber, YAKKL_FEE_BASIS_POINTS, type BigNumberish } from '$lib/common';
  import { ethers } from 'ethers';
  import { UniswapSwapManager } from '$lib/plugins/UniswapSwapManager';
  import { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
  import { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
  import { Token } from '$lib/plugins/Token';
  import type { Provider } from '$lib/plugins/Provider';
  // import { formatBasisPointsToPercentage } from '$lib/utilities/utilities';
  import { writable } from 'svelte/store';
	import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
	import { getTokenBalance } from '$lib/utilities/balanceUtils';
	import debounce from 'lodash/debounce';

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
    feeAmount: 0n,
    amountAfterFee: 0n,
    amountIn: 0n,
    amountOut: 0n,
    exchangeRate: 0,
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
  let tokenOutPriceInUSD = "";
  let gasEstimate: BigNumberish = 0n;
  let gasEstimateInUSD = "";
  // let feeAmount: BigNumberish = 0n;
  let feeAmountInUSD = "";
  // let feeBasisPointsToPercent: string = formatBasisPointsToPercentage(YAKKL_FEE_BASIS_POINTS);
  let slippageTolerance = 0.5;
  let deadline = 10;
  let poolFee = 3000; // 0.3% fee default
  let error: string | null = null;
  let isLoading = false;
  let ethersProvider: ethers.JsonRpcProvider | undefined;

  let fromBalance: BigNumberish = 0n;
  let toBalance: BigNumberish = 0n;
  let userEnteredFrom = false;
  let userEnteredTo = false;

  $: if (deadline || slippageTolerance || poolFee) {
    debouncedGetQuote();
  }

  // New reactive variable for balance validation
  $: if (tokenIn && fundingAddress && fromAmount) {
    checkBalance();
  }

  // Fetch tokens and initialize state
  onMount(async () => {
    try {
      ethersProvider = new ethers.JsonRpcProvider(url);
      tokens = await fetchTokenList();
      // Need to be able to specify the native token for the blockchain
      let eth: SwapToken = {
        chainId: 1,
        address: '',
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

  // async function checkBalance(token: SwapToken, amount: string) {
  //   try {
  //     const balance = await getTokenBalance(token, fundingAddress, provider, tokenService);
  //     const requiredAmount = ethers.parseUnits(amount, token.decimals);
  //     const isInsufficient = balance < requiredAmount;
  //     insufficientBalanceStore.set(isInsufficient);
  //   } catch {
  //     insufficientBalanceStore.set(true);
  //   }
  // }

  async function checkBalance() {
    insufficientBalanceStore.set(false);
    
    try {
      if (!tokenIn || !fromAmount || !fundingAddress) {
        insufficientBalanceStore.set(false);
        return false;
      }
      
      const balance = await getTokenBalance(tokenIn, fundingAddress, provider, tokenService);
      const requiredAmount = ethers.parseUnits(fromAmount, tokenIn.decimals);
      
      const isInsufficient = balance < requiredAmount;
      insufficientBalanceStore.set(isInsufficient);
      
      return isInsufficient;
    } catch (err) {
      console.log('Error validating balance:', err);
      insufficientBalanceStore.set(false);
      return false;
    }
  }

  function handleFromAmountInput(amount: string) {
    // Sanitize input
    const sanitizedAmount = amount.replace(/[^0-9.]/g, '');
    
    // Handle empty or invalid input
    if (sanitizedAmount === '' || sanitizedAmount === '.' || isNaN(parseFloat(sanitizedAmount))) {
      fromAmount = '';
      userEnteredFrom = false;
      userEnteredTo = false;
      
      updateSwapPriceData({ 
        amountIn: 0n,
        amountOut: 0n
      });
      
      return;
    }

    // Limit to 6 decimal places
    const formattedAmount = parseFloat(sanitizedAmount).toFixed(6);
    fromAmount = formattedAmount;
    userEnteredFrom = true;
    userEnteredTo = false;

    try {
      const parsedAmount = ethers.parseUnits(formattedAmount, $swapPriceDataStore.tokenIn.decimals);
      
      updateSwapPriceData({ 
        amountIn: parsedAmount 
      });

      debouncedGetQuote();
    } catch (error) {
      console.error('Error parsing amount:', error);
      // Reset or handle error gracefully
      fromAmount = '';
      updateSwapPriceData({ 
        amountIn: 0n 
      });
    }
  }

  function handleToAmountInput(amount: string) {
    // Sanitize input
    const sanitizedAmount = amount.replace(/[^0-9.]/g, '');
    
    // Handle empty or invalid input
    if (sanitizedAmount === '' || sanitizedAmount === '.' || isNaN(parseFloat(sanitizedAmount))) {
      toAmount = '';
      userEnteredFrom = false;
      userEnteredTo = false;
      
      updateSwapPriceData({ 
        amountIn: 0n,
        amountOut: 0n
      });
      
      return;
    }

    // Limit to 6 decimal places
    const formattedAmount = parseFloat(sanitizedAmount).toFixed(6);
    toAmount = formattedAmount;
    userEnteredFrom = false;
    userEnteredTo = true;

    try {
      const parsedAmount = ethers.parseUnits(formattedAmount, $swapPriceDataStore.tokenOut.decimals);
      
      updateSwapPriceData({ 
        amountOut: parsedAmount 
      });

      debouncedGetQuote();
    } catch (error) {
      console.error('Error parsing amount:', error);
      // Reset or handle error gracefully
      toAmount = '';
      updateSwapPriceData({ 
        amountOut: 0n 
      });
    }
  }

  function handleTokenSelect(token: SwapToken, isFromToken: boolean) {
    if (isFromToken) {
      tokenIn = token;
      selectedFromToken = token;

      updateSwapPriceData({
            tokenIn: token,
        });
    } else {
      tokenOut = token;
      selectedToToken = token;

      updateSwapPriceData({
            tokenOut: token,
        });
    }

    debouncedGetQuote();
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
      
      debug_log('Validating balance:', {
        tokenIn,
        fromAmount,
        fundingAddress,
        gasEstimate: $swapPriceDataStore.gasEstimate,
        feeAmount: $swapPriceDataStore.feeAmount
      });

      // Get token balance
      const balance = await getTokenBalance(tokenIn, fundingAddress, provider, tokenService);
      
      // Parse amounts
      const swapAmount = ethers.parseUnits(fromAmount, tokenIn.decimals);
      
      // If native token (ETH), account for gas
      if (tokenIn.isNative) {
        const gasEstimate = $swapPriceDataStore.gasEstimate || 0n;
        const totalRequiredAmount = swapAmount + (BigNumber.toBigInt(gasEstimate) || 0n); // Made a higher adjustment to the gasEstimate to account for native too. No need to multiply * ethers.parseUnits('20', 'gwei')); // Estimate gas cost. The '20' is an example only
        
        debug_log('Native token balance check:', {
          balance: balance.toString(),
          swapAmount: swapAmount.toString(),
          gasEstimate: gasEstimate.toString(),
          totalRequiredAmount: totalRequiredAmount.toString()
        });

        if (balance < totalRequiredAmount) {
          error = `Insufficient ${tokenIn.symbol} balance. Need ${ethers.formatUnits(totalRequiredAmount, tokenIn.decimals)} ${tokenIn.symbol}, but have ${ethers.formatUnits(balance, tokenIn.decimals)} ${tokenIn.symbol}`;
          return false;
        }
      } else {
        // For ERC20 tokens, check swap amount
        const feeAmount = $swapPriceDataStore.feeAmount || 0n;
        const totalRequiredAmount = swapAmount;
        
        debug_log('ERC20 token balance check:', {
          balance: balance.toString(),
          swapAmount: swapAmount.toString(),
          feeAmount: feeAmount.toString(),
          totalRequiredAmount: totalRequiredAmount.toString()
        });

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
    if (!provider || !swapManager || !blockchain) throw new Error('Provider, Blockahin, or swap manager not initialized');
    
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

  async function getQuote() {
    // Early return if no amount or tokens
    if (!tokenIn || !tokenOut || (!fromAmount && !toAmount) || !swapManager) {
      // Reset store to initial state
      updateSwapPriceData(initialSwapPriceData);
      return;
    }

    isLoading = true;
    error = null;
    
    try {
      const actualTokenIn = Token.fromSwapToken(tokenIn, blockchain!, provider!);
      const actualTokenOut = Token.fromSwapToken(tokenOut, blockchain!, provider!);
      
      if (!actualTokenIn || !actualTokenOut) {
        updateSwapPriceData(initialSwapPriceData);
        return; // Gracefully return if tokens are not prepared
      }

      const isExactIn = userEnteredFrom;
      const amount = isExactIn 
        ? ethers.parseUnits(fromAmount, actualTokenIn.decimals)
        : ethers.parseUnits(toAmount, actualTokenOut.decimals);

      const quote = await swapManager.getQuote(
        actualTokenIn,
        actualTokenOut,
        amount,
        isExactIn
      );

      // Dynamically set amounts based on quote direction
      if (isExactIn) {
        toAmount = ethers.formatUnits(BigNumber.toBigInt(quote.amountOut) || 0n, actualTokenOut.decimals);
      } else {
        fromAmount = ethers.formatUnits(BigNumber.toBigInt(quote.amountIn) || 0n, actualTokenIn.decimals);
      }

      // Ensure fee calculation is correct for both directions
      const feeAmount = quote.feeAmount;
      const amountAfterFee = quote.amountAfterFee;

      updateSwapPriceData({
        ...quote,
        amountIn: isExactIn ? amount : quote.amountIn,
        amountOut: isExactIn ? quote.amountOut : amount,
        feeAmount,
        amountAfterFee,
      });

      // updateSwapPriceData({...quote});

    } catch (err) {
      console.log('Error getting quote:', err);
      error = 'Failed to get quote. Please try again. ' + err;

      // Update store with the error
      updateSwapPriceData({
        error,
      });
    } finally {
      isLoading = false;

      // Update the store to reflect that loading has ended
      updateSwapPriceData({
        isLoading: false,
      });
    }
  }

  function calculateUsdValue(usdPerEth: number, ethAmount: string): number {
    // Convert the ETH amount (string) to a number and multiply by the USD price
    const ethInUsd = parseFloat(ethAmount) * usdPerEth;
    // Return the result
    return ethInUsd;
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
    
    // Reset store to initial state
    updateSwapPriceData(initialSwapPriceData);
    
    // Optional: Close and reopen dropdown if needed
    // We may need to add a method to reset token dropdowns
  }

</script>

<Modal bind:show title="Swap" {className}>
  <div class="p-6 space-y-4">
    <!-- Sell Section -->
    <span>Sell</span>
    <SwapTokenPanel
      swapPriceDataStore={swapPriceDataStore}
      type="sell"
      tokens={[...preferredTokens, ...tokens]}
      insufficientBalance={$insufficientBalanceStore}
      onTokenSelect={(token) => handleTokenSelect(token, true)}
      onAmountChange={(amount) => handleFromAmountInput(amount)}
    />

    <!-- Switch Button -->
    <button on:click={() => switchTokens()} class="mx-auto block bg-gray-200 p-2 rounded-full transform transition-transform hover:rotate-180">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    </button>

    <!-- Buy Section -->
    <span>Buy</span>
    <SwapTokenPanel
      swapPriceDataStore={swapPriceDataStore}
      type="buy"
      tokens={[...preferredTokens, ...tokens]}
      onTokenSelect={(token) => handleTokenSelect(token, false)}
      onAmountChange={(amount) => handleToAmountInput(amount)}
    />

    <!-- Swap Settings -->
    <SwapSettings {slippageTolerance} {deadline} {poolFee}
      onSlippageChange={(value) => slippageTolerance = value}
      onDeadlineChange={(value) => deadline = value}
      onPoolFeeChange={(value) => poolFee = value}
    />

    <!-- Swap Summary -->
    <SwapSummary swapPriceDataStore={swapPriceDataStore} />

    <!-- Error Message -->
    {#if error}
      <div class="text-red-500 text-center">{error}</div>
    {/if}

    <!-- After SwapSummary component -->
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
    <button on:click={() => swapTokens()} class="w-full px-4 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      disabled={!tokenIn || !tokenOut || !fromAmount || !toAmount || isLoading || !!error}>
      {isLoading ? 'Loading...' : 'Swap'}
    </button>
  </div>
</Modal>
