<script lang="ts">
	import { onMount } from "svelte";
  import { getProfile, setProfileStorage, yakklMiscStore, profileStore, yakklCurrentlySelectedStore, setYakklCurrentlySelectedStorage, getYakklCurrentlySelected } from '$lib/common/stores';
  import { encryptData, decryptData, digestMessage } from '$lib/common/encryption';
  import { deepCopy } from '$lib/utilities/utilities';
	import { isEncryptedData, isProfileData, type CurrentlySelectedData, type EncryptedData, type Profile, type ProfileData, type YakklCurrentlySelected } from '$lib/common';

  export let show = false;

  let pincodeOriginal = "";
  let pincodeNew = "";

  let eyeOpen = false;
  let eyeOpenId: HTMLElement;
  let eyeClosedId: HTMLElement;

  let eyeOpenNew = false;
  let eyeOpenIdNew: HTMLElement;
  let eyeClosedIdNew: HTMLElement;

  let currentlySelected: YakklCurrentlySelected;

  onMount(async () => {
    try {
      currentlySelected = await getYakklCurrentlySelected();

      eyeOpenId = document.getElementById("eye-open") as HTMLElement; 
      eyeClosedId = document.getElementById("eye-closed") as HTMLElement;
      eyeOpenId.setAttribute('tabindex', '-1');
      eyeClosedId.setAttribute('tabindex', '-1');
      eyeOpenId.setAttribute('hidden', 'hidden');

      eyeOpenIdNew = document.getElementById("eye-openNew") as HTMLElement; 
      eyeClosedIdNew = document.getElementById("eye-closedNew") as HTMLElement;
      eyeOpenIdNew.setAttribute('tabindex', '-1');
      eyeClosedIdNew.setAttribute('tabindex', '-1');
      eyeOpenIdNew.setAttribute('hidden', 'hidden');

      pincodeOriginal = "";
      pincodeNew = "";
    } catch (e) {
      console.log(e);
    }
  });

  async function handleChange(_e: any) {
    try {
      if (pincodeOriginal.length < 8 || pincodeNew.length < 8) {
        alert("Please enter a valid pincode. 8 numbers. Don't enter the same number in all 8 digits."); // Fallback
        return;
      }

      if (pincodeOriginal === pincodeNew) {
        alert("Please enter your a different pincode to update."); // Fallback
        return;
      }

      let profile: Profile | null = await getProfile();
      if (!profile) {
        throw 'No profile found';
      }
      
      if (isEncryptedData(profile.data)) {
        //@ts-ignore
        await decryptData(profile.data, $yakklMiscStore).then(result=> {
          profile.data = result as ProfileData;
        });
      }

      if (isProfileData(profile.data)) {
        profile.data.pincode = await digestMessage(pincodeNew);
        //@ts-ignore
        await encryptData(profile.data, $yakklMiscStore).then(result => {
          profile.data = result;
        });
      }

      (currentlySelected.data as CurrentlySelectedData).profile = await deepCopy(profile);

      await setYakklCurrentlySelectedStorage(currentlySelected);

      $profileStore = await deepCopy(profile);
      setProfileStorage(profile);

      pincodeOriginal = "";
      pincodeNew = "";
      
      show = false;
    } catch (e) {
      console.log(e); 
    }
  }
  
  function toggleVisability(id="password", type="text") {
    try {
      let x = document.getElementById(id) as HTMLInputElement;
      if (x.type === "password") {
          x.type = type;
      } else {
          x.type = "password";
      }
    } catch (e) {
      console.log(e);
    }
  }

  function togglePinVisibility(_e: any) {
    try {
      toggleVisability("pincodeOriginal", "number");
      if (eyeOpen === false) {
        eyeOpenId.removeAttribute('hidden');
        eyeClosedId.setAttribute('hidden', 'hidden');
        eyeOpen = true;
      } else {
        eyeOpenId.setAttribute('hidden', 'hidden');
        eyeClosedId.removeAttribute('hidden');
        eyeOpen = false;
      }
    } catch (e) {
      console.log(e);
    }
  }

  function togglePinVisibilityNew(_e: any) {
    try {
      toggleVisability("pincodeNew", "number");
      if (eyeOpenNew === false) {
        eyeOpenIdNew.removeAttribute('hidden');
        eyeClosedIdNew.setAttribute('hidden', 'hidden');
        eyeOpenNew = true;
      } else {
        eyeOpenIdNew.setAttribute('hidden', 'hidden');
        eyeClosedIdNew.removeAttribute('hidden');
        eyeOpenNew = false;
      }
    } catch (e) {
      console.log(e);
    }
  }

</script>

<div class="modal" class:modal-open={show}>
  <div class="modal-box relative px-2">
    <div class="justify-center">
      <h3 class="text-lg font-bold">Pincode Change</h3>
      <p class="py-3">Please verify your current pincode and then enter your new pincode. Thank you.</p>

      <div class="flex flex-row mt-2">
        <div class="w-[345px] flex flex-row">
          <input
            id="pincodeOriginal"
            type="password"
            inputmode="numeric"
            minlength="8"
            maxlength="8"
            class="input input-bordered input-primary w-full mt-2 flex flex-row"
            placeholder="CURRENT - 8 Digit Pin Code"
            autocomplete="off"
            bind:value="{pincodeOriginal}"
            required
          />
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <svg id="eye-closed" on:click={togglePinVisibility} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-1 fill-gray-200 absolute right-11 z-10 mt-5 cursor-pointer">
            <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
            <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
            <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
          </svg>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <svg id="eye-open" on:click={togglePinVisibility} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-1 fill-gray-200 absolute right-11 z-10 mt-5 cursor-pointer">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>

      <div class="flex flex-row mt-3">
        <div class="w-[345px] flex flex-row">
          <input
            id="pincodeNew"
            type="password"
            inputmode="numeric"
            minlength="8"
            maxlength="8"
            class="input input-bordered input-primary w-full mt-2 flex flex-row"
            placeholder="NEW - 8 Digit Pin Code"
            autocomplete="off"
            bind:value="{pincodeNew}"
            required
          />
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <svg id="eye-closedNew" on:click={togglePinVisibilityNew} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-1 fill-gray-200 absolute right-11 z-10 mt-5 cursor-pointer">
            <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
            <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
            <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
          </svg>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <svg id="eye-openNew" on:click={togglePinVisibilityNew} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 ml-1 fill-gray-200 absolute right-11 z-10 mt-5 cursor-pointer">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
      <div class="modal-action">
        <button class="btn" on:click={() => {show=false}}>Cancel</button>
        <button id="change" class="btn" on:click={handleChange}>Change</button>
      </div>   
    </div> 
  </div>
</div>

