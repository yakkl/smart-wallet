<script lang="ts">
  export let show = false;
  export let title = 'SUCCESS!';
  export let content = 'Great News - Success.'
  export let handleConfirm = () => {show=false};
  export let confirmText = 'Close';
  
</script>

<div class="modal" class:modal-open={show}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">{title}</h3>
    <p class="py-4">{content}</p>
    <div class="modal-action">
      <button class="btn" on:click={() => {show=false; handleConfirm}}>{confirmText}</button>
    </div>
  </div>
</div>

