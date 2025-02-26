<!-- LoadingState.svelte -->
<script lang="ts">

  interface Props {
    type?: 'overlay' | 'inline';
    message?: string;
    showSpinner?: boolean;
    showProgress?: boolean;
    progress?: number;
  }

  let { type = 'overlay', message = 'Loading...', showSpinner = true, showProgress = false, progress = 0 }: Props = $props();

</script>

{#if type === 'overlay'}
<!-- absolute inset-0 bg-black/50 -->
  <div class="flex mt-10 items-center justify-center">
    <div class="flex flex-col items-center gap-3 p-4 bg-gray-800/80 rounded-xl">
      {#if showSpinner}
        <div class="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      {/if}

      <span class="text-sm text-blue-400">{message}</span>

      {#if showProgress}
        <div class="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-blue-400 transition-all duration-300"
            style="width: {progress}%"
          ></div>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="inline-flex items-center gap-2">
    {#if showSpinner}
      <div class="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
    {/if}
    <span class="text-sm text-blue-400">{message}</span>
  </div>
{/if}

