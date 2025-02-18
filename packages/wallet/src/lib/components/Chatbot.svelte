<script lang="ts">
  import { browserSvelte } from '$lib/utilities/browserSvelte';
  // import { browser as browserSvelte } from '$app/environment';
  import { onDestroy, onMount } from 'svelte';
  import { yakklChatsStore, getYakklChats, setYakklChatsStorage, yakklGPTRunningStore, yakklConnectionStore, yakklGPTKeyStore } from '$lib/common/stores';
  import { autoscroll } from '$lib/utilities';
  import { Avatar, Spinner } from 'flowbite-svelte';
  import { handleOpenInTab } from "$lib/utilities/utilities";
  import ErrorNoAction from '$lib/components/ErrorNoAction.svelte';
  import { dateString, formatTimestamp } from '$lib/common/datetime';
  import { fetchGPT4Response } from '$lib/api/api-gpt.js';
  import { apiKeyFetch } from '$lib/api/apis';
  import ClipboardJS from 'clipboard';
  import { VERSION, type YakklChat } from '$lib/common';
	import { log } from '$lib/plugins/Logger';

  let messages = $state<YakklChat[]>([]);
  let error = $state(false);
  let errorValue = $state('An error has occurred. Please try again.');
  let clipboard;
  let showClearWarning = $state(false);

  $yakklGPTRunningStore = false;

  if (browserSvelte) {
    try {
      clipboard = new ClipboardJS('.clip');
    } catch(e) {
      log.error(e);
    }
  }

  onMount(async () => {
    try {
      messages.length = 0; // Clear existing messages

      if ($yakklGPTKeyStore === null || $yakklGPTKeyStore === undefined) {
        await apiKeyFetch(import.meta.env.VITE_GPT_API_KEY_BACKEND_URL, import.meta.env.VITE_GPT_API_KEY_BACKEND).then((results: any) => {
          if (results) {
            $yakklGPTKeyStore = results;
          } else {
            throw 'Error loading auth.';
          }
        });
      }

      const loadedMessages = await getYakklChats();

      // Ensure we have an array and add messages one by one
      if (Array.isArray(loadedMessages)) {
        loadedMessages.forEach(msg => {
          if (msg && typeof msg === 'object') {
            messages.push(msg);
          }
        });
      }
    } catch(e) {
      log.error('Error in onMount:', e);
      errorValue = 'Error loading key or chat history. ' + e;
      error = true;
    }
  });

  onDestroy(async () => {
    await storeChats();
  });

  async function storeChats() {
    try {
      // Create a clean array from the messages state
      const messageArray = Array.isArray(messages) ? [...messages] : [];

      // Ensure each message is a proper object before storing
      const cleanMessages = messageArray.map(msg => ({
          text: msg.text || '',
          sender: msg.sender || '',
          timestamp: msg.timestamp || Date.now().toString(),
          usage: msg.usage || {},
          id: msg.id || '',
          version: msg.version || VERSION,
          createDate: msg.createDate || dateString(),
          updateDate: msg.updateDate || dateString()
      }));

      // Update the store first
      $yakklChatsStore = cleanMessages;

      // Then store in localStorage
      await setYakklChatsStorage(cleanMessages);
    } catch (e) {
      log.error('Error storing chats:', e);
      throw e; // Rethrow if you want to handle it in the calling function
    }
  }

  export async function handleSendMessage(input: string) {
    if (input.trim() === '') return;

    let response = null;
    let dateNow = dateString();

    try {
      if (!$yakklConnectionStore) {
          throw 'Warning. Your Internet connection appears to be down. Try again later.';
      }

      $yakklGPTRunningStore = true;

      const newUserMessage = {
        text: input,
        sender: 'user',
        timestamp: Date.now().toString(),
        usage: {},
        id: '',
        version: VERSION,
        createDate: dateNow,
        updateDate: dateNow
      };

      messages.push(newUserMessage);

      response = await fetchGPT4Response(input);

      let formattedResponse = response?.content?.replace(/[\n]+/g, '<br/><br/>');

      const newBotMessage = {
        text: formattedResponse ? formattedResponse : '',
        sender: 'yak',
        timestamp: Date.now().toString(),
        usage: response?.usage,
        id: '',
        version: VERSION,
        createDate: dateNow,
        updateDate: dateNow
      };

      messages.push(newBotMessage);

      $yakklChatsStore = [...messages];
      await storeChats();
    } catch(e: any) {
      errorValue = `An error occurred: ${e?.message || e}`;
      error = true;
    } finally {
      $yakklGPTRunningStore = false;
    }
  }

  async function clearMessages() {
    try {
        messages.length = 0; // This clears the array while maintaining reactivity
        $yakklChatsStore = [];
        await setYakklChatsStorage([]);
        showClearWarning = false;
    } catch (e) {
        errorValue = 'Error clearing messages. ' + e;
        error = true;
    }
  }

  function handlePrint() {
    // Implement print functionality
    log.error("Print functionality not implemented yet");
  }
</script>

<div class="flex flex-col h-full">
  <ErrorNoAction bind:show={error} value={errorValue} title="ERROR!" />

  <div class="grid grid-cols-2 gap-4 mb-4 px-2">
    <button class="btn btn-sm btn-outline w-full" onclick={handlePrint}>
      Print conversation
    </button>
    <button class="btn btn-sm btn-outline btn-error w-full" onclick={() => showClearWarning = true}>
      Clear messages
    </button>
    <button
      class="btn btn-sm btn-primary col-span-2 w-full"
      onclick={() => handleOpenInTab('https://yakkl.com/university/support?utm_source=yakkl&utm_medium=extension&utm_campaign=yakkl_gpt&utm_content=knowledge_base&utm_term=extension')}
    >
      YAKKL® Knowledge base
    </button>
  </div>

  <div class="flex-grow overflow-y-auto bg-gray-100 p-4 rounded-lg border border-gray-300" use:autoscroll>
    {#if messages}
    <pre class="hidden">{JSON.stringify(messages, null, 2)}</pre>
    <!-- Your existing each block -->
    {#each messages as message, i (i)}
      <div class="mb-4 flex {message.sender === 'user' ? 'justify-end' : 'justify-start'}">
        <div class="flex items-start max-w-[70%]">
          {#if message.sender !== 'user'}
            <img src="/images/bot-avatar.png" alt="Bot avatar" class="w-8 h-8 rounded-full mr-2" />
          {/if}
          <div class="{message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'} rounded-lg p-3">
            <p>{@html message.text}</p>
            <div class="text-xs mt-1 {message.sender === 'user' ? 'text-blue-200' : 'text-gray-700'}">
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
          {#if message.sender === 'user'}
            <Avatar class="w-8 h-8 rounded-full ml-2" />
          {/if}
        </div>
      </div>
    {/each}
    {/if}
    {#if $yakklGPTRunningStore}
      <div class="flex justify-center items-center">
        <Spinner color="purple" size={8}/>
      </div>
    {/if}
  </div>
</div>

{#if showClearWarning}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-xl">
      <h3 class="text-lg font-bold mb-4">Clear all messages?</h3>
      <p class="mb-4">Are you sure you want to clear all messages? This action cannot be undone.</p>
      <div class="flex justify-end">
        <button class="btn btn-sm btn-outline mr-2" onclick={() => showClearWarning = false}>Cancel</button>
        <button class="btn btn-sm btn-error" onclick={clearMessages}>Clear</button>
      </div>
    </div>
  </div>
{/if}
