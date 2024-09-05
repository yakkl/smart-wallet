<script lang="ts">
  import { AccountTypeCategory } from '$lib/common/types'
  import type { YakklAccount } from '$lib/common/interfaces';

  export let accounts: YakklAccount[] = [];
  export let onAccountSelect: (account: YakklAccount) => void = () => {};
</script>

<ul>
  {#each accounts as item}
    <li class="mb-4">
      <button class="w-full flex items-start rounded-lg p-4 transition-colors duration-200 {item.accountType === AccountTypeCategory.PRIMARY ? 'bg-purple-100 hover:bg-purple-200' : item.accountType === AccountTypeCategory.SUB ? 'bg-blue-100 hover:bg-blue-200' : 'bg-green-100 hover:bg-green-200'}" on:click={() => onAccountSelect(item)}>
        <div class="w-8 h-8 flex items-center justify-center rounded-full {item.accountType === AccountTypeCategory.PRIMARY ? 'bg-purple-500' : item.accountType === AccountTypeCategory.SUB ? 'bg-blue-500' : 'bg-green-500'} text-white mr-4 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-bold">{item.accountType === AccountTypeCategory.PRIMARY ? 'PORTFOLIO' : item.accountType === AccountTypeCategory.SUB ? 'SUB-PORTFOLIO' : 'IMPORTED'}</h3>
            {#if item.accountType === AccountTypeCategory.SUB}
              <span class="text-sm text-gray-500 ml-2">Derived from Portfolio</span>
            {/if}
          </div>
          <p class="text-sm font-medium text-gray-600">{item.name}</p>
          <p class="text-xs text-gray-500 mt-2">{item.address}</p>
        </div>
      </button>
    </li>
  {/each}
</ul>
