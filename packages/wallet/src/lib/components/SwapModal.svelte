<script lang="ts">
  import Swap from '$lib/components/Swap.svelte';
  import type { SwapToken } from '$lib/common/interfaces';
	import type { BigNumberish } from '$lib/common';

	export let show: boolean = true;
	export let initialFromToken: SwapToken | null = null;
	export let initialToToken: SwapToken | null = null;
	export let fundingAddress: string | null = null;
  export let className = 'text-gray-600 z-[999]';

  // Note: This calls the actual Swap component but handles the onSwap function. If you want to handle the onSwap function then do not use this but call Swap itself.

	function onSwap(fundingAddress: string, fromToken: SwapToken, toToken: SwapToken, fromAmount: BigNumberish, toAmount: BigNumberish) {
    console.log(`onSwap: fundingAddress=${fundingAddress}, fromToken=${fromToken}, toToken=${toToken}, fromAmount=${fromAmount}, toAmount=${toAmount}`);


  }

</script>

<Swap {show} {initialFromToken} {initialToToken} {fundingAddress} {className} {onSwap}/>
