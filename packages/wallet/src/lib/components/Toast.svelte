<script lang="ts">
import { Toast } from 'flowbite-svelte';
import { slide } from 'svelte/transition';

  interface Props {
    toastStatus?: boolean;
    counter?: number;
    message?: string;
  }

  let { toastStatus = $bindable(false), counter = $bindable(2), message = 'Success' }: Props = $props();

export function toastTrigger(count=2, msg='Success') {
  toastStatus = true;
  counter = count;
  timeout();
}

export function timeout(): any {
  if (--counter > 0)
    return setTimeout(timeout, 1000);
  toastStatus = false;
}

</script>

<Toast color="indigo" transition={slide} bind:toastStatus>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  {message}
</Toast>
