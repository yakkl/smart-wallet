<script lang="ts">
  import { browser as browserSvelte} from '$app/environment';
  import { page } from '$app/stores';
  import { createForm } from "svelte-forms-lib";
  import { getSettings, getYakklCurrentlySelected, setYakklCurrentlySelectedStorage, setSettings, getPreferences, setPreferencesStorage, getYakklPrimaryAccounts, setSettingsStorage, setProfileStorage, yakklDappConnectRequestStore, getMiscStore } from '$lib/common/stores';
  import { syncStoresToStorage, yakklVersionStore, yakklUserNameStore } from '$lib/common/stores';
  import { goto } from '$app/navigation';
  import { Popover } from 'flowbite-svelte';
  import { PATH_WELCOME, PATH_REGISTER, PATH_DAPP_ACCOUNTS, DEFAULT_TITLE } from '$lib/common/constants';
  import { setIconLock, setIconUnlock } from '$lib/utilities/utilities';
  import { decryptData, encryptData } from '$lib/common/encryption';
  import { onMount } from 'svelte';
  import Copyright from '$lib/components/Copyright.svelte';
  import ProgressWaiting from '$lib/components/ProgressWaiting.svelte';
	import ErrorNoAction from '$lib/components/ErrorNoAction.svelte';
	import Welcome from '$lib/components/Welcome.svelte';
	import { RegistrationType, isEncryptedData, type ProfileData, type YakklCurrentlySelected, type YakklPrimaryAccount } from '$lib/common';
	import { dateString } from '$lib/common/datetime';
	import { verify } from '$lib/common/security';
  
  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
	import type { Browser } from 'webextension-polyfill';
  let browser_ext: Browser; 
  if (browserSvelte) browser_ext = getBrowserExt();

  // let wallet: Wallet;

  let currentlySelected: YakklCurrentlySelected;
  let yakklMiscStore: string;
  let yakklPrimaryAccountsStore: YakklPrimaryAccount[];

  let error = false;
  let errorValue: any; 
  let registeredType: string;
  let redirect = PATH_WELCOME;
  let requestId: string = '';
  let showProgress = false;
  let pweyeOpen = false;
  let pweyeOpenId: HTMLButtonElement;
  let pweyeClosedId: HTMLButtonElement;

  if (browserSvelte) {
    requestId = $page.url.searchParams.get('requestId') as string;
    $yakklDappConnectRequestStore = requestId;
    if (requestId) {
      redirect = PATH_DAPP_ACCOUNTS + '.html?requestId=' + requestId;
    }
  }
  
  $yakklVersionStore = ''; // This will get set AFTER user validation

  onMount(async () => {
    try {
      if (browserSvelte) {
        if (requestId) {
          redirect = PATH_DAPP_ACCOUNTS + '.html?requestId=' + requestId;
        }

        currentlySelected = await getYakklCurrentlySelected();

        // wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], currentlySelected  ? currentlySelected.shortcuts.chainId ?? 1 : 1, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);
        // console.log('onMount: wallet', wallet);

        pweyeOpenId = document.getElementById("pweye-open") as HTMLButtonElement; 
        pweyeClosedId = document.getElementById("pweye-closed") as HTMLButtonElement;
        pweyeOpenId.setAttribute('tabindex', '-1');
        pweyeClosedId.setAttribute('tabindex', '-1');
        pweyeOpenId.setAttribute('hidden', 'hidden');

        let namHelp = document.getElementById("nam-help");
        namHelp?.setAttribute('tabindex', '-1');

        let pwdHelp = document.getElementById("pwd-help");
        pwdHelp?.setAttribute('tabindex', '-1');

        setIconLock(); // make sure it shows locked

        const yakklPreferences = await getPreferences();
        if (yakklPreferences) {
          // Sets the default of 60 seconds but can be changed by setting the properties to another integer.
          browser_ext.idle.setDetectionInterval(yakklPreferences.idleDelayInterval); // System idle time is 2 minutes. This adds 1 minute to that. If any movement or activity is detected then it resets.
        }
        
        const yakklSettings = await getSettings();
        if (yakklSettings) {
          registeredType = yakklSettings.registeredType as string;
          // if (!checkUpgrade()) { // The checkUpgrade is not valid until after user is validated
          if (registeredType !== RegistrationType.PREMIER) {
            registeredType = RegistrationType.STANDARD;
          }
          
          // PROMO - BETA
          let promoDate = new Date('2025-01-01T00:00:00');  // TODO: May want to remove this altogether later...
          let date = new Date();
          if (date < promoDate) {
            registeredType = RegistrationType.PREMIER;
          }
          ////

          yakklSettings.isLocked = true; // This forces a lock
          await setSettingsStorage(yakklSettings);

          if (yakklSettings.init === false) {
            await goto(PATH_REGISTER);
          }
        }
      }
    } catch(e) {
      console.log(`onMount: Login - ${e}`);
    }
  });

  
  const { form, errors, handleSubmit } = createForm({
    initialValues: { userName: "", password: "" },
    onSubmit: async data => {
      // Verify password by decrypting data!
      let uName = data.userName;
      await login(uName, data.password);
      $form.userName = "";
      $form.password = "";
      data.password = "";
      data.userName = "";
    }
  });


  async function login(userName: string, password: string): Promise<void> {
    if (browserSvelte) {
      try {
        showProgress = true;

        let profile = await verify(userName.toLowerCase().trim().replace('.nfs.id', '')+'.nfs.id'+password); 
        if (!profile) {
          throw `User [ ${userName} ] was not found OR password is not correct OR no primary account was not found. Please try again or register if not already registered`;
        } else {

          if (!yakklMiscStore) yakklMiscStore = getMiscStore(); // This should be set by the verify function
          if (!yakklMiscStore) {
            throw `User [ ${userName} ] was not found OR password is not correct. Please try again or register if not already registered`;
          } 
          $yakklUserNameStore = userName;

          if (!currentlySelected) currentlySelected = await getYakklCurrentlySelected();
          
          currentlySelected.shortcuts.isLocked = false;
          // May can wait until the welcome page card to make any blockchain calls...
          // if (currentlySelected.shortcuts.address && wallet) {
          //   let result = await wallet.getBalance(currentlySelected.shortcuts.address);
          //   if (result) {              
          //     if ((currentlySelected.data as CurrentlySelectedData)?.account?.value) (currentlySelected.data as CurrentlySelectedData).account.value = result;
          //     if (currentlySelected.shortcuts?.value) currentlySelected.shortcuts.value = result;
          //   }
          // }          
          if (!isEncryptedData(currentlySelected.data)) {
            encryptData(currentlySelected.data, yakklMiscStore).then(result => {
              currentlySelected.data = result;
            });
          }
          await setYakklCurrentlySelectedStorage(currentlySelected);
          checkRegistration(); // Checks to see if settings have been init

          if (isEncryptedData(profile.data)) {
            decryptData(profile.data, yakklMiscStore).then(result => {
              profile.data = result as ProfileData;
            });
          }
          if ((profile.data as ProfileData).registered?.key) {
            let key = (profile.data as ProfileData).registered.key;
            if (key !== null || key !== '' && (profile.data as ProfileData).registered.type === RegistrationType.PREMIER) {
              $yakklVersionStore = RegistrationType.PREMIER; // Add this later... + ' - ' + key;
            } else {
              $yakklVersionStore = RegistrationType.STANDARD;
              (profile.data as ProfileData).registered.key = '';
              (profile.data as ProfileData).registered.type = RegistrationType.STANDARD;
            }
          } else { // Fallback to standard user. If the user was registrered before then this means something happened to the data and we need to reset it. In the future we will have a way to recover this.
            $yakklVersionStore = RegistrationType.STANDARD;
            (profile.data as ProfileData).registered.key = '';
            (profile.data as ProfileData).registered.type = RegistrationType.STANDARD;
          }
          if (!isEncryptedData(profile.data)) {
            encryptData(profile.data, yakklMiscStore).then(result => {
              profile.data = result;
            });
          }
          await setProfileStorage(profile);

          //// May not need this with new plugins...
          // const port = browser_ext.runtime.connect({name: YAKKL_INTERNAL});
          // port.onMessage.addListener(async(event: any) => {
          //   console.log(event);
          // });

          // if (port) {  // Add the others later...
          //   let params = [];
          //   params[0] = PROVIDERS.ALCHEMY;
          //   // params[1] = (currentlySelected.data as CurrentlySelectedData).providerKey;
          //   port.postMessage({method: 'providers', params: params});
          // }
          //// End of may not need...
          //// May not need this with new plugins...
          // if (port) port.disconnect();
          //// End of may not need...

          let settings = await getSettings();
          if (settings) {
            settings.lastAccessDate = dateString();
            settings.isLocked = false;
            settings.registeredType = registeredType;
            setSettings(settings);
          }

          let preferences = await getPreferences();
          if (preferences) {
            preferences.screenWidth = screen.width;
            preferences.screenHeight = screen.height;
            setPreferencesStorage(preferences);
          }

          yakklPrimaryAccountsStore = await getYakklPrimaryAccounts();
          
          if (redirect !== PATH_WELCOME) {
            // Must be a dapp
            if (requestId) { // Don't want to truely unlock with dapps
              if (settings && settings.init === true) {
                syncStoresToStorage();  // This sets up the memory stores from the physical store
              }
            }
          } else {
            setIconUnlock(); // Set the unlock icon and sync will occur in welcome (next step)
          }
          showProgress = false;
          goto(redirect);
        }
      } catch(e) {
        showProgress = false;
        console.log(`Login login: ${e}`);
        error = true;
        errorValue = e;
      }
    }
  }


  function toggleVisability(id="password", type="text") {
    let x = document.getElementById(id) as HTMLInputElement;
    if (x.type === "password") {
      x.type = type;
    } else {
      x.type = "password";
    }
  }


  function togglePasswordVisability() {
    toggleVisability("password", "text");
    if (pweyeOpen === false) {
      pweyeOpenId.removeAttribute('hidden');
      pweyeClosedId.setAttribute('hidden', 'hidden');
      pweyeOpen = true;
    } else {
      pweyeOpenId.setAttribute('hidden', 'hidden');
      pweyeClosedId.removeAttribute('hidden');
      pweyeOpen = false;
    }
  }

  async function checkRegistration() {
    if (browserSvelte) {
      await getSettings().then((settings) => {
        if (settings && settings.init !== true) {
          goto(PATH_REGISTER);
        }
      });
    }
  }
  
