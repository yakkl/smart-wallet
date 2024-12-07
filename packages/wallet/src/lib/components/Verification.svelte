<script lang="ts">

  interface Props {
    // Popup a username/pwd verification dialog
    show?: boolean;
    handleProcess?: any;
  }

  let { show = $bindable(false), handleProcess = (param1: any, param2: any) => {} }: Props = $props();
let userName: string = $state();
let password: string = $state();


// TODO: Need to be able to pass function to handleProcess. Until then simply use the code

</script>

<div class="modal" class:modal-open={show}>
  <div class="modal-box relative">
    <!-- <label for="my-modal-3" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label> -->
    <h3 class="text-lg font-bold">Authorization Verification</h3>
    <p class="py-3">Please verify your Username and Password to move forward. Thank you.</p>
    <input type="text" placeholder="Username" bind:value={userName} class="input input-bordered input-primary w-full max-w-xs mb-2" />
    <input type="password" placeholder="Password" bind:value={password} class="input input-bordered input-primary w-full max-w-xs" />
    <div class="modal-action">
      <button class="btn" onclick={() => show=false}>Cancel</button>
      <button class="btn" onclick={() => handleProcess(userName, password)}>Verify</button>
    </div>
  </div>
</div>

