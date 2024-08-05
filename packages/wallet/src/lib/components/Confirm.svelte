<script lang="ts">
  export let show = false;
  export let title = 'Confirmation';
  export let content = 'Are you sure you want to continue?'
  export let handleReject = () => {show=false};
  export let handleConfirm = () => {show=false};
  export let rejectText = 'No, Cancel';
  export let confirmText = 'Yes, Confirm';
  
</script>

<div class="modal" class:modal-open={show}>
  <div class="modal-box relative text-center">
    <h3 class="text-lg font-bold">{title}</h3>
    <p class="py-4">{content}</p>
    <div class="modal-action">
      <button class="btn" on:click|preventDefault={handleReject}>{rejectText}</button>
      <button class="btn" on:click|preventDefault={handleConfirm}>{confirmText}</button>
    </div>
  </div>
</div>

