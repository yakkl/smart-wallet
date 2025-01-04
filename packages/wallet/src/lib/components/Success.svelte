<script lang="ts">
  interface Props {
    show?: boolean;
    title?: string;
    content?: string;
    handleConfirm?: any;
    confirmText?: string;
  }

  let {
    show = $bindable(false),
    title = 'SUCCESS!',
    content = 'Great News - Success.',
    handleConfirm = () => {show=false},
    confirmText = 'Close'
  }: Props = $props();
  
</script>

<div class="modal" class:modal-open={show}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">{title}</h3>
    <p class="py-4">{content}</p>
    <div class="modal-action">
      <button class="btn" onclick={() => {show=false; handleConfirm}}>{confirmText}</button>
    </div>
  </div>
</div>

