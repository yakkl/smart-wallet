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
  import { ethers as ethersv6 } from 'ethers-v6';
  import { UniswapSwapManager } from '$lib/plugins/UniswapSwapManager';
  import { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
  import { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
  import { Token } from '$lib/plugins/Token';
  import type { Provider } from '$lib/plugins/Provider';
  import { derived, writable } from 'svelte/store';
  import { getTokenBalance } from '$lib/utilities/balanceUtils';
  import debounce from 'lodash/debounce';
  import { toBigInt } from '$lib/common/math';
	import { GasToken } from '$lib/plugins/GasToken';
	import { validateSwapQuote, type ValidationResult } from '$lib/common/validation';
	// import { multiHopQuoteAlphaRouter } from '$lib/plugins/alphaRouter';

// Add back to package.json - 		"@yakkl/uniswap-alpha-router-service": "workspace:*",

  interface Props {
    // Props
    fundingAddress: string;
    provider: Provider; // Provider must have Signer set before calling Swap!
    blockchain: Ethereum;
    swapManager: UniswapSwapManager;
    tokenService: TokenService<any>;
    show?: boolean;
    onSwap?: (fundingAddress: string, tokenIn: SwapToken, tokenOut: SwapToken, fromAmount: BigNumberish, toAmount: BigNumberish) => void;
    className?: string;
  }

  let {
    fundingAddress,
    provider,
    blockchain,
    swapManager,
    tokenService,
    show = $bindable(false),
    onSwap = () => {},
    className = 'text-gray-600 z-[999]'
  }: Props = $props();

  const SUPPORTED_STABLECOINS = [ 'USDC', 'USDT', 'DAI', 'BUSD' ];

  let browser_ext: Browser;
  if (browserSvelte) browser_ext = getBrowserExt();

  // May could have passed this in as a prop
  let gasToken: GasToken = $state();

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
    multiHop: false,
    slippageTolerance: 0.5,
    deadline: 10,
    error: null,
    isLoading: false,
  };

  // Create stores
  interface SwapStateStore {
    tokenIn: SwapToken,
    tokenOut: SwapToken,
    fromAmount: string,
    toAmount: string,
    fromBalance: string,
    error: string,
    deadline: number,            // Default value for deadline
    slippageTolerance: number,  // Default slippage tolerance in percentage
    poolFee: number,           // Default pool fee in basis points (e.g., 0.3%)
    multiHop: boolean,
  };

  interface UIStateStore {
    resetValues: boolean,
    isLoading: boolean,
    isSwapping: boolean,
  }

  const swapPriceDataStore = writable<SwapPriceData>(initialSwapPriceData);
  const insufficientBalanceStore = writable(false);

  let swapStateStore = writable<SwapStateStore>({
    tokenIn: initialToken,
    tokenOut: initialToken,
    fromAmount: '',
    toAmount: '',
    fromBalance: '0',
    error: '',
    deadline: 10,            // Default value for deadline
    slippageTolerance: 0.5,  // Default slippage tolerance in percentage
    poolFee: 3000,           // Default pool fee in basis points (e.g., 0.3%)
    multiHop: false,
  });

  let uiStateStore = writable<UIStateStore>({
    resetValues: false,
    isLoading: false,
    isSwapping: false,
  });

  // State
  // let tokenIn: SwapToken = $state(initialToken);
  // let tokenOut: SwapToken = $state(initialToken);
  // let fromAmount = $state('');
  // let toAmount = $state('');
  // let fromBalance = $state('0');
  // let slippageTolerance = $state(0.5);  // 0.5% default - amount in percentage of acceptable slippage from quoted price
  // let deadline = $state(10);  // 10 minutes default
  // let poolFee = $state(3000); // 0.3% fee default
  // let error: string | null = $state(null);
  // let isLoading = $state(false);
  // let isSwapping = $state(false);
  // let resetValues = $state(false);
  // let multiHop = $state(false);

  // eslint-disable-next-line svelte/non-reactive-declaration
  // let tokens: SwapToken[] = [];

  // svelte-ignore non_reactive_update
  // let preferredTokens: SwapToken[] = [];

  let lastModifiedPanel: 'sell' | 'buy' = 'sell';
  let swapManagerName = '';
  let pricesInterval: NodeJS.Timeout;
  let isEthWethSwap = $state(false);

  // Initialize
  onMount(async () => {
    try {
      reset();

      const chainId = 1;
      // Provider must have Signer set before calling Swap!
      gasToken = new GasToken('YAKKL GasToken', 'ETH', blockchain, provider, fundingAddress); // Native token for now

      // Defaulting gas price check as last thing in onMount
      if (gasToken) {
        gasToken.getMarketPrice().then(price => {
          updateSwapPriceData( { marketPriceGas: price.price });
        });
      }
      pricesInterval = setInterval(fetchPrices, 60000);
    } catch (err) {
      error_log('Error initializing swap:', err);
      $swapStateStore.error = 'Failed to initialize swap. Please try again.';
    }
  });

  onDestroy(() => {
    clearInterval(pricesInterval);
    debouncedGetQuote.cancel();
    debouncedCheckBalance.cancel();
    debouncedGetMarketPrice.cancel();
    reset();
  });

    // WIP Test

  const quoteTrigger = derived(
    [swapStateStore],
    ([$swapStateStore]) => {
      const { deadline, slippageTolerance, poolFee } = $swapStateStore;
      return { deadline, slippageTolerance, poolFee };
    }
  );
  // WIP End Test

  $effect(() => {
    if (quoteTrigger) {
      debouncedGetQuote();
    }
  });

  // Reactive statements
  // $effect(() => {
  //   if (deadline || slippageTolerance || poolFee) {
  //     debouncedGetQuote();
  //   }
  // });

  $effect(() => {
    $swapStateStore.multiHop = $swapPriceDataStore.multiHop;
  });

  $effect(() => {
    const { tokenIn, tokenOut } = $swapPriceDataStore;
    if (tokenIn.symbol === 'ETH' && tokenOut.symbol === 'WETH' ||
        (tokenIn.symbol === 'WETH' && tokenOut.symbol === 'ETH')) {
      isEthWethSwap = true;
    }
    else {
      isEthWethSwap = false;
    }
  });

  // const isEthWethSwap = derived(
  //   [swapPriceDataStore], // Source store(s)
  //   ([$swapPriceDataStore]) => {
  //     const { tokenIn, tokenOut } = $swapPriceDataStore;
  //     if (tokenIn.symbol === 'ETH' && tokenOut.symbol === 'WETH' ||
  //       (tokenIn.symbol === 'WETH' && tokenOut.symbol === 'ETH')) {
  //       return true;
  //     }
  //     else {
  //       return false;
  //     }
  //   }
  // );

  // $effect(() => {
  //   if ($swapStateStore.tokenIn && $swapStateStore.fromAmount) {
  //     debug_log('Checking balance:', $swapStateStore.tokenIn, $swapStateStore.fromAmount, fundingAddress);

  //     checkBalance($swapStateStore.tokenIn, $swapStateStore.fromAmount, fundingAddress); // Only need the selling token balance to verify if there are enough funds but we also need to verify ETH for gas
  //     if (gasToken && $swapPriceDataStore.marketPriceGas === 0) {
  //       gasToken.getMarketPrice().then(price => {
  //         updateSwapPriceData( { marketPriceGas: price.price }); // TODO: Need to add isInsufficient check for gas so we can show the error message and offer an alternative if there is one
  //       });
  //     }

  //     // Only need to update if we have a tokenIn and the market price is 0
  //     if ($swapStateStore.tokenIn.symbol && swapManager && $swapPriceDataStore.marketPriceIn === 0) {
  //       swapManager.getMarketPrice(`${$swapStateStore.tokenIn.symbol}-USD`).then(price => {
  //         if (price.price <= 0) {
  //           // debug_log('$swapStateStore.tokenIn - Market price is 0: (ignored)', price);
  //           return;
  //         }
  //         updateSwapPriceData( { marketPriceIn: price.price });
  //       }).catch(err => {
  //         error_log('$swapStateStore.tokenIn - Error fetching market price:', err);
  //       });
  //     }
  //   }
  // });

  $effect(() => {
    const { tokenIn, fromAmount } = $swapStateStore;
      if (tokenIn && fromAmount) {
          debouncedCheckBalance(tokenIn, fromAmount, fundingAddress);

          if (gasToken && $swapPriceDataStore.marketPriceGas === 0) {
              gasToken.getMarketPrice().then(price => {
                  if ($swapPriceDataStore.marketPriceGas === 0) {
                      updateSwapPriceData({ marketPriceGas: price.price });
                  }
              });
          }

          if (tokenIn.symbol && swapManager && $swapPriceDataStore.marketPriceIn === 0) {
            debouncedGetMarketPrice(tokenIn);
          }
      }
  });

  $effect(() => {
    if ($swapStateStore.tokenOut && $swapStateStore.toAmount) {
      // Only need to update if we have a tokenOut and the market price is 0
      if ($swapStateStore.tokenOut.symbol && swapManager && $swapPriceDataStore.marketPriceOut === 0) {
        swapManager.getMarketPrice(`${$swapStateStore.tokenOut.symbol}-USD`).then(price => {
          if (price.price <= 0) {
            return;
          }
          updateSwapPriceData( { marketPriceOut: price.price });
        }).catch(err => {
          error_log('tokenOut - Error fetching market price:', err);
        });
      }
    }
  });

  // Debounced quote handler, check balance, and market price
  const debouncedGetQuote = debounce(() => {
    getQuote();
  }, 300);

  const debouncedCheckBalance = debounce(checkBalance, 300);
  const debouncedGetMarketPrice = debounce(async (token) => {
      const price = await swapManager.getMarketPrice(`${token.symbol}-USD`);
      if (price.price > 0) {
          updateSwapPriceData({ marketPriceIn: price.price });
      }
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

    if ($swapStateStore.tokenIn && $swapStateStore.tokenIn.symbol && swapManager) {
      try {
        const price = await swapManager.getMarketPrice(`${$swapStateStore.tokenIn.symbol}-USD`);
        updateSwapPriceData({ marketPriceIn: price.price });
      } catch (error) {
        error_log('Error fetching market price:', error);
      }
    }

    if ($swapStateStore.tokenOut && $swapStateStore.tokenOut.symbol && swapManager) {
      try {
        const price = await swapManager.getMarketPrice(`${$swapStateStore.tokenOut.symbol}-USD`);
        updateSwapPriceData({ marketPriceOut: price.price });
      } catch (error) {
        error_log('Error fetching market price:', error);
      }
    }
  }

  // Handler functions
  async function handleSellAmountChange(amount: string) {
    $swapStateStore.error = '';
    $swapStateStore.fromAmount = amount;
    lastModifiedPanel = 'sell';

    if (amount !== '.' && isNaN(parseFloat(amount))) {
      $swapStateStore.fromAmount = '';//$swapStateStore.toAmount = '';
      updateSwapPriceData({
        amountIn: 0n,
        amountOut: 0n
      });
      return;
    }

    try {
      const parsedAmount = parseAmount(amount, $swapStateStore.tokenIn.decimals);
      updateSwapPriceData({
        amountIn: parsedAmount
      });
      if ($swapStateStore.tokenIn && $swapStateStore.tokenOut) await getQuote(true);
    } catch (err) {
      error_log('Error handling sell amount change:', err);
      $swapStateStore.error = 'Failed to process sell amount';
    }
  }

  async function handleBuyAmountChange(amount: string) {
    $swapStateStore.error = '';
    $swapStateStore.toAmount = amount;
    lastModifiedPanel = 'buy';

    if (amount !== '.' && isNaN(parseFloat(amount))) {
      $swapStateStore.toAmount = ''; // TBD: Should it be fromAmount?
      updateSwapPriceData({
        amountOut: 0n
      });
      return;
    }

    try {
      const parsedAmount = parseAmount(amount, $swapStateStore.tokenOut.decimals);
      updateSwapPriceData({
        amountOut: parsedAmount
      });
      if ($swapStateStore.tokenIn && $swapStateStore.tokenOut) await getQuote(false);
    } catch (err) {
      error_log('Error handling buy amount change:', err);
      $swapStateStore.error = 'Failed to process buy amount';
    }
  }

  async function handleTokenSelect(token: SwapToken, type: 'sell' | 'buy') {
    $swapStateStore.error = '';
    // This is a helper function to set the pool fee for stablecoins
    if (token.isStablecoin || SUPPORTED_STABLECOINS.includes(token.symbol)) { //&& swapManagerName.includes('uniswap')) { // May want to add an override flag that gets set if a pool fee is changed and if then skip this check
      $swapStateStore.poolFee = 500;
      token.isStablecoin = true;
      updateSwapPriceData({ fee: $swapStateStore.poolFee });
    }

    if (!token.balance || toBigInt(token.balance) <= 0n) {
      token.balance = await getTokenBalance(token, fundingAddress, provider, tokenService);
    }
    const formattedBalance = ethersv6.formatUnits(toBigInt(token.balance), token.decimals);  // NOTE: This and all ethers specific code should be moved to the TokenService - maybe

    if (type === 'sell') {
      $swapStateStore.tokenIn = token;
      updateSwapPriceData({ tokenIn: token });
      $swapStateStore.fromBalance = formattedBalance;
    } else {
      $swapStateStore.tokenOut = token;
      updateSwapPriceData({ tokenOut: token });
      // toBalance = formattedBalance;
    }

    if ($swapStateStore.tokenIn && $swapStateStore.tokenOut) {
      if (lastModifiedPanel === 'sell' && $swapStateStore.fromAmount) {
        handleSellAmountChange($swapStateStore.fromAmount);
      } else if (lastModifiedPanel === 'buy' && $swapStateStore.toAmount) {
        handleBuyAmountChange($swapStateStore.toAmount);
      }
    }
  }

  function switchTokens() {
    [$swapStateStore.tokenIn, $swapStateStore.tokenOut] = [$swapStateStore.tokenOut, $swapStateStore.tokenIn];
    [$swapStateStore.fromAmount, $swapStateStore.toAmount] = [$swapStateStore.toAmount, $swapStateStore.fromAmount];

    updateSwapPriceData({
      tokenIn: $swapStateStore.tokenIn,
      tokenOut: $swapStateStore.tokenOut,
      amountIn: $swapStateStore.toAmount ? parseAmount($swapStateStore.toAmount, $swapStateStore.tokenIn.decimals) : 0n,
      amountOut: $swapStateStore.fromAmount ? parseAmount($swapStateStore.fromAmount, $swapStateStore.tokenOut.decimals) : 0n
    });

    if ($swapStateStore.tokenIn && $swapStateStore.tokenOut) {
      if ($swapStateStore.fromAmount) handleSellAmountChange($swapStateStore.fromAmount);
      else if ($swapStateStore.toAmount) handleBuyAmountChange($swapStateStore.toAmount);
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
        const formattedBalance = ethersv6.formatUnits(balance, token.decimals);

        // Only update if the balance actually changes
        if (formattedBalance !== $swapStateStore.fromBalance) {
            $swapStateStore.fromBalance = formattedBalance;
            token.balance = balance;
        }

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

  // async function fetchTokenList(): Promise<SwapToken[]> {
  //   try {
  //     if ( browserSvelte ) {
  //       const response = await fetch(browser_ext.runtime.getURL('/data/uniswap.json')); // 'https://tokens.uniswap.org' );
  //       const data = await response.json();
  //       data.tokens
  //         .filter( ( token: SwapToken ) => token.chainId === (blockchain ? blockchain.getChainId() || 1 : 1))
  //         .map( ( token: SwapToken ) => {
  //           if ( SUPPORTED_STABLECOINS.includes( token.symbol ) ) {
  //             token.isStablecoin = true;
  //           }
  //           return token;
  //         } );
  //       return data.tokens.filter((token: SwapToken) => token.chainId === 1); // blockchain.getChainId() || 1);
  //     }
  //     return [];
  //   } catch (error) {
  //     error_log('Error fetching token list:', error);
  //     return [];
  //   }
  // }

  // function getPreferredTokens(tokens: SwapToken[]): SwapToken[] {
  //   const preferredTokenSymbols = ["ETH", "WETH", "USDC", "USDT", "WBTC"];
  //   return preferredTokenSymbols
  //     .map(symbol => tokens.find(token => token.symbol === symbol))
  //     .filter((token): token is SwapToken => token !== undefined);
  // }

  async function validateBalance(): Promise<boolean> {
    try {
      if (!$swapStateStore.tokenIn || !$swapStateStore.fromAmount || !fundingAddress) return false;
      // Get token or native balance
      const balance = await getTokenBalance($swapStateStore.tokenIn, fundingAddress, provider, tokenService);
      // Parse amounts
      const swapAmount = ethersv6.parseUnits($swapStateStore.fromAmount, $swapStateStore.tokenIn.decimals);

      // If native token (ETH), account for gas
      if ($swapStateStore.tokenIn.isNative) {
        const gasEstimate = $swapPriceDataStore.gasEstimate || 0n;
        const totalRequiredAmount = swapAmount + (BigNumber.toBigInt(gasEstimate) || 0n);
        if (balance < totalRequiredAmount) {
          $swapStateStore.error = `Insufficient ${$swapStateStore.tokenIn.symbol} balance. Need ${ethersv6.formatUnits(totalRequiredAmount, $swapStateStore.tokenIn.decimals)} ${$swapStateStore.tokenIn.symbol}, but have ${ethersv6.formatUnits(balance, $swapStateStore.tokenIn.decimals)} ${$swapStateStore.tokenIn.symbol}`;
          return false;
        }
      } else {
        // For ERC20 tokens, check swap amount
        const feeAmount = $swapPriceDataStore.feeAmount || 0n;
        const totalRequiredAmount = swapAmount;
        if (balance < totalRequiredAmount) {
          $swapStateStore.error = `Insufficient ${$swapStateStore.tokenIn.symbol} balance. Need ${ethersv6.formatUnits(totalRequiredAmount, $swapStateStore.tokenIn.decimals)} ${$swapStateStore.tokenIn.symbol}, but have ${ethersv6.formatUnits(balance, $swapStateStore.tokenIn.decimals)} ${$swapStateStore.tokenIn.symbol}`;
          return false;
        }
      }
      return true;
    } catch (err) {
      console.log('Error validating balance:', err);
      $swapStateStore.error = 'Failed to validate balance. Please try again.';
      return false;
    }
  }

  // Fix for the quote formatting issue
  async function getQuote(isExactIn: boolean = true) {
    if (!$swapStateStore.tokenIn.symbol || !$swapStateStore.tokenOut.symbol || (!$swapStateStore.fromAmount && !$swapStateStore.toAmount)) return;
    if (isEthWethSwap) {
      updateSwapPriceData({feeAmount: 0n}); // May want to force fees, slippage, etc. to 0 here
      return; // Do nothing here for now
    }

    try {
      $uiStateStore.isLoading = true;
      const amount = isExactIn
        ? parseAmount($swapStateStore.fromAmount, $swapStateStore.tokenIn.decimals)
        : parseAmount($swapStateStore.toAmount, $swapStateStore.tokenOut.decimals);

      $swapStateStore.slippageTolerance = $swapPriceDataStore.slippageTolerance || 0.5;
      $swapStateStore.deadline = $swapPriceDataStore.deadline || 10;

      const quote = await swapManager.getQuote(
        Token.fromSwapToken($swapStateStore.tokenIn, blockchain, provider),
        Token.fromSwapToken($swapStateStore.tokenOut, blockchain, provider),
        amount,
        fundingAddress,
        isExactIn,
        $swapStateStore.poolFee
      );


    // const { multiHopQuoteAlphaRouter } = await import('../plugins/alphaRouter');

    // multiHopQuoteAlphaRouter(
    //   Token.fromSwapToken($swapStateStore.tokenIn, blockchain, provider),
    //   Token.fromSwapToken($swapStateStore.tokenOut, blockchain, provider),
    //   amount,
    //   fundingAddress,
    //   isExactIn );


      if (!quote || quote.error) {
        $swapStateStore.error = 'No valid pool found for this token pair. Try a different combination.';
        return;
      }

      // Reset the slippage and deadline to correct values
      if (quote) {
        quote.slippageTolerance = $swapStateStore.slippageTolerance;
        quote.deadline = $swapStateStore.deadline;
      }

      // Handle the BigNumberish type safely
      if (isExactIn) {
        const amountOut = quote.amountOut ?? 0n;
        $swapStateStore.toAmount = ethersv6.formatUnits(toBigInt(amountOut), $swapStateStore.tokenOut.decimals);
      } else {
        const amountIn = quote.amountIn ?? 0n;
        $swapStateStore.fromAmount = ethersv6.formatUnits(toBigInt(amountIn), $swapStateStore.tokenIn.decimals);
      }
      updateSwapPriceData(quote);
    } catch (err) {
      error_log('Quote Error:', err);
      $swapStateStore.error = `Failed to get quote: ${err}`;
      $swapStateStore.toAmount = '';
    } finally {
      $uiStateStore.isLoading = false;
    }
  }

  // May want to make this a little less dependent on the store and move to a more generic function
  async function validateQuote() {
    let returnCode: boolean = false;

    if (!$swapStateStore.tokenIn || !$swapStateStore.tokenOut || !$swapStateStore.fromAmount || !$swapStateStore.toAmount || !fundingAddress || !swapManager) {
      $swapStateStore.error = 'Invalid swap parameters';
      return returnCode;
    }
    if (!$swapPriceDataStore) {
      $swapStateStore.error = 'Failed to get quote';
      return returnCode;
    }
    if ($swapPriceDataStore.error) {
      $swapStateStore.error = $swapPriceDataStore.error;
      return returnCode;
    }
    if ($insufficientBalanceStore) {
      $swapStateStore.error = `Insufficient balance for the given swap. You need ETH for gas fees and enough ${$swapStateStore.tokenIn.symbol} to sell/swap.`;
      return returnCode;
    }

    if (!await validateBalance()) { // Redundant check for now
      $swapStateStore.error = 'Insufficient balance for the given swap';
      return;
    }

    const results: ValidationResult = validateSwapQuote($swapPriceDataStore);

    if (results.error) {
      $swapStateStore.error = results.error;
      error_log('Validation error:', $swapStateStore.error);
      return returnCode;
    }

    return true;
  }

  async function swapTokens() {
    try {
      if (isEthWethSwap) {
        updateSwapPriceData({feeAmount: 0n}); // May want to force fees, slippage, etc. to 0 here
        // May want to do something with receipts later...
        if ($swapStateStore.tokenIn.symbol === 'ETH' && $swapStateStore.tokenOut.symbol === 'WETH') {
          // Wrap ETH to WETH
          const receipt = swapManager.wrapETH(ethersv6.parseUnits($swapStateStore.fromAmount, $swapStateStore.tokenIn.decimals), fundingAddress);
        } else if ($swapStateStore.tokenIn.symbol === 'WETH' && $swapStateStore.tokenOut.symbol === 'ETH') {
          // Unwrap WETH to ETH
          const receipt = swapManager.unwrapWETH(ethersv6.parseUnits($swapStateStore.fromAmount, $swapStateStore.tokenIn.decimals), fundingAddress);
        }
        return;
      }
      $uiStateStore.isSwapping = true;
      $swapStateStore.error = '';
      // Make sure getQuote has been called successfully
      if (!await validateQuote()) {
        $uiStateStore.isSwapping = false;
        return; // Error message is set in validateQuote
      }

      const tokenInInstance = Token.fromSwapToken($swapPriceDataStore.tokenIn, blockchain, provider);
      const tokenOutInstance = Token.fromSwapToken($swapPriceDataStore.tokenOut, blockchain, provider);

      if (!$swapPriceDataStore.tokenIn.isNative) {
        const allowance = await swapManager.checkAllowance(tokenInInstance, fundingAddress);
        const requiredAmount = ethersv6.parseUnits($swapStateStore.fromAmount, tokenInInstance.decimals);

        if (allowance < requiredAmount) {
          const receipt = await swapManager.approveToken(tokenInInstance, $swapStateStore.fromAmount);
        }
      }

      const { maxFeePerGas, maxPriorityFeePerGas } = await getCurrentGasPrices();

      const params: SwapParams = {
        tokenIn: tokenInInstance,
        tokenOut: tokenOutInstance,
        amount: ethersv6.parseUnits($swapStateStore.fromAmount, $swapPriceDataStore.tokenIn.decimals),
        fee: $swapPriceDataStore.fee || $swapStateStore.poolFee, // Basis points - not used here for multihops
        slippage: $swapPriceDataStore.slippageTolerance || $swapStateStore.slippageTolerance,
        deadline: $swapPriceDataStore.deadline || $swapStateStore.deadline,
        recipient: $swapPriceDataStore.fundingAddress,
        feeRecipient: import.meta.env.VITE_YAKKL_FEE_RECIPIENT || 'aifees.eth', // Fee recipient address
        feeAmount: $swapPriceDataStore.feeAmount || 0n,
        gasLimit: toBigInt($swapPriceDataStore.gasEstimate) || ETH_BASE_SWAP_GAS_UNITS,
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
      };

      const [receiptTrans, receiptFee] = await swapManager.executeFullSwap(params); // May want to do something with receipts later...

      onSwap(
        fundingAddress,
        $swapStateStore.tokenIn,
        $swapStateStore.tokenOut,
        ethersv6.parseUnits($swapStateStore.fromAmount, $swapStateStore.tokenIn.decimals),
        ethersv6.parseUnits($swapStateStore.toAmount, $swapStateStore.tokenOut.decimals)
      ); // Notify parent component - could add more data here such as fee, feeAmount, etc.

      $swapStateStore.error = '';
      reset();
      show = false;
    } catch (err: any) {
      $uiStateStore.isSwapping = false;
      error_log('Error executing swap:', err);
      $swapStateStore.error = `Failed to execute swap: ${err.message}`;
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
        maxFeePerGas: ethersv6.parseUnits('30', 'gwei'),
        maxPriorityFeePerGas: ethersv6.parseUnits('1', 'gwei')
      };
    }
  }

  function reset() {
    $swapStateStore.tokenIn = initialToken;
    $swapStateStore.tokenOut = initialToken;
    $swapStateStore.fromAmount = '';
    $swapStateStore.toAmount = '';
    $swapStateStore.fromBalance = '0';
    $swapStateStore.error = '';
    lastModifiedPanel = 'sell';
    insufficientBalanceStore.set(false);
    swapPriceDataStore.set(initialSwapPriceData);
    $uiStateStore.resetValues = true;
  }

</script>

<Modal bind:show title="Swap" {className}>
  <div class="p-6 space-y-4">
    <!-- Sell Section -->
           <!-- tokens={[...preferredTokens, ...tokens]} -->

    <span>Sell</span>
    <SellTokenPanel
      swapPriceDataStore={swapPriceDataStore}
      disabled={false}
      insufficientBalance={$insufficientBalanceStore}
      balance={$swapStateStore.fromBalance}
      bind:resetValues={$uiStateStore.resetValues}
      onTokenSelect={(token) => handleTokenSelect(token, 'sell')}
      onAmountChange={handleSellAmountChange}
    />

    <!-- Switch Button -->
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button
      onclick={switchTokens}
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
      disabled={false}
      bind:resetValues={$uiStateStore.resetValues}
      onTokenSelect={(token) => handleTokenSelect(token, 'buy')}
      onAmountChange={handleBuyAmountChange}
    />

    <div class="w-full bg-blue-400 border border-blue-800 rounded-lg p-3">
      <div class="flex items-center justify-center">
        <!-- <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 00-.707.293l-7 7a1 1 0 000 1.414l7 7a1 1 0 001.414-1.414L4.414 11H17a1 1 0 000-2H4.414l4.293-4.293A1 1 0 0010 3z" clip-rule="evenodd" />
        </svg> -->
        <div class="text-blue-700 text-center overflow-x-auto max-w-full">
            {#if $swapStateStore.multiHop}
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
      onSlippageChange={(value) => $swapStateStore.slippageTolerance = value}
      onDeadlineChange={(value) => $swapStateStore.deadline = value}
      onPoolFeeChange={(value) => {
        $swapStateStore.poolFee = value;
        if ($swapStateStore.tokenIn?.isStablecoin && swapManagerName.includes('uniswap')) {
          $swapStateStore.poolFee = 500;
        }
        updateSwapPriceData({ fee: $swapStateStore.poolFee });
      }}
    />
    {/if}

    <!-- Summary -->
    <SwapSummary swapPriceDataStore={swapPriceDataStore} disabled={isEthWethSwap}/>

    <!-- Error Message -->
    {#if $swapStateStore.error}
      <div class="w-full bg-red-50 border border-red-200 rounded-lg p-3">
        <div class="flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div class="text-red-500 text-center overflow-x-auto max-w-full">
            <span class="whitespace-nowrap">{$swapStateStore.error}</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Reset Button -->
    <button
      onclick={reset}
      class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Reset Swap
    </button>

    <!-- Swap Button -->
    <button
      onclick={swapTokens}
      class="w-full px-4 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      disabled={!$swapStateStore.tokenIn || !$swapStateStore.tokenOut || !$swapStateStore.fromAmount || !$swapStateStore.toAmount || $uiStateStore.isLoading || $uiStateStore.isSwapping}
    >
      {#if !isEthWethSwap}
        {$uiStateStore.isLoading ? 'Loading...' : $uiStateStore.isSwapping ? 'Swapping...' : 'Swap'}
      {:else}
        {$uiStateStore.isLoading ? 'Loading...' : $swapStateStore.tokenIn.symbol === 'WETH' ? 'Unwrap' : 'Wrap'}
      {/if}
    </button>
  </div>
</Modal>
