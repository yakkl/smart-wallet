<script lang="ts">
  import { browserSvelte } from '$lib/utilities/browserSvelte';
  import { page } from '$app/state';

  import { getYakklCurrentlySelected, getYakklAccounts, getMiscStore, getDappConnectRequestStore, setDappConnectRequestStore } from '$lib/common/stores';
  import { isEncryptedData, type AccountData, type YakklAccount, type YakklCurrentlySelected } from '$lib/common';
  import { YAKKL_DAPP } from '$lib/common/constants';
  import { onMount, onDestroy } from 'svelte';
  import { wait } from '$lib/common/utils';
  import { decryptData } from '$lib/common/encryption';
  import { Spinner } from 'flowbite-svelte';
  import WalletManager from '$lib/plugins/WalletManager';
  import type { Wallet } from '$lib/plugins/Wallet';
  import { log } from '$plugins/Logger';

  let wallet: Wallet;

  import type { Browser, Runtime } from 'webextension-polyfill';
  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
	import { verify } from '$lib/common/security';

  let browser_ext: Browser;
  if (browserSvelte) browser_ext = getBrowserExt();

  type RuntimePort = Runtime.Port;

  let currentlySelected: YakklCurrentlySelected;
  let yakklMiscStore: string;
  let yakklDappConnectRequest: string | null;

  let showConfirm = $state(false);
  let showSuccess = $state(false);
  let showFailure = $state(false);
  let showSpinner = $state(false);
  let errorValue = $state('No domain/site name was found. Access to YAKKL® is denied.');
  let port: RuntimePort | undefined;

  let domain: string = $state();
  let domainLogo: string = $state();
  let domainTitle: string = $state();
  let requestData: any;
  let method: string;
  let requestId: string | null;
  let userName: string = $state();
  let password: string = $state();
  let message;  // This gets passed letting the user know what the intent is
  let context: any;
  let addressToCheck: string;
  let signedData: any;
  let chainId: number;

  let params: any[] = $state([]);
  let personal_sign = {
    dataToSign: '',   // Only used for personal_sign
    address: '',
    description: '',
  };

  interface SignTypedData {
    address: string;
    dataToSign: string | Record<string, any>;
  };

  let signTypedData_v3v4: SignTypedData;

  signTypedData_v3v4 = {
    address: '',
    dataToSign: '',
  }

  let messageValue; // Used to display non-hex data that matches transaction or message

  onMount(async () => {
    try {
      if (browserSvelte) {
        currentlySelected = await getYakklCurrentlySelected();
        yakklMiscStore = getMiscStore();
        yakklDappConnectRequest = getDappConnectRequestStore(); // Not required any longer but keep for now
        yakklDappConnectRequest = requestId = page.url.searchParams.get('requestId') as string;
        setDappConnectRequestStore(yakklDappConnectRequest);
        chainId = currentlySelected.shortcuts.chainId as number;

        wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], currentlySelected.shortcuts.chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);

        port = browser_ext.runtime.connect({name: YAKKL_DAPP});
        if (port) {
          port.onMessage.addListener(async(event: any) => {
            if (!event?.data) return;
            method = context;
            requestData = event.data;

            if (event.method === 'get_params') {
              domainTitle = requestData?.data?.metaDataParams?.title ?? '';
              domain = requestData?.data?.metaDataParams?.domain ?? '';
              domainLogo = requestData?.data?.metaDataParams?.icon ?? '/images/logoBullLock48x48.png';
              message = requestData?.data?.metaDataParams?.message ?? 'Nothing was passed in explaining the intent of this approval. Be mindful!';
              context = requestData?.data?.metaDataParams?.context ?? 'sign';
              params = requestData?.data?.metaDataParams?.transaction ?? [];

              if (!requestId) requestId = requestData.id;
              let data;

              switch(context) {
                case 'personal_sign':
                  personal_sign.dataToSign = params[0];
                  personal_sign.address = addressToCheck = params[1];
                  personal_sign.description = message = params[2];
                  break;
                case 'eth_signTypedData_v3':
                case 'eth_signTypedData_v4':
                  signTypedData_v3v4.address = addressToCheck = params[0];
                  signTypedData_v3v4.dataToSign = params[1];
                  if (typeof signTypedData_v3v4.dataToSign === 'string') {
                    data = JSON.parse(signTypedData_v3v4.dataToSign);
                  } else {
                    data = signTypedData_v3v4.dataToSign;
                  }
                  message = data.message?.contents;
                  break;
                default:
                  messageValue = 'No message request was passed in. Error.';
                  break;
              }

            }
          });
        }

        if (port)
          port.postMessage({method: 'get_params', id: requestId}); // request is not currently used but we may want to later
      }
    } catch(e) {
      log.error(e);
    }
  });

  onDestroy( () => {
    if (browserSvelte) {
      if (port) {
        port.disconnect();
        // port.onMessage.removeListener();
        port = undefined;
      }
      showSpinner = false;
    }
  });

