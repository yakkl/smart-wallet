<script lang="ts">
  /// <reference types="svelte" />

  export let title: string = 'Registration Options';
  export let onCreate: () => void;
  export let onImport: () => void;
  export let onRestore: () => void;
</script>

<div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 shadow-md">
  <h1 class="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mb-4">{title}</h1>
  
  <div class="space-y-4 mb-6">
    <p class="text-gray-700 dark:text-gray-200 text-center">Choose an option to get started with your wallet:</p>
    <ul class="list-disc list-inside text-gray-700 dark:text-gray-200 space-y-2">
      <li>Create a new account if this is your first time</li>
      <li>Import an existing account if you have one</li>
      <li>Restore from a YAKKL Emergency Kit if you're recovering your wallet</li>
    </ul>
  </div>
  
  <div class="space-y-3">
    <button 
      on:click={onCreate}
      class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-200 ease-in-out"
    >
      Create New Account (default)
    </button>
    
    <div class="my-4 border-t border-gray-300"></div>
    
    <button 
      on:click={onImport}
      class="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition duration-200 ease-in-out"
    >
      Import Existing Account(s)
    </button>
    <button 
      on:click={onRestore}
      class="w-full py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition duration-200 ease-in-out"
    >
      Restore from Emergency Kit
    </button>
  </div>
</div>
