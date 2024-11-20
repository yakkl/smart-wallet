<script lang="ts">
  import Modal from './Modal.svelte';
  import Chatbot from './Chatbot.svelte';

  export let show = false;
  
  let input = '';
  let chatbotComponent: Chatbot;

  function sendMessage() {
    if (input.trim() !== '') {
      chatbotComponent.handleSendMessage(input);
      input = '';
    }
  }
</script>

<Modal 
  bind:show={show} 
  title="YAKKL-GPT (preview)" 
  className="z-[999] w-[100%] h-[90vh] max-w-none"
>
  <Chatbot bind:this={chatbotComponent} />
  
  <svelte:fragment slot="footer">
    <div class="flex w-full items-center">
      <textarea
        bind:value={input}
        class="flex-grow rounded-l-lg textarea textarea-bordered resize-none h-20 bg-gray-200 text-gray-950"
        placeholder="Type your question..."
        rows="3"
        on:keydown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
      ></textarea>
      <button class="btn btn-primary rounded-r-lg h-20" on:click={sendMessage}>Send</button>
    </div>
    <p class="text-xs text-gray-500 mt-2">
      Powered by OpenAI
    </p>
  </svelte:fragment>
</Modal>