async function handleReject() {
  try {
    showConfirm = false;
    showFailure = false;
    showSuccess = false;
    await bail();
  } catch(e) {
    log.error(e);
  }
}

async function bail() {
  try {
    if (port) {
      port.postMessage({method: method, response: {type: 'YAKKL_RESPONSE', data: {name: 'ProviderRPCError', code: 4001, message: 'User rejected the request.'}}, requestData: requestData});
      port.disconnect();
      // port.onMessage.removeListener();
      port = undefined;
    }
  } catch(e) {
    log.error(e);
  } finally {
    if (browserSvelte) {
      if (port) {
        port.disconnect();
        // port.onMessage.removeListener();
      }
      await wait(2000);
      showSpinner = false;
      window.close();
    }
  }
}

async function handleApprove() {
  try {
    showConfirm = false;
    if (!userName || !password || !userName.trim() || !password.trim())
      bail();

    let profile = await verify(userName.toLowerCase().trim().replace('.nfs.id', '')+'.nfs.id'+password);
    if (!profile)
      bail();

    showSpinner = true;

    let accounts: YakklAccount[] = [];
    accounts = await getYakklAccounts();
    if (!accounts)
      bail();
    const accountFind = accounts.find(element => {
      if (element.address === addressToCheck)
        return element;
    });

    if (!accountFind) await bail();

    const account: YakklAccount = accountFind as YakklAccount;
    if (isEncryptedData(account.data)) {
      await decryptData(account.data, yakklMiscStore).then(result => {
        account.data = result as AccountData;
      });
    }
    if (!(account.data as AccountData).privateKey)
      await bail();

    if ( context === 'personal_sign' ) {
      await handlePersonalSign(account);
    } else if ( context === 'eth_signTypedData_v3' || context === 'eth_signTypedData_v4' ) {
      await handleSignTypedData(account);
    } else {
      await bail();
    }
    showSuccess = false; //true;
    handleClose();
  } catch(e) {
    log.error(e);
    errorValue = e as string;
    showFailure = true;
  }
}

async function handlePersonalSign(account: YakklAccount) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!personal_sign.dataToSign || !personal_sign.address)
        reject('No message to sign or address to sign with was found.');

      // const wallet = new ethersv6.Wallet(account.data.privateKey);
      // account.data.privateKey = null; // Remove private key from memory
      // signedData = await wallet.signMessage(personal_sign.dataToSign);
      const blockchain = wallet.getBlockchain();
      signedData = await blockchain.getProvider().signMessage(personal_sign.dataToSign);
      resolve(signedData);
    } catch(e) {
      reject(e);
    }
  });
}

async function handleSignTypedData(account: YakklAccount) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!signTypedData_v3v4.dataToSign || !signTypedData_v3v4.address)
        reject('No data to sign or address to sign with was found.');

      // const signer = new ethersv6.providers.JsonRpcSigner(account.data.privateKey, provider);
      // account.data.privateKey = null; // Remove private key from memory
      // signedData = await signer._signTypedData(signTypedData_v3v4.dataToSign.domain, signTypedData_v3v4.dataToSign.types, signTypedData_v3v4.dataToSign.message);
     //console.log('signTypedData_v3v4 --->', signTypedData_v3v4, account);
      const blockchain = wallet.getBlockchain();




      // TODO: Verify this!
      //@ts-ignore
      signedData = await blockchain.signTypedData(signTypedData_v3v4.dataToSign.domain, signTypedData_v3v4.dataToSign.types, signTypedData_v3v4.dataToSign.message);




      resolve(signedData);
    } catch(e) {
      reject(e);
    }
  });
}


async function handleClose() {
  try {
    if (port) {
      port.postMessage({id: requestId, method: method, type: 'YAKKL_RESPONSE', result: signedData });
      port.disconnect();
      // port.onMessage.removeListener();
      port = undefined;
    }
    showSuccess = false;
    if (browserSvelte) {
      // if (port) {
        // port.disconnect();
        // port.onMessage.removeListener();
      // }
    }
  } catch(e) {
    log.error(e);
  } finally {
    await close();
  }
}