</script>

<svelte:head>
	<title>{DEFAULT_TITLE}</title>
</svelte:head>

<ProgressWaiting bind:show={showProgress} title="Verifying" value="Credentials and Loading..." />

<ErrorNoAction bind:show={error} title="ERROR!" bind:value={errorValue} />

<Popover class="text-sm z-10 w-60" triggeredBy="#register" placement="top">
  <h3 class="font-semibold">If NOT registered</h3>
  <div class="grid grid-cols-4 gap-2">
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
  </div>
  <p class="py-2 whitespace-normal">If you have not already register then click this. It will take you to the registration screen.</p>
</Popover>

<Popover class="text-sm z-10" triggeredBy="#nam-help" placement="left">
  <h3 class="font-semibold">Username</h3>
  <div class="grid grid-cols-4 gap-2">
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
  </div>
  <p class="py-2">Enter your username.</p>
</Popover>

<Popover class="text-sm z-10" triggeredBy="#pwd-help" placement="left">
  <h3 class="font-semibold">Password</h3>
  <div class="grid grid-cols-4 gap-2">
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
  </div>
  <p class="py-2">Enter your password.</p>
</Popover>

<!-- relative bg-gradient-to-b from-indigo-700 to-indigo-500/15 m-1 ml-2 mr-2 dark:bg-gray-900 rounded-t-xl overflow-hidden -->
<div class="relative h-[98vh] text-base-content">
  
  <main class="px-4 text-center">

    <Welcome />

    <div class="mt-5">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-interactive-supports-focus -->
      <!-- <div id="register" role="button" on:click={() => goto("/register/Register.html")} class="text-md uppercase underline font-bold">Click if NOT registered</div> -->
      
      <form on:submit|preventDefault={handleSubmit}>

        <div class="mt-5 flex flex-row">
          <div class="form-control w-[22rem]">
            <div class="join">
              <input id="userName"
                type="text"
                class="input input-bordered input-primary w-full join-item"
                placeholder="Username" autocomplete="off" bind:value="{$form.userName}" required />
              <span class="label-text bg-slate-900 join-item w-[60px]"><div class="mt-[.9rem]">.nfs.id</div></span>
            </div>
          </div>
          <svg id="nam-help" tabindex="-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-6 h-6 ml-1 mt-2 fill-gray-300">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
          </svg>
          
        </div>

        <div class="mt-5 flex flex-row">
          <div class="form-control w-[22rem]">
            <input id="password" type="password"
              class="input input-bordered input-primary w-full mt-2"
              placeholder="Password" autocomplete="off" bind:value="{$form.password}" required />
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <svg id="pweye-closed" on:click={togglePasswordVisability} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-1 fill-gray-200 absolute right-12 z-10 mt-5 cursor-pointer">
              <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
              <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
              <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
            </svg>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <svg id="pweye-open" on:click={togglePasswordVisability} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-1 fill-gray-200 absolute right-12 z-10 mt-5 cursor-pointer">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clip-rule="evenodd" />
            </svg>  
          </div>
          <svg id="pwd-help" tabindex="-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-6 h-6 ml-1 mt-4 fill-gray-300">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
          </svg>
        </div>

        <div class="inline-block text-center">
          <button type="submit"
            class="btn btn-primary w-64 rounded-full mt-3">
            <div class="inline-flex items-center align-middle">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 ml-2" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <span>Unlock</span>
            </div>
          </button>
        </div>
      </form>
      
    </div>

    <!-- {#if registeredType !== 'Premier'}
    <div id="upgrade" class="w-full mt-10">
      <div class="card bg-base-100 shadow-xl image-full animate-pulse">
        <figure><img src="/images/logoBullFav128x128.png" alt="upgrade" /></figure>
        <div class="card-body">
          <h2 class="card-title self-center">UPGRADE TO PREMIER!</h2>
          <p>It appears you have not upgraded to the Premier version. Do it today to unlock advanced features. Click the UPGRADE button after you login. This will enable a number of features including our unique Emergency Kit, AI Chat, and enhanced security.</p>
        </div>
      </div>      
    </div>
    {:else} -->
    <div id="upgrade" class="w-full mt-14">
      <div class="card bg-base-100 shadow-xl image-full animate-pulse">
        <figure><img src="/images/logoBullFav128x128.png" alt="upgrade" /></figure>
        <div class="card-body">
          <h2 class="card-title self-center">PREMIER!</h2>
          <p>Welcome to our Premier version. We have a lot of additional features waiting on you. We're also working hard on advanced features to make your digital asset experience a dream! We also need your suggestions! Enjoy!</p>
        </div>
      </div>      
    </div>
    <!-- {/if} -->

    <Copyright registeredType={registeredType} />
    
  </main>
</div>


