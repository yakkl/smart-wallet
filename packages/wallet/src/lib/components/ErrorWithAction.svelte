<script lang="ts">
  interface Props {
    show?: boolean;
    title?: string;
    value?: string;
    handle?: any;
  }

  let {
    show = $bindable(false),
    title = 'ERROR!',
    value = '',
    handle = () => {show=false}
  }: Props = $props();
  
</script>

<div class="modal" class:modal-open={show}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">{title}</h3>
    <p class="py-4">{value}</p>
    <div class="modal-action">
      <button class="btn" onclick={() => {show=false; handle}}>Close</button>
    </div>
  </div>
</div>

