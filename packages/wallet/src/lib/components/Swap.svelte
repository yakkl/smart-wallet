<script lang="ts">
  import { onMount } from 'svelte';
  import { yakklCurrentlySelectedStore, yakklMiscStore } from '$lib/common/stores';
  import type { AccountData, CurrentlySelectedData, SwapToken } from '$lib/common/interfaces';
  import TokenDropdown from './TokenDropdown.svelte';
  import Modal from './Modal.svelte';
  import WalletManager from '$lib/plugins/WalletManager';
  import { BigNumber, decryptData, isEncryptedData, type BigNumberish, type TransactionRequest } from '$lib/common';
  import { ethers } from 'ethers';
  import { UniswapV3SwapManager } from '$plugins/UniswapV3SwapManager';
  import { TokenService } from '$plugins/blockchains/evm/ethereum/TokenService';
	import { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
	import { Token } from '$lib/plugins/Token';
	import type { Wallet } from '$lib/plugins/Wallet';
	import type { Provider } from '$lib/plugins/Provider';
  import TokenPrice from './TokenPrice.svelte';
  import Balance from './Balance.svelte';
  import { getTokenBalance } from '$lib/utilities/balanceUtils';
  import { estimateGasFee } from '$lib/utilities/gasUtils';

  // Props
  export let fundingAddress: string | null = null;
  export const initialFromToken: SwapToken | null = null;
  export const initialToToken: SwapToken | null = null;
  export let show = false;
  export let onSwap: (fundingAddress: string, fromToken: SwapToken, toToken: SwapToken, fromAmount: BigNumberish, toAmount: BigNumberish) => void = () => {};
  export let className = 'text-gray-600 z-[999]';

  // State
  let fromToken: SwapToken | null = null;
  let toToken: SwapToken | null = null;
  let fromAmount: BigNumberish = 0n;
  let toAmount: BigNumberish = 0n;
  let fromBalance: BigNumberish = 0n;
  let toBalance: BigNumberish = 0n;
  let tokens: SwapToken[] = [];
  let preferredTokens: SwapToken[] = [];
  let selectedFromToken: SwapToken | null = null;
  let selectedToToken: SwapToken | null = null;

  let wallet: Wallet | null = null;
  let blockchain: Ethereum | null = null;
  let provider: Provider | null = null;
  let swapManager: UniswapV3SwapManager | null = null;
  let tokenService: any = null;

  const preferredTokenSymbols = ["ETH", "WETH", "USDC", "WBTC"];

  let sellAmount = "";
  let buyAmount = "";
  let sellValueUSD = 0;
  let buyValueUSD = 0;
  let exchangeRate = "";
  let gasFee = ""; // You'll need to implement gas fee estimation

  $: {
    if (fromToken && toToken) {
      getQuote();
      updateGasFeeEstimate();
      // updateTokenPrices();
    }
  }

  // async function updateTokenPrices() {
  //   if (fromToken) {
  //     sellValueUSD = parseFloat(sellAmount) * await getTokenPrice(fromToken);
  //   }
  //   if (toToken) {
  //     buyValueUSD = parseFloat(buyAmount) * await getTokenPrice(toToken);
  //   }
  // }

  async function getQuote() {
    if (fromToken && toToken && (parseFloat(sellAmount) > 0 || parseFloat(buyAmount) > 0)) {

      console.log('Getting quote...', fromToken, toToken, sellAmount, buyAmount);

      try {
        if (parseFloat(sellAmount) > 0) {
          const quote = await swapManager!.getQuote(
            Token.fromSwapToken(fromToken, blockchain!, provider!),
            Token.fromSwapToken(toToken, blockchain!, provider!),
            ethers.parseUnits(sellAmount, fromToken.decimals)
          );
          buyAmount = ethers.formatUnits(toBigNumberishString(quote.amountOut), toToken.decimals);
        } else {
          const quote = await swapManager!.getQuote(
            Token.fromSwapToken(toToken, blockchain!, provider!),
            Token.fromSwapToken(fromToken, blockchain!, provider!),
            ethers.parseUnits(buyAmount, toToken.decimals)
          );
          sellAmount = ethers.formatUnits(toBigNumberishString(quote.amountOut), fromToken.decimals);
        }
        
        sellValueUSD = parseFloat(sellAmount) * await getUSDPrice(fromToken);
        buyValueUSD = parseFloat(buyAmount) * await getUSDPrice(toToken);

        // Calculate and format exchange rate
        const rate = parseFloat(buyAmount) / parseFloat(sellAmount);
        exchangeRate = `1 ${fromToken.symbol} = ${rate.toFixed(5)} ${toToken.symbol} ($${await getUSDPrice(fromToken)})`;

        // Estimate gas fee (you'll need to implement this)
        // gasFee = await estimateGasFee();
        // gasFee = await estimateGasFee(fromToken, toToken, fromAmount ? fromAmount?.toString() : '0', provider!, swapManager!, blockchain);
      } catch (error) {
        console.error('Error getting quote:', error);
      }
    }
  }

  function calculateUniswapFee(swapAmount: bigint, feeTier: number): bigint {
    const fee = (swapAmount * BigInt(feeTier)) / BigInt(10000); // feeTier is in basis points (10000 = 100%)
    return fee;
  }

  async function updateGasFeeEstimate() {
    if (fromToken && toToken && fromAmount) {
      gasFee = await estimateGasFee(
        fromToken,
        toToken,
        fromAmount.toString(),
        provider!,
        swapManager!,
        blockchain!
      );
    }
  }

  // async function estimateGasFee() {
  //   // Implement gas fee estimation
  //   return "$7.01"; // Placeholder
  // }

  function handleSellAmountChange() {
    buyAmount = "";
    getQuote();
  }

  function handleBuyAmountChange() {
    sellAmount = "";
    getQuote();
  }

  function toBigNumberishString(value: BigNumberish): string {
    if (value === null || value === undefined) {
      return '0';
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
      return value.toString();
    }
    if (value instanceof BigNumber) {
      return value.toString();
    }
    // Add any other cases you need to handle
    return '0';
  }

  async function getUSDPrice(token: SwapToken): Promise<number> {
    // Implement this function to get the USD price of a token
    // You might want to use an oracle or price feed service
    return 1; // Placeholder
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
      throw 'Private key for fundingAddress (current address) was not obtained'; 
    }

    let wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], $yakklCurrentlySelectedStore!.shortcuts.chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_PROD, privateKey);
    await wallet.setSigner(privateKey as string);

    return wallet;
  } 

  // Fetches the balance of a token for the current wallet
  async function fetchBalance(token: SwapToken | null): Promise<BigNumberish> {
    if (!token || !wallet || !provider) return 0n;
    
    console.log('Fetching balance for token:', token, wallet, provider, provider!.getSigner());

    return await getTokenBalance(token, await provider.getSigner().getAddress(), provider, tokenService); // This returns the native token balance or the erc20 token balance
    // if (token.isNative) {
    //   return await provider!.getBalance(await provider!.getSigner().getAddress());
    // }

    // return await tokenService.getBalance(token.address, await provider!.getSigner().getAddress());
  }

  async function swapTokens() {
    if (!fromAmount || !toAmount) {
      throw new Error("Invalid amounts");
    }
    if (!fundingAddress) {
      throw new Error("Invalid funding address");
    }
    if (fromToken && toToken && BigInt(fromAmount.toString()) > 0n && BigInt(toAmount.toString()) > 0n && wallet) {
      try {
        if (!blockchain) throw new Error('Blockchain not available - (swapTokens)');
        if (!swapManager) throw new Error('Swap manager not available - (swapTokens)');

        const signer = wallet.getSigner();
        if (!signer) throw new Error('Signer not available - (swapTokens)');

        const fromTokenContract = blockchain.createContract(fromToken.address, ['function approve(address spender, uint256 amount) public returns (bool)']);
        await fromTokenContract.sendTransaction('approve', swapManager.getRouterAddress(), fromAmount);

        const swapTx: TransactionRequest = await swapManager.populateSwapTransaction(
          Token.fromSwapToken(fromToken, blockchain!, provider!), // Optimize these later plus the two above
          Token.fromSwapToken(toToken, blockchain!, provider!),
          fromAmount,
          toAmount,
          await signer.getAddress(),
          Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes deadline
        );

        const tx = await wallet.sendTransaction(swapTx);
        console.log('Swap transaction:', tx);
        
        onSwap(fundingAddress, fromToken, toToken, fromAmount, toAmount);

        // Handle successful swap (e.g., show confirmation, update balances)
      } catch (error) {
        console.error('Error executing swap:', error);
        // Handle error (e.g., show error message)
      }
    }
  }

  function switchTokens() {
    [fromToken, toToken] = [toToken, fromToken];
    [fromAmount, toAmount] = [toAmount, fromAmount];
    [fromBalance, toBalance] = [toBalance, fromBalance];
    [selectedFromToken, selectedToToken] = [selectedToToken, selectedFromToken];
    getQuote();
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

    console.log('Swap - Token selected:', token, isFromToken);

    if (isFromToken) {
      fromToken = token;
      selectedFromToken = token;
    } else {
      toToken = token;
      selectedToToken = token;
    }
    if (token) {
      await updateBalance(token, isFromToken);
      getQuote();
    }
  }

  function handleFromAmountChange() {
    getQuote();
  }

  function close() {
    show = false;
  }

  onMount(async () => {
    wallet = await getWallet(); 
    blockchain = wallet.getBlockchain() as Ethereum;
    provider = wallet.getProvider();
    swapManager = new UniswapV3SwapManager(blockchain, provider!);
    tokenService = new TokenService(blockchain as Ethereum);

    console.log('Wallet:', wallet, blockchain, provider, swapManager, tokenService);

    tokens = await fetchTokenList();
    let eth: SwapToken = {
      chainId: 1,
      address: '',  // There is no contract address for eth since it is native
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      isNative: true,
      logoURI: '/images/ethereum.svg',
    };
    tokens.unshift(eth);
    
    preferredTokens = preferredTokenSymbols.map(symbol => tokens.find(token => token.symbol === symbol)).filter(Boolean) as SwapToken[];
    tokens = tokens.filter(token => !preferredTokens.includes(token)).sort((a, b) => a.symbol.localeCompare(b.symbol));

    if (fromToken) {
      await updateBalance(fromToken, true);
    }
    if (toToken) {
      await updateBalance(toToken, false);
    }
  });
