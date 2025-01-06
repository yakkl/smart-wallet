<script lang="ts">

  // NOTE: This is for the RegistrationOption component. The RegistrationOptionModal is only for the RegistrationOption component. Restore requires a valid account to be created first. So, removed restore from here for now.

  interface Props {
    /// <reference types="svelte" />
    title?: string;
    onCreate: () => void;
    // onImport: () => void;  // NOTE: import and restore will not work if there is no account created first. Need to either create a tmp account and restore or move this to another component.
    // onRestore: () => void;
  }

  let {
    title = 'Registration Options',
    onCreate,
    // onImport,
    // onRestore
  }: Props = $props();
</script>

<div class="bg-surface-light dark:bg-surface-dark rounded-lg p-6 shadow-md">
  <h1 class="text-2xl font-bold text-center text-primary-light dark:text-primary-dark mb-4">{title}</h1>

  <div class="space-y-4 mb-6">
    <p class="text-secondary-light dark:text-secondary-dark text-center">Choose an option to get started with your wallet:</p>
    <ul class="list-disc list-inside text-secondary-light dark:text-secondary-dark space-y-2">
      <li>Create a new account if this is your first time</li>
      <!-- <li>Import an existing account if you have one</li> -->
      <li>Restore from a YAKKL Emergency Kit if you're recovering your wallet (AFTER creating the initial account!) </li>
    </ul>
  </div>

  <div class="space-y-3">
    <!-- Create New Account Button -->
    <button
      onclick={onCreate}
      class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200 ease-in-out"
    >
      Create New Account
    </button>

    <div class="my-4 border-t border-neutral-dark dark:border-neutral-light"></div>

    <!-- Import Existing Account Button -->
    <!-- <button
      onclick={onImport}
      class="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition duration-200 ease-in-out"
    >
      Import Existing Account(s)
    </button> -->

    <!-- Restore from Emergency Kit Button -->
    <!-- <button
      onclick={onRestore}
      class="w-full py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition duration-200 ease-in-out"
    >
      Restore from Emergency Kit
    </button> -->
  </div>
</div>
