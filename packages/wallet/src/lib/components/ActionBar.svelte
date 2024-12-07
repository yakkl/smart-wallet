<script lang="ts">
  import { goto } from '$app/navigation';
  import { PATH_CRYPTO, PATH_ETHEREUM_TRANSACTIONS_SEND, PATH_ETHEREUM_TRANSACTIONS_STAKE, PATH_ETHEREUM_TRANSACTIONS_SWAP } from '$lib/common/constants';

  interface Props {
    id?: string;
  }

  let { id = "actionbar" }: Props = $props();

</script>

<nav
  id="{id}"
  class="print:hidden visible relative inset-x-0 top-0 navbar navbar-expand-sm py-0 flex items-center w-full justify-center">

  <!-- Imcrease grid-col size when deposit is enabled -->
  <div class="grid grid-cols-4 gap-10 my-0.5 mx-2 items-center justify-center"> 
    <!-- Send -->
    <div class="rounded-full shadow-lg h-[60px]">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <div role="button" onclick={() => goto(PATH_ETHEREUM_TRANSACTIONS_SEND)}
        class="w-[60px] h-[60px] flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="absolute w-4 h-4 -mt-5 font-bold">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
        <span class="text-sm mt-3 font-bold">Send</span>
      </div>
    </div>

    <!-- Receive -->
    <div class="rounded-full shadow-lg h-[60px]">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <div role="button" onclick={() => goto(PATH_CRYPTO)}
        class="w-[60px] h-[60px] flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="absolute w-4 h-4 -mt-5 font-bold">
          <!-- <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" /> -->
          <path fill-rule="evenodd" d="M3 4.875C3 3.839 3.84 3 4.875 3h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 9.375v-4.5zM4.875 4.5a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm7.875.375c0-1.036.84-1.875 1.875-1.875h4.5C20.16 3 21 3.84 21 4.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5a1.875 1.875 0 01-1.875-1.875v-4.5zm1.875-.375a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zM6 6.75A.75.75 0 016.75 6h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75A.75.75 0 016 7.5v-.75zm9.75 0A.75.75 0 0116.5 6h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zM3 14.625c0-1.036.84-1.875 1.875-1.875h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.035-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 19.125v-4.5zm1.875-.375a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm7.875-.75a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm6 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zM6 16.5a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm9.75 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm-3 3a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm6 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75z" clip-rule="evenodd" />          
        </svg>
        <span class="text-sm mt-3 font-bold">Receive</span>
      </div>
    </div>

    <!-- Stake -->
    <div class="rounded-full shadow-lg h-[60px]">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <div role="button" onclick={() => goto(PATH_ETHEREUM_TRANSACTIONS_STAKE)}
        class="w-[60px] h-[60px] flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="absolute w-4 h-4 -mt-5 font-bold">
          <!-- <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" /> -->
          <path fill-rule="evenodd" d="M15.75 2.25H21a.75.75 0 01.75.75v5.25a.75.75 0 01-1.5 0V4.81L8.03 17.03a.75.75 0 01-1.06-1.06L19.19 3.75h-3.44a.75.75 0 010-1.5zm-10.5 4.5a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V10.5a.75.75 0 011.5 0v8.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V8.25a3 3 0 013-3h8.25a.75.75 0 010 1.5H5.25z" clip-rule="evenodd" />
        </svg>
        <span class="text-sm mt-3 font-bold">Stake</span>
      </div>
    </div>

    <!-- Swap -->
    <div class="rounded-full shadow-lg h-[60px]">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <div role="button" onclick={() => goto(PATH_ETHEREUM_TRANSACTIONS_SWAP)}
        class="w-[60px] h-[60px] flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="absolute w-4 h-4 -mt-5 font-bold">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
        </svg>
        <span class="text-sm mt-3 font-bold">Swap</span>
      </div>
    </div>

    <!-- Buy -->
    <!-- <div class="rounded-full shadow h-[60px]"> -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- <div role="button" on:click={() => goto(PATH_ETHEREUM_TRANSACTIONS_BUY)}
        class="w-[60px] h-[60px] flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="absolute w-4 h-4 -mt-5 font-bold">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
        </svg>
        <span class="text-sm mt-3 font-bold">Buy</span>
      </div>
    </div> -->

    <!-- Sell -->
    <!-- <div class="rounded-full shadow h-[60px]"> -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- <div role="button" on:click={() => goto(PATH_ETHEREUM_TRANSACTIONS_SELL)}
        class="w-[60px] h-[60px] flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="absolute w-4 h-4 -mt-5 font-bold">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
      <span class="text-sm mt-3 font-bold">Sell</span>
      </div>
    </div> -->
  </div>

</nav>

