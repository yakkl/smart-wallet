<script lang="ts">
  import { browser as browserSvelte } from '$app/environment';
  import { setSettings, setPreferencesStorage, getPreferences, getSettings, getMiscStore, getYakklCurrentlySelected } from "$lib/common/stores";
  import { DEFAULT_POPUP_HEIGHT, DEFAULT_TITLE, DEFAULT_POPUP_WIDTH } from '$lib/common';
  import type { Preferences, Settings, YakklCurrentlySelected } from '$lib/common';
  import Header from '$components/Header.svelte';
  import Footer from '$components/Footer.svelte';
  import { setIconLock, blockContextMenu, blockWindowResize } from '$lib/utilities';
  import { onMount } from 'svelte';
	import { Tooltip } from 'flowbite-svelte';

  // import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
	// import type { Browser } from 'webextension-polyfill';
  // let browser_ext: Browser; 
  // if (browserSvelte) browser_ext = getBrowserExt();

  // Local version
  let yakklMiscStore: string;
  let currentlySelected: YakklCurrentlySelected;
  let yakklSettings: Settings | null; 
  let yakklPreferences: Preferences;
  
  let popupWidth = DEFAULT_POPUP_WIDTH;
  let popupHeight = DEFAULT_POPUP_HEIGHT;
  let title = DEFAULT_TITLE;
  let contextMenu = false;
  let resize = false;

  let tooltipTriggerList;
  // let tooltipList;
  let legal = false;

  let error = false;
  let errorValue: string = '';

  let maxHeightClass = 'max-h-[448px]';

  $: {
    if (browserSvelte) {
      if (!window.navigator.onLine) {
        errorValue = 'It appears your Internet connection is offline. YAKKL needs access to the Internet to obtain current market prices and gas fees. A number of areas will either not function or work in a limited capacity. Thank you!';
        error = true;
      } else {
        error = false;
      }
    }
  }

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

  onMount(async () => {
    try {
      if (browserSvelte) {
        yakklMiscStore = getMiscStore();
        currentlySelected = await getYakklCurrentlySelected();
        legal = currentlySelected.shortcuts.legal === true;

        getPreferencesUpdate().then(async result => {
          if (result) {
            yakklPreferences = result;
            yakklPreferences.screenHeight = screen.height;
            yakklPreferences.screenWidth = screen.width;
          }

          setPreferencesStorage(yakklPreferences);
          getSettingsUpdate().then(async (value) => {
            yakklSettings = value; //? value : undefined;
            if (yakklSettings) {
              if (yakklSettings.legal.termsAgreed) {
                legal = true;
              }

              if (!yakklMiscStore) {
                maxHeightClass = ''; // So it is full screen
                yakklSettings.isLocked = true;
                setSettings(yakklSettings);
                await setIconLock();
              }
              
              if (yakklPreferences) {
                if (!yakklPreferences.wallet) {
                  popupWidth = DEFAULT_POPUP_WIDTH;
                  popupHeight = DEFAULT_POPUP_HEIGHT;
                  title = DEFAULT_TITLE;
                  contextMenu = false;
                  resize = false;  
                } else {
                  popupWidth = yakklPreferences.wallet.popupWidth ?? DEFAULT_POPUP_WIDTH;
                  popupHeight = yakklPreferences.wallet.popupHeight ?? DEFAULT_POPUP_HEIGHT;
                  title = yakklPreferences.wallet.title ?? DEFAULT_TITLE;
                  contextMenu = yakklPreferences.wallet.enableContextMenu ?? false;
                  resize = yakklPreferences.wallet.enableResize ?? false;  
                }
              } else {
                popupWidth = DEFAULT_POPUP_WIDTH;
                popupHeight = DEFAULT_POPUP_HEIGHT;
                title = DEFAULT_TITLE;
                contextMenu = false;
                resize = false;
              }
            }
          });
        });

        if (process.env.DEV_DEBUG) {
          contextMenu = true;
          resize = true;
        }
        if (!contextMenu) {
          blockContextMenu();
        }
        if (!resize) {
          blockWindowResize(popupWidth, popupHeight);
        }

        tooltipTriggerList = [].slice.call(
          document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );

        if (tooltipTriggerList.length > 0) {
          tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new Tooltip(tooltipTriggerEl);  // TODO: This needs to be replaced with another library
        });
        }
      }
    } catch (error) {
      console.log('layout: error', error);
      popupWidth = DEFAULT_POPUP_WIDTH;
      popupHeight = DEFAULT_POPUP_HEIGHT;
      title = DEFAULT_TITLE;
      contextMenu = false;
      resize = false;
    }
  });

</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div id="wrapper" class="w-[{popupWidth}px] rounded-lg flex flex-col">
  <div class="modal" class:modal-open={error}>
    <div class="modal-box relative">
      <h3 class="text-lg font-bold">ERROR!</h3>
      <p class="py-4">{errorValue}</p>
      <div class="modal-action">
        <button class="btn" on:click={() => error = false}>Close</button>
      </div>
    </div>
  </div>
  
  {#if legal === true}
  <Header containerWidth={popupWidth} />
  {/if}

  <div class="min-h-[40rem] mx-2"> 
    <div class="relative mt-1">
      <main class="p-2 {maxHeightClass} rounded-xl bg-base-100 overflow-scroll border-2 border-stone-700 border-r-stone-700/75 border-b-slate-700/75">
        <slot/>
      </main>
    </div>
  </div>

  {#if legal === true}
  <Footer containerWidth={popupWidth.toString()} classParam="print:hidden text-xs mt-1 visible" />
  {/if}
</div>
