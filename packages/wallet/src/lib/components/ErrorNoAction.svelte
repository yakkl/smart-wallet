<script lang="ts">
  interface Props {
    show: boolean;
    value: string;
    title?: string;
    handle?: () => void;
  }

  // Destructure props correctly
  let {
    show = $bindable(false),
    title = 'ERROR!',
    value = 'An error occurred',
    handle = () => {}
  }: Props = $props();
</script>

<div class="modal" class:modal-open={show}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">{title}</h3>
    <p class="py-4">{value}</p>
    <div class="modal-action">
      <button class="btn" onclick={() => {
        show = false;
        handle(); // Correct function call
      }}>Close</button>
    </div>
  </div>
</div>
