<script lang="ts">
  import { setSettings, setPreferencesStorage, getPreferences, getSettings, getMiscStore, getYakklCurrentlySelected } from "$lib/common/stores";
  import { DEFAULT_POPUP_HEIGHT, DEFAULT_TITLE, DEFAULT_POPUP_WIDTH, debug_log } from '$lib/common';
  import type { Preferences, Settings } from '$lib/common';
  import Header from '$components/Header.svelte';
  import Footer from '$components/Footer.svelte';
  import { setIconLock, blockContextMenu, blockWindowResize } from '$lib/utilities';
  import { onMount } from 'svelte';
	import ErrorNoAction from '$lib/components/ErrorNoAction.svelte';

  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
  import type { Browser } from 'webextension-polyfill';
	import { browserSvelte } from '$lib/utilities/browserSvelte';
	import { onMessageUnloadAdd, onMessageUnloadRemove } from "$lib/common/listeners/ui/windowListeners";

  let browser_ext: Browser;
  if (browserSvelte) browser_ext = getBrowserExt();

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  // Local version
  let yakklMiscStore: string;
  let yakklSettings: Settings | null;
  let yakklPreferences: Preferences;

  let popupWidth = $state(DEFAULT_POPUP_WIDTH);
  let popupHeight = DEFAULT_POPUP_HEIGHT;
  let title = $state(DEFAULT_TITLE);
  let contextMenu = false;
  let resize = false;
  let legal = $state(false);
  let error = $state(false);
  let errorValue: string = $state('');
  let maxHeightClass = $state('max-h-[448px]');

  // $effect(() => {
  //   if (browserSvelte) {
  //     if (!window.navigator.onLine) {
  //       errorValue = 'It appears your Internet connection is offline. YAKKL needs access to the Internet to obtain current market prices and gas fees. A number of areas will either not function or work in a limited capacity. Thank you!';
  //       error = true;
  //     } else {
  //       error = false;
  //     }
  //   }
  // });

  async function getSettingsUpdate() {
    if (browserSvelte) {
      return getSettings();
    }
    return null;
  }

  async function getPreferencesUpdate() {
    if (browserSvelte) {
      return getPreferences();
    }
    return null;
  }

  onMount(() => {
    let isMounted = true; // To handle potential race conditions

    const initialize = async () => {
      try {
        if (browserSvelte) {
          yakklMiscStore = getMiscStore();

          const currentlySelected = await getYakklCurrentlySelected();
          if (currentlySelected && isMounted) {
            legal = currentlySelected.shortcuts.legal === true;
          }

          const preferences = await getPreferencesUpdate();
          if (preferences && isMounted) {
            yakklPreferences = preferences;
            yakklPreferences.screenHeight = screen.height;
            yakklPreferences.screenWidth = screen.width;
            setPreferencesStorage(yakklPreferences);
          }

          const settings = await getSettingsUpdate();
          if (settings && isMounted) {
            yakklSettings = settings;

            if (yakklSettings.legal?.termsAgreed) {
              legal = true;
            }

            if (!yakklMiscStore) {
              maxHeightClass = ''; // So it is full screen
              yakklSettings.isLocked = true;
              setSettings(yakklSettings);
              await setIconLock();
            }

            if (yakklPreferences?.wallet) {
              popupWidth = yakklPreferences.wallet.popupWidth ?? DEFAULT_POPUP_WIDTH;
              popupHeight = yakklPreferences.wallet.popupHeight ?? DEFAULT_POPUP_HEIGHT;
              title = yakklPreferences.wallet.title ?? DEFAULT_TITLE;
              contextMenu = yakklPreferences.wallet.enableContextMenu ?? false;
              resize = yakklPreferences.wallet.enableResize ?? false;
            } else {
              popupWidth = DEFAULT_POPUP_WIDTH;
              popupHeight = DEFAULT_POPUP_HEIGHT;
              title = DEFAULT_TITLE;
              contextMenu = false;
              resize = false;
            }
          }

          if (process.env.DEV_DEBUG) {
            contextMenu = true;
            resize = true;
          }
          if (!contextMenu) blockContextMenu();
          if (!resize) blockWindowResize(popupWidth, popupHeight);
        }

        debug_log('App layout: initialized');

        onMessageUnloadAdd();
      } catch (error) {
        console.log('[ERROR]: layout: error', error);
        popupWidth = DEFAULT_POPUP_WIDTH;
        popupHeight = DEFAULT_POPUP_HEIGHT;
        title = DEFAULT_TITLE;
        contextMenu = false;
        resize = false;
      }
    };

    initialize();

    // Cleanup function
    return () => {
      isMounted = false; // Prevent further updates
      onMessageUnloadRemove();
    };
  });

</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<ErrorNoAction bind:show={error} title="Error" value={errorValue} />

<div id="wrapper" class="w-[{popupWidth}px] rounded-lg flex flex-col">
  {#if legal}
    <Header containerWidth={popupWidth} />
  {/if}

  <div class="min-h-[40rem] mx-2">
    <div class="relative mt-1">
      <main class="p-2 {maxHeightClass} rounded-xl bg-base-100 overflow-scroll border-2 border-stone-700 border-r-stone-700/75 border-b-slate-700/75">
        {@render children?.()}
      </main>
    </div>
  </div>

  {#if legal}
    <Footer containerWidth={popupWidth.toString()} />
  {/if}
</div>
