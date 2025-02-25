<script lang="ts">
  import { browserSvelte } from '$lib/utilities/browserSvelte';
  import { page } from '$app/state';
  import { YAKKL_DAPP } from '$lib/common/constants';
  import { onMount, onDestroy } from 'svelte';
  import { log } from '$plugins/Logger';

  import type { Browser, Runtime } from 'webextension-polyfill';
  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
  let browser_ext: Browser;
  if (browserSvelte) browser_ext = getBrowserExt();


  type RuntimePort = Runtime.Port | undefined;

  let errorValue = 'No domain/site name was found. Access to YAKKL® is denied.';
  let message: string = $state();
  let method: string;
  let port: RuntimePort;
  let requestId: string;

  if (browserSvelte) {
    requestId = page.url.searchParams.get('requestId') ?? '';
  }

  onMount(() => {
    try {
      if (browserSvelte) {
        port = browser_ext.runtime.connect({name: YAKKL_DAPP});
        port.onMessage.addListener(async(event: any) => {
          method = event.method;

          console.log('warning', event);

          if (event.method === 'get_warning') {
            message = event.data?.data ?? 'Nothing was passed in explaining the intent of this approval. Be mindful!';
          }

          console.log('message', message);
        });
        console.log('requestId', requestId);
        port.postMessage({method: 'get_warning', id: requestId ?? 0}); // request is not currently used but we may want to later
      }
    } catch(e) {
      log.error(e);
    }
  });

  onDestroy( () => {
    if (browserSvelte) {
      if (port) {
        // port.onMessage.removeListener();
        port.disconnect();
        port = undefined;
      }
    }
  });


function handleReject() {
  try {
    if (port) port.postMessage({method: method, response: {type: 'error', data: {code: 4001, message: 'User rejected the request. User issue!'}}, requestData: ''});
    // If we call logout then the default process would be to update currentlyselected and we don't want any changes from dapp related activities. We could send an indicator and bypass
    if (browserSvelte) {
      browser_ext.action.setIcon({path: "/images/logoBullLock48x48.png"}); // Just incase login changed it
    }
  } catch(e) {
    log.error(e);
  } finally {
    window.close();
  }
}

</script>
<svelte:head>
	<title>YAKKL® Smart Wallet</title>
</svelte:head>

<div class="text-center justify-center m-2 flex flex-col absolute top-[180px]">

  <div class="text-primary-content text-2xl font-bold flex flex-col">
    Current DAPP Site Error
    <br>
  </div>

  <div class="mt-10">
    <div class="image-full justify-center flex">
      <figure><img src="/images/logoBullFav128x128.png" alt="yakkl logo" /></figure>
    </div>
  </div>

  <div class="flex flex-col m-4 text-left border-black rounded-md bg-black">
    <p class="text-base-content p-1">{message}</p>
  </div>

  <div class="my-4">
    <div class="flex space-x-2 justify-center">
      <button
        type="submit"
        onclick={() => handleReject()}
        class="btn-sm btn-accent uppercase rounded-full"
        aria-label="Close">
        Close
      </button>
    </div>
  </div>

</div>

