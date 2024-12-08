<script lang="ts">
  interface Props {
    show?: boolean;
    title?: string;
    value?: string; // Calling this function will cause the modal to be shown and the caller should bind:show to a variable and pass it in.
  }

  let { show = $bindable(false), title = 'Verifying', value = 'Credentials and Loading...' }: Props = $props();


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
