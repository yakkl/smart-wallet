<script lang="ts">
  import {browser as browserSvelte} from '$app/environment';
  import { page } from '$app/stores';
  import { getYakklCurrentlySelected, yakklCurrentlySelectedStore, yakklMiscStore, yakklDappConnectRequestStore, getYakklConnectedDomains, getYakklAccounts } from '$lib/common/stores';
  import { YAKKL_DAPP, ETH_BASE_SCA_GAS_UNITS, ETH_BASE_EOA_GAS_UNITS } from '$lib/common/constants';
  import { onMount, onDestroy } from 'svelte';
  import { deepCopy } from '$lib/utilities/utilities';
  import { decryptData } from '$lib/common/encryption';
  import { wait } from '$lib/common/utils';
	import { Spinner } from 'flowbite-svelte';
	import { isEncryptedData, type AccountData, type BigNumberish, type TransactionRequest, type TransactionResponse, type YakklAccount, type YakklCurrentlySelected } from '$lib/common';
  import WalletManager from '$lib/plugins/WalletManager';
  import type { Wallet } from '$lib/plugins/Wallet';

  let wallet: Wallet;
  
  import type { Browser, Runtime } from 'webextension-polyfill';
  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
	import { verify } from '$lib/common/security';
  let browser_ext: Browser; 
  if (browserSvelte) browser_ext = getBrowserExt();

  type RuntimePort = Runtime.Port | undefined;

  let currentlySelected: YakklCurrentlySelected;

  let showConfirm = false;
  let showSuccess = false;
  let showFailure = false;
  let showSpinner = false;
  let errorValue = 'No domain/site name was found. Access to YAKKL® is denied.';
  let port: RuntimePort;
  let chainId: number;
  let domain: string;
  let domainLogo: string;
  let domainTitle: string;
  let requestData: any;
  let method: string;
  let requestId = $yakklDappConnectRequestStore;
  let userName: string;
  let password: string;
  let message;  // This gets passed letting the user know what the intent is
  let context;
  let smartContract = false;
  let jsonKeys: (keyof TransactionRequest)[]=[];
  // let txTransactions = [];
  let tx: TransactionResponse; // returned transaction
  let txGasLimitIncrease = 0;
  let gasLimit: BigNumberish = 0n;

  let transaction: TransactionRequest; 
  // = {  // EIP-1559
  //   from: '', // Hex
  //   to: '', // Hex
  //   value: '', // Hex
  //   data: '', // Hex - optional - don't forget to add (68 * byte size of data) to gasLimit
  //   gasLimit: '', // Hex
  //   maxFeePerGas: '', // Hex
  //   maxPriorityFeePerGas: '', // Hex
  //   type: 2, // EIP-1559
  //   nonce: -1,  // Lets the provider set the nonce
  // };

  let transactionValue: TransactionRequest; // Used to display on UI
  let addressApproved = false;
  let addressToCheck = '';


  try {
    if (browserSvelte) {
      requestId = $page.url.searchParams.get('requestId') ?? '';
      $yakklDappConnectRequestStore = requestId;
    }
  } catch(e) {
    console.error(e);
  }

  if (!requestId) requestId = '';

  onMount(async () => {
    try {
      if (browserSvelte && browser_ext) {
        currentlySelected = await getYakklCurrentlySelected();
        chainId = currentlySelected.shortcuts.chainId as number; // Maybe we will make hex calls consistent ;)
        port = browser_ext.runtime.connect({name: YAKKL_DAPP});

        if (port) {
          port.onMessage.addListener(async(event: any) => {
            if (!event || !event?.method || !event?.data) return;
            method = event.method;
            requestData = event.data;

            if (event.method === 'get_params') {
              domainTitle = requestData?.data?.metaDataParams?.title ?? '';
              domain = requestData?.data?.metaDataParams?.domain ?? '';
              domainLogo = requestData?.data?.metaDataParams?.icon ?? '/images/logoBullLock48x48.png';
              message = requestData?.data?.metaDataParams?.message ?? 'Nothing was passed in explaining the intent of this approval. Be mindful!';
              context = requestData?.data?.metaDataParams?.context ?? 'transactions';
              transaction = (requestData?.data?.metaDataParams?.transaction[0] ?? {}) as TransactionRequest;

              if (transaction) {
                addressToCheck = transaction?.from as string; // This only has one transaction so the 'from' is all that is needed
                transactionValue = deepCopy(transaction); // This value is used to display wei or even currency amount to UI
                jsonKeys = Object.keys(transaction) as (keyof TransactionRequest)[];

                // for (const item of jsonKeys) {
                 //console.log('Transaction key pair', item);
                  // if (item !== 'from' && item !== 'to' && item !== 'data' && item !== 'result') {
                    // if (isHexString(transactionValue[item])) {                    
                    // }
                  // }
                // };

                if (!requestId) requestId = requestData.id;
                let domains = [];
                domains = await getYakklConnectedDomains();

                for (const item of domains) {
                  if (item.addresses.find(address => address.address === addressToCheck)) {
                    addressApproved = true;
                    break;
                  }
                };

                if (!addressApproved) {
                  errorValue = 'The address of ' + addressToCheck + ' is not showing approved, so this transaction will not be allowed to go through. Rejected';
                  showFailure = true;
                }
              }
            }
          });
        }
        if (port) {
          port.postMessage({method: 'get_params', id: requestId}); // request is not currently used but we may want to later

          // Now setup the wallet
          wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], currentlySelected.shortcuts.chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);
        }
      }
    } catch(e) {
      console.error(e);
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
  } catch(e) {
    console.log(e);
  } finally {
    await bail();
  }
}


