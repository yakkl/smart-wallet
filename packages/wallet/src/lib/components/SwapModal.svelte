<script lang="ts">
  import type { Profile, ProfileData, SwapToken } from '$lib/common/interfaces';
	import { decryptData, isEncryptedData, type BigNumberish } from '$lib/common';
	import type { Provider } from '$lib/plugins/Provider';
	import type { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
	import type { UniswapSwapManager } from '$lib/plugins/UniswapSwapManager';
	import type { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
	import Swap from './Swap.svelte';
	import { getMiscStore, getProfile } from '$lib/common/stores';
	import { deepCopy } from '$lib/utilities';
	import ErrorNoAction from './ErrorNoAction.svelte';
	import Warning from './Warning.svelte';
	import PincodeVerify from './PincodeVerify.svelte';
  import { log } from '$plugins/Logger';

  interface Props {
    show?: boolean;
    fundingAddress: string;
    provider: Provider;
    blockchain: Ethereum;
    swapManager: UniswapSwapManager;
    tokenService: TokenService<any>;
    // export let gasProvider: EthereumGasProvider;
    className?: string;
  }

  let {
    show = $bindable(true),
    fundingAddress,
    provider,
    blockchain,
    swapManager,
    tokenService,
    className = 'text-gray-600 z-[999]'
  }: Props = $props();

  let showVerify = $state(false);
  let showError = $state(false);
  let errorValue = $state('');
  let showWarning = $state(false);
  let warningValue = $state('');
  let pincode = '';
  let pincodeVerified = false;

  // Note: This calls the actual Swap component but handles the onSwap function. If you want to handle the onSwap function then do not use this but call Swap itself.

	function onSwap(fundingAddress: string, fromToken: SwapToken, toToken: SwapToken, fromAmount: BigNumberish, toAmount: BigNumberish) {
    log.info(`onSwap: fundingAddress=${fundingAddress}, fromToken=${fromToken}, toToken=${toToken}, fromAmount=${fromAmount}, toAmount=${toAmount}`);
  }

  function handleClose() {
    showError = false;
    errorValue = '';
    showWarning = false;
    warningValue = '';
    pincodeVerified = false;
  }

  // Pincode verification
  function handleReject(rejection: string = 'You have rejected or Pincode was not validated. No swap transaction was sent.') {
		try {
			showVerify = false;
			showWarning = true;
			warningValue = rejection;
		} catch(e: any) {
			log.error(e);
		}
	}

  // One more internal check to verify the pincode
	async function verifyWithPin(pin: string, pincodeVerified: boolean): Promise<Profile | null>{
		try {
      const yakklMiscStore = getMiscStore();
			let profile: Profile | null = await getProfile();
			if (profile === null) {
        pincodeVerified = false;
				throw 'Profile was not found.';
			}

			let profileEncrypted = null;

			if (isEncryptedData(profile.data)) {
				profileEncrypted = deepCopy(profile);
				await decryptData(profile?.data, yakklMiscStore).then(result => {
					(profile as Profile).data = result as ProfileData;
				});
			}

			if ((profile.data as ProfileData).pincode !== pincode && pincodeVerified === false) {
        pincodeVerified = false;
				throw 'PINCODE was not verified.';
			}

			if (pincode === (profile.data as ProfileData).pincode) {
				profile = null;
				return profileEncrypted;
			} else {
        pincodeVerified = false;
				throw 'PINCODE did not match.';
			}
		} catch(e: any) {
      log.error(e);
      pincodeVerified = false;
			return null;
		}
	}

  async function handleVerified(pincode: string) {
		try {
			let profile: Profile | null = await verifyWithPin(pincode, pincodeVerified);
      if (profile === null) {
        throw 'Profile was not found.';
      }

    } catch(e) {
      log.error(e);
    }
  }

</script>
<PincodeVerify bind:show={showVerify} onRejected={handleReject} onVerified={handleVerified} className="text-gray-600"/>
<ErrorNoAction bind:show={showError} value={errorValue} handle={handleClose}/>
<Warning bind:show={showWarning} value={warningValue} handle={handleClose} />

<!-- Just shows you how to set it up but it is not plugged into Swap itself -->

<Swap bind:show={show} {fundingAddress} {provider} {blockchain} {swapManager} {tokenService} {className} {onSwap}/>
