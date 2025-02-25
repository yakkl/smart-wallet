<script lang="ts">
  // NOTE: tw-elements alpha is what we are using. The latest version changed the data elements which caused the UI elements not to work. If we decide to continue using tw-elements then we will need to change from data-bs-xxxx to data-te-xxxx after upgrading.

  // NOTE: This impacts the dropdown for networks, top right and top left header options (offcanvas), and tooltips

  import { goto } from '$app/navigation';
  import { identicon } from '$lib/utilities';
  import { getMiscStore, getYakklCurrentlySelected } from '$lib/common/stores';
  import { PATH_LOGOUT, DEFAULT_POPUP_WIDTH, type YakklCurrentlySelected } from '$lib/common';
  import Card from '$lib/components/Card.svelte';
  import ImageBar from '$lib/components/ImageBar.svelte';
  import { handleOpenInTab } from '$lib/utilities';
	import NotEnabled from '$lib/components/NotEnabled.svelte';
	import Share from '$lib/components/Share.svelte';
  // import CommingSoon from '$lib/components/ComingSoon.svelte';
	import { onMount } from 'svelte';
	import EmergencyKitModal from './EmergencyKitModal.svelte';
	import { log } from '$lib/plugins/Logger';

  interface Props {
    id?: string;
    containerWidth?: any; // Default but IS changed via properties on <Header ...>
  }

  let { id = "header", containerWidth = DEFAULT_POPUP_WIDTH }: Props = $props();

  let currentlySelected: YakklCurrentlySelected;
  let yakklMiscStore: string | null = getMiscStore();
  // let showComingSoon = $state(false);
  let showInfo = $state(false);

  let address: string;
  let imageSRC: string;
  let showEmergencyKit = $state(false);
  let showEmergencyKitExport = $state(false);
  let showEmergencyKitImport = $state(false);

  onMount(async () => {
    try {
      currentlySelected = await getYakklCurrentlySelected();
      // yakklMiscStore = getMiscStore();
      address = currentlySelected.shortcuts.address;
      imageSRC = identicon(address ? address : 'default');
    } catch (e) {
      log.error(`Header: onMount - ${e}`);
    }
  });

  // function handleDelete() {
  //   try {
  //     document.getElementById('collapseSidenavSecEx2')?.classList?.remove('show');
  //     document.getElementById('offcanvasSettings')?.classList?.remove('show');
  //     let id = document.getElementsByClassName('offcanvas-backdrop')[0];
  //   id.remove();
  //   } catch (error) {
  //     log.error(error);
  //   }
  // }

  function handleUniversity() {
    try {
      handleOpenInTab('https://yakkl.com/university/support?utm_source=yakkl&utm_medium=extension&utm_campaign=extension&utm_content=university&utm_term=extension');
    } catch (error) {
      log.error(error);
    }
  }

</script>

<NotEnabled bind:show={showInfo} value="This feature is not yet available. It will be released soon!"/>
<!-- <CommingSoon bind:show={showComingSoon} value="This feature is not yet available. It will be released soon!"/> -->
<EmergencyKitModal bind:show={showEmergencyKit} mode={showEmergencyKitExport ? 'export' : showEmergencyKitImport ? 'import' : 'export'} />

<ImageBar>
  <!-- id="{id}" -->
  <nav id="{id}" class="print:hidden visible relative top-0 navbar navbar-expand-sm py-0 flex items-center w-full justify-between">

    <!-- svelte-ignore a11y_consider_explicit_label -->
    <a data-bs-toggle="offcanvas" href="#offcanvasSystemSettings" role="button" aria-controls="offcanvasSystemSettings">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-8 h-8 fill-gray-100 hover:fill-gray-500">
        <path fill-rule="evenodd" d="M3 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 5.25zm0 4.5A.75.75 0 013.75 9h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 9.75zm0 4.5a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zm0 4.5a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clip-rule="evenodd" />
      </svg>
    </a>

    <div class="flex justify-center py-1 ">
      <div>
        <div class="relative">
          <button
            class="px-6 py-2 backdrop-opacity-10 backdrop-invert bg-white/50 text-purple-900 font-bold text-xs uppercase underline leading-tight rounded-full shadow-md hover:bg-white/90 hover:shadow-lg transition duration-150 ease-in-out flex items-center whitespace-nowrap"
            onclick={handleUniversity}
            aria-expanded="false"
            id="yakkluni">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="w-4 h-4 mr-2 stroke-purple-900">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
            <span id="yakklU">YAKKL® University</span>
          </button>
        </div>
      </div>
    </div>

    <Share class="absolute top-[1.1rem] right-[2.8rem]"/>

    <a data-bs-toggle="offcanvas" href="#offcanvasSettings" role="button" aria-controls="offcanvasSettings">
      <!-- Can add an avatar here ---- <img id="avatar" src="{imageSRC}" class="rounded-full mr-2 w-8 ring-offset-1 ring-2 " alt="Avatar" /> -->
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="w-8 h-8 font-bold stroke-gray-100 hover:stroke-gray-500">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
      </svg>
    </a>
  </nav>

