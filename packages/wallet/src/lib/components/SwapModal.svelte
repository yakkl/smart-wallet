<script lang="ts">
  import type { SwapPriceProvider, SwapToken } from '$lib/common/interfaces';
	import type { BigNumberish } from '$lib/common';
	import type { Provider } from '$lib/plugins/Provider';
	import type { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
	import type { UniswapSwapManager } from '$lib/plugins/UniswapSwapManager';
	import type { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
	import type { EthereumGasProvider } from '$lib/plugins/providers/fees/ethereum/EthereumGasProvider';
	import Swap from './Swap.svelte';

	export let show: boolean = true;
  export let fundingAddress: string;
  export let provider: Provider;
  export let blockchain: Ethereum;
  export let swapManager: UniswapSwapManager;
  export let tokenService: TokenService<any>;
  // export let gasProvider: EthereumGasProvider;
  export let className = 'text-gray-600 z-[999]';

  // Note: This calls the actual Swap component but handles the onSwap function. If you want to handle the onSwap function then do not use this but call Swap itself.

	function onSwap(fundingAddress: string, fromToken: SwapToken, toToken: SwapToken, fromAmount: BigNumberish, toAmount: BigNumberish) {
    console.log(`onSwap: fundingAddress=${fundingAddress}, fromToken=${fromToken}, toToken=${toToken}, fromAmount=${fromAmount}, toAmount=${toAmount}`);


  }

</script>

<Swap bind:show={show} {fundingAddress} {provider} {blockchain} {swapManager} {tokenService} {className} {onSwap}/>
