<script lang="ts">
  import { sessionInitialized, yakklSettingsStore } from "$lib/common/stores";
  import { DEFAULT_POPUP_HEIGHT, DEFAULT_TITLE, DEFAULT_POPUP_WIDTH, PATH_LOGIN, PATH_REGISTER, PATH_LEGAL, PATH_LOCK, PATH_LOGOUT } from '$lib/common';
  import Header from '$components/Header.svelte';
  import Footer from '$components/Footer.svelte';
  import { blockContextMenu, blockWindowResize } from '$lib/utilities';
  import ErrorNoAction from '$lib/components/ErrorNoAction.svelte';
  import { browserSvelte } from "$lib/common/environment";
  import { page } from '$app/state';
  import { log } from '$plugins/Logger';
	import { onMount } from "svelte";
	import { ErrorHandler } from "$lib/plugins/ErrorHandler";
	import { afterNavigate, beforeNavigate } from "$app/navigation";

  // import type { Preferences, Settings, TokenData, YakklCurrentlySelected } from '$lib/common';
	// import type { Wallet } from '$lib/plugins/Wallet';
	// import type { Blockchain, Provider } from '$lib/plugins';
	// import type { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
	// import { goto } from '$app/navigation';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  const EXCLUDED_PATHS = [PATH_LOGIN, PATH_REGISTER, PATH_LEGAL, PATH_LOCK, PATH_LOGOUT, '/', '/index.html'];

  // UI State
  let popupWidth: number = $state(DEFAULT_POPUP_WIDTH);
  let popupHeight: number = DEFAULT_POPUP_HEIGHT;
  let title: string = $state(DEFAULT_TITLE);
  let contextMenu: boolean = $state(false);
  let resize: boolean = $state(false);
  let error: boolean = $state(false);
  let errorValue: string = $state('');
  let maxHeightClass: string = $state('max-h-[448px]');

  // Effect: Sync Store Values
  // $effect(() => { yakklCurrentlySelected = $yakklCurrentlySelectedStore; });
  // $effect(() => { yakklMisc = $yakklMiscStore; });
  // $effect(() => { yakklSettings = $yakklSettingsStore; });
  // $effect(() => { yakklPreferences = $yakklPreferencesStore; });
  // $effect(() => { yakklTokenData = $yakklTokenDataStore; });
  // $effect(() => { yakklInstances = $yakklInstancesStore; });
  // $effect(() => { yakklPrimaryAccounts = $yakklPrimaryAccountsStore; });

  // Effect: Check Lock Status & Redirect - This should be the first thing that runs on every page. It will need to be put into any layout that is used.
  // $effect(() => {
  //   if (!browserSvelte) return; // Ensure this only runs on the client
  //   // Use store OR localStorage to check if locked
  //   const isLocked = $yakklSettingsStore?.isLocked ?? JSON.parse(localStorage.getItem('settings') || '{}')?.isLocked;
  //   if (isLocked && !EXCLUDED_PATHS.includes(page.url.pathname)) {
  //     log.info('Locked: Redirecting to login...from', page.url.pathname);
  //     goto(PATH_LOGIN);
  //   }
  // });

  // Effect: Handle Internet Connection Status
  $effect(() => {
    if (browserSvelte && !navigator.onLine) {
      log.warn('Internet connection is offline');
      errorValue = 'It appears your Internet connection is offline. YAKKL needs access to the Internet to obtain current market prices and gas fees. A number of areas will either not function or work in a limited capacity. Thank you!';
      error = true;
    } else {
      error = false;
    }
  });

  // Effect: Manage Debug Mode and Blocking Features
  $effect(() => {
    if (process.env.DEV_DEBUG) {
      contextMenu = true;
      resize = true;
    }
    if (!contextMenu) blockContextMenu();
    if (!resize) blockWindowResize(popupWidth, popupHeight);
  });

  onMount(() => {
    // Reset session initialization state when app first loads
    sessionInitialized.set(false);
  });

  beforeNavigate(({ from, to, cancel }) => {
    log.info('Navigation attempted', true, {
      from: from?.url.pathname,
      to: to?.url.pathname,
      time: Date.now()
    });
  });

  afterNavigate(({ from, to }) => {
    log.info('Navigation completed', true, {
      from: from?.url.pathname,
      to: to?.url.pathname,
      time: Date.now()
    });
  });

</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<ErrorNoAction bind:show={error} title="Error" value={errorValue} />

<div id="wrapper" class="w-[{popupWidth}px] rounded-lg flex flex-col">
  <Header containerWidth={popupWidth} />

  <div class="min-h-[40rem] mx-2">
    <div class="relative mt-1">
      <main class="p-2 {maxHeightClass} rounded-xl bg-base-100 overflow-scroll border-2 border-stone-700 border-r-stone-700/75 border-b-slate-700/75">
        {@render children?.()}
      </main>
    </div>
  </div>

  <Footer containerWidth={popupWidth.toString()} />
</div>

