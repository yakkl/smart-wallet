<script lang="ts">
// Popup a username/pwd verification dialog
export let show = false;
export let handleProcess = (param1: any, param2: any) => {};
let userName: string;
let password: string;


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
      <button class="btn" on:click={() => show=false}>Cancel</button>
      <button class="btn" on:click={() => handleProcess(userName, password)}>Verify</button>
    </div>
  </div>
</div>

