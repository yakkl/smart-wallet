<script lang="ts">
  import { onMount } from "svelte";
  import { getProfile, yakklMiscStore } from "$lib/common/stores";
  import { decryptData, digestMessage, isEncryptedData, isProfileData } from '$lib/common';
  import type { EncryptedData, ProfileData, Profile } from '$lib/common';
  import Modal from './Modal.svelte';

  export let show = false;
  export let className = "z-[999]";
  export let onVerify: (pincode: string) => void = () => {};

  let pincode = "";
  let eyeOpen = false;

  onMount(() => {
    pincode = "";
    show = false;
  });

  async function handleVerify() {
    try {
      if (pincode.length < 8) {
        alert("Please enter a valid pincode");
        return;
      }

      const profile: Profile | null = await getProfile() as Profile;

      if (!profile) {
        throw 'No profile found';
      }

      if (isEncryptedData(profile.data as ProfileData)) {
        await decryptData(profile.data as unknown as EncryptedData, $yakklMiscStore).then(result => {
          if (profile) {
            profile.data = result as ProfileData;
          }
        });
      }

      const digestedPincode = await digestMessage(pincode);
      if (isProfileData(profile.data as ProfileData) && (profile.data as ProfileData).pincode === digestedPincode) {
        onVerify(digestedPincode); // Send the digested pincode and not the actual pincode
      } else {
        alert("Invalid pincode");
      }

      pincode = "";
      show = false;
    } catch (e) {
      console.log(e);
    } finally {
      show = false;
    }
  }

  function closeModal() {
    pincode = "";
    show = false;
  }

  function resetForm() {
    pincode = "";
  }

  function togglePinVisibility() {
    eyeOpen = !eyeOpen;
    toggleVisibility("pincode", "number");
  }

  function toggleVisibility(id="pincode", type="text") {
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

</script>

<div class="relative {className}">
  <Modal bind:show={show} title="Pincode Authorization" on:close={closeModal}>
    <div class="p-6 text-primary-light dark:text-primary-dark">
      <p class="mb-4 text-secondary-light dark:text-secondary-dark">Please verify your pincode to move forward. Thank you.</p>
      <div class="relative">
        <!-- Numeric with password type will still show dots even if not allowed when type is text but it will not show -->
        <input
          id="pincode"
          type="password"
          inputmode="numeric"
          minlength="8"
          maxlength="8"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-700 bg-gray-50"
          placeholder="Enter 8 Digit Pin Code"
          autocomplete="off"
          bind:value={pincode}
          required
        />
        <button type="button" class="absolute top-1/2 right-3 transform -translate-y-1/2 focus:outline-none" on:click={togglePinVisibility}>
          {#if eyeOpen}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-gray-500">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clip-rule="evenodd" />
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-gray-500">
              <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
              <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
              <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
            </svg>
          {/if}
        </button>
      </div>
      <div class="mt-6 flex justify-end space-x-4">
        <button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" on:click={closeModal}>Cancel</button>
        <button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" on:click={resetForm}>Reset</button>
        <button type="button" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" on:click={handleVerify}>Verify</button>
      </div>
    </div>
  </Modal>
</div>
