<script lang="ts">
  import { goto } from "$app/navigation";

  export let defaultClass = "left-0 top-0"
  export let href = '';
  
  // Shim for login page - needs a better way
  function handleBack(_e: any) {
    if (href === '') {
      if (history.length > 3) {
        history.back(); 
      } // it is assumed that it takes at least 3 pages before the welcome screen is presented for the first time. Note, if the user clicks any of the recover or import links on the login page then the length will be higher and this can fool this simple check which can reload the login page and the user has to login again. FYI
    } else {
      goto(href);
    }
  }

</script>

<button class="btn btn-sm btn-circle btn-outline z-10 {defaultClass}" on:click={handleBack}>
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" /></svg>
</button>
