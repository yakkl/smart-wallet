<script lang="ts">
  // import { browser as browserSvelte } from "$app/environment";
	import { onMount } from "svelte";
  // import { Pincode, PincodeInput } from "svelte-pincode";
  import { getProfile, yakklMiscStore } from "$lib/common/stores";
  import { decryptData, digestMessage, isEncryptedData, isProfileData } from '$lib/common';
	import type { EncryptedData, ProfileData, Profile } from '$lib/common';

  export let show = false;
  export let value = "";
  export let verified = false;
  export let callback = () => {};

  // let pin;
  let valueCode="";
  // let code = [];

  let eyeOpen = false;
  let eyeOpenId: HTMLElement;
  let eyeClosedId: HTMLElement;

  onMount(() => {
    try {
      // pin.focusFirstInput();
      value = "";
      valueCode = "";
      // code = [];
      show = false;

      eyeOpenId = document.getElementById("eye-open") as HTMLElement; 
      eyeClosedId = document.getElementById("eye-closed") as HTMLElement;
      // eyeOpenId.setAttribute('tabindex', '-1');
      // eyeClosedId.setAttribute('tabindex', '-1');
      eyeOpenId.setAttribute('hidden', 'hidden');

    } catch (e) {
      console.log(e);
    }
  });

  async function handleVerify(_e: any) {
    try {
      verified = false;

      if (valueCode.length < 8) {
        alert("Please enter a valid pincode"); // Fallback
        return;
      }

      let profile: Profile | null = await getProfile() as Profile;

      if (!profile) {
        throw 'No profile found';
      }

      if (isEncryptedData(profile.data as ProfileData)) {
        await decryptData(profile.data as unknown as EncryptedData, $yakklMiscStore).then(result=> {
          if (profile) {
            profile.data = result as ProfileData;
          }
        });
      }

      valueCode = await digestMessage(valueCode);
      if (isProfileData(profile.data as ProfileData) && (profile.data as ProfileData).pincode === valueCode) {
        verified = true;
      }

      profile = null; // Clear memory
      value = valueCode;
      valueCode = "";
      // code = [];
    } catch (e) {
      console.log(e);
    } finally {
      callback();
      show = false;
    }
  }


  function handleCancel(_e: any) {
    try {
      value = valueCode = "";
      callback();
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

</script>

<div class="modal" class:modal-open={show}>
  <div class="modal-box relative px-2">
    <h3 class="text-lg font-bold">Pincode Authorization</h3>
    <p class="py-3">Please verify your pincode to move forward. Thank you.</p>
    <!-- <div class="justify-center">
      <Pincode type="numeric" bind:this={pin} bind:value={valueCode} code={code} style="border: none;" on:complete={handleComplete}>
        <PincodeInput />
        <PincodeInput />
        <PincodeInput />
        <PincodeInput />
        <PincodeInput />
        <PincodeInput />
        <PincodeInput />
        <PincodeInput />
      </Pincode>
    </div> -->
    <div class="flex flex-row mt-2">
      <div class="w-[345px] flex flex-row">
        <input
          id="pincodeOriginal"
          type="password"
          inputmode="numeric"
          minlength="8"
          maxlength="8"
          class="input input-bordered input-primary w-full mt-2 flex flex-row"
          placeholder="Enter 8 Digit Pin Code"
          autocomplete="off"
          bind:value="{valueCode}"
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

    <!-- Have an optional terms check box here with a popup reading of the terms and conditions - LATER -->
    <div class="modal-action">
      <!-- code=[]; -->
      <button class="btn" on:click={handleCancel}>Cancel</button>
      <button id="verify" class="btn" on:click={handleVerify} >Verify</button>
    </div>
  </div>
</div>

<style>
  
  /** Pincode - Also, style to turn off spinner for numberic fields is in app.html **/
  :global([data-pincode]) {
    display: inline-flex;
    margin-left: .5rem;
    border: none;
}

/** PincodeInput */
:global([data-pincode] input) {
  width: 2.5rem;
  padding: 0.5rem 0.5rem;
  margin-left: .25rem;
  border: none;
  border-radius: .2rem;
  text-align: center;
  color: #000;
}

:global([data-pincode] input:focus) {
  z-index: 1;
}

:global([data-pincode] input:not(:last-of-type)) {
  border-right: 1px solid #e0e0e0;
}

</style>
