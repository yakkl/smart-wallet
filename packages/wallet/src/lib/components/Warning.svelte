<script lang="ts">
  interface Props {
    show?: boolean;
    value?: string;
    title?: string;
    rejectText?: string;
  }

  let {
    show = $bindable(false),
    value = '',
    title = 'WARNING!',
    rejectText = 'Close'
  }: Props = $props();
 
</script>

<div class="modal" class:modal-open={show}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">{title}</h3>
    <p class="py-4">{value}</p>
    <div class="modal-action">
      <button class="btn" onclick={() => {show=false}}>{rejectText}</button>
    </div>
  </div>
</div>

