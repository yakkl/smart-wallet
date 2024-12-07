<script lang="ts">
  interface Props {
    show?: boolean;
    title?: string;
    content?: string;
    handleReject?: any;
    rejectText?: string;
  }

  let {
    show = $bindable(false),
    title = 'FAILED!',
    content = 'An error has occurred.',
    handleReject = () => {show=false},
    rejectText = 'Close'
  }: Props = $props();
  
</script>

<div class="modal" class:modal-open={show}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">{title}</h3>
    <p class="py-4">{content}</p>
    <div class="modal-action">
      <button class="btn" onclick={() => {show=false; handleReject}}>{rejectText}</button>
    </div>
  </div>
</div>

