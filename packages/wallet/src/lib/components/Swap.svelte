<script lang="ts">
  import { onMount } from 'svelte';
  import { yakklCurrentlySelectedStore, yakklMiscStore } from '$lib/common/stores';
  import type { AccountData, CurrentlySelectedData, PriceProvider, SwapParams, SwapToken } from '$lib/common/interfaces';
  import TokenDropdown from './TokenDropdown.svelte';
  import Modal from './Modal.svelte';
  import WalletManager from '$lib/plugins/WalletManager';
  import { decryptData, isEncryptedData, type BigNumberish } from '$lib/common';
  import { ethers } from 'ethers';
  import { UniswapSwapManager } from '$lib/plugins/UniswapSwapManager';
  import { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
  import { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
  import { Token } from '$lib/plugins/Token';
  import type { Wallet } from '$lib/plugins/Wallet';
  import type { Provider } from '$lib/plugins/Provider';
  import SwapTokenPrice from './SwapTokenPrice.svelte';
  import { getTokenBalance } from '$lib/utilities/balanceUtils';
  import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
  import { EthereumGasProvider } from '$lib/plugins/providers/fees/ethereum/EthereumGasProvider';
  import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';
  import type { Signer } from '$lib/plugins/Signer';
  import TokenBalance from './TokenBalance.svelte';

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
  let ethersProvider: ethers.JsonRpcProvider | undefined;
  let signer: Signer | null = null;
  let priceProvider: PriceProvider = new CoinbasePriceProvider();
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

  let userEnteredFrom = false;
  let userEnteredTo = false;

  $: {
    if (tokenIn && tokenOut || (slippageTolerance && tokenIn && tokenOut)) debouncedGetQuote();
  }

  onMount(async () => {
    try {
      wallet = await getWallet(); 
      blockchain = wallet.getBlockchain() as Ethereum;
      provider = wallet.getProvider();
      if (provider) {
        const url = await provider.getProviderURL();
        ethersProvider = new ethers.JsonRpcProvider(url);
      }

      swapManager = new UniswapSwapManager(blockchain, provider!);
      tokenService = new TokenService(blockchain);
      gasProvider = new EthereumGasProvider(provider!, blockchain!, new CoinbasePriceProvider());

      if (!wallet || !blockchain || !provider || !swapManager || !tokenService) {
        throw new Error('Failed to initialize wallet, blockchain, provider, swap manager, or token service');
      }

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
      
      preferredTokens = preferredTokenSymbols
        .map(symbol => tokens.find(token => token.symbol === symbol))
        .filter((token): token is SwapToken => token !== undefined);
      
      tokens = tokens
        .filter(token => !preferredTokens.includes(token))
        .sort((a, b) => a.symbol.localeCompare(b.symbol));

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

  function validateAmount(value: string): boolean {
    // Only allow numbers and one decimal point
    const regex = /^\d*\.?\d*$/;
    return regex.test(value);
  }

  function handleFromAmountInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (!validateAmount(value)) {
      input.value = fromAmount;
      return;
    }

    userEnteredFrom = true;
    userEnteredTo = false;
    fromAmount = value;

    if (tokenIn && tokenOut) {
      debouncedGetQuote();
    }
  }

  function handleToAmountInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (!validateAmount(value)) {
      input.value = toAmount;
      return;
    }

    userEnteredTo = true;
    userEnteredFrom = false;
    toAmount = value;

    if (tokenIn && tokenOut) {
      debouncedGetQuote();
    }
  }

  async function getQuote() {
    if (!tokenIn || !tokenOut) {
      console.log('Both tokens must be selected for quote');
      return;
    }

    if (!fromAmount && !toAmount) {
      console.log('No amount specified for quote');
      return;
    }

    if (!swapManager) {
      console.log('Swap manager not initialized');
      return;
    }

    isLoading = true;
    error = null;

    try {
      const [actualTokenIn, actualTokenOut] = await swapManager.prepareTokensForSwap(
        Token.fromSwapToken(tokenIn, blockchain!, provider!),
        Token.fromSwapToken(tokenOut, blockchain!, provider!)
      );

      if (userEnteredFrom && fromAmount) {
        const quote = await swapManager.getQuote(
          actualTokenIn,
          actualTokenOut,
          ethers.parseUnits(fromAmount, actualTokenIn.decimals),
          true
        );

        if (quote.amountOut) {
          toAmount = ethers.formatUnits(quote.amountOut.toString(), actualTokenOut.decimals);
          exchangeRate = `1 ${tokenIn.symbol} = ~${(Number(toAmount) / Number(fromAmount)).toFixed(4)} ${tokenOut.symbol}`; //${quote.exchangeRate.toFixed(6)} ${tokenOut.symbol}`; //${(Number(toAmount) / Number(fromAmount)).toFixed(6)} ${tokenOut.symbol}`;
        }
      } else if (userEnteredTo && toAmount) {
        const quote = await swapManager.getQuote(
          actualTokenIn,
          actualTokenOut,
          ethers.parseUnits(toAmount, actualTokenOut.decimals),
          false
        );

        if (quote.amountIn) {
          fromAmount = ethers.formatUnits(quote.amountIn.toString(), actualTokenIn.decimals);
          exchangeRate = `1 ${tokenIn.symbol} = ~${(Number(toAmount) / Number(fromAmount)).toFixed(4)} ${tokenOut.symbol}`; //${quote.exchangeRate.toFixed(6)} ${tokenOut.symbol}`; //${(Number(toAmount) / Number(fromAmount)).toFixed(6)} ${tokenOut.symbol}`;
        } else {
          throw new Error('Invalid quote received');
        }
      }

      // Update gas estimate
      if (fromAmount) {
        gasFee = await gasProvider.estimateSwapGasFee(
          tokenIn,
          tokenOut,
          fromAmount,
          slippageTolerance,
          deadline,
          swapManager
        );
      }

    } catch (err) {
      console.error('Error getting quote:', err);
      error = 'Failed to get quote. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  function resetAmounts() {
    fromAmount = '';
    toAmount = '';
  }

  async function validateBalance(): Promise<boolean> {
    if (!tokenIn || !fromAmount || !fundingAddress) return false;
    
    const balance = await getTokenBalance(tokenIn, fundingAddress, provider, tokenService);
    const requiredAmount = ethers.parseUnits(fromAmount, tokenIn.decimals);
    
    if (balance < requiredAmount) {
      error = `Insufficient ${tokenIn.symbol} balance to perform swap. Balance: ${ethers.formatUnits(balance.toString(), tokenIn.decimals)}`;
      return false;
    }
    
    return true;
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
    
    if (tokenIn && tokenOut) {
      debouncedGetQuote();
    }
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
      if (token?.address === tokenOut?.address) {
        error = "Cannot select the same token";
        return;
      }
      tokenIn = token;
      selectedFromToken = token;
    } else {
      if (token?.address === tokenIn?.address) {
        error = "Cannot select the same token";
        return;
      }
      tokenOut = token;
      selectedToToken = token;
    }
    
    if (token) {
      await updateBalance(token, isFromToken);

      if (tokenIn && tokenOut) {
        if (!userEnteredFrom && !userEnteredTo) {
          fromAmount = '';
          toAmount = '';
        }
        error = null;
        await getQuote();
      }
    }
  }

  async function fetchTokenList(): Promise<SwapToken[]> {
    try {
      const response = await fetch('https://tokens.uniswap.org');
      // https://api.coinmarketcap.com/data-api/v3/uniswap/all.json
      const data = await response.json();
      return data.tokens.filter((token: SwapToken) => token.chainId === blockchain?.getChainId());
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
      privateKey = $yakklCurrentlySelectedStore?.data ? 
        (($yakklCurrentlySelectedStore?.data as CurrentlySelectedData).account?.data as AccountData).privateKey : 
        null;
    }

    if (privateKey === null) {
      throw new Error('Private key for fundingAddress (current address) was not obtained');
    }

    let wallet = WalletManager.getInstance(
      ['Alchemy'],
      ['Ethereum'],
      $yakklCurrentlySelectedStore!.shortcuts.chainId ?? 1,
      import.meta.env.VITE_ALCHEMY_API_KEY_PROD,
      privateKey
    );
    
    signer = await wallet.setSigner(privateKey as string);
    return wallet;
  } 

  async function fetchBalance(token: SwapToken | null): Promise<BigNumberish> {
    if (!token || !wallet || !provider) return 0n;
    
    try {
      if (!signer) {
        return 0n;
      }
      if (token.isNative || token.symbol === 'ETH') {
        const balance = await provider.getBalance(await signer.getAddress());
        return balance;
      } else {
        return await getTokenBalance(token, await signer.getAddress(), provider, tokenService);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0n;
    }
  }

  async function swapTokens() {
    if (!tokenIn || !tokenOut || !fromAmount || !toAmount || !fundingAddress || !swapManager || !blockchain || !provider) {
      error = 'Invalid swap parameters';
      return;
    }

    if (!await validateBalance()) {
      return;
    }

    try {
      const tokenInInstance = Token.fromSwapToken(tokenIn, blockchain, provider);
      const tokenOutInstance = Token.fromSwapToken(tokenOut, blockchain, provider);

      // Check allowance first if not native token
      if (!tokenIn.isNative) {
        const tokenContract = blockchain.createContract(
          tokenIn.address,
          ['function allowance(address,address) view returns (uint256)']
        );

        // const allowance = await tokenContract.call(
        //   'allowance',
        //   fundingAddress,
        //   swapManager.getRouterAddress()
        // );

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
      console.log('Swap transaction:', tx);
      
      onSwap(
        fundingAddress,
        tokenIn,
        tokenOut,
        ethers.parseUnits(fromAmount, tokenIn.decimals),
        ethers.parseUnits(toAmount, tokenOut.decimals)
      );

      error = null;
      resetAmounts();
      close();
    } catch (err: any) {
      console.error('Error executing swap:', err);
      error = `Failed to execute swap: ${err.message}`;
    }
  }

  async function checkAllowance(token: Token): Promise<bigint> {
    if (!provider || !signer || !swapManager) return 0n;

    const tokenContract = new ethers.Contract(
      token.address,
      ['function allowance(address,address) view returns (uint256)'],
      ethersProvider
    );
    
    return await tokenContract.allowance(
      await signer.getAddress(),
      swapManager.getRouterAddress()
    );
  }

  async function approveToken(token: Token, amount: string) {
    if (!provider || !swapManager || !blockchain) throw new Error('Provider, Blockahin, or swap manager not initialized');
    
    const tokenContract = blockchain.createContract(
      token.address,
      ['function approve(address,uint256) returns (bool)']
    );

    const tx = await tokenContract.sendTransaction(
      'approve',
      swapManager.getRouterAddress(),
      ethers.parseUnits(amount, token.decimals)
    );
    
    return await tx.wait();
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
            on:input={handleFromAmountInput}
            class="bg-transparent text-3xl font-bold focus:outline-none w-1/2 mr-4"
            placeholder="0"
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
            <TokenBalance 
              token={tokenIn}
              address={fundingAddress}
              {provider}
              {tokenService}
              className="text-sm"
            />
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
            on:input={handleToAmountInput}
            class="bg-transparent text-3xl font-bold focus:outline-none w-1/2 mr-4"
            placeholder="0"
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
            <TokenBalance 
              token={tokenOut} 
              address={fundingAddress}
              {provider} 
              {tokenService}
              className="text-sm"
            />
          {/if}
        </div>
      </div>

      <!-- Exchange rate and gas fee -->
      <div class="text-sm text-gray-500 flex flex-col space-y-2">
        {#if exchangeRate}
          <div class="flex justify-between w-full">
            <span class="text-left truncate">{exchangeRate}</span>
          </div>
        {/if}
        {#if gasFee}
          <div class="flex justify-between w-full">
            <span class="text-left truncate">Gas fee ≈ {gasFee}</span>
          </div>
        {:else}
          <div class="flex justify-between w-full">
            <span class="text-left truncate">Gas fee ≈ --</span>
          </div>
        {/if}
      </div>

      <!-- Slippage and Deadline settings -->
      <div class="flex justify-between items-center">
        <div>
          <label for="slippage" class="block text-sm font-medium text-gray-700">
            Slippage Tolerance
          </label>
          <select
            id="slippage"
            bind:value={slippageTolerance}
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value={0.1}>0.1%</option>
            <option value={0.5}>0.5%</option>
            <option value={1}>1%</option>
            <option value={3}>3%</option>
          </select>
        </div>
        <div>
          <label for="deadline" class="block text-sm font-medium text-gray-700">
            Transaction Deadline
          </label>
          <select
            id="deadline"
            bind:value={deadline}
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
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


<style>
  /* Ensure text doesn't overflow */
  .text-sm {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