async function bail() {
  try {
    if (port)
      port.postMessage({method: method, response: {type: 'YAKKL_RESPONSE', data: {name: 'ProviderRPCError', code: 4001, message: 'User rejected the request.'}}, requestData: requestData});
  } catch(e) {
    console.log(e);
  } finally {
    if (browserSvelte) {
      await close();
    }
  }
}

async function close() {
  await wait(1000);
  if (port) {
    port.disconnect();
    // port.onMessage.removeListener();
    port = undefined;
  }
  showSpinner = false;
  window.close();
}

async function handleApprove() {
  try {
    showConfirm = false;
    if (!userName || !password || !userName.trim() || !password.trim()) bail();

    let profile = await verify(userName.toLowerCase().trim().replace('.nfs.id', '')+'.nfs.id'+password);
    if (!profile) bail();

    showSpinner = true;

    let accountFrom = transaction.from;
    let accounts = [];
    accounts = await getYakklAccounts();
    if (!accounts) bail();

    const accountFound = accounts.find(element => { element.address === accountFrom});
    if (!accountFound) bail();

    const account = accountFound as YakklAccount; 
    if (isEncryptedData(account.data)) {
      await decryptData(account.data, $yakklMiscStore).then(result => {
        account.data = result as AccountData;
      });
    }

    if (!(account.data as AccountData).privateKey) bail();

    // const privateKey = (account.data as AccountData).privateKey;

    const blockchain = wallet.getBlockchain();
				if (blockchain.isSmartContractSupported()) { // TODO: Look into adding an additional block check for other blockchains that support smart contracts
					smartContract = await blockchain.isSmartContract(transaction.to as string) ?? false;
				} else {
					smartContract = false;
				}

    // Ethereum specific
    gasLimit = smartContract === true ? ETH_BASE_SCA_GAS_UNITS : ETH_BASE_EOA_GAS_UNITS;

    if (transaction.data) {
      handleIncreaseGasLimit(transaction.data.length * 68); // 68 may need to be more dynamic in the future. This is for EOA transactions that have hex data
    } else {
      gasLimit = smartContract === true ? ETH_BASE_SCA_GAS_UNITS : ETH_BASE_EOA_GAS_UNITS;
      txGasLimitIncrease = 0;
    }    

    if (currentlySelected?.shortcuts?.gasLimit) 
      gasLimit = currentlySelected?.shortcuts?.gasLimit;
    // May want to do the same as we did in send transaction on increasing gasLimit if the data field contains data OR should we let the dApp specify the gasLimit?

    transaction.gasLimit = gasLimit; // 21000 - EOA gasLimit and not SCA
    transaction.nonce = -1;
    transaction.type = 2; // EIP-1559

    // TODO: Check the transaction object to see if it has the correct fields and values

    tx = await wallet.sendTransaction(transaction);
    if (tx) {
      tx.wait().then(async () => {
        await handleClose();
      }).catch((e: any) => {
        errorValue = `${e}`;
        showFailure = true;
        showSpinner = false;
			});
		} else {
      throw 'No transaction was returned. Something went wrong.';
    }
  } catch(e) {
    console.log(e);
    errorValue = e as string;
    showFailure = true;
  }
}

