<script lang="ts">
  import { handleOpenInTab } from "$lib/utilities";

  interface Props {
    show?: boolean;
    value?: string;
  }

  let { show = $bindable(false), value = "This feature is not yet available. We are working on it!" }: Props = $props();

  // Shim for login page - needs a better way
  function handleLearnMore(_e: any) {
    handleOpenInTab('https://yakkl.com/university/support?utm_source=yakkl&utm_medium=extension&utm_campaign=learn_more&utm_content=knowledge_base&utm_term=extension');
    show=false;
  }

</script>

<div class="modal" class:modal-open={show}>
  <div class="modal-box relative">
    <!-- <label for="my-modal-3" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label> -->
    <div class="border border-base-content rounded-md m-2 text-center p-1">
      <h1 class="font-bold"><span class="font-bold text-white">INFO</span></h1>
      <p class="pt-4 text-white">{value}</p>
      <!-- <p class="mt-1">Do you wish to continue?</p> -->
    </div>
    <div class="modal-action">
      <button class="btn" onclick={handleLearnMore}>Learn More...</button>
      <button class="btn" onclick={() => {show=false}}>OK</button>
    </div>
  </div>
</div>
