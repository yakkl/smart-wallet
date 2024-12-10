<script lang="ts">
  import {browser as browserSvelte} from '$app/environment';
  import { goto } from '$app/navigation';
  import { Checkbox, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, TableSearch } from 'flowbite-svelte';
  import { getYakklAccounts, setYakklConnectedDomainsStorage, setYakklAccountsStorage, yakklDappConnectRequestStore, getYakklCurrentlySelected, getYakklConnectedDomains } from '$lib/common/stores';
  import { deepCopy, truncate } from "$lib/utilities/utilities";
  import { PATH_LOGIN, YAKKL_DAPP, DEFAULT_TITLE } from '$lib/common/constants';
  import { onMount, onDestroy } from 'svelte';
  import { navigating, page } from '$app/stores';
  import { wait } from '$lib/common/utils';
	import ProgressWaiting from '$lib/components/ProgressWaiting.svelte';
	import type { AccountAddress, ConnectedDomainAddress, YakklAccount, YakklConnectedDomain, YakklCurrentlySelected } from '$lib/common';

  import type { Browser, Runtime } from 'webextension-polyfill';
  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
	import { dateString } from '$lib/common/datetime';
  let browser_ext: Browser;
  if (browserSvelte) browser_ext = getBrowserExt();

  type RuntimePort = Runtime.Port | undefined;

  let currentlySelected: YakklCurrentlySelected;
  let yakklAccountsStore: YakklAccount[] = [];
  let yakklConnectedDomainsStore: YakklConnectedDomain[] = [];

  let searchTerm = $state('');
  let addresses: Map<string, ConnectedDomainAddress> = new Map();  // Complete list
  let filteredAddresses: Map<string, ConnectedDomainAddress> = $state(new Map());  // Filtered list
  let accounts: AccountAddress [] = [];
  let accountNumber = 0; // Number of accounts
  let accountsPicked = $state(0);
  let showConfirm = $state(false);
  let showSuccess = $state(false);
  let showFailure = $state(false);
  let showWarning = $state(false);
  let showProgress = $state(false);
  let warningValue = $state('No accounts were selected. Access to YAKKL® is denied.');
  let errorValue = $state('No domain/site name was found. Access to YAKKL® is denied.');
  let port: RuntimePort;
  let domain: string = $state();
  let domainLogo: string = $state();
  let domainTitle: string;
  let requestId: string | null;
  let requestData: any;
  let pass = false;
  let filteredAddressesArray: ConnectedDomainAddress[] = $state();

  if (browserSvelte) {
    try {
      requestId = $page.url.searchParams.get('requestId');
      $yakklDappConnectRequestStore = requestId as string;

      if ($navigating) {
        if ($navigating?.from?.url?.pathname) {
          if ($navigating.from.url.pathname.includes('dapp/popups/approve') ||
            $navigating.from.url.pathname.includes('login/Login')) {
            pass = true;
          }
        }
      }

      if (pass !== true) {
        if (requestId) {
          pass = true;
        } else {
          if (browserSvelte) {
            goto(PATH_LOGIN);
          }
        }
      }
    } catch(e) {
      console.log(e);
    }
  }

  // if (!requestId) requestId = '';

  // if (browserSvelte) {
  //   async function checkCurrentlySelected() {
  //     try {
  //       if (!currentlySelected?.shortcuts?.accountName) {
  //         currentlySelected = await getYakklCurrentlySelected();
  //       }
  //     } catch(e) {
  //       console.log(e);
  //     }
  //   }
  //   checkCurrentlySelected().then();
  // }

  async function getAccounts() {
    try {
      if (browserSvelte) {
        if (!currentlySelected.shortcuts.accountName) {
          currentlySelected = await getYakklCurrentlySelected();
        }
        yakklAccountsStore = await getYakklAccounts();

        for (const account of yakklAccountsStore) {
          if (currentlySelected.shortcuts.blockchain === account.blockchain) {
            // Could use a variable of type ConnectedDomainAddress and push that instead but this is easier
            addresses.set(account.address, {
              address: account.address,
              name: account.name,
              alias: account.alias,
              blockchain: currentlySelected.shortcuts.blockchain,
              chainId: currentlySelected.shortcuts.chainId as number,
              checked: false,
            }); // Only add if not already there for a given blockchain
          }
        };

        filteredAddresses = addresses;
        accountNumber = addresses.size;
      }
    } catch(e) {
      console.log(e);
    }
  }


  // (async () => {
  //   await getAccounts();
  // })();


  $effect(() => {
    try {
      filteredAddresses = addresses.has(searchTerm) ? addresses : new Map([...addresses].filter(([k, v]) => v.name.toLowerCase().includes(searchTerm.toLowerCase())));
      filteredAddressesArray = Array.from(filteredAddresses.values());
    } catch(e) {
      console.log(e);
    }
  });

  onMount(async () => {
    try {
      if (browserSvelte) {
        currentlySelected = await getYakklCurrentlySelected();

        await getAccounts();
        port = browser_ext.runtime.connect({name: YAKKL_DAPP});
        if (port) {
          port.onMessage.addListener(async (event: any) => {
            requestData = event.data;

            if (event.method === 'get_params') {
              domainTitle = requestData?.data?.metaDataParams?.title ?? '';
              domain = requestData?.data?.metaDataParams?.domain ?? '';
              domainLogo = requestData?.data?.metaDataParams?.icon ?? '/images/logoBullLock48x48.png';
              domain = domain.trim();

              if (!requestId) requestId = requestData?.id ?? null;
              if (!domain || !requestId) {
                showFailure = true;
              } else {
                // Update the connected domains
                yakklConnectedDomainsStore =  await getYakklConnectedDomains();
                if (yakklConnectedDomainsStore) {
                  yakklConnectedDomainsStore.find(element => {
                    if (element.domain === domain) {
                      let counter = 0;

                      for (const address of element.addresses) {
                        let index = -1;
                        let itemElem: ConnectedDomainAddress | null = null;

                        // Find the item in the items array
                        for (const [i, [key, value]] of Array.from(addresses.entries()).entries()) {
                          if (key === address.address) {
                            itemElem = value;
                            index = i;
                            accounts.push(value);
                            break;
                          }
                        };

                        counter++;
                        if (counter > accountNumber) {
                          return true; // circuit breaker
                        }

                        if (index >= 0) {
                          (document.getElementById("cb" + index.toString()) as HTMLInputElement).checked = true;
                          if (itemElem) itemElem.checked = true;
                        }

                      // let counter = 0;
                      // let index = 0;

                      // for (const address of element.addresses) {
                      //   let itemElem: ConnectedDomainAddress | undefined;
                      //   counter++;

                      //   if (counter > accountNumber) {
                      //     return; // circuit breaker
                      //   }

                      //   itemElem = addresses.get(address.address);
                      //   if (itemElem) {
                      //     index++;
                      //     (document.getElementById("cb" + index.toString()) as HTMLInputElement).checked = true;
                      //     itemElem.checked = true;
                      //     accounts.push(itemElem);
                      //   }
                      // }
                      // return;
                      };
                    }
                  });
                }
              }
            }
         });
          port.postMessage({method: 'get_params', id: requestId});
        }
      }
    } catch(e) {
      console.log(e);
    }
  });


  onDestroy( () => {
    try {
      if (browserSvelte) {
        if (port) {
          // port.onMessage.removeListener();
          port.disconnect();
          port = undefined;
        }
      }
    } catch(e) {
      console.log(e);
    }
  });


  function handleAccount(item: ConnectedDomainAddress, e: MouseEvent) {
    try {
      let index = -1;
      if (!item) throw 'No item was found.';
      const target = e.target as HTMLInputElement;
      if (!target) throw 'No event was found.';

      item.checked = target.checked;

      if (addresses.size > 0 && item.checked === true) {
        accounts.find((element, i) => {
          if (element.address === item.address) {
            index = i;
            return true;
          }
        });
        if (index >= 0) {
          accounts.splice(index,1);
          return;
        }
      }

      if (item.checked === true) {
        accounts.push(item);
      } else {
        index = -1;
        accounts.find((element, i) => {
          if (element.address === item.address) {
            index = i;
            return true;
          }
        });
        if (index >= 0) {
          accounts.splice(index, 1);
        }
      }
      accountsPicked = accounts.length;
    } catch(e) {
      console.log(e);
    }
  }

  // Not used but could be useful for future use
  // function handleToggleAll(e: any) {
  //   try {
  //     let arrIndex = 0;
  //     let accountsStore = [];

  //     if ($yakklAccountsStore?.length === 0) {
  //       throw 'No accounts are present.';
  //     }
  //     accountsStore = $yakklAccountsStore;

  //     if (!e || !e?.srcElement) throw 'No event was found.';

  //     if (e.srcElement.checked) {
  //       accounts.length = 0;
  //       addresses.clear();
  //       // select them all...
  //       for (const [index, account] of accountsStore.entries()) {
  //         if (currentlySelected.shortcuts.blockchain === account.blockchain) {
  //           addresses.set(account.address, {
	// 								address: account.address,
  //                 name: account.name,
  //                 alias: account.alias,
	// 								blockchain: currentlySelected.shortcuts.blockchain,
	// 								chainId: currentlySelected.shortcuts.chainId,
  //                 checked: true,
	// 							}); // Only add if not already there for a given blockchain

  //           // accounts.push({address: item.address, name: item.name, alias: item.alias, checked: true});

  //           (document.getElementById("cb" + index.toString()) as HTMLInputElement).checked = true;
  //         }
  //       };
  //     } else {
  //       // unselect them all...
  //       addresses.clear();
  //       for (const [index, account] of accountsStore.entries()) {
  //         if (currentlySelected.shortcuts.blockchain === account.blockchain) {
  //           addresses.set(account.address, {
	// 								address: account.address,
  //                 name: account.name,
  //                 alias: account.alias,
	// 								blockchain: currentlySelected.shortcuts.blockchain,
	// 								chainId: currentlySelected.shortcuts.chainId,
  //                 checked: false,
	// 							}); // Only add if not already there for a given blockchain
  //           (document.getElementById("cb" + index.toString()) as HTMLInputElement).checked = false;
  //         }
  //       };
  //       accounts.length = 0;
  //     }
  //   } catch(e) {
  //     console.log(e);
  //   }
  // }

  function handleConfirm() {
    accountsPicked = accounts.length;
    if (accounts.length > 0) {
      showConfirm=true;
    } else {
      showConfirm=false;
      warningValue = 'No accounts were selected. Access to YAKKL® is denied.';
      showWarning=true;
    }
  }

  // Final accepted step so all updates and confirmations are done here
  async function handleProcess() {
    let domains: YakklConnectedDomain[] = [];
    let addDomain = false;

    try {
      if (!domain) {
        throw 'No domain name is present.';
      }
      if (yakklAccountsStore.length === 0) {
        throw 'No accounts are present.';
      }

      showProgress = true;

      if (yakklConnectedDomainsStore) {
        domains = deepCopy(yakklConnectedDomainsStore);
      }
      if (domains?.length > 0) {
        let domainFound: boolean = false;
        domains.find((element) => {
          if (element.domain === domain) {
            element.addresses.length = 0;
            element.updateDate = dateString();
            for (const item of accounts) {
              if (!element.addresses.includes(item)) {
                element.addresses.push(item);
              }
            }
            domainFound = true; //element;
            return true;
          }
        });

        if (!domainFound) {
          addDomain = true;
        } else {
          addDomain = false;
        }
      } else {
        addDomain = true;
      }

      let localAddresses: AccountAddress[] = [];
      for (const item of accounts) {
        if (!localAddresses.find((address) => {address.address === item.address})) {
          localAddresses.push({address: item.address, name: item.name, alias: item.alias, blockchain: currentlySelected!.shortcuts.blockchain as string,
            chainId: currentlySelected!.shortcuts.chainId as number});
        }
      };

      if (addDomain === true) {
        domains.push({
          id: currentlySelected!.id,
          addresses: localAddresses,
          name: domainTitle,
          domain: domain,
          icon: domainLogo,
          permissions: [],
          version: currentlySelected!.version,
          createDate: dateString(),
          updateDate: dateString()
        });
      } else {
        domains.find((element: YakklConnectedDomain) => {
          if (element.domain === domain) {
            element.name = domainTitle;
            element.icon = domainLogo;
            element.addresses = localAddresses;
            element.version = currentlySelected!.version;
            element.updateDate = dateString();
            return;
          }
        });
      }

      // Update storage and stores
      yakklConnectedDomainsStore = deepCopy(domains);
      await setYakklConnectedDomainsStorage(domains);

      let yakklAccounts: YakklAccount[] = [];
      yakklAccounts = deepCopy(yakklAccountsStore);
      for (const item of accounts) {
        yakklAccounts.find(element => {
          if (element.address === item.address) {
            if (!element.connectedDomains.includes(domain)) {
              element.connectedDomains.push(domain);
            }
            return;
          }
        });
      };

      yakklAccountsStore = deepCopy(yakklAccounts);
      await setYakklAccountsStorage(yakklAccountsStore);

      let sendAccounts = [];
      for (const item of localAddresses) {
          sendAccounts.push(item.address);
      }

      let yakklCurrentlySelected = await getYakklCurrentlySelected();
      let chainId = yakklCurrentlySelected.shortcuts.chainId;

      if (port)
        port.postMessage({id: requestId, method: 'eth_requestAccounts', type: 'YAKKL_RESPONSE', chainId: chainId, result: sendAccounts});

      showConfirm = false;
      showSuccess = false; //true;

      await close();

    } catch (e) {
      console.log('Dapp - accounts process error:', e);
      errorValue = e as string;
      resetValuesExcept('showFailure');
    }
  }

  function resetValuesExcept(value: string) {
    showConfirm = value === 'showConfirm' ? true : false;
    showSuccess = value === 'showSuccess' ? true : false;
    showFailure = value === 'showFailure' ? true : false;
    showWarning = value === 'showWarning' ? true : false;
    showProgress = value === 'showProgress' ? true : false;
  }

  async function handleReject() {
    try {
      resetValuesExcept(''); // Reset all values

      if (port) {
        port.postMessage({id: requestId, method: 'eth_requestAccounts', response: {type: 'error', data: {name: 'ProviderRPCError', code: 4001, message: 'User rejected the request.'}}});
      }

    } catch(e) {
      console.log(e);
    } finally {
      // If requestId is not valid then use 0 since we are bailing out anyway
      // May want to think about putting a slight tick to make sure all queues get flushed
      //goto(PATH_LOGOUT); // May want to do something else if they are already logged in!
      if (browserSvelte) {
        await close();
      }
    }
  }