</script>

<Modal bind:show title="Swap" {className}>
  <div class="p-6">
    <div class="space-y-4">
      <!-- Sell section -->
      <div class="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-lg p-4">
        <div class="flex justify-between items-center">
          <input
            type="number"
            bind:value={fromAmount}
            on:input={handleFromAmountChange}
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
          <TokenPrice 
            baseToken={fromToken?.symbol ?? ''}
            quantity={Number(fromAmount)}
            quoteToken="USD"
            customClass="text-gray-500"
          />
          {#if fromToken}
            <Balance token={fromToken} address={fundingAddress} {provider} {tokenService} />
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
      <div class="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-lg p-4">
        <div class="flex justify-between items-center">
          <input
            type="number"
            bind:value={toAmount}
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
          <TokenPrice 
            baseToken={toToken?.symbol ?? ''}
            quantity={Number(toAmount)}
            quoteToken="USD"
            customClass="text-gray-500"
          />
          {#if toToken}
            <Balance token={toToken} address={fundingAddress} {provider} {tokenService} />
          {/if}
        </div>
      </div>

      <!-- Exchange rate and gas fee -->
      <div class="text-sm text-gray-500 flex justify-between">
        <span>{exchangeRate}</span>
        <span>Gas fee ≈ {gasFee}</span>
      </div>

      <!-- Error message -->
      {#if parseFloat(sellAmount) > parseFloat(ethers.formatUnits(toBigNumberishString(fromBalance), fromToken?.decimals || 18))}
        <div class="text-red-500 text-center">Insufficient {fromToken?.symbol} balance</div>
      {/if}

      <!-- Swap button -->
      <button
        on:click={swapTokens}
        class="w-full px-4 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={!fromToken || !toToken || !sellAmount || !buyAmount || parseFloat(sellAmount) > parseFloat(ethers.formatUnits(toBigNumberishString(fromBalance), fromToken?.decimals || 18))}
      >
        Swap
      </button>
    </div>
  </div>
</Modal>
