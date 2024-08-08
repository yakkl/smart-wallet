<script  lang="ts">

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

  // Toast
  import { Toast } from 'flowbite-svelte';
  import { slide } from 'svelte/transition';  
	// Toast

  let messages: YakklChat[] = [];
  let input = '';
  let error = false;
  let errorValue = 'An error has occurred. Please try again.';
  let clipboard;
  let warning = false;
  let warningValue = 'Are you sure you want to clear the conversations? They will be lost forever.';
  let showInfo = false;

  $yakklGPTRunningStore = false;
  
  if (browserSvelte) {
    try {
      clipboard = new ClipboardJS('.clip');
    } catch(e) {
      console.log(e);
    }
  }

  //////// Toast
  let toastStatus = false;
  let toastCounter = 4;
  let toastMessage = 'Success';
  let toastType = 'success'; // 'success', 'warning', 'error'

  function toastTrigger(count=4, msg='Success') {
    toastStatus = true;
    toastCounter = count;
    toastMessage = msg;
    timeout();
  }

  function timeout(): any {
    if (--toastCounter > 0)
      return setTimeout(timeout, 1000);
    toastStatus = false;
  }
  //////// Toast

 
  async function clearMessages() {
    try {
      warning = false;
      messages = [];
      await setYakklChatsStorage(messages);
      error = false;
      errorValue = '';
    } catch (e) {
      errorValue = 'Error clearing messages. ' + e;
      // error = true;
      throw errorValue;
    }
  }


  onMount(async () => {
    try {
      // NOTE: Call OPENAI_ORG from backend just like other key. Add the fetch code for this key
      if ($yakklGPTKeyStore === null || $yakklGPTKeyStore === undefined) {
        // TODO: MUST use OAuth2 to get the key and use same credentials for encryption
        await apiKeyFetch(import.meta.env.VITE_GPT_API_KEY_BACKEND_URL, import.meta.env.VITE_GPT_API_KEY_BACKEND).then((results: any) => {          
          if (results) {
            $yakklGPTKeyStore = results;
          } else {
            throw 'Error loading auth.';
          }
        });
      }

      messages = await getYakklChats();
      console.log('Messages: ', messages);

    } catch(e) {
      errorValue = 'Error loading key or chat history. ' + e;
      // error = true;
      throw errorValue;
    }
  });

  onDestroy(async () => {
    storeChats();
  });

  async function storeChats() {
    try {
      console.log('Storing chats...', messages);
      await setYakklChatsStorage(messages);  
    } catch (e) {
      console.log(e);
    }
  }

  async function sendMessage() {
    if (input.trim() === '') return;

    let response = null;
    let arrayLength = 0;
    let dateNow = dateString();

    try{
      if ($yakklConnectionStore === false) {
        throw 'Warning. Your Internet connection appears to be down. Try again later.';
      }

      $yakklGPTRunningStore = true;

      response = await fetchGPT4Response(input);

      // Wait for the response before added to the chat history
      arrayLength = messages.push({
				text: input, 
        sender: 'user', 
        timestamp: Date.now().toString(), 
        usage: {},
				id: '',
				version: VERSION,
				createDate: dateNow,
				updateDate: dateNow
			});
      $yakklChatsStore = messages;
      
      let formattedResponse;
      // if (isHTML(response)) {
        // formattedResponse = response; // Checking could take time so we will not do that for now
      // } else {
        formattedResponse = response?.content?.replace(/[\n]+/g, '<br/><br/>'); // If any code is returned it will not be formatted well.
      // }
      arrayLength = messages.push({
				text: formattedResponse ? formattedResponse : '', 
        sender: 'yak', 
        timestamp: Date.now().toString(), 
        usage: response?.usage,
				id: '',
				version: VERSION,
				createDate: dateNow,
				updateDate: dateNow
			});
      
      $yakklChatsStore = messages;
      error = false;
      errorValue = '';
      $yakklGPTRunningStore = false;
      storeChats();
    } catch(e) {
      // Some of messages are older and do not contain error or usage elements
      $yakklGPTRunningStore = false;

      //@ts-ignore
      if (e?.response?.usage) {
        // @ts-ignore
        messages[arrayLength - 1].usage = e.response.usage;
        // @ts-ignore
        errorValue = 'An error or warning has occurred while fetching the response. Please try again. -- ' + e?.error + ' --- Tokens: ' + e?.response?.usage?.completion_tokens;
      } else {
        // @ts-ignore
        if (e?.error) {
          // @ts-ignore
          errorValue = 'An error or warning has occurred while fetching the response. Please try again. -- ' + e?.error?.message;
        } else {
          errorValue = 'An error or warning has occurred while fetching the response. Please try again. -- ' + e;
        }
        error = true;
      }
    } finally {
      input = '';
    }
  }

  function isHTML(str: string) {
    let regexForHTML = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/;
    return regexForHTML.test(str);
  }

  
  //test for \n
  function findCarriageReturnAndNewLine(inputString: string) {
    // let regex = /[\r\n]+/g;
    let matches = String(inputString).includes('\n'); //.match(regex);
    return matches;
  }

  async function handlePrint(index: number) {
    if (index === -1) {
      // Print the entire conversation
    } else {
      // Only print the 'YAK' response and user question
    }

    showInfo = true;

    // Have a nice header and body
    // Use the prose css for the body
    // call the print 
  }

  function handleLearnMore(_e: any) {
    handleOpenInTab('https://yakkl.com/university/support?utm_source=yakkl&utm_medium=extension&utm_campaign=yakkl_gpt&utm_content=learn_more&utm_term=extension');
    showInfo=false;
  }

