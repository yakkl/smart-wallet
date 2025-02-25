<script lang="ts">
	import { log } from '$lib/plugins/Logger';
  import { handleOpenInTab } from '$lib/utilities';
  import { Popover } from 'flowbite-svelte';

  interface Props {
    [key: string]: any
  }

  let { ...rest }: Props = $props();

  async function handleShare(event: MouseEvent): Promise<void> {
    event.preventDefault(); // Modern way to prevent default

    const target = event.currentTarget as HTMLElement;
    const id = target?.dataset?.id;

    if (!id) {
      log.error('No ID found');
      return;
    }

    let message: string;
    let url: string = '';

    if (id === 'twitter') {
      message = 'Spreading the love! @yakklcrypto YAKKL® Smart Wallet is awesome! Their website is: https://yakkl.com and you can download the Smart Wallet at the Chrome Browser Extension store: ';
      url = encodeURI(`https://twitter.com/intent/tweet?hashtags=crypto,yakkl,bitcoin,ethereum&via=yakklcrypto&original_referer=https://yakkl.com&ref_src=YAKKL&url=https://chrome.google.com/webstore/detail/dpmfhilhjlhhakpbieclcghochdofeao/&text=${message}`);
    } else if (id === 'linkedin') {
      message = "Can't wait to share the love of YAKKL® Smart Wallet! Download the best Crypto Smart Wallet at (Google Chrome Store) https://chrome.google.com/webstore/detail/dpmfhilhjlhhakpbieclcghochdofeao/. The website is: https://yakkl.com.";
      url = encodeURI(`https://www.linkedin.com/sharing/share-offsite?url=https://yakkl.com/?utm_source=linkedin&utm_medium=share&title=${message}`);
    }

    if (url) {
      handleOpenInTab(url);
    }
  }
</script>

<Popover triggeredBy="#share" placement="bottom-start" class="w-[200px] text-sm font-normal text-gray-900 bg-white dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800 z-100">
  <div class="p-1 block">
    <div class="flex text-center justify-center m-2 ml-0 w-full">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6 fill-red-700 animate-pulse">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
      <p class="ml-1 text-sm font-bold text-center text-purple-600">SHARE THE LOVE!</p>
    </div>

    <!-- Social Media Buttons -->
    <button
      id="twitter"
      data-id="twitter"
      onclick={handleShare}
      class="flex flex-row rounded-md ml-6 text-base font-semibold text-gray-900 dark:text-wwhite hover:bg-gray-200 w-full text-left"
    >
      <svg viewBox="0 0 1200 1227" xmlns="http://www.w3.org/2000/svg" class="flex flex-col w-5 h-5 mt-[.1rem] mr-1 bg-black">
        <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" fill="white"/>
      </svg>
      <span class="ml-3 flex flex-col text-base font-semibold text-gray-900 dark:text-base-content hover:text-slate-600 dark:hover:text-gray-900">X (twitter)</span>
    </button>

    <button
      id="linkedin"
      data-id="linkedin"
      onclick={handleShare}
      class="my-1 flex flex-row rounded-md ml-6 text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-200 w-full text-left"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="flex flex-col w-6 h-6">
        <path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"/>
      </svg>
      <span class="ml-3 flex flex-col text-base font-semibold text-gray-900 dark:text-base-content hover:text-slate-600 dark:hover:text-gray-900">LinkedIn</span>
    </button>
  </div>
</Popover>

<!-- Share Button -->
<!-- svelte-ignore a11y_consider_explicit_label -->
<button
  id="share"
  onclick={handleShare}
  {...rest}
  class="bg-transparent border-none p-0 cursor-pointer"
>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7 fill-gray-100 hover:fill-gray-400">
    <path fill-rule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clip-rule="evenodd" />
  </svg>
</button>
