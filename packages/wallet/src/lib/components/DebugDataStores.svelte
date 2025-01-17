<script lang="ts">
  import { get } from 'svelte/store';
  import { yakklTokenDataStore, yakklTokenDataCustomStore, yakklCombinedTokenStore } from '$lib/common/stores';

  // Define the store map
  const stores = {
    yakklTokenDataStore,
    yakklTokenDataCustomStore,
    yakklCombinedTokenStore
  };
</script>

<div class="space-y-4">
  <h2 class="text-lg font-bold text-gray-700 dark:text-gray-300">Debug Data Stores</h2>

  <div class="overflow-auto border rounded-lg shadow-md w-[1500px]">
    <table class="table-auto w-full text-left text-sm text-gray-600 dark:text-gray-300">
      <thead class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
        <tr>
          <th class="px-4 py-2 border-b font-semibold">Store Name</th>
          <th class="px-4 py-2 border-b font-semibold">Content</th>
        </tr>
      </thead>
      <tbody>
        {#each Object.entries(stores) as [storeName, store]}
          <tr class="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-700 dark:even:bg-gray-800">
            <td class="px-4 py-2 border-b">{storeName}</td>
            <td class="px-4 py-2 border-b">
              <pre class="whitespace-pre-wrap break-all">{JSON.stringify(get(store), null, 2)}</pre>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
