<script lang="ts">
  import { browserSvelte, browser_ext } from '$lib/common/environment';
  import { yakklVersionStore, yakklUserNameStore, getProfile, setProfileStorage, getYakklCurrentlySelected, setYakklCurrentlySelectedStorage, setPreferencesStorage, setSettingsStorage, setMiscStore, getMiscStore, getSettings, getPreferences } from '$lib/common/stores';
  import { profile as profileDefaults, yakklPreferences as yakklPreferencesDefaults, yakklCurrentlySelected as yakklCurrentlySelectedDefaults, yakklSettings as yakklSettingsDefaults } from '$lib/models/dataModels';
  import { encryptData, digestMessage, decryptData } from '$lib/common/encryption';
  import { createForm } from "svelte-forms-lib";
  import * as yup from 'yup';
  import zxcvbn from "zxcvbn";
  import { goto } from '$app/navigation';
  import { Popover } from 'flowbite-svelte';
  import { PATH_ACCOUNTS_ETHEREUM_CREATE_PRIMARY, PATH_LOGIN, DEFAULT_TITLE, YAKKL_ZERO_ADDRESS, YAKKL_ZERO_ACCOUNT_NAME, VERSION, PATH_LOGOUT } from '$lib/common/constants';
  import { getCurrencyCode, getCurrencySymbol } from '$lib/utilities/utilities';
  import { onMount } from 'svelte';
  import ErrorNoAction from '$lib/components/ErrorNoAction.svelte';
  import Warning from '$lib/components/Warning.svelte';
	import type { CurrentlySelectedData, Preferences, Profile, ProfileData, Settings, YakklCurrentlySelected } from '$lib/common/interfaces';
	import { RegistrationType } from '$lib/common/types';
	import { getUserId, isEncryptedData } from '$lib/common';
  import { dateString } from '$lib/common/datetime';
	import { sendNotificationMessage } from '$lib/common/notifications';
  import { log } from '$plugins/Logger';
	import { updateTokenPrices } from '$lib/common/tokenPriceManager';

	// import RegistrationOptionModal from '$lib/components/RegistrationOptionModal.svelte';
  // import { GoogleAuth } from '$lib/index';
	// import ImportPrivateKey from '$lib/components/ImportPrivateKey.svelte';
	// import EmergencyKitModal from '$lib/components/EmergencyKitModal.svelte';
	// import ImportOptionModal from '$lib/components/ImportOptionModal.svelte';
	// import ImportPhrase from '$lib/components/ImportPhrase.svelte';

  let currentlySelected: YakklCurrentlySelected | null = null;
  let yakklSettings: Settings | null = null;
  let yakklMiscStore: string = '';
  let yakklPreferences: Preferences | null = null;
  let yakklProfile: Profile | null = null;

  let error = $state(false);
  let errorValue: string = $state('');
  let warning = $state(false);
  let warningValue: string;
  let init = false;
  let eyeOpen = false;
  let eyeOpenId: HTMLButtonElement;
  let eyeClosedId: HTMLButtonElement;
  let pweyeOpen = false;
  let pweyeOpenId: HTMLButtonElement;
  let pweyeClosedId: HTMLButtonElement;

  let strength = $state(0);

  // let showRegistrationOption = $state(false);
  // let showImportAccount = false;
  // let showEmergencyKit = false;
  // let showImportOption = false;
  // let showImportPhrase = false;

  // Force 'Standard' version on registration - normally
  // DURING FREE - REMOVE LATER
  let promoDate = new Date('2026-01-01T00:00:00');
  let date = new Date();
  if (date < promoDate) {
    $yakklVersionStore = RegistrationType.PRO;
  } else {
    $yakklVersionStore = RegistrationType.STANDARD;
  }
  ////

  $effect(() => { strength = zxcvbn($form.password).score ?? 0; });

  onMount(async() => {
    try {
      if (browserSvelte) {
        currentlySelected = await getYakklCurrentlySelected() || yakklCurrentlySelectedDefaults;
        yakklSettings = await getSettings() || yakklSettingsDefaults;
        yakklMiscStore = getMiscStore() || '';
        yakklPreferences = await getPreferences() || yakklPreferencesDefaults;
        yakklProfile = await getProfile() || profileDefaults;

        eyeOpenId = document.getElementById("eye-open") as HTMLButtonElement;
        eyeClosedId = document.getElementById("eye-closed") as HTMLButtonElement;
        eyeOpenId.setAttribute('tabindex', '-1');
        eyeClosedId.setAttribute('tabindex', '-1');
        eyeOpenId.setAttribute('hidden', 'hidden');

        pweyeOpenId = document.getElementById("pweye-open") as HTMLButtonElement;
        pweyeClosedId = document.getElementById("pweye-closed") as HTMLButtonElement;
        pweyeOpenId.setAttribute('tabindex', '-1');
        pweyeClosedId.setAttribute('tabindex', '-1');
        pweyeOpenId.setAttribute('hidden', 'hidden');

        let namHelp = document.getElementById("nam-help") as HTMLButtonElement;
        namHelp.setAttribute('tabindex', '-1');

        let pwdHelp = document.getElementById("pwd-help") as HTMLButtonElement;
        pwdHelp.setAttribute('tabindex', '-1');

        let conHelp = document.getElementById("con-help") as HTMLButtonElement;
        conHelp.setAttribute('tabindex', '-1');

        let pinHelp = document.getElementById("pin-help") as HTMLButtonElement;
        pinHelp.setAttribute('tabindex', '-1');

        let actHelp = document.getElementById("act-help") as HTMLButtonElement;
        actHelp.setAttribute('tabindex', '-1');

        let emailHelp = document.getElementById("email-help") as HTMLButtonElement;
        emailHelp.setAttribute('tabindex', '-1');
      }
    } catch(e) {
      log.error(`Register: onMount - ${e}`);
    }
  });

  async function handleCreate() {
    // showRegistrationOption = false;
    // showEmergencyKit = false;
    // showImportAccount = false;
    // The above is commented out since we no longer show the registration option modal
    await goto(PATH_ACCOUNTS_ETHEREUM_CREATE_PRIMARY);
  }

  async function onCancelRegistrationOption() {
    // showRegistrationOption = false;
    // showEmergencyKit = false;
    // showImportAccount = false;
    // The above is commented out since we no longer show the registration option modal
    goto(PATH_LOGOUT);
  }

  // async function checkRegistration() {
  //   if (browserSvelte) {
  //     await getSettings().then((settings) => {
  //       if (settings.init === true) {
  //         init = true;
  //         errorReg = true; // Don't need to log since it is not an actual error.
  //         errorValue = "Your account has already been initialized. Going forward will RESET your account by wiping out your secret phrase and addresses (balances remain the same). This will take back.";
  //       }
  //     });
  //   }
  // }

  // checkRegistration();

  async function register(userName: string, password: string, pincode: string, accountName: string, email: string): Promise<void> {
    try {
      if (browserSvelte && browser_ext) {
        const pinPass = pincode;
        const digest = await digestMessage(userName + password);
        pincode = await digestMessage(pincode);

        if (pinPass === pincode) {
          error = true;
          errorValue = "Pin code encryption failed!";
          log.error(errorValue);
          return;
        }

        yakklMiscStore = digest; // Leave this for now. It's used for testing redaction
        setMiscStore(digest);

        if (isEncryptedData(currentlySelected?.data)) {
          currentlySelected.data = await decryptData(currentlySelected.data, digest) as CurrentlySelectedData;
        }

        if (isEncryptedData(yakklProfile?.data)) {
          yakklProfile.data = await decryptData(yakklProfile.data, digest) as ProfileData;
        }

        const profileData: ProfileData = typeof yakklProfile.data === 'object' && yakklProfile.data !== null ? yakklProfile.data as ProfileData : profileDefaults.data as ProfileData;

        $yakklUserNameStore = currentlySelected.shortcuts.profile.userName = userName;

        yakklProfile = {
          ...yakklProfile,
          userName,
          id: getUserId(),
          createDate: dateString(),
          updateDate: dateString(),
          version: VERSION,
          preferences: {
            ...yakklProfile.preferences,
            screenWidth: screen.width,
            screenHeight: screen.height,
            locale: navigator.language,
            currency: {
              code: getCurrencyCode(navigator.language),
              symbol: getCurrencySymbol(navigator.language, yakklProfile.preferences.currency.code)
            }
          }
        };

        profileData.digest = digest;
        profileData.pincode = pincode;
        profileData.email = email;

        if (date < promoDate) {
          profileData.registered = {
            type: RegistrationType.PRO,
            key: RegistrationType.PRO,
            version: VERSION,
            createDate: dateString(),
            updateDate: dateString()
          };
        }

        profileData.meta = { accountName: accountName ?? YAKKL_ZERO_ACCOUNT_NAME };

        currentlySelected = {
          ...currentlySelected,
          id: yakklProfile.id,
          version: VERSION,
          createDate: dateString(),
          updateDate: dateString(),
          preferences: {
            ...currentlySelected.preferences,
            locale: yakklProfile.preferences.locale,
            currency: yakklProfile.preferences.currency
          },
          shortcuts: {
            ...currentlySelected.shortcuts,
            legal: true,
            address: YAKKL_ZERO_ADDRESS,
            accountName: accountName ?? YAKKL_ZERO_ACCOUNT_NAME,
            init: true,
            isLocked: false,
          },
          data: {
            ...currentlySelected.data,
            profile: yakklProfile,
          }
        };

        password = '';
        pincode = '';

        const profileDataEnc = await encryptData(profileData, digest);
        yakklProfile.data = profileDataEnc;

        await setProfileStorage(yakklProfile); // Sets $profileStore as well
        await setYakklCurrentlySelectedStorage(currentlySelected); // Sets $yakklCurrentlySelectedStore as well

        // const preferences = await getPreferences() || yakklPreferencesDefaults;
        yakklPreferences.screenWidth = screen.width;
        yakklPreferences.screenHeight = screen.height;
        await setPreferencesStorage(yakklPreferences); // Sets $yakklPreferencesStore as well

        await browser_ext.runtime.setUninstallURL(encodeURI(`https://yakkl.com/cta/bye?userName=${userName}&utm_source=yakkl&utm_medium=extension&utm_campaign=uninstall&utm_content=${VERSION}&utm_term=extension`));

        // const settings = await getSettings();
        if (yakklSettings !== null) {
          yakklSettings.id = yakklProfile.id;
          yakklSettings.registeredType = RegistrationType.PRO;
          yakklSettings.lastAccessDate = yakklSettings.updateDate = yakklProfile.createDate;
          yakklSettings.init = true;
          yakklSettings.isLocked = false;
          await setSettingsStorage(yakklSettings);
        }

        await updateTokenPrices();

        sendNotificationMessage('Welcome to YAKKL!', "Your account is set up. Thank you for choosing YAKKL Smart Wallet. \nStart exploring swaps, low fees, and more. 🚀");

        // No need to show registration option at this time. We may enable it later with other options. There must be at least one valid account
        // showRegistrationOption = true;

        // Call handleCreate directly now to go to the next step
        await handleCreate();
      }
    } catch (e) {
      const er = !yakklMiscStore ? String(e) : String(e).replace(yakklMiscStore, "REDACTED");
      errorValue = `Register: Following error occurred: ${er}`;
      error = true;
      log.error(errorValue);
    }
  }

  const { form, errors, handleChange, handleSubmit } = createForm({
    initialValues: { userName: "", password: "", confirmPassword: "", pincode: "", email: "", accountName: "Primary Portfolio Account"},
    validationSchema: yup.object().shape({
        userName: yup
          .string()
          .lowercase()
          .required('Please enter your username (used in encryption) - min of 6 characters')
          .matches(/^[a-z0-9]{6,}$/, "Must be lowercase and at least 6 characters and not contain '.nfs.id'"),
        password: yup
          .string()
          .required('Please enter your password. It must be at least 8 characters')
          .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, "Must Contain at least 8 Characters, One Uppercase, One Lowercase, One Number and one special case Character"),
        confirmPassword: yup
          .string()
          .oneOf([yup.ref('password'), ''], 'Passwords must match'),
        pincode: yup
          .string()
          .required('Please enter your pin code. It must be 8 numbers')
          .matches(/^[0-9]{8,8}$/, "Must be numeric and 8 numbers"),
        email: yup
          .string()
          .email('Please enter a valid email address. Required for additional security').max(255)
          .required('Please enter your email. Required for additional security'),
        accountName: yup
          .string()
          .trim()
          .matches(/^[A-Za-z0-9#@!*&_.() ]{3,}$/, "Can contain uppercase, lowercase, numeric, and a few special characters, and at least 3 characters"),
    }),
    onSubmit: async data => {
      try {
        let uName = data.userName.toLowerCase().trim().replace('.nfs.id', '')+'.nfs.id';
        await register(uName, data.password, data.pincode, data.accountName.trim(), data.email);
      } catch (e) {
          error = true;
          // let er = (!password || !confirmPassword ? String(e) : String(e).replace(password, "REDACTED").replace(confirmPassword, "REDACTED"));
          errorValue = `Form with following error occurred: ${e}`;
          log.error(errorValue);
      }
    }
  });

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

  function togglePinVisibility() {
    toggleVisability("pincode", "number");
    if (eyeOpen === false) {
      eyeOpenId.removeAttribute('hidden');
      eyeClosedId.setAttribute('hidden', 'hidden');
      eyeOpen = true;
    } else {
      eyeOpenId.setAttribute('hidden', 'hidden');
      eyeClosedId.removeAttribute('hidden');
      eyeOpen = false;
    }
  }

</script>

<svelte:head>
	<title>
		{DEFAULT_TITLE}
	</title>
</svelte:head>

<!-- <ImportPrivateKey bind:show={showImportAccount} onComplete={onCompleteImportPrivateKey} onCancel={onCancelImportPrivateKey} /> -->
<!-- <ImportPhrase bind:show={showImportPhrase} onComplete={onCompleteImportPhrase} onCancel={onCancelImportPhrase}  /> -->
<!-- <EmergencyKitModal bind:show={showEmergencyKit} onComplete={onCompleteEmergenyKit} onCancel={onCancelEmergencyKit} mode='import'/> -->
<!-- <ImportOptionModal bind:show={showImportOption} onCancel={onCancelImportOption} {onImportKey} {onImportPhrase} onRestore={handleRestore}/> -->

<!-- <RegistrationOptionModal bind:show={showRegistrationOption} onClose={onCancelRegistrationOption} onCancel={onCancelRegistrationOption} onCreate={handleCreate} /> -->

<ErrorNoAction bind:show={error} value={errorValue} title="ERROR!"/>
<Warning bind:show={warning} value={warningValue} title="WARNING!" />

<Popover class="text-sm z-50" triggeredBy="#pwd-help" placement="top">
    <h3 class="font-semibold text-gray-900 dark:text-white">Must have at least 8 characters</h3>
    <div class="grid grid-cols-4 gap-2">
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
    </div>
    <p class="py-2">It’s better to have:</p>
    <ul>
        <li class="flex items-center mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mr-2 w-4 h-4 text-green-400 dark:text-green-500"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
  Upper &amp; lower case letters
        </li>
        <li class="flex items-center mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mr-2 w-4 h-4 text-green-400 dark:text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            A symbol (#$&amp;!)
        </li>
        <li class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mr-2 w-4 h-4 text-green-400 dark:text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            A longer password is best (12+ characters)
        </li>
    </ul>
</Popover>

<!-- <Popover class="text-sm z-50" triggeredBy="#imp-help" placement="top">
    <h3 class="font-semibold text-gray-900 dark:text-white">Recover YAKKL®</h3>
    <div class="grid grid-cols-4 gap-2">
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
    </div>
    <p class="py-2">It’s used for recovering YAKKL®:</p>
    <ul>
        <li class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mr-2 w-4 h-4 text-green-400 dark:text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Do this ONLY if you are having to re-install and recover your previous YAKKL® settings. If you do this on a working YAKKL® version then it WILL RESET so becareful in this scenario!
        </li>
    </ul>
</Popover> -->

<Popover class="text-sm z-50" triggeredBy="#nam-help" placement="top">
    <h3 class="font-semibold text-gray-900 dark:text-white">Must have at least 6 lowercase alphanumeric characters</h3>
    <div class="grid grid-cols-4 gap-2">
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
    </div>
    <p class="py-2">It's used for:</p>
    <ul>
        <li class="flex items-center mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mr-2 w-4 h-4 text-green-400 dark:text-green-500"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Encryption
        </li>
        <li class="flex items-center mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mr-2 w-4 h-4 text-gray-300 dark:text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Additional security
        </li>
        <li class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mr-2 w-4 h-4 text-gray-300 dark:text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Enhanced options
        </li>
    </ul>
</Popover>

<Popover class="text-sm z-50" triggeredBy="#pin-help" placement="top">
  <h3 class="font-semibold text-gray-900 dark:text-white">Must be 8 digits.</h3>
  <div class="grid grid-cols-4 gap-2">
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
      <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
  </div>
  <p class="py-2">It's used for:</p>
  <ul>
      <li class="flex items-center mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mr-2 w-4 h-4 text-green-400 dark:text-green-500"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          Additional security prompt when verification is required
      </li>
  </ul>
</Popover>

<Popover class="text-sm z-50" triggeredBy="#act-help" placement="top">
    <h3 class="font-semibold text-gray-900 dark:text-white">Must be alphanumeric. Some special characters are allowed.</h3>
    <div class="grid grid-cols-4 gap-2">
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
    </div>
    <p class="py-2">It's used for:</p>
    <ul>
        <li class="flex items-center mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mr-2 w-4 h-4 text-green-400 dark:text-green-500"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Naming your Primary Portfolio Crypto Account (spaces are allowed)
        </li>
    </ul>
</Popover>

<Popover class="text-sm z-50" triggeredBy="#email-help" placement="top">
    <h3 class="font-semibold text-gray-900 dark:text-white">Email</h3>
    <div class="grid grid-cols-4 gap-2">
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
        <div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
    </div>
    <p class="py-2">It's used for:</p>
    <ul>
        <li class="flex items-center mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mr-2 w-4 h-4 text-green-400 dark:text-green-500"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Additional security. We may send you an email to confirm your account.
        </li>
    </ul>
</Popover>

<div class="relative m-2 h-[95%] bg-base-100 text-base-content rounded-xl">
  <main class="mt-1 mx-auto w-full text-center p-4">
    <h1 class="text-xl tracking-tight font-extrabold">
      <span class="3xl:inline">WELCOME</span>
      <br>
      <span class="lg:inline">{DEFAULT_TITLE}</span>
      <!-- <span class="block text-primary-600 xl:inline">Cross-Chain</span> -->
    </h1>
    <p class="mt-1 mx-auto text-base">
      A smart wallet that works as you would expect
    </p>
    <p class="mx-auto text-base">
      Intuitive, Secure, Fast, and Powerful
    </p>
    <hr class="my-2">
    <div class="w-full">
      {#if init}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <div role="button" onclick={() => {goto(PATH_LOGIN)}} class="font-bold text-md uppercase my-5">
        NOTE: It appears you have already registered! Click here to go to login instead. If you continue with registering below then it will RESET your account to empty and start over (BE CAREFUL)!
      </div>
      {/if}
      <span class="mb-2 text-md uppercase font-bold text-center">[Registration data is used for securing your authenticity! Never leaves YAKKL, fully encrypted, and is Required.]</span>
      <form class="w-full" onsubmit={handleSubmit}>
        <div class="my-1">
          <div class="flex flex-row mt-2">
            <div class="form-control w-full">
              <label class="input-group">
                <input id="userName"
                  type="text"
                  class="input input-bordered input-primary w-full"
                  placeholder="Username" autocomplete="off" bind:value="{$form.userName}" onchange={handleChange} required />
                <span class="label-text">.nfs.id</span>
              </label>
            </div>
            <svg id="nam-help" tabindex="-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-6 h-6 ml-1 mt-4 fill-gray-300">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
            </svg>
          </div>
          {#if $errors.userName}
          <small class="text-red-600 font-bold animate-pulse">{$errors.userName}</small>
          {/if}
          <div class="flex flex-row mt-2">
            <div class="form-control w-full">
              <input id="password" type="password"
                class="input input-bordered input-primary w-full mt-2"
                placeholder="Password"
                autocomplete="off"
                bind:value="{$form.password}"
                onchange={handleChange}
                required />
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <svg id="pweye-closed" onclick={togglePasswordVisability} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-1 fill-gray-200 absolute right-11 z-10 mt-5 cursor-pointer">
                <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
                <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
                <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
              </svg>
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <svg id="pweye-open" onclick={togglePasswordVisability} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-1 fill-gray-200 absolute right-11 z-10 mt-5 cursor-pointer">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clip-rule="evenodd" />
              </svg>
            </div>
            <svg id="pwd-help" tabindex="-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-6 h-6 ml-1 mt-4 fill-gray-300">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
            </svg>
          </div>
          {#if $errors.password}
          <small class="text-red-600 font-bold animate-pulse">{$errors.password}</small>
          {/if}
          <div class="w-[93%] bg-gray-200 rounded-full my-1 mt-1">
            {#if strength < 3}
            <div class="bg-red-600 h-1.75 mt-1 text-2xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-l-full" style="width: 33%">
              Weak
            </div>
            {/if}
            {#if strength === 3}
            <div class="bg-yellow-400 h-1.75 mt-1 text-2xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-l-full" style="width: 66%">
              Average
            </div>
            {/if}
            {#if strength > 3}
            <div class="bg-green-500 h-1.75 mt-1 text-2xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style="width: 100%">
              Strong
            </div>
            {/if}
          </div>
          <div class="w-full text-center mt-1">
            <span class="text-sm font-bold">Weak password or anything less than 8 characters will not be allowed!</span>
          </div>
          <div class="mt-2">
            <div class="flex flex-row">
              <div class="form-control w-full">
                <input
                  id="confirmPassword"
                  type="password"
                  class="input input-bordered input-primary w-full mt-2"
                  placeholder="Confirm Password"
                  autocomplete="off"
                  bind:value="{$form.confirmPassword}"
                  onchange={handleChange}
                  required
                />
              </div>
              <svg id="con-help" tabindex="-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-6 h-6 relative ml-1 mt-2 fill-gray-200">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
              </svg>
            </div>
            {#if $errors.confirmPassword}
            <small class="text-red-600 font-bold animate-pulse">{$errors.confirmPassword}</small>
            {/if}
          </div>
          <div class="flex flex-row mt-2">
            <div class="form-control w-full flex flex-row">
              <input
                id="pincode"
                type="password"
                inputmode="numeric"
                minlength="8"
                maxlength="8"
                class="input input-bordered input-primary w-full mt-2 flex flex-row"
                placeholder="8 Digit Pin Code"
                autocomplete="off"
                bind:value="{$form.pincode}"
                onchange={handleChange}
                required
              />
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <svg id="eye-closed" onclick={togglePinVisibility} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-1 fill-gray-200 absolute right-11 z-10 mt-5 cursor-pointer">
                <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
                <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
                <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
              </svg>
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <svg id="eye-open" onclick={togglePinVisibility} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-1 fill-gray-200 absolute right-11 z-10 mt-5 cursor-pointer">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clip-rule="evenodd" />
              </svg>
            </div>
            <svg id="pin-help" tabindex="-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-6 h-6 relative ml-1 mt-4 fill-gray-200">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
            </svg>
          </div>
          {#if $errors.pincode}
          <small class="text-red-600 font-bold animate-pulse">{$errors.pincode}</small>
          {/if}
          <div class="flex flex-row mt-2">
            <div class="form-control w-full flex flex-row">
              <input
                id="email"
                type="email"
                class="input input-bordered input-primary w-full mt-2 flex flex-row"
                placeholder="Required Email"
                autocomplete="on"
                bind:value="{$form.email}"
                onchange={handleChange}
                required
              />
            </div>
            <svg id="email-help" tabindex="-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-6 h-6 relative ml-1 mt-4 fill-gray-200">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
            </svg>
          </div>
          {#if $errors.email}
          <small class="text-red-600 font-bold animate-pulse">{$errors.email}</small>
          {/if}
          <div class="flex flex-row mt-2">
            <div class="form-control w-full">
              <input
                id="accountName"
                class="input input-bordered input-primary w-full mt-2"
                placeholder="Main Account Name"
                autocomplete="off"
                bind:value="{$form.accountName}"
                onchange={handleChange}
              />
            </div>
            <svg id="act-help" tabindex="-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-6 h-6 relative ml-1 mt-4 fill-gray-200">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
            </svg>
          </div>
          {#if $errors.accountName}
          <small class="text-red-600 font-bold animate-pulse">{$errors.accountName}</small>
          {/if}
        </div>

          <div class="mt-2 inline-block text-center">
            <button
              type="submit"
              class="btn btn-primary w-64 rounded-full mt-2">
              <div class="inline-flex items-center align-middle">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                <span>Register</span>
              </div>
            </button>
          </div>
        </form>
      </div>
    <!-- <div class="divider lg:divider-vertical">Upgrade AFTER registration is complete!</div> -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- <div class="flex flex-row justify-center items-center">
      <div role="button" on:click="{handleGOTO}" class="font-extrabold underline uppercase">
        Click to import wallet (with secret phrase)
      </div>
      <svg id="imp-help" tabindex="-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="flex flex-row w-6 h-6 ml-1 fill-gray-300">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
      </svg>
    </div> -->

    <!-- <div id="upgrade" class="w-full mt-8">
      <div class="card bg-base-100 shadow-xl image-full">
        <figure><img class="h-auto" src="/images/logoBullFav128x128.png" alt="upgrade" /></figure>
        <div class="card-body p-1">
          <h2 class="card-title self-center">PRO</h2>
          <p>This is the beta program for our Pro version. This means you are receiving all Pro features for FREE! We are adding new features and making small cosmetic changes and we would love to have your feedback. To add feedback or create a ticket for a found issue, cloud the BETA button on the Header bar once logged in. We also need your suggestions!
          </p>
        </div>
      </div>
    </div> -->

  </main>
</div>

<!-- <h2 class="card-title">UPGRADE TO PRO!</h2>
<p>Upgrade to the Pro version! Do it today to unlock advanced features. Click the UPGRADE button after you login. This will enable a number of features including our unique Emergency Kit, AI Chat, and enhanced security.</p> -->

