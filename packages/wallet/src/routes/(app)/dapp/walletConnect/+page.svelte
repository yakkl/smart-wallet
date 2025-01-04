<script lang="ts">
  import {browser as browserSvelte} from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { yakklConnectedDomainsStore, getSettings, yakklDappConnectRequestStore } from '$lib/common/stores';
  import { PATH_LOGIN, YAKKL_DAPP, PATH_DAPP_ACCOUNTS } from '$lib/common/constants';
  import { onMount, onDestroy } from 'svelte';

  import type { Browser, Runtime } from 'webextension-polyfill';
  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
	import type { Settings } from '$lib/common';
  let browser_ext: Browser;
  if (browserSvelte) browser_ext = getBrowserExt();


  type RuntimePort = Runtime.Port | undefined;

  let showConfirm = $state(false);
  let showSuccess = false;
  let showFailure = $state(false);
  let errorValue = $state('No domain/site name was found. Access to YAKKL® is denied.');
  let port: RuntimePort;
  let domain: string = $state();
  let domainLogo: string = $state();
  let domainTitle: string = $state();
  let requestData: any;
  let method: string;
  let requestId: string | null;
  let message;  // This gets passed letting the user know what the intent is
  let context;

  if (browserSvelte) {
    requestId = $page.url.searchParams.get('requestId');
    $yakklDappConnectRequestStore = requestId as string;
  }

  // NOTE: domains will be added (if not already there at the next step - accounts)
  async function handleIsLocked() {
    try {
      let yakklSettings = await getSettings() as Settings;

      if (yakklSettings.init && yakklSettings.isLocked === true) {
        goto(PATH_LOGIN + '.html?requestId=' + requestId); // May force login auth every time so all of the checks would not be needed!
      } else {
        goto(PATH_DAPP_ACCOUNTS + '.html?requestId=' + requestId);
      }
    } catch(e) {
      errorValue = e as string;
      showFailure = true;
    }
  }

  onMount(() => {
    try {
      if (browserSvelte) {
        port = browser_ext.runtime.connect({name: YAKKL_DAPP});
        port.onMessage.addListener(async(event: any) => {
          method = event.method;
          requestData = event.data;

          if (event.method === 'get_params') {
            domainTitle = requestData?.data?.metaDataParams?.title ?? '';
            domain = requestData?.data?.metaDataParams?.domain ?? '';
            domainLogo = requestData?.data?.metaDataParams?.icon ?? '';
            message = requestData?.data?.metaDataParams?.message ?? 'Nothing was passed in explaining the intent of this approval. Be mindful!';
            context = requestData?.data?.metaDataParams?.context ?? 'accounts';
            requestId = !requestId ? requestData.id : requestId;

            if (!domain) {
              errorValue = 'Domain was not found. Check the dApp site again.'
              showFailure = true;
            } else {
              // Only enable these if you need to CLEAR everything out for testing!
              // $yakklConnectedDomainsStore = null;
              // await setYakklConnectedDomainsStorage(null);
              // let yakklAccounts = [];
              // yakklAccounts = await getYakklAccounts();
              // for (const item of yakklAccounts) {
              //   item.connectedDomains.length = 0;
              // };
              // $yakklAccountsStore = yakklAccounts;
              // await setYakklAccountsStorage($yakklAccountsStore);
              // Comment out this section after testing for clearing

              if ($yakklConnectedDomainsStore) {
                $yakklConnectedDomainsStore.find(element => {
                  if (element.domain === domain) {
                    const accounts = element.addresses;
                    if (port) port.postMessage({method: 'eth_requestAccounts', id: requestId, type: 'YAKKL_RESPONSE', result: accounts});
                    return;
                  }
                });
              }
            }
          }
        });
        port.postMessage({method: 'get_params', id: requestId}); // request is not currently used but we may want to later
      }
    } catch(e) {
      console.error(e);
    }
  });

  onDestroy( () => {
    try {
      if (browserSvelte) {
        if (port) {
          port.disconnect();
          // port.onMessage.removeListener();
          port = undefined;
        }
      }
    } catch(e) {
      console.log(e);
    }
  });