async function close() {
  await wait(1000);
  showSpinner = false;
  window.close();
}


function handleConfirm() {
  showConfirm = true;
}

</script>

<svelte:head>
	<title>YAKKL® Smart Wallet</title>
</svelte:head>

<div class="modal" class:modal-open={showConfirm}>
  <div class="modal-box relative">
    <div class="border border-base-content rounded-md m-2 text-center p-1">
      <h1 class="font-bold">Approval Request - Confirmation</h1>
      <p class="pt-4">This will approve the signing of the transaction or message for <span class="font-bold underline">{domain}</span>! If you are NOT 100% certain about this request, then REJECT. If uncertain, research and/or verify more, and then try again. Do you wish to continue?</p>
    </div>
    <div class="form-control w-[22rem]">
      <input id="userName"
        type="text"
        class="input input-bordered input-primary w-full"
        placeholder="Username" autocomplete="off" bind:value="{userName}" required />
    </div>
    <div class="form-control w-[22rem]">
      <input id="password" type="password"
        class="input input-bordered input-primary w-full mt-2"
        placeholder="Password" autocomplete="off" bind:value="{password}" required />
    </div>
    <div class="modal-action">
      <button class="btn" onclick={handleReject}>Reject</button>
      <button class="btn" onclick={handleApprove}>Yes, Approved</button>
    </div>
  </div>
</div>

<div class="modal" class:modal-open={showSuccess}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">Signing for {domain} - Success!</h3>
    <p class="py-4">Success! The signing request you approved has been signed! Click close.</p>
    <div class="modal-action">
      <button class="btn" onclick={handleClose}>Close</button>
    </div>
  </div>
</div>

<div class="modal" class:modal-open={showFailure}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">Failed!</h3>
    <p class="py-4">{errorValue}</p>
    <div class="modal-action">
      <button class="btn" onclick={handleReject}>Close</button>
    </div>
  </div>
</div>

{#await params}
<div class="w-[96%] text-center justify-center m-2 flex flex-col absolute top-[250px]">
  <div class="text-primary-content text-2xl font-bold flex flex-col">
    {domainTitle ?? ''}
    <br>
    <div class="text-primary-content text-2xl font-bold flex flex-col mt-4">Wants to get your approval for signing the transaction or message:</div>
  </div>
  <div class="text-primary-content text-2xl font-bold flex flex-col mt-3">
    Connect with YAKKL®
  </div>
  <div class="justify-center mt-5">
    <div class="rounded-badge inline-flex w-fit p-2 bg-secondary text-base-content font-semibold">
      <div class="flex flex-row w-10 h-10">
        <img crossorigin="anonymous" src={domainLogo} alt="Dapp logo" />
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
</div>
{:then _}
<div class="w-[96%] text-center justify-center m-2 flex flex-col absolute top-[225px]">
  <!-- <Beta /> -->
  <div class="text-primary-content text-2xl font-bold flex flex-col">
    {domainTitle ?? ''}
    <br>
    <div class="text-primary-content text-2xl font-bold flex flex-col mt-4">Wants to get your approval for signing the transaction or message:</div>
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

  <div class="text-left mt-4 border border-gray-900 bg-black text-base-content rounded-md">
    <div class="m-2">
      <h4>Signing of Message requesting permission to execute: PLEASE be mindful and know what you are doing. There is no cancel or return option! Be 100% sure or REJECT this transaction and research more before trying again.</h4>
      <div class="mt-1">
        <!-- {#each jsonKeys as key}
        <p>{key}: <span class="font-bold">{transactionValue[key]}</span></p>
        {/each} -->
      </div>
    </div>
  </div>

  <div class="my-4">
    <div class="flex space-x-2 justify-center">
      {#if !showSpinner}
      <button
        onclick={handleReject}
        class="btn-sm btn-accent uppercase rounded-full"
        aria-label="Cancel">
        Reject
      </button>

      <button
        type="submit"
        id="recover"
        onclick={handleConfirm}
        class="btn-sm btn-primary uppercase rounded-full ml-2"
        aria-label="Confirm">
        Approve
      </button>
      {:else}
      <Spinner class="w-10 h-10" />
      <h3 class="mt-2 font-bold animate-pulse">Signing - please wait...</h3>
      {/if}
    </div>
  </div>

</div>

{/await}