</script>

<ErrorNoAction bind:show={error} bind:value={errorValue} title="ERROR!"/>

<div class="modal" class:modal-open={showInfo}>
  <div class="modal-box relative">
    <div class="border border-base-content rounded-md m-2 text-center p-1">
      <h1 class="font-bold"><span class="font-bold text-white">INFO</span></h1>
      <p class="pt-4 text-white">This feature is not yet available. We are working on it!</p> 
    </div>
    <div class="modal-action">
      <button class="btn" on:click|preventDefault={handleLearnMore}>Learn More...</button>
      <button class="btn" on:click|preventDefault={() => {showInfo=false}}>OK</button>
    </div>
  </div>
</div>
<!-- <NotEnabled show={showInfo} /> -->

<Toast color="indigo" transition={slide} bind:toastStatus>
  <svelte:fragment slot="icon">
    {#if toastType === 'success'}
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {/if}
  </svelte:fragment>
  {toastMessage}
</Toast>

<div class="modal" class:modal-open={warning}>
  <div class="modal-box relative">
    <!-- <label for="my-modal-3" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label> -->
    <div class="border border-base-content rounded-md m-2 text-center p-1">
      <h1 class="font-bold"><span class="font-bold text-red-600">WARNING - </span></h1>
      <p class="pt-4">{warningValue}</p> 
      <p class="mt-1">Do you wish to continue?</p>
    </div>
    <div class="modal-action">
      <button class="btn" on:click|preventDefault={() => {warning=false}}>No, cancel</button>
      <button class="btn" on:click|preventDefault={clearMessages}>Yes, I'm sure</button>
    </div>
  </div>
</div>

<!-- (message.text) -->
<!-- bg-gradient-to-r from-primary-light to-primary-dark"> -->
<div class="max-w-md -mt-4 -mx-4 mb-4"> 
  {#if error}
    <div class="error-message bg-red-500 text-white p-2 rounded mb-1">
      {error}
    </div>
  {/if}

  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-interactive-supports-focus -->
  <div role="button" class="ml-1 mb-2 -mt-4 flex flex-row" on:click|preventDefault={() => {handlePrint(-1)}}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 flex flex-row">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
    </svg>
    <span class="ml-2 text-gray-900 font-semibold flex flex-row mt-[.3rem]">Print full conversation</span>
  </div>
  <div class="h-[38rem] overflow-y-auto bg-gray-100 p-[.9rem] rounded-lg border border-primary" use:autoscroll>
    {#each $yakklChatsStore as message, i}
    
    {#if message.sender === 'user'}
    <div class="mb-2 -mr-[.7rem] flex items-start flex-row-reverse ">
      <div class="flex flex-col">
        <div class="flex flex-col">
          <Avatar border size="sm"/>
        </div>

        <!-- svelte-ignore a11y-interactive-supports-focus -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <button id="qcopy{i}" on:click|preventDefault={() => toastTrigger(2,'Copied!')} class="clip w-6 h-6 ml-1 mt-0.5 hover:text-gray-800" data-clipboard-action="copy" data-clipboard-target="#question{i}" data-yakkl-copy="yakkl-q{i}"> 
          <svg id="qcopy2{i}" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 dark:text-white hover:stroke-gray-200" data-yakkl-copy="yakkl-q{i}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>  
        </button>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-interactive-supports-focus -->
        <div role="button" class="ml-1 mt-1 flex flex-col" on:click|preventDefault={() => {handlePrint(i)}}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
        </div>
      </div>

      <div class="ml-2 mr-1 max-w-[calc(100%-3rem)] text-right text-white border border-purple-800 bg-primary rounded-l-xl rounded-tr-xl p-1 break-word" style="width: max-content; float: right; clear: both;">
        <input id="question{i}" name="question{i}" value=":yakkl:{message.text}" type="hidden" data-yakkl-copy="yakkl-q{i}">
          {@html message.text}
        <small class="text-small text-blue-500">{formatTimestamp(message.timestamp)}</small>
        <small class="text-small text-blue-500">Tokens: {message?.usage?.prompt_tokens ?? 'N/A'}</small>
      </div>
    </div>
    {:else}
    <div class="mb-4 -ml-[.8rem] flex flex-row items-start ">
      <div class="flex flex-col">
        <div class="flex flex-col">
          <img
            src="/images/bot-avatar.png"
            alt="Bot avatar"
            class="w-8 h-8 object-cover rounded-full"
          />

        </div>
        <!-- svelte-ignore a11y-interactive-supports-focus -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <button id="copy{i}" on:click|preventDefault={() => toastTrigger(2,'Copied!')} class="clip w-6 h-6 ml-1 mt-0.5 hover:text-gray-800" data-clipboard-action="copy" data-clipboard-target="#response{i}" data-yakkl-copy="yakkl{i}"> 
          <svg id="copy2{i}" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 dark:text-white hover:stroke-gray-200" data-yakkl-copy="yakkl{i}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>  
        </button>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-interactive-supports-focus -->
        <div role="button" class="ml-1 mt-1 flex flex-col" on:click|preventDefault={() => {handlePrint(i)}}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
        </div>
      </div>

      <div class="ml-1 mr-2 max-w-[calc(100%-3rem)] text-gray-900 bg-white border border-primary rounded-r-xl rounded-tl-xl p-1 break-word" style="width: max-content; float: left; clear: both;">        
        <input id="response{i}" name="response{i}" value=":yakkl:{message.text}" type="hidden" data-yakkl-copy="yakkl{i}">
        {@html message.text}
        <small class="text-small text-gray-500">{formatTimestamp(message.timestamp)}</small>
        <small class="text-small text-gray-500">Tokens: {message?.usage?.completion_tokens ?? 'N/A'}</small>
      </div>
    </div>
    {/if}

    {/each}
    {#if $yakklGPTRunningStore } <!--=== true && $yakklChatsStore.length === i}-->
    <Spinner color="purple" size={8}/>
    <!-- svelte-ignore a11y-missing-attribute -->
    <!-- <img src="/images/waiting.gif" class="w-20"/> -->
    {/if}
  </div>
  <div class="flex mt-2 w-full">
    <button class="flex-grow px-4 py-2 btn btn-error rounded-full " on:click|preventDefault="{() => {warning=true}}">
      Clear messages
    </button>
    <button class="flex-grow ml-1 px-4 py-2 btn btn-primary rounded-full" on:click|preventDefault={() => {handleOpenInTab('https://yakkl.com/university/support?utm_source=yakkl&utm_medium=extension&utm_campaign=yakkl_gpt&utm_content=knowledge_base&utm_term=extension')}}>
      YAKKL® Knowledge base 
    </button>
  </div>
  <div class="flex w-full mt-2">
    <!-- <input type="text" bind:value="{input}" placeholder="Type your question..." /> -->
    <!-- border-t border-b border-l border-gray-300 outline-none -->
    <!-- <div class="form-control w-full">
      <div class="input-group">
        <input type="text" placeholder="Type your question…" bind:value="{input}" class="flex-grow input input-bordered input-primary" />
        <button class="btn btn-square btn-primary" on:click|preventDefault={() => sendMessage()}>Send</button>
      </div>
    </div> -->
    <div class="form-control w-full">
      <div class="input-group">
        <textarea
          bind:value="{input}"
          class="flex-grow rounded-l-xl textarea textarea-bordered textarea-primary font-bold text-white resize-none"
          placeholder="Type your question..."
          rows="1"
          on:keydown="{(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}"
        ></textarea>
        <button class="px-4 btn btn-primary rounded-r-xl uppercase cursor-pointer" on:click|preventDefault="{sendMessage}">Send</button>
      </div>
    </div>
    <!-- May want a CLEAR button to clear the conversation -->
  </div>
  <p class="text-sm italic mt-1">Powered by gpt-4</p>
</div>



