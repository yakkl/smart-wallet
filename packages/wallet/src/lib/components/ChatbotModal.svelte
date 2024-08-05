<script lang="ts">
import { Modal } from "flowbite-svelte";
import Chatbot from "./Chatbot.svelte";

export let title = 'YAKKL-GPT (preview)';
export let showChat = false;

</script>

<!-- class="bg-gradient-to-r from-primary-light to-primary-dark" -->
<!-- padding="xs" - before we upgraded -->
<Modal class="p-1" title={title}  bind:open={showChat} size="xs" autoclose>
  <Chatbot />
</Modal>
