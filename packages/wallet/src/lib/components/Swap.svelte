<script lang="ts">
  import { onMount } from 'svelte';
  import { yakklCurrentlySelectedStore, yakklMiscStore } from '$lib/common/stores';
  import type { AccountData, CurrentlySelectedData, PriceProvider, SwapToken } from '$lib/common/interfaces';
  import TokenDropdown from './TokenDropdown.svelte';
  import Modal from './Modal.svelte';
  import WalletManager from '$lib/plugins/WalletManager';
  import { decryptData, ETH_BASE_UNISWAP_GAS_UNITS, isEncryptedData, type BigNumberish, type TransactionRequest } from '$lib/common';
  import { ethers } from 'ethers';
  import { UniswapSwapManager } from '$lib/plugins/UniswapSwapManager';
  import { TokenService } from '$plugins/blockchains/evm/ethereum/TokenService';
  import { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
  import { Token } from '$lib/plugins/Token';
  import type { Wallet } from '$lib/plugins/Wallet';
  import type { Provider } from '$lib/plugins/Provider';
  import SwapTokenPrice from './SwapTokenPrice.svelte';
  import Balance from './Balance.svelte';
  import { getTokenBalance } from '$lib/utilities/balanceUtils';
	import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
	import { EthereumGasProvider } from '$lib/plugins/providers/fees/ethereum/EthereumGasProvider';
	import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';

  // Props
  export let fundingAddress: string | null = null;
  export let initialFromToken: SwapToken | null = null;
  export let initialToToken: SwapToken | null = null;
  export let show = false;
  export let onSwap: (fundingAddress: string, tokenIn: SwapToken, tokenOut: SwapToken, fromAmount: BigNumberish, toAmount: BigNumberish) => void = () => {};
  export let className = 'text-gray-600 z-[999]';

  // State
  let tokenIn: SwapToken | null = initialFromToken;
  let tokenOut: SwapToken | null = initialToToken;
  let fromAmount = '';
  let toAmount = '';
  let fromBalance: BigNumberish = 0n;
  let toBalance: BigNumberish = 0n;
  let tokens: SwapToken[] = [];
  let preferredTokens: SwapToken[] = [];
  let selectedFromToken: SwapToken | null = tokenIn;
  let selectedToToken: SwapToken | null = tokenOut;
  
  let gasProvider: EthereumGasProvider;

  let wallet: Wallet | null = null;
  let blockchain: Ethereum | null = null;
  let provider: Provider | null = null;
  let priceProvider: PriceProvider = new CoinbasePriceProvider();  // NOTE: Provide one for now and then use the price provider service that rotates through them
  let swapManager: UniswapSwapManager | null = null;
  let tokenService: TokenService<any> | null = null;

  const preferredTokenSymbols = ["ETH", "WETH", "USDC", "WBTC"];

  let exchangeRate = "";
  let gasFee = "";
  let isLoading = false;
  let error: string | null = null;

  let slippageTolerance = 0.5; // 0.5% default slippage tolerance
  let deadline = 20; // 20 minutes default deadline

  let quoteTimer: NodeJS.Timeout | null = null;
  const QUOTE_DELAY = 300; // 300ms delay

  $: {
    if (tokenIn && tokenOut) {
      debouncedGetQuote();
    }
  }

  onMount(async () => {
    try {
      wallet = await getWallet(); 
      blockchain = wallet.getBlockchain() as Ethereum;
      provider = wallet.getProvider();
      swapManager = new UniswapSwapManager(blockchain, provider!);
      tokenService = new TokenService(blockchain);
      gasProvider = new EthereumGasProvider(provider!, blockchain!);

      tokens = await fetchTokenList();

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
      
      preferredTokens = preferredTokenSymbols.map(symbol => tokens.find(token => token.symbol === symbol)).filter(Boolean) as SwapToken[]; // The ones to appear at top of list
      tokens = tokens.filter(token => !preferredTokens.includes(token)).sort((a, b) => a.symbol.localeCompare(b.symbol));

      if (!tokenIn) tokenIn = tokens.find(token => token.symbol === 'WETH') || null;
      
      if (tokenIn) {
        await updateBalance(tokenIn, true);
      }
      if (tokenOut) {
        await updateBalance(tokenOut, false);
      }
    } catch (err) {
      console.error('Error initializing swap:', err);
      error = 'Failed to initialize swap. Please try again.';
    }
  });

  function debouncedGetQuote() {
    if (quoteTimer) clearTimeout(quoteTimer);
    quoteTimer = setTimeout(() => {
      getQuote();
    }, QUOTE_DELAY);
  }


  async function getQuote() {
    if (!tokenIn || !tokenOut || (!fromAmount && !toAmount) || !swapManager || !blockchain || !provider) {
      return;
    }

    isLoading = true;
    error = null;

    try {
      if (fromAmount && fromAmount !== '0') {
        
        console.log('Getting quote - from:', tokenIn, 'to:', tokenOut, 'fromAmount:', fromAmount);

        const quote = await swapManager.getQuote(
          Token.fromSwapToken(tokenIn, blockchain, provider),
          Token.fromSwapToken(tokenOut, blockchain, provider),
          ethers.parseUnits(fromAmount, tokenIn.decimals)
        );
        if (!quote || typeof quote.amountOut === 'undefined' || quote.amountOut === null) throw new Error('Invalid quote');
        toAmount = ethers.formatUnits(quote.amountOut.toString(), tokenOut.decimals);
      } else if (toAmount && toAmount !== '0') {

        console.log('Getting quote - from:', tokenOut, 'to:', tokenIn, 'toAmount:', toAmount);

        const quote = await swapManager.getQuote(
          Token.fromSwapToken(tokenOut, blockchain, provider),
          Token.fromSwapToken(tokenIn, blockchain, provider),
          ethers.parseUnits(toAmount, tokenOut.decimals)
        );
        if (!quote || typeof quote.amountOut === 'undefined' || quote.amountOut === null) throw new Error('Invalid quote');
        fromAmount = ethers.formatUnits(quote.amountOut.toString(), tokenIn.decimals);
      } else {
        fromAmount = '';
        toAmount = '';
      }

      await updateExchangeRate();
      await updateGasFeeEstimate();
    } catch (err) {
      console.log('Error getting quote:', err);
      error = 'Failed to get quote. Please try again.';
      if (fromAmount) {
        toAmount = '';
      } else if (toAmount) {
        fromAmount = '';
      }
    } finally {
      isLoading = false;
    }
  }

  async function updateExchangeRate() {
    if (!tokenIn || !tokenOut || !fromAmount || !toAmount) return;

    console.log('Updating exchange rate - from:', tokenIn, 'to:', tokenOut, 'fromAmount:', fromAmount, 'toAmount:', toAmount);
    const rate = parseFloat(toAmount) / parseFloat(fromAmount);
    const tokenInPrice = await getMarketPrice(tokenIn);

    console.log('Exchange rate:', rate, 'tokenInPrice:', tokenInPrice);

    exchangeRate = `1 ${tokenIn.symbol} = ${rate.toFixed(5)} ${tokenOut.symbol} ($${tokenInPrice.toFixed(2)})`;

    console.log('Exchange rate:', exchangeRate);
  }


  async function updateGasFeeEstimate() {
    if (!tokenIn || !tokenOut || !fromAmount || !wallet || !swapManager) return;

    try {
      gasFee = await gasProvider.estimateSwapGasFee(
        tokenIn,
        tokenOut,
        fromAmount,
        slippageTolerance,
        deadline,
        swapManager
      );
    } catch (err) {
      console.error('Error estimating gas fee:', err);
      gasFee = 'Unable to estimate';
    }
  }

  // async function updateGasFeeEstimate() {
  //   if (!tokenIn || !tokenOut || !fromAmount || !provider || !swapManager || !blockchain || !wallet) return;

  //   try {
  //     const fromAmountBN = EthereumBigNumber.fromEther(fromAmount);
  //     const slippageBN = fromAmountBN.mul(EthereumBigNumber.from(Math.floor(slippageTolerance * 100))).div(EthereumBigNumber.from(10000));
  //     const minAmountOut: EthereumBigNumber = EthereumBigNumber.from(fromAmountBN.sub(slippageBN));
  //     const deadlineTimestamp = Math.floor(Date.now() / 1000) + deadline * 60;

  //     const swapTx = await swapManager.populateSwapTransaction(
  //       Token.fromSwapToken(tokenIn, blockchain, provider),
  //       Token.fromSwapToken(tokenOut, blockchain, provider),
  //       fromAmountBN.toWei().toBigInt() ?? BigInt(0),
  //       minAmountOut.toWei().toBigInt() ?? BigInt(0),
  //       await wallet.getSigner()!.getAddress(),
  //       deadlineTimestamp,
  //       3000
  //     );

  //     let estimatedGas;
  //     try {
  //       estimatedGas = await provider.estimateGas(swapTx);
  //     } catch (estimateError) {
  //       console.error('Gas estimation failed:', estimateError);
  //       // Use a default gas limit as fallback
  //       estimatedGas = EthereumBigNumber.from(ETH_BASE_UNISWAP_GAS_UNITS); // Adjust this value based on typical swap gas usage
  //       // estimatedGas = getFallbackGasFee(gasPriceGwei);
  //     }

  //     console.log('Estimated gas:', estimatedGas.toString());

  //     const feeData = await provider.getFeeData();
  //     console.log('Fee data:', feeData);

  //     const gasPriceGwei = EthereumBigNumber.from(feeData.maxFeePerGas || feeData.gasPrice || 0);
  //     const gasFeeGwei = EthereumBigNumber.from(estimatedGas).mul(gasPriceGwei);

  //     console.log('Gas price (Gwei):', gasPriceGwei.toString());
  //     console.log('Gas fee (Gwei):', gasFeeGwei.toString());

  //     // Convert Gwei to ETH
  //     const gasFeeEth = EthereumBigNumber.fromGwei(gasFeeGwei.toString()).toEtherString();
      
  //     // Get current ETH price (you'll need to implement this function)
  //     const ethPrice = await getEthPrice();

  //     // Calculate gas fee in USD
  //     const gasFeeUsd = parseFloat(gasFeeEth) * ethPrice;

  //     gasFee = `$${gasFeeUsd.toFixed(2)} (${gasFeeEth} ETH)`;

  //     console.log('Gas fee:', gasFee);
  //   } catch (err) {
  //     console.error('Error estimating gas fee:', err);
  //     gasFee = 'Unable to estimate';
  //   }
  // }

  function getFallbackGasFee(gasPrice: EthereumBigNumber): string {
    const fixedGasLimit = EthereumBigNumber.from(ETH_BASE_UNISWAP_GAS_UNITS); // Typical gas limit for Uniswap swaps
    const gasFeeGwei = fixedGasLimit.mul(gasPrice);
    const gasFeeEth = EthereumBigNumber.fromGwei(gasFeeGwei.toString()).toEtherString();
    return gasFeeEth;
  }

  function handleFromAmountChange() {
    if (tokenIn && tokenOut) {
      toAmount = '';
      debouncedGetQuote();
    }
  }

  function handleToAmountChange() {
    if (tokenIn && tokenOut) {
      fromAmount = '';
      debouncedGetQuote();
    }
  }

  async function getMarketPrice(token: SwapToken): Promise<number> {
    try {
      const priceData = await priceProvider.getMarketPrice(`${token.symbol}-USD`);
      return priceData.price;
    } catch (error) {
      console.error('Error fetching market price:', error); // This could be for a number of reasons but for sure if the token symbol is not found (this means that the given token is not currently supported by the price provider) 
      return 0;
    }
  }

  async function fetchTokenList(): Promise<SwapToken[]> {
    try {
      const response = await fetch('https://tokens.uniswap.org');
      const data = await response.json();
      return data.tokens;
    } catch (error) {
      console.error('Error fetching token list:', error);
      return [];
    }
  }

  async function getWallet() {
    let privateKey: string | null | undefined = null;

    if (isEncryptedData($yakklCurrentlySelectedStore?.data)) {
      let result = await decryptData($yakklCurrentlySelectedStore?.data, $yakklMiscStore);
      let data = result as CurrentlySelectedData;
      if (isEncryptedData(data.account?.data)) {
        let result = await decryptData(data.account.data, $yakklMiscStore);
        let accountData = result as AccountData;
        privateKey = accountData.privateKey;
      } else {
        privateKey = data ? data?.account?.data.privateKey : null;
      }
    } else {
      privateKey = $yakklCurrentlySelectedStore?.data ? (($yakklCurrentlySelectedStore?.data as CurrentlySelectedData).account?.data as AccountData).privateKey : null;
    }

    if (privateKey === null) {
      throw new Error('Private key for fundingAddress (current address) was not obtained');
    }

    let wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], $yakklCurrentlySelectedStore!.shortcuts.chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_PROD, privateKey);
    await wallet.setSigner(privateKey as string);

    return wallet;
  } 

  async function fetchBalance(token: SwapToken | null): Promise<BigNumberish> {
    if (!token || !wallet || !provider) return 0n;
    
    try {
      if (token.isNative || token.symbol === 'ETH') {
        const balance = await provider.getBalance(await provider.getSigner().getAddress());
        return balance;
      } else {
        return await getTokenBalance(token, await provider.getSigner().getAddress(), provider, tokenService);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0n;
    }
  }

  async function swapTokens() {
    if (!tokenIn || !tokenOut || !fromAmount || !toAmount || !fundingAddress || !wallet || !blockchain || !swapManager || !provider) {
      error = 'Invalid swap parameters';
      return;
    }

    const fromAmountBN = ethers.parseUnits(fromAmount, tokenIn.decimals);
    const toAmountBN = ethers.parseUnits(toAmount, tokenOut.decimals);

    if (fromAmountBN <= 0n || toAmountBN <= 0n) {
      error = 'Invalid amounts';
      return;
    }

    try {
      const signer = wallet.getSigner();
      if (!signer) throw new Error('Signer not available');

      const tokenInContract = blockchain.createContract(tokenIn.address, ['function approve(address spender, uint256 amount) public returns (bool)']);
      await tokenInContract.sendTransaction('approve', swapManager.getRouterAddress(), fromAmountBN);

      const slippageBN = toAmountBN * BigInt(Math.floor(slippageTolerance * 100)) / BigInt(10000);
      const minAmountOut = toAmountBN - slippageBN;
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + deadline * 60;

      const swapTx: TransactionRequest = await swapManager.populateSwapTransaction(
        Token.fromSwapToken(tokenIn, blockchain, provider),
        Token.fromSwapToken(tokenOut, blockchain, provider),
        fromAmountBN,
        minAmountOut,
        await signer.getAddress(),
        deadlineTimestamp
      ) as TransactionRequest;

      const tx = await wallet.sendTransaction(swapTx);
      console.log('Swap transaction:', tx);
      
      onSwap(fundingAddress, tokenIn, tokenOut, fromAmountBN, toAmountBN);

      error = null;
      // You might want to add a success message or trigger a UI update here
    } catch (error: any) {
      console.error('Error executing swap:', error);
      error = `Failed to execute swap: ${error.message}`;
    }
  }

  function switchTokens() {
    [tokenIn, tokenOut] = [tokenOut, tokenIn];
    [fromAmount, toAmount] = [toAmount, fromAmount];
    [fromBalance, toBalance] = [toBalance, fromBalance];
    [selectedFromToken, selectedToToken] = [selectedToToken, selectedFromToken];
    debouncedGetQuote();
  }

  async function updateBalance(token: SwapToken | null, isFromToken: boolean) {
    const balance = await fetchBalance(token);
    if (isFromToken) {
      fromBalance = balance;
    } else {
      toBalance = balance;
    }
  }

  async function handleTokenSelect(token: SwapToken | null, isFromToken: boolean) {
    if (isFromToken) {
      tokenIn = token;
      selectedFromToken = token;
    } else {
      tokenOut = token;
      selectedToToken = token;
    }
    if (token) {
      await updateBalance(token, isFromToken);
      if (tokenIn && tokenOut) {
        if (fromAmount) {
          await getQuote();
        } else if (toAmount) {
          await getQuote();
        }
      }
    }
  }

  function close() {
    show = false;
  }

</script>

<Modal bind:show title="Swap" {className}>
  <div class="p-6">
    <div class="space-y-4">
      <!-- Sell section -->
      <span>Sell</span>
      <div class="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-lg p-4">
        <div class="flex justify-between items-center">
          <input
            type="text"
            bind:value={fromAmount}
            on:input={handleFromAmountChange}
            class="bg-transparent text-3xl font-bold focus:outline-none w-1/2 mr-4"
            placeholder="0"
            min="0"
          />
          <TokenDropdown
            tokens={[...preferredTokens, ...tokens]}
            selectedToken={selectedFromToken}
            onTokenSelect={(token) => handleTokenSelect(token, true)}
          />
        </div>
        <div class="flex justify-between items-center mt-2 text-sm">
          {#if tokenIn}
            <SwapTokenPrice 
              tokenIn={tokenIn}
              tokenOut={tokenOut}
              amountIn={fromAmount}
              isExactIn={true}
              customClass="text-gray-500"
            />
            <Balance token={tokenIn} address={fundingAddress} {provider} {tokenService} />
          {/if}
        </div>
      </div>

      <!-- Switch button -->
      <button
        on:click={switchTokens}
        class="mx-auto block bg-gray-200 p-2 rounded-full transform transition-transform hover:rotate-180"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </button>

      <!-- Buy section -->
      <span>Buy</span>
      <div class="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-lg p-4">
        <div class="flex justify-between items-center">
          <input
            type="text"
            bind:value={toAmount}
            on:input={handleToAmountChange}
            class="bg-transparent text-3xl font-bold focus:outline-none w-1/2 mr-4"
            placeholder="0"
            min="0"
          />
          <TokenDropdown
            tokens={[...preferredTokens, ...tokens]}
            selectedToken={selectedToToken}
            onTokenSelect={(token) => handleTokenSelect(token, false)}
          />
        </div>
        <div class="flex justify-between items-center mt-2 text-sm">
          {#if tokenOut}
            <SwapTokenPrice 
              tokenIn={tokenIn}
              tokenOut={tokenOut}
              amountOut={toAmount}
              isExactIn={false}
              customClass="text-gray-500"
            />
            <Balance token={tokenOut} address={fundingAddress} {provider} {tokenService} />
          {/if}
        </div>
      </div>

      <!-- Exchange rate and gas fee -->
      <div class="text-sm text-gray-500 flex justify-between">
        <span>{exchangeRate}</span>
        <span>Gas fee ≈ {gasFee}</span>
      </div>

      <!-- Slippage and Deadline settings -->
      <div class="flex justify-between items-center">
        <div>
          <label for="slippage" class="block text-sm font-medium text-gray-700">Slippage Tolerance</label>
          <select id="slippage" bind:value={slippageTolerance} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option value={0.1}>0.1%</option>
            <option value={0.5}>0.5%</option>
            <option value={1}>1%</option>
            <option value={3}>3%</option>
          </select>
        </div>
        <div>
          <label for="deadline" class="block text-sm font-medium text-gray-700">Transaction Deadline</label>
          <select id="deadline" bind:value={deadline} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option value={10}>10 minutes</option>
            <option value={20}>20 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </div>
      </div>

      <!-- Error message -->
      {#if error}
        <div class="text-red-500 text-center">{error}</div>
      {/if}

      <!-- Swap button -->
      <button
        on:click={swapTokens}
        class="w-full px-4 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={!tokenIn || !tokenOut || !fromAmount || !toAmount || isLoading || !!error || (tokenIn && fromBalance !== undefined && fromBalance !== null && parseFloat(fromAmount) > parseFloat(ethers.formatUnits(fromBalance.toString(), tokenIn.decimals)))}
      >
        {isLoading ? 'Loading...' : 'Swap'}
      </button>
    </div>
  </div>
</Modal>
