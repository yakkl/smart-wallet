<script lang="ts">
  import { browser as browserSvelte } from '$app/environment';
  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
	import type { Browser } from 'webextension-polyfill';
  import { debug_log, error_log } from '$lib/common/debug-error';
  import { onDestroy, onMount } from 'svelte';
  import type { SwapParams, SwapPriceData, SwapToken } from '$lib/common/interfaces';
  import SellTokenPanel from './SellTokenPanel.svelte';
  import BuyTokenPanel from './BuyTokenPanel.svelte';
  import SwapSettings from './SwapSettings.svelte';
  import SwapSummary from './SwapSummary.svelte';
  import Modal from './Modal.svelte';
  import { BigNumber, ETH_BASE_SWAP_GAS_UNITS, parseAmount, YAKKL_FEE_BASIS_POINTS, type BigNumberish } from '$lib/common';
  import { ethers } from 'ethers';
  import { UniswapSwapManager } from '$lib/plugins/UniswapSwapManager';
  import { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
  import { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
  import { Token } from '$lib/plugins/Token';
  import type { Provider } from '$lib/plugins/Provider';
  import { writable } from 'svelte/store';
  import { getTokenBalance } from '$lib/utilities/balanceUtils';
  import debounce from 'lodash/debounce';
  import { ADDRESSES } from '$lib/plugins/contracts/evm/constants-evm';
  import { toBigInt } from '$lib/common/math';
	import { GasToken } from '$lib/plugins/GasToken';
	import { validateSwapQuote, type ValidationResult } from '$lib/common/validation';
	// import { multiHopQuoteAlphaRouter } from '$lib/plugins/alphaRouter';

  // Props
  export let fundingAddress: string;
  export let provider: Provider;     // Provider must have Signer set before calling Swap!
  export let blockchain: Ethereum;
  export let swapManager: UniswapSwapManager;
  export let tokenService: TokenService<any>;
  export let show = false;
  export let onSwap: (fundingAddress: string, tokenIn: SwapToken, tokenOut: SwapToken, fromAmount: BigNumberish, toAmount: BigNumberish) => void = () => {};
  export let className = 'text-gray-600 z-[999]';

  const SUPPORTED_STABLECOINS = [ 'USDC', 'USDT', 'DAI', 'BUSD' ];

  let browser_ext: Browser; 
  if (browserSvelte) browser_ext = getBrowserExt();

  // May could have passed this in as a prop
  let gasToken: GasToken;

  // Initial token values
  let initialToken: SwapToken = {
    chainId: 1,
    address: '',
    name: '',
    symbol: '',
    decimals: 0,
    balance: 0n,
    logoURI: '',
    isNative: false,
    isStablecoin: false
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
    marketPriceGas: 0,
    priceImpactRatio: 0,
    path: [],
    fee: 0,
    feeBasisPoints: YAKKL_FEE_BASIS_POINTS,
    feeAmountPrice: 0,
    feeAmountInUSD: '',
    gasEstimate: 0n,
    gasEstimateInUSD: '',
    tokenOutPriceInUSD: '',
    slippageTolerance: 0.5,
    deadline: 10,
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
  // let stablecoinTokens: SwapToken[] = [];
  let fromBalance = '0';
  let toBalance = '0'; // Not used yet
  let slippageTolerance = 0.5;  // 0.5% default - amount in percentage of acceptable slippage from quoted price
  let deadline = 10;  // 10 minutes default
  let poolFee = 3000; // 0.3% fee default
  let error: string | null = null;
  let isLoading = false;
  let isSwapping = false;
  let lastModifiedPanel: 'sell' | 'buy' = 'sell';
  let resetValues = false;
  let swapManagerName = ''; 
  let pricesInterval: NodeJS.Timeout;

  // Reactive statements
  $: {
    if (deadline || slippageTolerance || poolFee) {
      debouncedGetQuote();
    }
  }

  $: isEthWethSwap = (tokenIn.symbol === 'ETH' && tokenOut.symbol === 'WETH') || (tokenIn.symbol === 'WETH' && tokenOut.symbol === 'ETH');

  $: if (tokenIn && fromAmount) {
    checkBalance(tokenIn, fromAmount, fundingAddress); // Only need the selling token balance to verify if there are enough funds but we also need to verify ETH for gas
    if (gasToken && $swapPriceDataStore.marketPriceGas === 0) {
      gasToken.getMarketPrice().then(price => {
        updateSwapPriceData( { marketPriceGas: price.price }); // TODO: Need to add isInsufficient check for gas so we can show the error message and offer an alternative if there is one
      });
    }

    // Only need to update if we have a tokenIn and the market price is 0
    if (tokenIn.symbol && swapManager && $swapPriceDataStore.marketPriceIn === 0) {
      swapManager.getMarketPrice(`${tokenIn.symbol}-USD`).then(price => {
        if (price.price <= 0) {
          // debug_log('tokenIn - Market price is 0: (ignored)', price);
          return;
        }
        updateSwapPriceData( { marketPriceIn: price.price });
      }).catch(err => {
        error_log('tokenIn - Error fetching market price:', err);
      });
    }
  }

  $: if (tokenOut && toAmount) {
    // Only need to update if we have a tokenOut and the market price is 0
    if (tokenOut.symbol && swapManager && $swapPriceDataStore.marketPriceOut === 0) {
      swapManager.getMarketPrice(`${tokenOut.symbol}-USD`).then(price => {
        if (price.price <= 0) {
          // debug_log('tokenOut - Market price is 0: (ignored)', price);
          return;
        }
        updateSwapPriceData( { marketPriceOut: price.price });
      }).catch(err => {
        error_log('tokenOut - Error fetching market price:', err);
      });
    }
  }

  // Initialize
  onMount(async () => {
    try {
      reset();

      const chainId = 1;
      const wethAddress = chainId === 1 ? ADDRESSES.WETH : ADDRESSES.WETH_SEPOLIA;

      // Provider must have Signer set before calling Swap!
      gasToken = new GasToken('YAKKL GasToken', 'ETH', blockchain, provider, fundingAddress); // Native token for now 

      tokens = await fetchTokenList();

      let eth: SwapToken = {
        chainId: 1,
        address: wethAddress,
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        isNative: true,
        isStablecoin: false,
        logoURI: '/images/ethereum.svg',
      };
      
      tokens.unshift(eth);
      preferredTokens = getPreferredTokens(tokens);
      tokens = tokens
        .filter(token => !preferredTokens.includes(token))
        .sort((a, b) => a.symbol.localeCompare(b.symbol));

      // Defaulting gas price check as last thing in onMount
      if (gasToken) {
        gasToken.getMarketPrice().then(price => {
          updateSwapPriceData( { marketPriceGas: price.price });
        });
      }

      pricesInterval = setInterval(fetchPrices, 60000);

    } catch (err) {
      error_log('Error initializing swap:', err);
      error = 'Failed to initialize swap. Please try again.';
    }
  });

  onDestroy(() => {
    clearInterval(pricesInterval);
    debouncedGetQuote.cancel();
    reset();
  });

  // Debounced quote handler
  const debouncedGetQuote = debounce(() => {
    getQuote();
  }, 300);

  // Function to fetch the gas price
  async function fetchPrices() {
    if (gasToken) {
      try {
        // Always the native token except where we sponsor the gas
        const price = await gasToken.getMarketPrice();
        updateSwapPriceData({ marketPriceGas: price.price });
      } catch (error) {
        error_log('Error fetching gas price:', error);
      }
    }

    if (tokenIn && tokenIn.symbol && swapManager) {
      try {
        const price = await swapManager.getMarketPrice(`${tokenIn.symbol}-USD`);
        updateSwapPriceData({ marketPriceIn: price.price });
      } catch (error) {
        error_log('Error fetching market price:', error);
      }
    }

    if (tokenOut && tokenOut.symbol && swapManager) {
      try {
        const price = await swapManager.getMarketPrice(`${tokenOut.symbol}-USD`);
        updateSwapPriceData({ marketPriceOut: price.price });
      } catch (error) {
        error_log('Error fetching market price:', error);
      }
    }
  }

  // Handler functions
  async function handleSellAmountChange(amount: string) {
    error = '';
    fromAmount = amount;
    lastModifiedPanel = 'sell';
    
    if (amount !== '.' && isNaN(parseFloat(amount))) {
      fromAmount = '';//toAmount = '';
      updateSwapPriceData({
        amountIn: 0n,
        amountOut: 0n
      });
      return;
    }

    try {
      const parsedAmount = parseAmount(amount, tokenIn.decimals);
      updateSwapPriceData({
        amountIn: parsedAmount
      });
      if (tokenIn && tokenOut) await getQuote(true);
    } catch (err) {
      error_log('Error handling sell amount change:', err);
      error = 'Failed to process sell amount';
    }
  }

  async function handleBuyAmountChange(amount: string) {
    error = '';
    toAmount = amount;
    lastModifiedPanel = 'buy';
    
    if (amount !== '.' && isNaN(parseFloat(amount))) {
      toAmount = ''; // TBD: Should it be fromAmount?
      updateSwapPriceData({
        amountOut: 0n
      });
      return;
    }

    try {
      const parsedAmount = parseAmount(amount, tokenOut.decimals);
      updateSwapPriceData({
        amountOut: parsedAmount
      });
      if (tokenIn && tokenOut) await getQuote(false);
    } catch (err) {
      error_log('Error handling buy amount change:', err);
      error = 'Failed to process buy amount';
    }
  }

  async function handleTokenSelect(token: SwapToken, type: 'sell' | 'buy') {
    error = '';

    // This is a helper function to set the pool fee for stablecoins
    if (token.isStablecoin || SUPPORTED_STABLECOINS.includes(token.symbol)) { //&& swapManagerName.includes('uniswap')) { // May want to add an override flag that gets set if a pool fee is changed and if then skip this check
      poolFee = 500;
      token.isStablecoin = true;
      updateSwapPriceData({ fee: poolFee });
    } 

    if (!token.balance || toBigInt(token.balance) <= 0n) {
      token.balance = await getTokenBalance(token, fundingAddress, provider, tokenService);
    }
    const formattedBalance = ethers.formatUnits(toBigInt(token.balance), token.decimals);  // NOTE: This and all ethers specific code should be moved to the TokenService - maybe
    
    if (type === 'sell') {
      tokenIn = token;
      updateSwapPriceData({ tokenIn: token });
      fromBalance = formattedBalance;
    } else {
      tokenOut = token;
      updateSwapPriceData({ tokenOut: token });
      toBalance = formattedBalance;
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

  async function checkBalance(token: SwapToken, amount: string, fundingAddress: string) {
    try {
      if (!token || !amount || !fundingAddress) {
        insufficientBalanceStore.set(false);
        return false;
      }      
      const balance = await getTokenBalance(token, fundingAddress, provider, tokenService);
      const formattedBalance = ethers.formatUnits(balance, token.decimals);
      token.balance = balance;
      if (token === tokenIn) fromBalance = formattedBalance; // Only update balance for tokenIn
      const requiredAmount = parseAmount(amount, token.decimals);
      const isInsufficient = balance < requiredAmount;
      insufficientBalanceStore.set(isInsufficient);      
      return isInsufficient;
    } catch (err) {
      insufficientBalanceStore.set(false);
      error_log('Error checking balance:', err);
      return false;
    }
  }

  async function fetchTokenList(): Promise<SwapToken[]> {
    try {
      if ( browserSvelte ) {
        const response = await fetch(browser_ext.runtime.getURL('/data/uniswap.json')); // 'https://tokens.uniswap.org' );
        const data = await response.json();
        data.tokens
          .filter( ( token: SwapToken ) => token.chainId === (blockchain ? blockchain.getChainId() || 1 : 1))
          .map( ( token: SwapToken ) => {
            if ( SUPPORTED_STABLECOINS.includes( token.symbol ) ) {
              token.isStablecoin = true;
            }
            return token;
          } );
        return data.tokens.filter((token: SwapToken) => token.chainId === 1); // blockchain.getChainId() || 1);
      }
      return [];
    } catch (error) {
      error_log('Error fetching token list:', error);
      return [];
    }
  }

  function getPreferredTokens(tokens: SwapToken[]): SwapToken[] {
    const preferredTokenSymbols = ["ETH", "WETH", "USDC", "USDT", "WBTC"];
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

  // Fix for the quote formatting issue
  async function getQuote(isExactIn: boolean = true) {
    if (!tokenIn.symbol || !tokenOut.symbol || (!fromAmount && !toAmount)) return;

    if (isEthWethSwap) {
      updateSwapPriceData({feeAmount: 0n}); // May want to force fees, slippage, etc. to 0 here
      return; // Do nothing here for now
    }

    try {
      isLoading = true;
      const amount = isExactIn 
        ? parseAmount(fromAmount, tokenIn.decimals)
        : parseAmount(toAmount, tokenOut.decimals);

      slippageTolerance = $swapPriceDataStore.slippageTolerance || 0.5;
      deadline = $swapPriceDataStore.deadline || 10;

      const quote = await swapManager.getQuote(
        Token.fromSwapToken(tokenIn, blockchain, provider),
        Token.fromSwapToken(tokenOut, blockchain, provider),
        amount,
        fundingAddress,
        isExactIn,
        poolFee
      );


    // const { multiHopQuoteAlphaRouter } = await import('../plugins/alphaRouter');

    // multiHopQuoteAlphaRouter( 
    //   Token.fromSwapToken(tokenIn, blockchain, provider), 
    //   Token.fromSwapToken(tokenOut, blockchain, provider), 
    //   amount, 
    //   fundingAddress, 
    //   isExactIn );


      if (!quote || quote.error) {
        error = 'No valid pool found for this token pair. Try a different combination.';
        return;
      }

      // Reset the slippage and deadline to correct values 
      if (quote) {
        quote.slippageTolerance = slippageTolerance;
        quote.deadline = deadline;
      }

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
      error_log('Quote Error:', err);
      error = `Failed to get quote: ${err}`;
      toAmount = '';
    } finally {
      isLoading = false;
    }
  }

  // May want to make this a little less dependent on the store and move to a more generic function
  async function validateQuote() {
    let returnCode: boolean = false;

    if (!tokenIn || !tokenOut || !fromAmount || !toAmount || !fundingAddress || !swapManager) {
      error = 'Invalid swap parameters';
      return returnCode;
    }
    if (!$swapPriceDataStore) {
      error = 'Failed to get quote';
      return returnCode;
    }
    if ($swapPriceDataStore.error) {
      error = $swapPriceDataStore.error;
      return returnCode;
    }
    if ($insufficientBalanceStore) {
      error = `Insufficient balance for the given swap. You need ETH for gas fees and enough ${tokenIn.symbol} to sell/swap.`;
      return returnCode;
    }

    if (!await validateBalance()) { // Redundant check for now
      error = 'Insufficient balance for the given swap';
      console.log(error);
      return;
    }

    const results: ValidationResult = validateSwapQuote($swapPriceDataStore);

    if (results.error) {
      error = results.error;
      error_log('Validation error:', error);
      return returnCode;
    }

    return true;
  }

  async function swapTokens() {
    try {
      debug_log('SWAP: Swapping tokens...');

      if (isEthWethSwap) {
        updateSwapPriceData({feeAmount: 0n}); // May want to force fees, slippage, etc. to 0 here
        // May want to do something with receipts later...
        if (tokenIn.symbol === 'ETH' && tokenOut.symbol === 'WETH') {
          // Wrap ETH to WETH
          const receipt = swapManager.wrapETH(ethers.parseUnits(fromAmount, tokenIn.decimals), fundingAddress);
          debug_log('SWAP: Wrap ETH to WETH receipt:', receipt);
        } else if (tokenIn.symbol === 'WETH' && tokenOut.symbol === 'ETH') {
          // Unwrap WETH to ETH
          const receipt = swapManager.unwrapWETH(ethers.parseUnits(fromAmount, tokenIn.decimals), fundingAddress);
          debug_log('SWAP: Unwrap WETH to ETH receipt:', receipt);
        }
        return; 
      }
      isSwapping = true;
      error = '';
      // Make sure getQuote has been called successfully
      if (!await validateQuote()) {
        debug_log('Swap validation failed:', error);
        isSwapping = false;
        return; // Error message is set in validateQuote
      }
      
      const tokenInInstance = Token.fromSwapToken($swapPriceDataStore.tokenIn, blockchain, provider);
      const tokenOutInstance = Token.fromSwapToken($swapPriceDataStore.tokenOut, blockchain, provider);

      if (!$swapPriceDataStore.tokenIn.isNative) {
        const allowance = await swapManager.checkAllowance(tokenInInstance, fundingAddress);
        const requiredAmount = ethers.parseUnits(fromAmount, tokenInInstance.decimals);

        if (allowance < requiredAmount) {
          const receipt = await swapManager.approveToken(tokenInInstance, fromAmount);
          debug_log('SWAP: Approval receipt:', receipt);
        }
      }

      const { maxFeePerGas, maxPriorityFeePerGas } = await getCurrentGasPrices();

      const params: SwapParams = {
        tokenIn: tokenInInstance,
        tokenOut: tokenOutInstance,
        amount: ethers.parseUnits(fromAmount, $swapPriceDataStore.tokenIn.decimals),
        fee: $swapPriceDataStore.fee || poolFee, // Basis points - not used here for multihops
        slippage: $swapPriceDataStore.slippageTolerance || slippageTolerance,
        deadline: $swapPriceDataStore.deadline || deadline,
        recipient: $swapPriceDataStore.fundingAddress,
        feeRecipient: 'aifees.eth',
        feeAmount: $swapPriceDataStore.feeAmount || 0n,
        gasLimit: toBigInt($swapPriceDataStore.gasEstimate) || ETH_BASE_SWAP_GAS_UNITS,
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
      };

      debug_log('SWAP: Swap params:', params);
      const [receiptTrans, receiptFee] = await swapManager.executeFullSwap(params); // May want to do something with receipts later...

      debug_log('SWAP: Swap receipts:', receiptTrans, receiptFee);

      onSwap(
        fundingAddress,
        tokenIn,
        tokenOut,
        ethers.parseUnits(fromAmount, tokenIn.decimals),
        ethers.parseUnits(toAmount, tokenOut.decimals)
      ); // Notify parent component - could add more data here such as fee, feeAmount, etc.

      error = '';
      reset();
      show = false;
    } catch (err: any) {
      isSwapping = false;
      error_log('Error executing swap:', err);
      error = `Failed to execute swap: ${err.message}`;
    }
  }

  async function getCurrentGasPrices(): Promise<{maxFeePerGas: bigint; maxPriorityFeePerGas: bigint;}> {
    try {
      // Use a gas price API or provider method
      const feeData = await provider.getFeeData();
      
      debug_log('Current gas prices (feeData): ====================================>>>>>>>>>>>>>>>>>>>>>>>>', feeData);
      return {
        maxFeePerGas: toBigInt(feeData.maxFeePerGas),
        maxPriorityFeePerGas: toBigInt(feeData.maxPriorityFeePerGas)
      };
    } catch (error) {
      // Fallback to manual rates
      debug_log('Error fetching gas prices (fallback being used):', error);
      return {
        maxFeePerGas: ethers.parseUnits('30', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
      };
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

    <div class="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3">
      <div class="flex items-center justify-center">
        <!-- <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 00-.707.293l-7 7a1 1 0 000 1.414l7 7a1 1 0 001.414-1.414L4.414 11H17a1 1 0 000-2H4.414l4.293-4.293A1 1 0 0010 3z" clip-rule="evenodd" />
        </svg> -->
        <div class="text-yellow-500 text-center overflow-x-auto max-w-full">
            {#if swapPriceDataStore.multihops}
              <span class="whitespace-nowrap">This swap requires multiple hops to complete.</span>
            {:else}
              <span class="whitespace-nowrap">This swap requires a single hop to complete.</span>
            {/if}
        </div>
      </div>
    </div>

    <!-- Settings -->
    {#if isEthWethSwap === false}
    <SwapSettings
      swapPriceDataStore={swapPriceDataStore} 
      onSlippageChange={(value) => slippageTolerance = value}
      onDeadlineChange={(value) => deadline = value}
      onPoolFeeChange={(value) => { 
        poolFee = value;
        if (tokenIn?.isStablecoin && swapManagerName.includes('uniswap')) {
          poolFee = 500;
        }
        updateSwapPriceData({ fee: poolFee });
      }}
    />
    {/if}

    <!-- Summary -->
    <SwapSummary swapPriceDataStore={swapPriceDataStore} disabled={isEthWethSwap}/>

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
      disabled={!tokenIn || !tokenOut || !fromAmount || !toAmount || isLoading || isSwapping}
    >
      {#if !isEthWethSwap}
        {isLoading ? 'Loading...' : isSwapping ? 'Swapping...' : 'Swap'}
      {:else}
        {isLoading ? 'Loading...' : tokenIn.symbol === 'WETH' ? 'Unwrap' : 'Wrap'}
      {/if}
    </button>
  </div>
</Modal>