async function close() {
  await wait(1000); // Wait for the port to disconnect and message to go through
  window.close();
}

</script>

<svelte:head>
	<title>{DEFAULT_TITLE}</title>
</svelte:head>

<ProgressWaiting bind:show={showProgress} title="Processing" value="Verifying selected accounts..."/>

<!-- <Confirm bind:show={showConfirm} title="Connect to {domain}" content="This will connect {domain} to {accountsPicked} of your addresses! Do you wish to continue?" handleConfirm={handleProcess}/> -->

<!-- <Warning bind:show={showWarning} title="Warning!" content={warningValue}/>

<Failed bind:show={showFailure} title="Failed!" content={errorValue} handleReject={() => {window.close()}}/>

<Success bind:show={showSuccess} title="Success!" content="{domain} is now connected to YAKKL®" handleConfirm={() => {window.close()}}/> -->

<div class="modal" class:modal-open={showConfirm}>
  <div class="modal-box relative">

    <h3 class="text-lg font-bold">Connect to {domain}</h3>
    <p class="py-4">This will connect <span class="font-bold">{domain}</span> to {accountsPicked}  of your addresses! Do you wish to continue?</p>
    <div class="modal-action">
      <button class="btn" onclick={()=>showConfirm = false}>Cancel</button>
      <button class="btn" onclick={handleProcess}>Yes</button>
    </div>
  </div>
