<script lang="ts">
  import { onMount } from 'svelte';
  import { yakklCurrentlySelectedStore, yakklMiscStore } from '$lib/common/stores';
  import type { AccountData, CurrentlySelectedData, SwapToken } from '$lib/common/interfaces';
  import TokenDropdown from './TokenDropdown.svelte';
  import Modal from './Modal.svelte';
  import WalletManager from '$lib/plugins/WalletManager';
  import { decryptData, isEncryptedData, type BigNumberish, type TransactionRequest } from '$lib/common';
  import { ethers } from 'ethers';
  import { UniswapV3SwapManager } from '$plugins/UniswapV3SwapManager';
  import { TokenService } from '$plugins/blockchains/evm/ethereum/TokenService';
	import { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
	import { Token } from '$lib/plugins/Token';
	import type { Wallet } from '$lib/plugins/Wallet';
	import type { Provider } from '$lib/plugins/Provider';

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

  const preferredTokenSymbols = ["WETH", "USDC", "ETH", "WBTC"];

  
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

  async function fetchBalance(token: SwapToken | null): Promise<BigNumberish> {
    if (!token || !wallet) return 0n;
    
    console.log('Fetching balance for token:', token, wallet, provider, provider!.getSigner());

    return await tokenService.getBalance(token.address, await provider!.getSigner().getAddress());
  }

  async function getQuote() {
    console.log('Getting quote...', fromToken, toToken, fromAmount);
    
    if (!fromAmount) {
      throw new Error("Invalid from amount");
    }

    console.log('Getting quote - bigint...', BigInt(fromAmount.toString()));

    if (fromToken && toToken && BigInt(fromAmount.toString()) > 0n) {
      try {
        const quote = await swapManager!.getQuote(Token.fromSwapToken(fromToken, blockchain!, provider!), Token.fromSwapToken(toToken, blockchain!, provider!), fromAmount);
        toAmount = quote.amountOut;
      } catch (error) {
        console.error('Error getting quote:', error);
      }
    }
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

<Modal bind:show title="Token Swap" {className}>
  <div class="p-6">
    <div class="space-y-4 mt-6">
      <!-- From Token -->
      <div class="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-lg p-4">
        <div class="flex justify-between items-center">
          <input
            type="number"
            bind:value={fromAmount}
            on:input={handleFromAmountChange}
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
          <div class="text-sm text-gray-700 dark:text-gray-200 mt-2">Balance: {ethers.formatUnits((fromBalance ? BigInt(fromBalance.toString()) : 0n), fromToken.decimals)} {fromToken.symbol}</div>
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

      <!-- To Token - computed value -->
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
          <div class="text-sm text-gray-600 mt-2">Balance: {ethers.formatUnits((toBalance ? BigInt(toBalance.toString()) : 0n), toToken.decimals)} {toToken.symbol}</div>
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
        disabled={!fromToken || !toToken || !fromAmount || !toAmount}
      >
        Swap
      </button>
    </div>
  </div>
</Modal>
