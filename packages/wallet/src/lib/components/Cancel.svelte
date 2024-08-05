<script lang="ts">
  import { goto } from "$app/navigation";
  import { PATH_WELCOME } from "$lib/common";

  export let defaultClass = "right-0 top-0"
  export let path = PATH_WELCOME;
  export let handle = () => goto(path);
  
</script>

<button class="btn btn-sm btn-circle btn-outline z-10 {defaultClass}" on:click|preventDefault={handle}>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>  
</button>