</div>

<div class="modal" class:modal-open={showSuccess}>
  <div class="modal-box relative">

    <h3 class="text-lg font-bold">Success!</h3>
    <p class="py-4"><span class="font-bold">{domain}</span> is now connected to YAKKL®</p>
    <div class="modal-action">
      <button class="btn" onclick={()=> window.close()}>Close</button>
    </div>
  </div>
</div>

<div class="modal" class:modal-open={showFailure}>
  <div class="modal-box relative">

    <h3 class="text-lg font-bold">Failed!</h3>
    <p class="py-4">{errorValue}</p>
    <div class="modal-action">
      <button class="btn" onclick={()=> window.close()}>Close</button>
    </div>
  </div>
</div>

<div class="modal" class:modal-open={showWarning}>
  <div class="modal-box relative">

    <h3 class="text-lg font-bold">Failed!</h3>
    <p class="py-4">{warningValue}</p>
    <div class="modal-action">
      <button class="btn" onclick={() => showWarning=false}>OK</button>
    </div>
  </div>
</div>

{#await filteredAddresses}
<div class="w-[96%] text-center justify-center m-2 flex flex-col">
  <div class="justify-center">
    <div class="rounded-badge inline-flex w-fit p-2 bg-secondary text-base-content font-semibold">
      <div class="flex flex-row w-8 h-8">
        <img crossorigin="anonymous" src={domainLogo} alt="Dapp logo" />
      </div>
      <div class="flex flex-row">
      <p class="ml-2 mt-2">Accounts to use in DAPP</p>
      </div>
    </div>
  </div>
  <div class="text-primary-content text-2xl font-bold flex flex-col">
    Connect with YAKKL®
  </div>

  <div class="w-full text-center flex flex-col">
    <p class="text-base-content">Loading accounts...</p>
  </div>

</div>
{:then _}
<div class="w-[96%] text-center justify-center m-2 flex flex-col">
  <div class="justify-center">
    <div class="rounded-badge inline-flex w-fit p-2 bg-secondary text-base-content font-semibold">
      <div class="flex flex-row w-8 h-8">
        <img src={domainLogo} alt="Dapp logo" />
      </div>
      <div class="flex flex-row">
      <p class="ml-2 mt-2">Accounts to use in DAPP</p>
      </div>
    </div>
  </div>
  <div class="text-primary-content text-2xl font-bold flex flex-col">
    Connect with YAKKL®
  </div>

  <div class="w-full text-center flex flex-col">
    <p class="text-base-content">Select the account to use for this dApp site</p>
  </div>

</div>

<div class="mx-4 mb-2 overflow-scroll max-h-[700px]">
  <TableSearch placeholder="Search by address name" hoverable={true} bind:inputValue={searchTerm} > <!-- shadow> -->
    <TableHead>
      <TableHeadCell>

        <!-- <Checkbox on:click={handleToggleAll}/> -->

      </TableHeadCell>
      <TableHeadCell>Addresses</TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
      {#each filteredAddressesArray as item, i}
        <TableBodyRow>
          <!-- ; (item.checked === true) ? 'checked' : '' -->
          <TableBodyCell><Checkbox id="cb{i}" on:click={(e) => {handleAccount(item, e); (item.checked === true) ? 'checked' : '' }}/></TableBodyCell>
          <TableBodyCell>
            {truncate(item.name, 20)} - {truncate(item.address, 6) + item.address.substring(item.address.length - 4)}
            {#if item?.alias?.length > 0}
            {item.alias}
            {/if}
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </TableSearch>
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
      onclick={handleConfirm}
      class="btn-sm btn-primary uppercase rounded-full ml-2"
      aria-label="Confirm">
      Approve
    </button>
  </div>
</div>

{/await}