</ImageBar>

{#if yakklMiscStore}
<Card/>
{/if}

<!-- Hamburger icon 550px -->
<div class="flex space-x-2 z-10 text-base-content">
  <div>
    <div
      class="offcanvas offcanvas-start top-0 left-0 fixed bottom-auto flex flex-col min-w-[200px] max-w-[{containerWidth}px] md:max-w-full font-sans antialiased invisible bg-clip-padding shadow-sm outline-none transition duration-300 ease-in-out border-none rounded-r-md bg-primary"
      tabindex="-1" id="offcanvasSystemSettings" aria-labelledby="offcanvasSystemSettingsLabel">
      <div class="offcanvas-header flex items-center justify-between pl-4 pr-4 pt-2 pb-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h5 class="offcanvas-title mb-0 leading-normal font-semibold text-base-content" id="offcanvasSystemSettingsLabel">System Settings</h5>
        <button type="button"
          class="-mr-2 border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:opacity-75 hover:no-underline"
          data-bs-dismiss="offcanvas" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <hr class="my-1">

      <div class="min-w-60 shadow-md flex-grow" id="sidenavSecSettings">
        <ul class="relative px-1">
          <li class="relative" data-bs-dismiss="offcanvas" >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <div role="button" onclick={() => goto(PATH_LOGOUT)}
              class="flex items-center text-sm py-4 px-6 h-10 overflow-hidden text-ellipsis whitespace-nowrap rounded text-base-content hover:text-base-300 hover:bg-primary-100/50 transition duration-300 ease-in-out"
              data-mdb-ripple="true" data-mdb-ripple-color="primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 -ml-2" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <span>Lock/Logout</span>
            </div>
          </li>
        </ul>

        <div class="text-center relative w-full bg-primary">
          <hr class="m-0">
          <p class="text-sm text-base-content" data-bs-dismiss="offcanvas" ><a href="https://yakkl.com/university/support?utm_source=yakkl&utm_medium=extension&utm_campaign=extension&utm_content=menu&utm_term=help" target="_blank" rel="noreferrer">Help - yakkl.com/university/support</a></p>
        </div>
      </div>

    </div>
  </div>
</div>

<!-- Account Settings - More icon 550px-->
<div class="flex space-x-2 z-10 text-base-content">
  <div>
    <div
      class="offcanvas offcanvas-end top-0 right-0 fixed bottom-auto flex flex-col min-w-[200px] max-w-[{containerWidth}px] font-sans antialiased invisible bg-clip-padding shadow-sm outline-none transition duration-300 ease-in-out border-none rounded-l-md bg-primary"
      tabindex="-1" id="offcanvasSettings" aria-labelledby="offcanvasSettingsLabel">
      <div class="offcanvas-header flex items-center justify-between pl-4 pr-4 pt-2 pb-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        <h5 class="offcanvas-title mb-0 leading-normal font-semibold" id="offcanvasSettingsLabel">Emergency Kit</h5>
        <button type="button"
          class="-mr-2 border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 "
          data-bs-dismiss="offcanvas" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <hr class="my-1">

      <div class="min-w-60 shadow-md flex-grow" id="sidenavSec">
        <!-- <div class="pt-1 pb-1 px-3">
          <div class="flex items-center">
            <div class="shrink-0">
              <img
                src="{imageSRC}" class="rounded-full w-6 mr-2 ring-offset-1 ring-1" alt="Avatar">
            </div>
          </div>
        </div> -->
        <ul class="relative px-1">
          <!-- <li class="relative" data-bs-dismiss="offcanvas" > -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <!-- <div role="button" on:click={() => goto(PATH_WELCOME)}
              class="flex items-center text-sm py-4 px-3 h-10 overflow-hidden text-ellipsis whitespace-nowrap rounded hover:text-primary hover:bg-base-100/50 transition duration-300 ease-in-out"
              data-mdb-ripple="true" data-mdb-ripple-color="primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 -ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
              </svg>
              <span>Theme</span>
            </div>
          </li> -->

          <!-- <li class="relative" data-bs-dismiss="offcanvas" > -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <!-- <div role="button" on:click={() => {showComingSoon = true}}
              class="flex items-center text-sm py-4 px-3 h-10 overflow-hidden text-ellipsis whitespace-nowrap rounded hover:text-base-300 hover:bg-primary/50 transition duration-300 ease-in-out"
              data-mdb-ripple="true" data-mdb-ripple-color="primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 -ml-2" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Profile</span>
            </div>
          </li> -->

          <li class="relative" data-bs-dismiss="offcanvas" >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <div role="button" onclick={() => {showEmergencyKitImport = false; showEmergencyKitExport=true; showEmergencyKit=true;}} class="flex items-center text-sm py-4 px-3 h-10 overflow-hidden hover:text-base-300 hover:bg-primary/50 text-ellipsis whitespace-nowrap rounded  transition duration-300 ease-in-out"
              data-mdb-ripple="true" data-mdb-ripple-color="primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 -ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </div>
          </li>
          <li class="relative" data-bs-dismiss="offcanvas" >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <div role="button" onclick={() => {showEmergencyKitExport = false; showEmergencyKitImport=true; showEmergencyKit=true;}} class="flex items-center text-sm py-4 px-3 h-10 overflow-hidden text-ellipsis whitespace-nowrap rounded hover:text-base-300 hover:bg-primary/50 transition duration-300 ease-in-out"
              data-mdb-ripple="true" data-mdb-ripple-color="primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 -ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Import</span>
            </div>
          </li>
          <!-- <li class="relative" data-bs-dismiss="offcanvas" > -->
            <!-- <a class="flex items-center text-sm py-4 px-3 h-10 overflow-hidden text-ellipsis whitespace-nowrap rounded hover:text-primary hover:bg-base-100/50 transition duration-300 ease-in-out" href="/" data-mdb-ripple="true" data-mdb-ripple-color="primary"> -->
              <!-- svelte-ignore a11y_interactive_supports_focus -->
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- <div role="button" on:click={() => goto(PATH_ACCOUNTS)} class="flex items-center text-sm py-4 px-3 h-10 overflow-hidden text-ellipsis whitespace-nowrap rounded hover:text-primary hover:bg-base-100/50 transition duration-300 ease-in-out"
                data-mdb-ripple="true" data-mdb-ripple-color="primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 -ml-2" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Add Accounts</span> -->
            <!-- </a> -->
            <!-- </div>
          </li> -->
        </ul>

        <hr class="my-1">

        <ul class="relative px-1">
          <li class="relative" data-bs-dismiss="offcanvas" >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <div role="button" onclick={() => goto(PATH_LOGOUT)} class="flex items-center text-sm py-4 px-6 h-10 text-base-content text-ellipsis whitespace-nowrap rounded hover:text-base-300 hover:bg-primary/50 transition duration-300 ease-in-out" data-mdb-ripple="true" data-mdb-ripple-color="primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 -ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>EXIT YAKKL</span>
            </div>
          </li>
        </ul>
        <div class="text-center relative w-full bg-primary">
          <hr class="m-0">
          <p class="text-sm text-base-content font-semibold" data-bs-dismiss="offcanvas" ><a href="https://yakkl.com?utm_source=yakkl&utm_medium=extension&utm_campaign=extension&utm_content=menu&utm_term=primary" target="_blank" rel="noreferrer">yakkl.com</a></p>
        </div>
      </div>

    </div>
  </div>
</div>


