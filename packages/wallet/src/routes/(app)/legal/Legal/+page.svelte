<!-- Must be here - prerender -->
<script lang="ts">
  import { browserSvelte, browser_ext } from '$lib/common/environment';
  import { PATH_REGISTER } from '$lib/common';
  import type { Settings } from '$lib/common';

	import { getSettings, setSettingsStorage } from '$lib/common/stores';
	import { goto } from '$app/navigation';
  import { log } from '$plugins/Logger';

  let yakklSettings: Settings | null = null;

  async function update() {
    try {
      if (browserSvelte) {
        yakklSettings = await getSettings();
        if (yakklSettings) {
          yakklSettings.legal.privacyViewed = true;
          yakklSettings.legal.termsAgreed = true;
          yakklSettings.isLocked = true;
          await setSettingsStorage(yakklSettings);
          await goto(PATH_REGISTER);
        }
      }
    } catch (error) {
      log.error(error);
    }
  }

  async function handleSubmit() {
      try {
        await update();
      } catch (error) {
        log.error(error);
      }
  }

  function handleLink(e: { srcElement: { href: any; }; }) {
    // send link to new tab
    if (browserSvelte) {
      log.info(e);
      browser_ext.tabs.create({url: e.srcElement.href});
    }
  }

</script>
<!-- overflow-scroll  -->
<div class="relative pl-1 pr-1 m-1 ml-2 mr-2 bg-gradient-to-b from-indigo-900 to-indigo-700/80 rounded-xl">
  <main class="mt-1 max-w-7xl pl-1 pr-1">
    <div class="text-center">
      <h1 class="text-xl tracking-tight font-bold text-gray-900 dark:text-white">
        <span class=" text-gray-100 2xl:inline">LEGALS</span>
        <br>
        <span class=" text-gray-100 xl:inline">YAKKL® Smart Wallet</span>
      </h1>
      <p class="mt-1 max-w text-base text-gray-100 dark:text-white">
        Review and accept terms of service
      </p>
    </div>
    <div class="mt-1 mr-2 mb-2 w-full h-[564px] text-xs p-2 border border-1 text-gray-100 border-black dark:border-white dark:text-white overflow-scroll">

        <!-- Only here to allow for simple collapsing -->
        <div>

          {@html `___HTML_SNIPPET___`}

        </div>

    </div>
    <div class="mt-2 mb-2">
      <input type="checkbox"
          class="appearance-none animate-pulse h-4 w-4 border border-blue-800 rounded-sm bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain mr-2 cursor-pointer"
          onclick={handleSubmit}
          id="terms">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="stroke-white animate-bounce w-6 h-6 -ml-1 inline-block">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
      </svg>
      <label class="inline-block text-white dark:text-white  font-bold" for="terms">I have read and agree to the terms of service</label>
    </div>
    <div class="text-xs text-gray-100 dark:text-white mb-10">
      By checking the box above you are agreeing to our terms of service. Disclaimer and Privacy Policy can be found at yakkl.com. If you do not agree with the terms of service then you may close YAKKL® Smart Wallet and remove it.
    </div>

  </main>
</div>

