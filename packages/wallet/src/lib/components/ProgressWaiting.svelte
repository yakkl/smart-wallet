<script lang="ts">
  export let show = false;
  export let title = 'Verifying';
  export let value = 'Credentials and Loading...';

  // Calling this function will cause the modal to be shown and the caller should bind:show to a variable and pass it in.
</script>


<div class="modal" class:modal-open={show}>
  <div class="modal-box relative justify-center">
    <h3 class="text-lg font-bold">{title}</h3>
    <p class="py-4">{value}</p>
    <div class="mt-8">
      <progress class="progress progress-success"></progress>
    </div>
  </div>
</div>
