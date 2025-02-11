<script lang="ts">
  import { browserSvelte } from '$lib/common/environment';
  import { onMount, onDestroy } from "svelte";
  import { PATH_ACCOUNTS, PATH_SECURITY } from "$lib/common/constants";
  import ErrorNoAction from "$components/ErrorNoAction.svelte";
  import ButtonGridItem from "$components/ButtonGridItem.svelte";
  import ButtonGrid from "$components/ButtonGrid.svelte";
  import { setIconLock } from '$lib/utilities';
  import Import from '$lib/components/Import.svelte';
  import TokenViews from "$lib/components/TokenViews.svelte";
	import { yakklCombinedTokenStore, yakklCurrentlySelectedStore, yakklInstancesStore } from "$lib/common/stores";
	import { debug_log, getInstances } from '$lib/common';
	import type { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
	// import { setStateStore, stateStore } from '$lib/common/stores/stateStore';
	// import { routeCheckWithSettings } from '$lib/common/routes';

  // let wallet: Wallet | null = null;
  // let provider: Provider | null = null;
  // let blockchain: Blockchain | null = null;
  let tokenService: TokenService<any> | null = null;

  let error = false;
  let errorValue: any = null;
  let showImportOption = false;

  onMount(async () => {
    try {
      if (browserSvelte) {
        // if (!$stateStore) {
          const yakklInstances = await getInstances();

          debug_log('Welcome page $yakklInstancesStore:', yakklInstances);
          if (yakklInstances) {
            tokenService = yakklInstances[3];
            if (tokenService) {
              debug_log('Welcome page all instances:', yakklInstancesStore);

              tokenService.updateTokenBalances($yakklCurrentlySelectedStore.shortcuts.address);

              debug_log('Welcome page after updating token service-------------------------->>>>');
            }
          } else {
            error = true;
            errorValue = '[ERROR]: No wallet provider found.';
          }
        }
      // }
    } catch (e) {
      console.log('[ERROR]:', e);
    }
  });

  onDestroy(() => {
    try {
      if (browserSvelte) {
        setIconLock();
      }
    } catch (e) {
      console.log('[ERROR]:', e);
    }
  });

  // routeCheckWithSettings();

  function handleImports() {
    showImportOption = true;
  }

  function onImportComplete(imported: string) {
    console.log('Imported:', imported);
  }
</script>

<Import bind:show={showImportOption} onComplete={onImportComplete}/>
<ErrorNoAction bind:show={error} title="Error" value={errorValue} />

<div class="bg-primary absolute top-[0.1rem] left-[.1rem] rounded-tl-xl rounded-tr-xl w-[99%] h-2">
</div>

<ButtonGrid>
  <ButtonGridItem path={PATH_ACCOUNTS} title="Wallet Accounts">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 -mb-2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  </ButtonGridItem>
  <ButtonGridItem path={PATH_SECURITY} title="Security">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mb-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
    </svg>
  </ButtonGridItem>
  <ButtonGridItem handle={handleImports} title="Import/Recovery Options">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mb-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16.712 4.33a9.027 9.027 0 011.652 1.306c.51.51.944 1.064 1.306 1.652M16.712 4.33l-3.448 4.138m3.448-4.138a9.014 9.014 0 00-9.424 0M19.67 7.288l-4.138 3.448m4.138-3.448a9.014 9.014 0 010 9.424m-4.138-5.976a3.736 3.736 0 00-.88-1.388 3.737 3.737 0 00-1.388-.88m2.268 2.268a3.765 3.765 0 010 2.528m-2.268-4.796a3.765 3.765 0 00-2.528 0m4.796 4.796c-.181.506-.475.982-.88 1.388a3.736 3.736 0 01-1.388.88m2.268-2.268l4.138 3.448m0 0a9.027 9.027 0 01-1.306 1.652c-.51.51-1.064.944-1.652 1.306m0 0l-3.448-4.138m3.448 4.138a9.014 9.014 0 01-9.424 0m5.976-4.138a3.765 3.765 0 01-2.528 0m0 0a3.736 3.736 0 01-1.388-.88 3.737 3.737 0 01-.88-1.388m2.268 2.268L7.288 19.67m0 0a9.024 9.024 0 01-1.652-1.306 9.027 9.027 0 01-1.306-1.652m0 0l4.138-3.448M4.33 16.712a9.014 9.014 0 010-9.424m4.138 5.976a3.765 3.765 0 010-2.528m0 0c.181-.506.475-.982.88-1.388a3.736 3.736 0 011.388-.88m-2.268 2.268L4.33 7.288m6.406 1.18L7.288 4.33m0 0a9.024 9.024 0 00-1.652 1.306A9.025 9.025 0 004.33 7.288" />
    </svg>
  </ButtonGridItem>
</ButtonGrid>

{#if $yakklCombinedTokenStore.length > 0}
  <TokenViews />
{:else}
  <div class="flex items-center justify-center w-full h-full">
    <p class="text-lg text-gray-500">No additional tokens found</p>
  </div>
{/if}
