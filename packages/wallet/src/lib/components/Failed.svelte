<script lang="ts">
  export let show = false;
  export let title = 'FAILED!';
  export let content = 'An error has occurred.'
  export let handleReject = () => {show=false};
  export let rejectText = 'Close';
  
</script>

<div class="modal" class:modal-open={show}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">{title}</h3>
    <p class="py-4">{content}</p>
    <div class="modal-action">
      <button class="btn" on:click={() => {show=false; handleReject}}>{rejectText}</button>
    </div>
  </div>
</div>

