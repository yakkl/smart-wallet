<script lang="ts">
  import { goto } from "$app/navigation";
  import { PATH_WELCOME, PATH_LOGIN, YEAR, VERSION, PATH_ETHEREUM_TRANSACTIONS_SEND, RegistrationType, type Settings, type SwapPriceProvider } from "$lib/common";
  import { getYakklCurrentlySelected } from '$lib/common/stores';
  import ChatbotModal from './ChatbotModal.svelte';
	import Buy from "$lib/components/Buy.svelte";
	import { onMount } from 'svelte';
	import { getMiscStore, getSettings } from '$lib/common/stores';
	import Swap from "./Swap.svelte";
	import type { Provider } from "$lib/plugins/Provider";
	import type { Ethereum } from "$lib/plugins/blockchains/evm/ethereum/Ethereum";
	import { UniswapSwapManager } from "$lib/plugins/UniswapSwapManager";
	import { TokenService } from "$lib/plugins/blockchains/evm/TokenService";
	import type { Wallet } from "$lib/plugins/Wallet";
	import WalletManager from "$lib/plugins/WalletManager";
	import { getYakklCurrentlySelectedAccountKey } from "$lib/common/security";


  interface Props {
    // Defaults for properties. Can be changed when calling component
    id?: string;
    containerWidth?: string; //"394"; // iPhone pro size
    classParam?: string;
  }

  let { id = "footer", containerWidth = "428", classParam = "text-center" }: Props = $props();

  let showChat = $state(false);
  let showBuy = $state(false);
  let showSwap = $state(false);

  let w = 6;
  let h = 6;
  let registeredType = $state(RegistrationType.PRO.toUpperCase()); // Default to Pro for now!!!!

  let yakklMiscStore: string;
  let yakklSettingsStore: Settings | null;

  let fundingAddress: string = $state(''); //| null | undefined = $yakklCurrentlySelectedStore?.shortcuts.address || null;
  let swapPriceProvider: SwapPriceProvider | null = null; // Don't have to set it to null
  let provider: Provider = $state();
  let chainId = 1;
  let blockchain: Ethereum = $state();
  let swapManager: UniswapSwapManager = $state();
  let tokenService: TokenService<any> = $state();

  onMount(async () => {
    try {
      yakklMiscStore = getMiscStore();
      if (!yakklMiscStore) {
        return; // Don't do anything if not logged in
      }

      // Get the settings
      yakklSettingsStore = await getSettings();
      if (yakklSettingsStore) {
        registeredType = yakklSettingsStore.registeredType.toUpperCase();
      }

      const currentlySelected = await getYakklCurrentlySelected();
      if (currentlySelected) {
        fundingAddress = currentlySelected.shortcuts.address;
      }

            if (swapPriceProvider === null) {
        let wallet: Wallet | null = null;
        wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);
        if (wallet) {
          if (!wallet.getSigner()) {
            const accountKey = await getYakklCurrentlySelectedAccountKey();
            if (accountKey && accountKey.privateKey) await wallet.setSigner(accountKey.privateKey); // Could have sent this to getInstance as well
          }

          provider = wallet.getProvider()!; // Only for testing
          if (provider) {
            const signer = wallet.getSigner();
            if (signer) {
              provider.setSigner(signer);
            }
            blockchain = wallet.getBlockchain() as Ethereum;

            swapManager = new UniswapSwapManager(blockchain as Ethereum, provider!);
            tokenService = new TokenService(blockchain as Ethereum);
          }
        }
      }


    } catch (e) {
      console.log(`Footer: onMount - ${e}`);
    }
  });

  async function home() {
    let path;

    if (!yakklMiscStore) {
      path = PATH_LOGIN;
    } else {
      path = PATH_WELCOME;
    }

    goto(path);
  }

  async function send() {
    let path;

    if (!yakklMiscStore) {
      path = PATH_LOGIN;
    } else {
      path = PATH_ETHEREUM_TRANSACTIONS_SEND;
    }

    goto(path);
  }

  async function buy() {
    let path;

    if (!yakklMiscStore) {
      path = PATH_LOGIN;
      goto(path);
    } else {
      showBuy = true;
    }
  }

  async function swap() {
    let path;

    if (!yakklMiscStore) {
      path = PATH_LOGIN;
      goto(path);
    } else {
      showSwap = true;
    }
  }

</script>

<ChatbotModal bind:show={showChat}/>

<Buy bind:show={showBuy}/>