function handleIncreaseGasLimit(increase: number) {
  try {
    if (increase > 0) {
      txGasLimitIncrease = increase;
      gasLimit = gasLimit as bigint + BigInt(txGasLimitIncrease);
    }
  } catch(e) {
    console.log(e);
  }
}

async function handleClose() {
  try {
    if (tx?.hash) {
      if (port) {
        port.postMessage({id: requestId, method: 'eth_sendTransaction', type: 'YAKKL_RESPONSE', result: tx.hash});
      }
    }
    showSuccess = false;
    if (browserSvelte) {
      await wait(1000);
      if (port) {
        port.disconnect();
        // port.onMessage.removeListener();
        port = undefined;
      }
      showSpinner = false;
      window.close();
    }
  } catch(e) {
    console.log(e);
  }
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
      <p class="pt-4">This approves the transaction <span class="font-bold underline">{domain}</span> wishes to send via YAKKL®! There is NO REFUND/BLOCK/CANCEL for this transaction after you approve!! If you are NOT 100% certain about this request, then REJECT. If uncertain, research and/or verify more, and then try again. Do you wish to continue?</p>
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
      <button class="btn" on:click={handleReject}>Reject</button>
      <button class="btn" on:click={handleApprove}>Yes, Approved</button>
    </div>
  </div>
</div>

<div class="modal" class:modal-open={showSuccess}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">Transaction for {domain} - Success!</h3>
    <p class="py-4">Success! The transaction you approved has been submitted to the BLOCKCHAIN! YAKKL® only assisted in helping you sign the transaction with your private key. The Source of Truth for this transaction is the {domain} DAPP! Click close.</p>
    <div class="modal-action">
      <button class="btn" on:click={handleClose}>Close</button>
    </div>
  </div>
</div>

<div class="modal" class:modal-open={showFailure}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">Failed!</h3>
    <p class="py-4">{errorValue}</p>
    <div class="modal-action">
      <button class="btn" on:click={handleReject}>Close</button>
    </div>
  </div>
</div>

{#await transaction?.from}
<div class="w-[96%] text-center justify-center m-2 flex flex-col absolute top-[250px]">
  <div class="text-primary-content text-2xl font-bold flex flex-col">
    {domainTitle ?? '/images/logoBullLock48x48.png'}
    <br>
    <div class="text-primary-content text-2xl font-bold flex flex-col mt-4">Wants to get your approval for the transaction:</div>
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
    <div class="text-primary-content text-2xl font-bold flex flex-col mt-4">Wants to get your approval for the transaction:</div>
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
      <h4>Transaction requesting permission to execute: PLEASE be mindful and know what you are doing. There is no cancel or return option! Be 100% sure or REJECT this transaction and research more before trying again.</h4>
      <div class="mt-1">
        {#each jsonKeys as key}
        <p>{key}: <span class="font-bold">{transactionValue[key]}</span></p>
        {/each}
      </div>
    </div>
  </div>

  <div class="my-4">
    <div class="flex space-x-2 justify-center">
      {#if !showSpinner}
      <button 
        on:click|preventDefault={handleReject}
        class="btn-sm btn-accent uppercase rounded-full"
        aria-label="Cancel">
        Reject
      </button>
      
      <button 
        type="submit"
        id="recover"
        on:click|preventDefault={handleConfirm}
        class="btn-sm btn-primary uppercase rounded-full ml-2"
        aria-label="Confirm">
        Approve
      </button>
      {:else}
      <Spinner class="w-10 h-10" />
      <h3 class="mt-2 font-bold animate-pulse">Processing - please wait...</h3>
      {/if}
    </div>
  </div>

</div>

{/await}
