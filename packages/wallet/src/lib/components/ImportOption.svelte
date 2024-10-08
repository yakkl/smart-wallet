<script lang="ts">
  /// <reference types="svelte" />

  export let showImportWatch: boolean = false;
  export let title: string = 'Importing/Restoring Options';
  export let onImportKey: () => void;
  export let onImportPhrase: () => void;
  export let onImportWatch: () => void;
  export let onRestore: () => void;
</script>

<div class="bg-surface-light dark:bg-surface-dark text-primary-light dark:text-primary-dark rounded-lg p-6 shadow-md">
  <h1 class="text-2xl font-bold text-center text-primary-light dark:text-primary-dark mb-4">{title}</h1>
  
  <div class="space-y-4 mb-6">
    <p class="text-secondary-light dark:text-secondary-dark text-center">Choose an option to import or restore your wallet:</p>
    <ul class="list-disc list-inside text-secondary-light dark:text-secondary-dark space-y-2">
      <li>Import an account using a private key</li>
      <li>Import an account using a secret phrase (12-24 words)</li>
      {#if showImportWatch}
        <li>Import a watch-only address</li>
      {/if}
      <li>Restore from a YAKKL Emergency Kit if you're recovering your wallet</li>
    </ul>
  </div>
  
  <div class="space-y-3">
    <!-- Import using Private Key -->
    <button 
      on:click={onImportKey}
      class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200 ease-in-out"
    >
      Import using Private Key
    </button>
    
    <!-- Import Watch-Only Address (if applicable) -->
    {#if showImportWatch}
      <button 
        on:click={onImportWatch}
        class="w-full py-2 px-4 bg-amber-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200 ease-in-out"
      >
        Import Watch-Only Address
      </button>
    {/if}
        
    <!-- Import using Secret Phrase -->
    <button 
      on:click={onImportPhrase}
      class="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition duration-200 ease-in-out"
    >
      Import using Secret Phrase
    </button>
    
    <!-- Restore from Emergency Kit -->
    <button 
      on:click={onRestore}
      class="w-full py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition duration-200 ease-in-out"
    >
      Restore from Emergency Kit
    </button>
  </div>
</div>