<!-- <SwapModal bind:show={showSwap} {fundingAddress} /> -->
<Swap bind:show={showSwap} {fundingAddress} {provider} {blockchain} {swapManager} {tokenService} />

<footer id="{id}" class="visible fixed bg-base-100 mb-2 inset-x-0 bottom-0 mx-2 mt-0 rounded-lg max-w-[{containerWidth}px] {classParam}">

  <div class="flex flex-row m-2 mb-0 justify-center bg-primary/80 text-base-content rounded-lg">
    <span class="inline-grid grid-cols-2 gap-5">
      <!-- HOME -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <div role="button" onclick={home}
        class="m-1 flex flex-col w-[60px] h-[40px] fill-base-content hover:fill-base-300 hover:text-base-300 items-center justify-center"
        data-bs-toggle="tooltip" data-bs-placement="top" title="Welcome Page" aria-label="home">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-{w} h-{h} stroke-primary/5 stroke-[1px]">
          <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
          <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
        </svg>
        <span class="text-xs">Home</span>
      </div>

      <!-- Send -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <div role="button" onclick={send}
        class="m-1 flex flex-col w-[60px] h-[40px] fill-base-content hover:fill-base-300 hover:text-base-300 items-center justify-center"
        data-bs-toggle="tooltip" data-bs-placement="top" title="Send" aria-label="wallet send">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 font-bold">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>

        <span class="text-xs">Send</span>
      </div>
    </span>

    <!-- Help Bot -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="static bg-gray-100 rounded-full w-[50px] h-[50px] shadow-lg z-50">
      <div class="relative bg-gray-300/75 rounded-full m-1 h-[39px] drop-shadow-lg hover:drop-shadow-xl">
        <!-- fill-indigo-700 hover:fill-indigo-400 text-purple-900 hover:text-purple-700 -->
        <!-- svelte-ignore a11y_interactive_supports_focus -->
        <div role="button" onclick={() => {showChat=true}}
          class="relative m-1 w-[40px] h-[40px] fill-primary hover:fill-primary/50 text-primary hover:text-primary/50"
          data-bs-toggle="tooltip" data-bs-placement="top" title="Ring for Help" aria-label="help">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 mt-0.5 -ml-[.05rem]">
            <path fill-rule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clip-rule="evenodd" />
          </svg>

          <!-- <i class="fa-solid fa-bell-concierge" style="font-size: 2rem; margin-left: 1px; margin-top: -3px; margin-bottom: -1.5rem;"></i> -->
          <p class="text-xs ml-[.3rem] -mt-[.25rem]" style="line-height: .75rem; font-size: smaller">Help</p>
        </div>
      </div>
    </div>

    <span class="inline-grid grid-cols-2 gap-5 ml-2">
      <!-- Buy -->
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div role="button" onclick={buy}
        class="m-1 flex flex-col w-[60px] h-[40px] fill-base-content hover:fill-base-300 hover:text-base-300 items-center justify-center"
        data-bs-toggle="tooltip" data-bs-placement="top" title="Buy" aria-label="Buy">

        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
        <span class="text-xs">Buy</span>
      </div>

      <!-- Swap -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <div role="button" onclick={swap}
        class="m-1 flex flex-col w-[60px] h-[40px] fill-base-content hover:fill-base-300 hover:text-base-300 items-center justify-center"
        data-bs-toggle="tooltip" data-bs-placement="top" title="Swap" aria-label="swap">

        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 font-bold">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
        </svg>
        <span class="text-xs">Swap</span>
      </div>
    </span>
  </div>

  <!-- Don't use copyright component here - Needs different formatting here in footer -->
  <div class="inline-block mx-auto w-full text-center label-text">
    <!-- <a href="https://yakkl.com?utm_source=yakkl"
       class="text-xs hover:text-opacity-75 hover:cursor-pointer"
       style="color: inherit; text-decoration: none; transition: color 0.3s ease, opacity 0.3s ease;"> -->
      <span style="font-size: 10px;">YAKKL® ©Copyright {YEAR}, Version: {VERSION} {registeredType}</span>
    <!-- </a> -->
  </div>


  <!-- <div class="inline-block mx-auto w-full text-center label-text">
    <a href="https://yakkl.com?utm_source=yakkl" class="text-xs text-primary/50 hover:text-primary/75">
      <span style="font-size: 10px;">YAKKL® ©Copyright {YEAR}, Version: {VERSION} {registeredType}</span>
    </a>
  </div> -->
</footer>
