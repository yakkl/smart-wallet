<script lang="ts">
	import { goto } from "$app/navigation";
	import { PATH_WELCOME, VERSION } from "$lib/common/constants";
	import { createForm } from "svelte-forms-lib";
	import * as yup from 'yup';
	import { setProfileStorage, getYakklWatchList, setYakklWatchListStorage, setYakklCurrentlySelectedStorage, getYakklCurrentlySelected, getMiscStore, getSettings } from "$lib/common/stores";
	import { encryptData, decryptData } from "$lib/common/encryption";
	import { Button, Modal } from 'flowbite-svelte';
	import Back from '$lib/components/Back.svelte';
  import { deepCopy } from "$lib/utilities/utilities";
	import { isEncryptedData, type CurrentlySelectedData, type Profile, type ProfileData, type Settings, type YakklCurrentlySelected, type YakklWatch } from '$lib/common';
	import { onMount } from 'svelte';
	import { dateString } from '$lib/common/datetime';

  let currentlySelected: YakklCurrentlySelected;
  let yakklMiscStore: string;
  let yakklWatchListStore: YakklWatch[];
  let yakklSettingsStore: Settings | null;

	let error = false;
	let errorValue: any;

  onMount(async () => {
    currentlySelected = await getYakklCurrentlySelected();
    yakklMiscStore = getMiscStore();
    yakklWatchListStore = await getYakklWatchList();
    yakklSettingsStore = await getSettings();
  });

	// Simply adds an address an existing address that may be managed by a hardware wallet or anything else
	async function handleAddWatch(data: any) {
		try {        
			console.log(data);
			// TODO: Validate data.address for given network

			let watchList: YakklWatch[] = [];

      if (isEncryptedData(currentlySelected.data)) {
          await decryptData(currentlySelected.data, yakklMiscStore).then(result => {
            currentlySelected.data = result as CurrentlySelectedData;
          });
      }

      let profile: Profile = deepCopy((currentlySelected.data as CurrentlySelectedData).profile);
      if (isEncryptedData(profile.data)) {
        await decryptData(profile.data, yakklMiscStore).then(result => {
          profile.data = result as ProfileData;
        });
      }

      if ((profile.data as ProfileData).watchList.length > 0) {
        if ((profile.data as ProfileData).watchList.find((watch: YakklWatch) => (watch.address === data.address) && (watch.blockchain === data.blockchain))) {
          errorValue = 'This account already exists for the given profile.';
          error = true;
        }
      }

      let currentDate: string = dateString();

      let watch: YakklWatch = {
				id: profile.id,
				blockchain: data.blockchain,
				name: data.addressName,
				tags: [],
				value: 0n,
				includeInPortfolio: data.includeInPortfolio,
				explorer: data.url,
				address: data.address,
				addressAlias: data.addressAlias,
				version: VERSION,
				createDate: currentDate,
				updateDate: currentDate,
			};
      
      (profile.data as ProfileData).watchList.push(watch);

      encryptData(profile.data, yakklMiscStore).then(async result => {
        profile.data = result;
        await setProfileStorage(profile);
      });

      (currentlySelected.data as CurrentlySelectedData).profile = deepCopy(profile);

      await setYakklCurrentlySelectedStorage(currentlySelected);

      // TODO: May not need an additional storage for watchlist but only the one attached to a given profile
			watchList = await getYakklWatchList();

      if (watchList?.length > 0) {
        if (watchList.find(account => (account.address === data.address) && (account.blockchain === data.blockchain))) {
          errorValue = 'This account already exists.';
          error = true;
        }
      }

      watchList.push({
				id: profile.id,
				name: data.addressName,
				tags: [],
				value: '0.0',
				includeInPortfolio: data.includeInPortfolio,
				explorer: data.url,
				address: data.address,
				addressAlias: data.addressAlias,
				blockchain: data.blockchain,
				version: yakklSettingsStore !== null ? yakklSettingsStore.version : '0.0.1',
				createDate: currentDate,
				updateDate: currentDate
			});
			
			setYakklWatchListStorage(watchList);
      // TODO: The above...

      // encryptData(profile.data, $yakklMiscStore).then(async result => {
      //   profile.data = result;
      //   await setProfileStorage(profile);
      // });

      $form.address = data.address = "";
      $form.addressName = data.addressName = "";
      $form.includeInPortfolio = data.includeInPortfolio = false;
      $form.addressAlias = data.addressAlias = "";
      $form.url = data.url = "";
		} catch (e) {
			error = true;
			errorValue = e;
			// TBD - Remove sensitive information
			// console.log(errorValue);            
		}        
	}

	//TODO: Need to create a Network Provider dropdown control to include for 'network'. We have a basic one now but plugin control would be better
	const { form, errors, handleChange, handleSubmit } = createForm({
			initialValues: { 
					blockchain: "Ethereum",
					address: "", 
					addressName: "",
					includeInPortfolio: false,
					addressAlias: "",
					url: ""
			},
			validationSchema: yup.object().shape({
					blockchain: yup.string().required('Please enter the crypto account network (watch-only)'),
					address: yup.string().required('Please enter the crypto account (watch-only)'),
					addressName: yup.string().required('Please enter the account name (e.g., address alias)')
					// TBD - Validate hex address for Ethereum
			}),
			onSubmit: data => {
					// const element = document.getElementById("recover");
					// element.disabled = true;

				handleAddWatch(data);
			}
	});

