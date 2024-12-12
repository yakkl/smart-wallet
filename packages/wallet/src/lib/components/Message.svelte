<script lang="ts">
  import { Avatar } from 'flowbite-svelte';
  import { createEventDispatcher } from 'svelte';
  import type { YakklChat } from '$lib/common/interfaces';
  import { formatTimestamp } from '$lib/common/datetime';

  interface Props {
    message: YakklChat;
    by: 'human' | 'bot';
    i: number;
  }

  let { message, by, i }: Props = $props();

  const dispatch = createEventDispatcher();

  function handleCopy() {
    dispatch('copy');
  }

  function handlePrint() {
    dispatch('print');
  }
</script>

<div class="mb-4 flex items-start {by === 'human' ? 'flex-row-reverse' : 'flex-row'}">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="flex flex-col">
    {#if by === 'human'}
      <Avatar border size="sm"/>
    {:else}
      <img
        src="/images/bot-avatar.png"
        alt="Bot avatar"
        class="w-8 h-8 object-cover rounded-full"
      />
    {/if}
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button onclick={handleCopy} class="clip w-6 h-6 ml-1 mt-0.5 hover:text-gray-800">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 dark:text-white hover:stroke-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
      </svg>
    </button>
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div role="button" class="ml-1 mt-1 flex flex-col" onclick={handlePrint}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
      </svg>
    </div>
  </div>

  <div class="mx-2 max-w-[calc(100%-3rem)] {by === 'human' ? 'text-right text-white bg-primary border border-purple-800' : 'text-gray-900 bg-white border border-primary'} rounded-xl p-1 break-word" style="width: max-content; float: {by === 'human' ? 'right' : 'left'}; clear: both;">
    <input id="{by === 'human' ? 'question' : 'response'}{i}" name="{by === 'human' ? 'question' : 'response'}{i}" value=":yakkl:{message.text}" type="hidden">
    {@html message.text}
    <small class="text-small {by === 'human' ? 'text-blue-500' : 'text-gray-500'}">{formatTimestamp(message.timestamp)}</small>
    <small class="text-small {by === 'human' ? 'text-blue-500' : 'text-gray-500'}">Tokens: {message?.usage?.[by === 'human' ? 'prompt_tokens' : 'completion_tokens'] ?? 'N/A'}</small>
  </div>
</div>
