<script lang="ts">
  export let show = false;
  export let title = 'ERROR!';
  export let value = '';
  export let handle = () => {value=''};
  
</script>

<div class="modal" class:modal-open={show}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">{title}</h3>
    <p class="py-4">{value}</p>
    <div class="modal-action">
      <button class="btn" on:click={() => {show=false; handle}}>Close</button>
    </div>
  </div>
</div>