</script>

<Modal bind:open={error}>
    <div class="text-center">
        <svg aria-hidden="true" class="mx-auto mb-4 w-14 h-14 text-gray-400 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400"><span class="font-bold">ERROR!</span> Your Watch-Only account did not process for the following reason: {errorValue}</h3>
        <Button color='red' on:click={() => {error=false}}>Close</Button>
    </div>
</Modal>

<div class="flex flex-col relative justify-center left-0">
    <Back defaultClass="-left-3 -top-3"/>
    
    <div class="items-center justify-center">
        <span class="w-full block px-1 text-xl font-extrabold border-none text-base-content text-center">Add Watch-Only Address</span>
    </div>

    <hr class="mb-3"/>

    <p class="ml-5 mr-5 p-2 text-small border-2 border-green-200 bg-green-50 text-green-900 rounded-lg" aria-label="Watch-only notification">
        This is a <strong>WATCH - ONLY address</strong>. This means that you will not be able to perform any transactions with this specific address in YAKKL since there is no private key associated with this address.
        You can <strong>Import</strong> this address if you have your private key using the Import option. This `watch-only` address allows you to keep track of <strong>ALL</strong> of your crypto in one wallet and have a complete portfolio view.
        You can also use this feature to keep track of other addresses belonging to others (e.g, `whales`) and be alerted on activities (useful for staying aware of potential market moves).
    </p>

    <div class="pt-2 ml-5 mr-5 text-gray-900 dark:text-white">
        <div class="">
            <form class="px-5" on:submit|preventDefault={handleSubmit}>
                <div class="my-1">
                    <select id="blockchain" name="blockchain" bind:value={$form.blockchain} on:change={handleChange} class="block w-full px-4 md:py-2 py-1 text-sm font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded-md ">
                        <!-- <option value="Bitcoin">Bitcoin</option> -->
                        <option value="Ethereum">Ethereum</option>
						            <option value="Polygon">Polygon</option>
                        <!-- <option value="Solana">Solana</option> -->
                        <!-- <option value="YAKKL">YAKKL</option> -->
                    </select>
                    <input
                        id="address"
                        class="block w-full px-4 md:py-2 py-1 mt-2 text-md font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded-md transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                        placeholder="Address"
                        bind:value={$form.address}
                        on:change={handleChange}
                    />
                    {#if $errors.address}
                    <small class="text-red-800 animate-pulse">{$errors.address}</small>
                    {/if}
                    <input
                        id="addressName"
                        class="block w-full px-4 md:py-2 py-1 mt-2 text-md font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded-md transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                        placeholder="Address Name"
                        bind:value={$form.addressName}
                        on:change={handleChange}
                    />
                    {#if $errors.addressName}
                    <small class="text-red-800 animate-pulse">{$errors.addressName}</small>
                    {/if}
                    <div class="flex flex-row">
                        <input type="checkbox"
                            class="appearance-none h-4 w-4 border border-gray-300 rounded-sm bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain mr-2 cursor-pointer"
                            bind:value={$form.includeInPortfolio}
                            on:change={handleChange}
                            id="include">
                        <label class="text-white  font-bold" for="include">Include this account in your portfolio totals?</label>        
                    </div>
                    <input
                        id="addressAlias"
                        class="block w-full px-4 md:py-2 py-1 mt-2 text-md font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded-md transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                        placeholder="Address Alias (optional)"
                        bind:value={$form.addressAlias}
                        on:change={handleChange}
                    />
                    <input
                        id="url"
                        class="block w-full px-4 md:py-2 py-1 mt-2 text-md font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded-md transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                        placeholder="URL for checking address data (optional)"
                        bind:value={$form.url}
                        on:change={handleChange}
                    />
                </div>
                
                <div class="flex flex-row space-x-2 justify-center mt-2 mb-20">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-interactive-supports-focus -->
                    <div role="button" on:click={() => goto(PATH_WELCOME)}
                        aria-label="Cancel"
                        class="text-center bg-white px-6 py-2 border-2 border-purple-600 text-purple-600 font-medium text-xs leading-tight uppercase rounded-full hover:bg-black hover:bg-opacity-5 dark:hover:bg-white focus:outline-none focus:ring-0 transition duration-150 ease-in-out ml-2 w-[125px]">
                        Cancel
                    </div>
                    <button 
                        type="submit"
                        on:click={handleSubmit}
                        class="bg-white px-6 py-2 border-2 border-purple-600 text-purple-600 font-medium text-xs leading-tight uppercase rounded-full hover:bg-black hover:bg-opacity-5 dark:hover:bg-white focus:outline-none focus:ring-0 transition duration-150 ease-in-out ml-2 w-[125px]"
                        aria-label="Confirm">
                        Submit
                    </button>
                </div>
            </form>            
        </div>
    </div>
</div>
