<script lang="ts">
  import { browser as browserSvelte } from '$app/environment';
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

  let messages: YakklChat[] = [];
  let error = false;
  let errorValue = 'An error has occurred. Please try again.';
  let clipboard;
  let showClearWarning = false;

  $yakklGPTRunningStore = false;
  
  if (browserSvelte) {
    try {
      clipboard = new ClipboardJS('.clip');
    } catch(e) {
      console.log(e);
    }
  }

  onMount(async () => {
    try {
      if ($yakklGPTKeyStore === null || $yakklGPTKeyStore === undefined) {
        await apiKeyFetch(import.meta.env.VITE_GPT_API_KEY_BACKEND_URL, import.meta.env.VITE_GPT_API_KEY_BACKEND).then((results: any) => {          
          if (results) {
            $yakklGPTKeyStore = results;
          } else {
            throw 'Error loading auth.';
          }
        });
      }

      messages = await getYakklChats();
    } catch(e) {
      errorValue = 'Error loading key or chat history. ' + e;
      error = true;
    }
  });

  onDestroy(async () => {
    await storeChats();
  });

  async function storeChats() {
    try {
      await setYakklChatsStorage(messages);  
    } catch (e) {
      console.log(e);
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

      messages = [...messages, {
        text: input, 
        sender: 'user', 
        timestamp: Date.now().toString(), 
        usage: {},
        id: '',
        version: VERSION,
        createDate: dateNow,
        updateDate: dateNow
      }];

      response = await fetchGPT4Response(input);
      
      let formattedResponse = response?.content?.replace(/[\n]+/g, '<br/><br/>');
      messages = [...messages, {
        text: formattedResponse ? formattedResponse : '', 
        sender: 'yak', 
        timestamp: Date.now().toString(), 
        usage: response?.usage,
        id: '',
        version: VERSION,
        createDate: dateNow,
        updateDate: dateNow
      }];
      
      $yakklChatsStore = messages;
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
      messages = [];
      $yakklChatsStore = messages;
      await setYakklChatsStorage(messages);
      showClearWarning = false;
    } catch (e) {
      errorValue = 'Error clearing messages. ' + e;
      error = true;
    }
  }

  function handlePrint() {
    // Implement print functionality
    console.log("Print functionality not implemented yet");
  }
</script>

<div class="flex flex-col h-full">
  <ErrorNoAction bind:show={error} bind:value={errorValue} title="ERROR!" />

  <div class="grid grid-cols-2 gap-4 mb-4 px-2">
    <button class="btn btn-sm btn-outline w-full" on:click={handlePrint}>
      Print conversation
    </button>
    <button class="btn btn-sm btn-outline btn-error w-full" on:click={() => showClearWarning = true}>
      Clear messages
    </button>
    <button 
      class="btn btn-sm btn-primary col-span-2 w-full" 
      on:click={() => handleOpenInTab('https://yakkl.com/university/support?utm_source=yakkl&utm_medium=extension&utm_campaign=yakkl_gpt&utm_content=knowledge_base&utm_term=extension')}
    >
      YAKKL® Knowledge base 
    </button>
  </div>

  <div class="flex-grow overflow-y-auto bg-gray-100 p-4 rounded-lg border border-gray-300" use:autoscroll>
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
        <button class="btn btn-sm btn-outline mr-2" on:click={() => showClearWarning = false}>Cancel</button>
        <button class="btn btn-sm btn-error" on:click={clearMessages}>Clear</button>
      </div>
    </div>
  </div>
{/if}