function handleReject() {
  try {
    showConfirm = false;
    showFailure = false;
    showSuccess = false;

    if (port) port.postMessage({method: method, response: {type: 'error', data: {code: 4001, message: 'User rejected the request.'}}, requestData: requestData});
    // If requestId is not valid then use 0 since we are bailing out anyway
    // May want to think about putting a slight tick to make sure all queues get flushed
    //goto(PATH_LOGOUT); // May want to do something else if they are already logged in!
    if (browserSvelte) window.close();
  } catch(e) {
    console.log(e);
  }
}

function handleApprove() {
  showConfirm = true;
}

</script>

<svelte:head>
	<title>YAKKL® Smart Wallet</title>
</svelte:head>

<div class="modal" class:modal-open={showConfirm}>
  <div class="modal-box relative">
    <!-- <label for="my-modal-3" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label> -->
    <h3 class="text-lg font-bold">Connect to {domain}</h3>
    <p class="py-4">This will connect <span class="font-bold">{domain}</span> to YAKKL®! Do you wish to continue?</p>
    <div class="modal-action">
      <button class="btn" onclick={handleReject}>Reject</button>
      <button class="btn" onclick={handleIsLocked}>Yes, Approved</button>
    </div>
  </div>
</div>

<div class="modal" class:modal-open={showFailure}>
  <div class="modal-box relative">
    <!-- <label for="my-modal-3" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label> -->
    <h3 class="text-lg font-bold">Failed!</h3>
    <p class="py-4">{errorValue}</p>
    <div class="modal-action">
      <button class="btn" onclick={handleReject}>Close</button>
    </div>
  </div>
</div>

<div class="text-center justify-center m-2 flex flex-col absolute top-[250px]">
  <!-- <Beta /> -->
  <div class="text-primary-content text-2xl font-bold flex flex-col">
    {domainTitle ?? ''}
    <br>
    <div class="text-primary-content text-2xl font-bold flex flex-col mt-4">Wants to connect to:</div>
  </div>
  <div class="text-primary-content text-2xl font-bold flex flex-col mt-3">
    Connect with YAKKL®
  </div>
  <div class="justify-center mt-5">
    <div class="rounded-badge inline-flex w-fit p-2 bg-secondary text-base-content font-semibold">
      <div class="flex flex-row w-10 h-10">
        <img src={domainLogo} alt="Dapp logo" />
      </div>
      <div class="animate-pulse flex flex-row">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-8 h-8 fill-gray-100">
          <path fill-rule="evenodd" d="M15.97 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 11-1.06-1.06l3.22-3.22H7.5a.75.75 0 010-1.5h11.69l-3.22-3.22a.75.75 0 010-1.06zm-7.94 9a.75.75 0 010 1.06l-3.22 3.22H16.5a.75.75 0 010 1.5H4.81l3.22 3.22a.75.75 0 11-1.06 1.06l-4.5-4.5a.75.75 0 010-1.06l4.5-4.5a.75.75 0 011.06 0z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="flex flex-row w-10 h-10">
        <img src="/images/logoBullFav48x48.png" alt="yakkl logo" />
      </div>
    </div>
  </div>

  <div class="text-center flex flex-col m-4 broder border-gray-500 bg-black">
    <p class="text-base-content font-bold">Select the account(s) to use for this dApp site</p>
  </div>

  <div class="my-4">
    <div class="flex space-x-2 justify-center">
      <button
        onclick={handleReject}
        class="btn-sm btn-accent uppercase rounded-full"
        aria-label="Cancel">
        Reject
      </button>

      <button
        type="submit"
        id="recover"
        onclick={handleApprove}
        class="btn-sm btn-primary uppercase rounded-full ml-2"
        aria-label="Confirm">
        Approve
      </button>
    </div>
  </div>

</div>


