<script lang="ts">
  import { onMount } from 'svelte';
  import { yakklSettingsStore, yakklCurrentlySelectedStore, yakklMiscStore, yakklPreferencesStore, yakklTokenDataStore } from "$lib/common/stores";
  import { DEFAULT_POPUP_HEIGHT, DEFAULT_TITLE, DEFAULT_POPUP_WIDTH, debug_log, PATH_LOGIN, PATH_REGISTER, PATH_LEGAL, PATH_LOCK } from '$lib/common';
  import type { Preferences, Settings, TokenData, YakklCurrentlySelected } from '$lib/common';
  import Header from '$components/Header.svelte';
  import Footer from '$components/Footer.svelte';
  import { blockContextMenu, blockWindowResize } from '$lib/utilities';
  import ErrorNoAction from '$lib/components/ErrorNoAction.svelte';
  import { browserSvelte } from "$lib/common/environment";
	// import type { Wallet } from '$lib/plugins/Wallet';
	// import type { Blockchain, Provider } from '$lib/plugins';
	// import type { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
	import { goto } from '$app/navigation';
  import { page } from '$app/state';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  const EXCLUDED_PATHS = [PATH_LOGIN, PATH_REGISTER, PATH_LEGAL, PATH_LOCK, '/', '/index.html'];

  // Reactive State
  let yakklCurrentlySelected: YakklCurrentlySelected | null = $state(null);
  let yakklMisc: string = $state('');
  let yakklSettings: Settings | null = $state(null);
  let yakklPreferences: Preferences | null = $state(null);
  let yakklTokenData: TokenData[] = $state([]);
  // let yakklPrimaryAccounts: YakklPrimaryAccount[] = $state([]);
  // let yakklInstances: [Wallet, Provider, Blockchain, TokenService<any>] | [null, null, null, null] = $state([null, null, null, null]);

  // UI State
  let popupWidth: number = $state(DEFAULT_POPUP_WIDTH);
  let popupHeight: number = DEFAULT_POPUP_HEIGHT;
  let title: string = $state(DEFAULT_TITLE);
  let contextMenu: boolean = $state(false);
  let resize: boolean = $state(false);
  // let legal = $state(false);
  let error: boolean = $state(false);
  let errorValue: string = $state('');
  let maxHeightClass: string = $state('max-h-[448px]');

  onMount(async () => {
    debug_log('<<<<======= App layout: onMount =======>>>>');

    // yakklInstances = await getInstances();
    // debug_log('App layout: yakklInstances 1', yakklInstances);
    // yakklInstancesStore.set(yakklInstances); //Add the instances to the store so that we can use them in the app
    // if (yakklInstances) {
    //   debug_log('App layout: yakklInstances 2', yakklInstances, yakklInstancesStore);
    // } else {
    //   debug_log('App layout: yakklInstances - null', yakklInstances, yakklInstancesStore);
    // }

  });

  // Effect: Sync Store Values
  $effect(() => { yakklCurrentlySelected = $yakklCurrentlySelectedStore; });
  $effect(() => { yakklMisc = $yakklMiscStore; });
  $effect(() => { yakklSettings = $yakklSettingsStore; });
  $effect(() => { yakklPreferences = $yakklPreferencesStore; });
  $effect(() => { yakklTokenData = $yakklTokenDataStore; });
  // $effect(() => { yakklInstances = $yakklInstancesStore; });
  // $effect(() => { yakklPrimaryAccounts = $yakklPrimaryAccountsStore; });

  // Effect: Check Lock Status & Redirect - This should be the first thing that runs on every page. It will need to be put into any layout that is used.
  $effect(() => {
    if (!browserSvelte) return; // Ensure this only runs on the client
    // Use store OR localStorage to check if locked
    const isLocked = $yakklSettingsStore?.isLocked ?? JSON.parse(localStorage.getItem('settings') || '{}')?.isLocked;
    if (isLocked && !EXCLUDED_PATHS.includes(page.url.pathname)) {
      console.log('[INFO]: Locked: Redirecting to login...');
      goto(PATH_LOGIN);
    }
  });

  // Effect: Handle Internet Connection Status
  $effect(() => {
    if (browserSvelte && !navigator.onLine) {
      errorValue = 'It appears your Internet connection is offline. YAKKL needs access to the Internet to obtain current market prices and gas fees. A number of areas will either not function or work in a limited capacity. Thank you!';
      error = true;
    } else {
      error = false;
    }
  });

  // Effect: Sync Preferences and Settings
  // $effect(() => {
  //   debug_log('yakklPreferences 1', yakklPreferences);
  //   if (yakklPreferences) {
  //     debug_log('yakklPreferences 1 - screen', screen.height, screen.width);
  //     // yakklPreferences.screenHeight = screen.height;
  //     // yakklPreferences.screenWidth = screen.width;
  //     // setPreferencesStorage(yakklPreferences);
  //   }
  // });

  // $effect(() => {
  //   debug_log('yakklSettings', yakklSettings);
  //   if (yakklSettings && !yakklMisc) {
  //     maxHeightClass = ''; // Full-screen
  //     if (!yakklSettings.isLocked) {
  //       yakklSettings.isLocked = true;
  //       setSettingsStorage(yakklSettings);
  //     }
  //   }
  // });

  // Effect: Manage UI Preferences
  // $effect(() => {
  //   if (yakklPreferences?.wallet) {
  //     debug_log('yakklPreferences 2', yakklPreferences);

  //     popupWidth = yakklPreferences.wallet.popupWidth ?? DEFAULT_POPUP_WIDTH;
  //     popupHeight = yakklPreferences.wallet.popupHeight ?? DEFAULT_POPUP_HEIGHT;
  //     title = yakklPreferences.wallet.title ?? DEFAULT_TITLE;
  //     contextMenu = yakklPreferences.wallet.enableContextMenu ?? false;
  //     resize = yakklPreferences.wallet.enableResize ?? false;
  //   } else {
  //     debug_log('yakklPreferences defaults');
      // popupWidth = DEFAULT_POPUP_WIDTH;
      // popupHeight = DEFAULT_POPUP_HEIGHT;
      // title = DEFAULT_TITLE;
      // contextMenu = false;
      // resize = false;
  //   }
  // });

  // Effect: Manage Debug Mode and Blocking Features

  $effect(() => {
    if (process.env.DEV_DEBUG) {
      contextMenu = true;
      resize = true;
    }
    if (!contextMenu) blockContextMenu();
    if (!resize) blockWindowResize(popupWidth, popupHeight);
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

