<script lang="ts">
  import { goto } from "$app/navigation";
  import { PATH_WELCOME, PATH_LOGIN, YEAR, VERSION, PATH_ACCOUNTS, PATH_LOCK, PATH_CONTACTS, PATH_ETHEREUM_TRANSACTIONS_SEND, RegistrationType, type Settings, PATH_ETHEREUM_TRANSACTIONS_SWAP } from "$lib/common";
  import { yakklCurrentlySelectedStore } from '$lib/common/stores';
  import { Modal } from "flowbite-svelte";
  import Chatbot from '$lib/components/Chatbot.svelte';
	import Buy from "$lib/components/Buy.svelte";
	import Swap from "$lib/components/Swap.svelte";
	import { onMount } from 'svelte';
	import { getMiscStore, getSettings } from '$lib/common/stores';
  
  // Defaults for properties. Can be changed when calling component
  export let id = "footer";
  export let containerWidth = "428"; //"394"; // iPhone pro size
  export let classParam = "text-center";

  let showChat = false;
  let showBuy = false;
  let showSwap = false;

  let w = 6;
  let h = 6;
  let registeredType = 'Premier'; //RegistrationType.PREMIER; // Default to Premier for now!!!!

  let yakklMiscStore: string;
  let yakklSettingsStore: Settings | null;

  let currentlySelected: string = $yakklCurrentlySelectedStore?.shortcuts.address as string;

  onMount(async () => {
    try {
      // Get the settings
      yakklSettingsStore = await getSettings();
      yakklMiscStore = getMiscStore();
      if (yakklSettingsStore) {
        registeredType = yakklSettingsStore.registeredType;
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

  async function accounts() {
    let path;

    if (!yakklMiscStore) {
      path = PATH_LOGIN;
    } else {
      path = PATH_ACCOUNTS;
    }

    goto(path);
  }

  async function contacts() {
    let path;

    if (!yakklMiscStore) {
      path = PATH_LOGIN;
    } else {
      path = PATH_CONTACTS;
    }

    goto(path);
  }

  async function lock() {
    let path;

    if (!yakklMiscStore) {
      path = PATH_LOCK;
    } else {
      path = PATH_LOCK;
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

<!-- <ChatbotModal showChat={showChat}/> -->
<!-- padding="xs" - flowbite changed --> 
<Modal  title="YAKKL-GPT"  bind:open={showChat} size="xs" >
  <Chatbot />
</Modal>

<Buy bind:show={showBuy}/>

<Swap bind:show={showSwap} currentlySelected={currentlySelected}/>

<footer id="{id}" class="visible fixed bg-base-100 mb-2 inset-x-0 bottom-0 mx-2 mt-0 rounded-lg max-w-[{containerWidth}px] {classParam}">
  <!-- Send -->
  <div class="flex flex-row m-2 mb-0 justify-center bg-primary/80 text-base-content rounded-lg">
    <span class="inline-grid grid-cols-2 gap-5">
      <!-- HOME -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-interactive-supports-focus -->
      <div role="button" on:click={home} 
        class="m-1 flex flex-col w-[60px] h-[40px] fill-base-content hover:fill-base-300 hover:text-base-300 items-center justify-center"
        data-bs-toggle="tooltip" data-bs-placement="top" title="Welcome Page" aria-label="home">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-{w} h-{h} stroke-primary/5 stroke-[1px]">
          <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
          <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
        </svg>
        <span class="text-xs">Home</span>
      </div>

      <!-- Wallet Accounts -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-interactive-supports-focus -->
      <div role="button" on:click={send} 
        class="m-1 flex flex-col w-[60px] h-[40px] fill-base-content hover:fill-base-300 hover:text-base-300 items-center justify-center" 
        data-bs-toggle="tooltip" data-bs-placement="top" title="Send" aria-label="wallet send">

        <!-- <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-{w} h-{h} stroke-primary/5 stroke-[1px]">
          <path d="M2.273 5.625A4.483 4.483 0 015.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 3H5.25a3 3 0 00-2.977 2.625zM2.273 8.625A4.483 4.483 0 015.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 6H5.25a3 3 0 00-2.977 2.625zM5.25 9a3 3 0 00-3 3v6a3 3 0 003 3h13.5a3 3 0 003-3v-6a3 3 0 00-3-3H15a.75.75 0 00-.75.75 2.25 2.25 0 01-4.5 0A.75.75 0 009 9H5.25z" />
        </svg> -->
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 font-bold">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>

        <span class="text-xs">Send</span>
      </div>

      <!-- <div role="button" on:click={accounts} 
        class="m-1 flex flex-col w-[60px] h-[40px] fill-white hover:fill-gray-300 text-white hover:text-gray-300 items-center justify-center" 
        data-bs-toggle="tooltip" data-bs-placement="top" title="Wallet Activities" aria-label="wallet">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-{w} h-{h} stroke-purple-500/5 stroke-[1px]">
          <path d="M2.273 5.625A4.483 4.483 0 015.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 3H5.25a3 3 0 00-2.977 2.625zM2.273 8.625A4.483 4.483 0 015.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 6H5.25a3 3 0 00-2.977 2.625zM5.25 9a3 3 0 00-3 3v6a3 3 0 003 3h13.5a3 3 0 003-3v-6a3 3 0 00-3-3H15a.75.75 0 00-.75.75 2.25 2.25 0 01-4.5 0A.75.75 0 009 9H5.25z" />
        </svg>
        <span class="text-xs">Accounts</span>
      </div> -->

    </span>

    <!-- Help Bot -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="static bg-gray-100 rounded-full w-[50px] h-[50px] shadow-lg z-50">
      <div class="relative bg-gray-300/75 rounded-full m-1 h-[39px] drop-shadow-lg hover:drop-shadow-xl">
        <!-- fill-indigo-700 hover:fill-indigo-400 text-purple-900 hover:text-purple-700 -->
        <!-- svelte-ignore a11y-interactive-supports-focus -->
        <div role="button" on:click|preventDefault={() => {showChat=true}} 
          class="relative m-1 w-[40px] h-[40px] fill-primary hover:fill-primary/50 text-primary hover:text-primary/50"
          data-bs-toggle="tooltip" data-bs-placement="top" title="Ring for Help" aria-label="help">

          <!-- <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
            <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
          </svg> -->
          
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 mt-0.5 -ml-[.05rem]">
            <path fill-rule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clip-rule="evenodd" />
          </svg>
          
          <!-- <i class="fa-solid fa-bell-concierge" style="font-size: 2rem; margin-left: 1px; margin-top: -3px; margin-bottom: -1.5rem;"></i> -->
          <p class="text-xs ml-[.3rem] -mt-[.25rem]" style="line-height: .75rem; font-size: smaller">Help</p>
        </div>
      </div>
    </div>

    <span class="inline-grid grid-cols-2 gap-5 ml-2">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- <div role="button" on:click={() => goto(PATH_ETHEREUM_TRANSACTIONS_STAKE)} 
        class="m-1 flex flex-col w-[60px] h-[40px] fill-gray-300 hover:fill-gray-100 text-gray-300 hover:text-gray-100 items-center justify-center" 
        data-bs-toggle="tooltip" data-bs-placement="top" title="Stake Crypto" aria-label="stake">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-{w} h-{h} font-bold">
          <path fill-rule="evenodd" d="M15.75 2.25H21a.75.75 0 01.75.75v5.25a.75.75 0 01-1.5 0V4.81L8.03 17.03a.75.75 0 01-1.06-1.06L19.19 3.75h-3.44a.75.75 0 010-1.5zm-10.5 4.5a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V10.5a.75.75 0 011.5 0v8.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V8.25a3 3 0 013-3h8.25a.75.75 0 010 1.5H5.25z" clip-rule="evenodd" />
        </svg>          
        <span class="text-xs">Stake</span>
      </div> -->

      <!-- Bell - Notifications -->
      <!-- <div role="button" 
        class="m-1 flex flex-col w-[60px] h-[40px] fill-white hover:fill-gray-300 text-white hover:text-gray-300 items-center justify-center" 
        data-bs-toggle="tooltip" data-bs-placement="top" title="Notifications" aria-label="notifications">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-{w} h-{h} stroke-purple-500/5 stroke-[1px]">
          <path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clip-rule="evenodd" />
        </svg>
        <span class="text-xs">Notifications</span>
      </div> -->

      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- <div role="button" on:click={() => goto(PATH_ETHEREUM_TRANSACTIONS_SWAP)} 
        class="m-1 flex flex-col w-[60px] h-[40px] fill-gray-300 hover:fill-gray-100 text-gray-300 hover:text-gray-100 items-center justify-center" 
        data-bs-toggle="tooltip" data-bs-placement="top" title="Stake Crypto" aria-label="stake">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-{w} h-{h} font-bold">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
        </svg>
        <span class="text-xs">Swap</span>
      </div>

      <hr class="ml-[2px] mr-2 -mb-1 col-span-2 shadow-xl hover:shadow-2xl"> -->

      <!-- Crypto -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- <div role="button" on:click={crypto} 
        class="m-1 flex flex-col w-[60px] h-[40px] fill-gray-300 hover:fill-gray-100 text-gray-300 hover:text-gray-100 items-center justify-center" 
        data-bs-toggle="tooltip" data-bs-placement="top" title="Crypto Actions" aria-label="crypto">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-{w} h-{h} stroke-purple-500/5 stroke-[1px]">
          <path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clip-rule="evenodd" />
        </svg>
        <span class="text-xs">Crypto</span>
      </div> -->

      <!-- Buy -->
      <!-- svelte-ignore a11y-interactive-supports-focus -->
      <div role="button" on:click={buy}
        class="m-1 flex flex-col w-[60px] h-[40px] fill-base-content hover:fill-base-300 hover:text-base-300 items-center justify-center" 
        data-bs-toggle="tooltip" data-bs-placement="top" title="Buy" aria-label="Buy">

        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
        <!-- Bell - Notifications - make notifications dynamic and move to top header bar -->
        <!-- <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-{w} h-{h} stroke-purple-500/5 stroke-[1px]">
          <path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clip-rule="evenodd" />
        </svg> -->
        <span class="text-xs">Buy</span>
      </div>

      <!-- Swap -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-interactive-supports-focus -->
      <div role="button" on:click={swap} 
        class="m-1 flex flex-col w-[60px] h-[40px] fill-base-content hover:fill-base-300 hover:text-base-300 items-center justify-center"
        data-bs-toggle="tooltip" data-bs-placement="top" title="Swap" aria-label="swap">

        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 font-bold">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
        </svg>

        <!-- lock -->
        <!-- {#if !$yakklMiscStore}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-{w} h-{h} stroke-primary/5 stroke-[1px]">
          <path fill-rule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clip-rule="evenodd" />
        </svg>
        <span class="text-xs">Locked</span>
        {:else}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-{w} h-{h} stroke-primary/5 stroke-[1px]">
          <path d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 01-1.5 0V6.75a3.75 3.75 0 10-7.5 0v3a3 3 0 013 3v6.75a3 3 0 01-3 3H3.75a3 3 0 01-3-3v-6.75a3 3 0 013-3h9v-3c0-2.9 2.35-5.25 5.25-5.25z" />
        </svg>
        <span class="text-xs">Unlocked</span>
        {/if} -->

        <span class="text-xs">Swap</span>
      </div>   
      
    </span>

  </div>

  <!-- Don't use copyright component here - Needs different formatting here in footer -->
  <div class="inline-block mx-auto w-full text-center label-text">
    <!-- <a href="https://yakkl.com?utm_source=yakkl" class="text-xs text-primary/50 hover:text-primary/75"> -->
      <span style="font-size: 10px;">YAKKL® ©Copyright {YEAR}, Version: {VERSION} {registeredType}</span>
    <!-- </a> -->
  </div>
</footer>
