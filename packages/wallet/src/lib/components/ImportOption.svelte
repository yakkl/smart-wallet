<script lang="ts">


  interface Props {
    /// <reference types="svelte" />
    showImportWatch?: boolean;
    title?: string;
    onImportKey: () => void;
    onImportPhrase: () => void;
    onImportWatch: () => void;
    onRestore: () => void;
  }

  let {
    showImportWatch = false,
    title = 'Importing/Restoring Options',
    onImportKey,
    onImportPhrase,
    onImportWatch,
    onRestore
  }: Props = $props();
</script>

<div class="bg-surface-light dark:bg-surface-dark text-primary-light dark:text-primary-dark rounded-lg p-6 shadow-md">
  <h1 class="text-2xl font-bold text-center text-primary-light dark:text-primary-dark mb-4">{title}</h1>

  <div class="space-y-4 mb-6">
    <p class="text-secondary-light dark:text-secondary-dark text-center">Choose an option to import or restore your wallet:</p>
    <ul class="list-disc list-inside text-secondary-light dark:text-secondary-dark space-y-2">
      <li>Import a single account using a private key</li>
      <li>Import a single account using a secret phrase (12-24 words)</li>
      {#if showImportWatch}
        <li>Import a single watch-only address</li>
      {/if}
      <li>Restore everything from a YAKKL Emergency Kit (recover your whole wallet)</li>
    </ul>
  </div>

  <div class="space-y-3">
    <!-- Import using Private Key -->
    <button
      onclick={onImportKey}
      class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200 ease-in-out"
    >
      Import using Private Key
    </button>

    <!-- Import Watch-Only Address (if applicable) -->
    {#if showImportWatch}
      <button
        onclick={onImportWatch}
        class="w-full py-2 px-4 bg-amber-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200 ease-in-out"
      >
        Import Watch-Only Address
      </button>
    {/if}

    <!-- Import using Secret Phrase -->
    <button
      onclick={onImportPhrase}
      class="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition duration-200 ease-in-out"
    >
      Import using Secret Phrase
    </button>

    <!-- Restore from Emergency Kit -->
    <button
      onclick={onRestore}
      class="w-full py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition duration-200 ease-in-out"
    >
      Restore all from Emergency Kit
    </button>
  </div>
</div>
