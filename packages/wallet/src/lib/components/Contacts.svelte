<script context="module" lang="ts">
	import type { YakklContact } from '$lib/common';
  import { getYakklContactsStore, setContactStore } from "$lib/common/stores";
  import { Modal } from "flowbite-svelte";

  export let showContacts = false;
  export let contacts: YakklContact[] = [];
  // export let hContact; // TODO: Handle the contact once selected

  export async function handleContacts(show=true) {
    contacts = [];
    contacts = getYakklContactsStore();
    showContacts = show;
  }

  function handleContact(contact: YakklContact | null) {
    if (contact) {
      setContactStore(contact);
    } //else {
    //   setContactStore();
    // }
    showContacts = false;
  }

</script>
<!-- padding="xs" flowbite no longer there-->
<Modal title="Contact List" bind:open={showContacts} size="xs" >
  <p class="text-sm font-normal text-base-content">Select the contact you wish to send/transfer to</p>
  {#if contacts}
  <ul class="my-4 space-y-3">
    {#each contacts as contact}
      <li class="my-2">
      <!-- svelte-ignore a11y-missing-attribute -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-interactive-supports-focus -->
      <a id="d1" role="button" on:click|preventDefault={() => handleContact(contact)} class="flex items-center p-2 text-base text-base-content bg-gray-100 rounded-lg hover:bg-gray-200 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="w-6 h-6" fill="none" viewBox="-161.97 -439.65 1403.74 2637.9">
          <path fill="#8A92B2" d="M539.7 650.3V0L0 895.6z"/>
          <path fill="#62688F" d="M539.7 1214.7V650.3L0 895.6zm0-564.4l539.8 245.3L539.7 0z"/>
          <path fill="#454A75" d="M539.7 650.3v564.4l539.8-319.1z"/>
          <path fill="#8A92B2" d="M539.7 1316.9L0 998l539.7 760.6z"/>
          <path fill="#62688F" d="M1079.8 998l-540.1 318.9v441.7z"/>
        </svg>
        <div class="flex flex-1 flex-col ml-2">
         <span class="text-sm font-bold">{contact.name}</span>
         <span class="text-xs font-mono">{contact.address}</span>
         <span class="text-xs font-mono">{contact.alias}</span>
         <span class="text-xs font-mono">{contact.note}</span>
        </div>
      </a>
    </li>
    {/each}
  </ul>
  {:else}
  <div class="text-center text-md text-base-content">
    There are currently no contacts! You can add contacts in the 'Accounts' area.
  </div>
  {/if}
  <svelte:fragment slot='footer'>
    <p class="text-sm font-normal text-base-content">Always <span class="border-b-2 underline underline-offset-8">verify</span> the address before transferring!</p>
  </svelte:fragment>
</Modal>

