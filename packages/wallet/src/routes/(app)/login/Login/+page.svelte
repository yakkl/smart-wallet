<script lang="ts">
  import { page } from '$app/state';
  import { createForm } from "svelte-forms-lib";
  import { setYakklCurrentlySelectedStorage, setSettingsStorage, setProfileStorage, yakklDappConnectRequestStore, yakklCurrentlySelectedStore, yakklSettingsStore, yakklPreferencesStore, yakklPrimaryAccountsStore, syncStoresToStorage, yakklMiscStore } from '$lib/common/stores';
  import { yakklVersionStore, yakklUserNameStore } from '$lib/common/stores';
  import { goto } from '$app/navigation';
  import { Popover } from 'flowbite-svelte';
  import { PATH_WELCOME, PATH_REGISTER, PATH_DAPP_ACCOUNTS, DEFAULT_TITLE, PATH_ACCOUNTS_ETHEREUM_CREATE_PRIMARY, PATH_LOGOUT, PATH_LEGAL } from '$lib/common/constants';
  import { setIconLock, setIconUnlock } from '$lib/utilities/utilities';
  import { decryptData, encryptData } from '$lib/common/encryption';
  import { onMount } from 'svelte';
  import Copyright from '$lib/components/Copyright.svelte';
	import ErrorNoAction from '$lib/components/ErrorNoAction.svelte';
	import Welcome from '$lib/components/Welcome.svelte';
	import { RegistrationType, checkAccountRegistration, debug_log, isEncryptedData, type Preferences, type ProfileData, type Settings, type YakklAccount, type YakklCurrentlySelected, type YakklPrimaryAccount } from '$lib/common';
	import { dateString } from '$lib/common/datetime';
	import { verify } from '$lib/common/security';

	import RegistrationOptionModal from '$lib/components/RegistrationOptionModal.svelte';
	import ImportPrivateKey from '$lib/components/ImportPrivateKey.svelte';
	import EmergencyKitModal from '$lib/components/EmergencyKitModal.svelte';
	import ImportPhrase from '$lib/components/ImportPhrase.svelte';
	import ImportOptionModal from '$lib/components/ImportOptionModal.svelte';
	import { deepCopy } from '@ethersproject/properties';
  import { browser_ext, browserSvelte } from '$lib/common/environment';
	import { debug } from 'console';
	import { stateStore } from '$lib/common/stores/stateStore';
	// import { sendNotificationStartLockIconTimer } from '$lib/common/notifications';
  // import ProgressWaiting from '$lib/components/ProgressWaiting.svelte';

  // Reactive State
  let yakklCurrentlySelected: YakklCurrentlySelected | null = $state(null);
  let yakklMisc: string = $state('');
  let yakklSettings: Settings | null = $state(null);
  let yakklPreferences: Preferences | null = $state(null);
  let yakklPrimaryAccounts: YakklPrimaryAccount[] = $state([]);
  // let yakklTokenData: TokenData[] = $state([]);
  // let yakklInstances: [Wallet, Provider, Blockchain, TokenService<any>] | [null, null, null, null] = $state([null, null, null, null]);

  let error = $state(false);
  let errorValue: any = $state();
  let registeredType: string = $state();
  let redirect = PATH_WELCOME;
  let requestId: string = '';
  let showProgress = $state(false);
  let pweyeOpen = false;
  let pweyeOpenId: HTMLButtonElement;
  let pweyeClosedId: HTMLButtonElement;

  let showRegistrationOption = $state(false);
  let showEmergencyKit = $state(false);
  let showImportOption = $state(false);
  let showImportAccount = $state(false);
  let showImportPhrase = $state(false);

  if (browserSvelte) {
    requestId = page.url.searchParams.get('requestId') as string ?? '';
    $yakklDappConnectRequestStore = requestId;
    if (requestId) {
      redirect = PATH_DAPP_ACCOUNTS + '.html?requestId=' + requestId;
    }
  }

  $yakklVersionStore = ''; // This will get set AFTER user validation

  $effect(() => { yakklCurrentlySelected = $yakklCurrentlySelectedStore; });
  $effect(() => { yakklMisc = $yakklMiscStore; });
  $effect(() => { yakklSettings = $yakklSettingsStore; });
  $effect(() => { yakklPreferences = $yakklPreferencesStore; });
  // $effect(() => { yakklTokenData = $yakklTokenDataStore; });
  // $effect(() => { yakklInstances = $yakklInstancesStore; });
  $effect(() => { yakklPrimaryAccounts = $yakklPrimaryAccountsStore; });

  onMount(async () => {
    try {
      if (browserSvelte) {

        debug_log('Login: onMount: Login');

        if (!yakklSettings || !yakklSettings.legal.termsAgreed) {
          debug_log('Login: Redirecting to:', PATH_LEGAL);
          return await goto(PATH_LEGAL);
        }
        if (yakklSettings.init === false) {
          debug_log('Login: Redirecting to:', PATH_REGISTER);
          return await goto(PATH_REGISTER);
        }

        await setIconLock(); // make sure it shows locked

        // If lock state set then just verify user
        if (!$stateStore) {
          if (yakklCurrentlySelected.shortcuts?.isLocked === false) {
            yakklCurrentlySelected.shortcuts.isLocked = true;
            await setYakklCurrentlySelectedStorage(yakklCurrentlySelected);
          }

          if (yakklSettings && !yakklSettings.isLocked) {
            yakklSettings.isLocked = true; // This forces a lock
            await setSettingsStorage(yakklSettings);
          }

          // const yakklPreferences = await getPreferences();
          if (yakklPreferences) {
            // Sets the default of 60 seconds but can be changed by setting the properties to another integer.
            browser_ext.idle.setDetectionInterval(yakklPreferences.idleDelayInterval || 60); // System idle time is 2 minutes. This adds 1 minute to that. If any movement or activity is detected then it resets.
          }

          registeredType = yakklSettings.registeredType as string;
          // if (!checkUpgrade()) { // The checkUpgrade is not valid until after user is validated
          if (registeredType !== RegistrationType.PRO) {
            registeredType = RegistrationType.STANDARD;
          }

          // PROMO
          // let promoDate = new Date('2026-01-01T00:00:00');
          // let date = new Date();
          // if (date < promoDate) {
            registeredType = RegistrationType.PRO;
          // }
          ////
        }

        pweyeOpenId = document.getElementById("pweye-open") as HTMLButtonElement;
        pweyeClosedId = document.getElementById("pweye-closed") as HTMLButtonElement;
        pweyeOpenId.setAttribute('tabindex', '-1');
        pweyeClosedId.setAttribute('tabindex', '-1');
        pweyeOpenId.setAttribute('hidden', 'hidden');

        let namHelp = document.getElementById("nam-help");
        namHelp?.setAttribute('tabindex', '-1');

        let pwdHelp = document.getElementById("pwd-help");
        pwdHelp?.setAttribute('tabindex', '-1');
      }
    } catch(e: any) {
      console.log(`[ERROR]: onMount: Login - ${e}`, e?.stack);
    }
  });

  const { form, errors, handleSubmit } = createForm({
    initialValues: { userName: "", password: "" },
    onSubmit: async data => {
      // Verify password by decrypting data!
      await login(data.userName, data.password);
      $form.userName = "";
      $form.password = "";
      data.password = "";
      data.userName = "";
    }
  });

  async function login(userName: string, password: string): Promise<void> {
    if (browserSvelte) {
      try {
        // showProgress = true;
        let profile = await verify(userName.toLowerCase().trim().replace('.nfs.id', '')+'.nfs.id'+password);
        if (!profile) {
          throw `User [ ${userName} ] was not found OR password is not correct OR no primary account was not found. Please try again or register if not already registered`;
        } else {

          debug_log('Login: Login: profile', profile);

          // yakklMisc = getMiscStore(); // This should be set by the verify function
          if (!yakklMisc) {
            throw `User [ ${userName} ] was not found OR password is not correct. Please try again or register if not already registered`;
          }
          $yakklUserNameStore = userName;

          // yakklCurrentlySelected = await getYakklCurrentlySelected();
          if (yakklCurrentlySelected.shortcuts.isLocked) {
            yakklCurrentlySelected.shortcuts.isLocked = false;
            // NO need to encrypt the data again because it is already encrypted since it was never decrypted
            // if (!isEncryptedData(yakklCurrentlySelected.data)) {
            //   const data = await encryptData(yakklCurrentlySelected.data, yakklMisc);
            //   if (data) {
            //     yakklCurrentlySelected.data = data;
            //   } else {
            //     throw `User [ ${userName} ] was not found OR password is not correct. Please try again or register if not already registered`;
            //   }
            // }
            await setYakklCurrentlySelectedStorage(yakklCurrentlySelected);
          }

          if (yakklSettings.isLocked) {
            yakklSettings.lastAccessDate = dateString();
            yakklSettings.isLocked = false;
            yakklSettings.registeredType = registeredType;
            await setSettingsStorage(yakklSettings);
          }

          // if (!$stateStore) {
            if (isEncryptedData(profile.data)) {
              profile.data = await decryptData(profile.data, yakklMisc);
            }
            if ((profile.data as ProfileData).registered?.key) {
              let key = (profile.data as ProfileData).registered.key;
              if (key !== null || key !== '' && (profile.data as ProfileData).registered.type === RegistrationType.PRO) {
                $yakklVersionStore = RegistrationType.PRO; // Add this later... + ' - ' + key;
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

            if (yakklPrimaryAccounts.length > 0) {
              if (!isEncryptedData(profile.data) && (profile.data as ProfileData).primaryAccounts.length !== yakklPrimaryAccounts.length) {
                (profile.data as ProfileData).primaryAccounts = deepCopy(yakklPrimaryAccounts);
              }
            }

            if (!isEncryptedData(profile.data)) {
              profile.data = await encryptData(profile.data, yakklMisc);
            }
            await setProfileStorage(profile);

            if (redirect !== PATH_WELCOME) {

              debug_log('Login: Redirecting dapp to:', redirect);

              // Must be a dapp - now doing load in +page.ts
              if (requestId) { // Don't want to truely unlock with dapps
                if (yakklSettings && yakklSettings.init === true) {
                  await syncStoresToStorage();  // This sets up the memory stores from the physical store
                }
              }
            } else {
              await setIconUnlock(); // Set the unlock icon and sync will occur in welcome (next step)
            }
            showProgress = false;

            // Make sure there is at least one Primary or Imported account
            if (await checkAccountRegistration()) {
              debug_log('Login: Redirecting to:', redirect);

              // await sendNotificationStartLockIconTimer();
              goto(redirect, { replaceState: true, invalidateAll: true });
            } else {
              showRegistrationOption = true;
            }
          // } else {
          //   debug_log('Login: Redirecting to (state):', PATH_WELCOME);
          //   // location.href = PATH_WELCOME + '.html';
          //   goto(PATH_WELCOME);
          // }
        }
      } catch(e: any) {
        showProgress = false;
        console.log(`[ERROR]: Login login: ${e}`, e?.stack);
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

  async function onCompleteImportPrivateKey(account: YakklAccount) {
    showImportAccount = false;
    await goto(PATH_WELCOME)
  }

  function onCancelImportPrivateKey() {
    showImportAccount = false;
    showRegistrationOption = true;
  }

  async function onCompleteEmergenyKit(success: boolean, message: string) {
    showEmergencyKit = false;
    await goto(PATH_WELCOME)
  }

  function onCancelEmergencyKit() {
    showEmergencyKit = false;
    showRegistrationOption = true;
  }

  async function onCancelRegistrationOption() {
    showRegistrationOption = false;
    showEmergencyKit = false;
    showImportAccount = false;
    await goto(PATH_LOGOUT);
  }

  function onCancelImportOption() {
    showImportOption = false;
    showEmergencyKit = false;
    showImportAccount = false;
    showImportPhrase = false;
    showRegistrationOption = true; // Go back to the registration option
  }

  function onImportKey() {
    showRegistrationOption = false;
    showImportOption = false;
    showImportPhrase = false;
    showEmergencyKit = false;
    showImportAccount = true;
  }

  function onImportPhrase() {
    showRegistrationOption = false;
    showImportOption = false;
    showEmergencyKit = false;
    showImportAccount = false;
    showImportPhrase = true;
  }

  // May want to add parameters of what changed later but not currently needed
  async function onCompleteImportPhrase() {
    showImportPhrase = false;
    await goto(PATH_WELCOME)
  }

  function onCancelImportPhrase() {
    showImportAccount = false;
    showRegistrationOption = true;
  }

  // Here as a reference for ErrorNoAction
  function handleCustomAction() {
    errorValue = '';
  }
</script>

<svelte:head>
	<title>{DEFAULT_TITLE}</title>
</svelte:head>

<!-- Here, we don't need to close anything so no need for onClose or onCancel -->
<RegistrationOptionModal bind:show={showRegistrationOption} onCreate={() => {showRegistrationOption=false; goto(PATH_ACCOUNTS_ETHEREUM_CREATE_PRIMARY);}} onImport={() => {showRegistrationOption=false; showImportAccount=true;}} onRestore={() => {showRegistrationOption=false; showEmergencyKit=true;}} />
<ImportPrivateKey bind:show={showImportAccount} onComplete={onCompleteImportPrivateKey} onCancel={onCancelImportPrivateKey} />
<ImportPhrase bind:show={showImportPhrase} onComplete={onCompleteImportPhrase} onCancel={onCancelImportPhrase}  />
<ImportOptionModal bind:show={showImportOption} onCancel={onCancelImportOption} {onImportKey} {onImportPhrase} onRestore={() => {showRegistrationOption=false; showEmergencyKit=true;}}/>
<EmergencyKitModal bind:show={showEmergencyKit} onComplete={onCompleteEmergenyKit} onCancel={onCancelEmergencyKit}/>
<!-- <ProgressWaiting bind:show={showProgress} title="Verifying" value="Credentials and Loading..." /> -->
<ErrorNoAction bind:show={error} title="ERROR!" value={errorValue} handle={handleCustomAction} />

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
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <!-- <div id="register" role="button" on:click={() => goto("/register/Register.html")} class="text-md uppercase underline font-bold">Click if NOT registered</div> -->

      <form onsubmit={(e) => {
        e.preventDefault();
        handleSubmit(e);
      }}>

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
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <svg id="pweye-closed" onclick={togglePasswordVisability} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-1 fill-gray-200 absolute right-12 z-10 mt-5 cursor-pointer">
              <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
              <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
              <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
            </svg>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <svg id="pweye-open" onclick={togglePasswordVisability} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-1 fill-gray-200 absolute right-12 z-10 mt-5 cursor-pointer">
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
          <button type="button" onclick={onCancelRegistrationOption}
            class="btn btn-secondary w-64 rounded-full mt-3 text-white">
            <div class="inline-flex items-center align-middle">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" stroke="currentColor" class="w-6 h-6 mx-2">
                <path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd" />
                <path fill-rule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clip-rule="evenodd" />
              </svg>
              <span>Exit/Logout</span>
            </div>
          </button>
        </div>

      </form>

    </div>

    <!-- {#if registeredType !== 'Pro'}
    <div id="upgrade" class="w-full mt-10">
      <div class="card bg-base-100 shadow-xl image-full animate-pulse">
        <figure><img src="/images/logoBullFav128x128.png" alt="upgrade" /></figure>
        <div class="card-body">
          <h2 class="card-title self-center">UPGRADE TO PRO!</h2>
          <p>It appears you have not upgraded to the Pro version. Do it today to unlock advanced features. Click the UPGRADE button after you login. This will enable a number of features including our unique Emergency Kit, AI Chat, and enhanced security.</p>
        </div>
      </div>
    </div>
    {:else} -->
    <div id="upgrade" class="w-full mt-14">
      <div class="card bg-base-100 shadow-xl image-full animate-pulse">
        <figure><img src="/images/logoBullFav128x128.png" alt="upgrade" /></figure>
        <div class="card-body">
          <h2 class="card-title self-center">PRO!</h2>
          <p>Welcome to our Pro version. We have a lot of additional features waiting on you. We're also working hard on advanced features to make your digital asset experience a dream! We also need your suggestions! Enjoy!</p>
        </div>
      </div>
    </div>
    <!-- {/if} -->

    <Copyright registeredType={registeredType} />

  </main>
</div>


