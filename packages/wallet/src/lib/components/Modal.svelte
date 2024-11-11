<script lang="ts">
  export const onCancel: () => void = () => { show = false };
  export const onClose: () => void = () => { show = false };
  export let show = false;
  export let title = '';
  export let description = '';
  export let className = '';
</script>

{#if show}
  <div class="fixed inset-0 flex items-center justify-center z-[999]">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="absolute inset-0 bg-black opacity-50" on:click={onClose}></div>
    
    <!-- Modal container -->
    <div class="bg-surface-light dark:bg-surface-dark text-primary-light dark:text-primary-dark rounded-lg shadow-lg w-full max-w-md mx-auto z-10 max-h-[80%] flex flex-col {className}">
      
      <!-- Modal header -->
      <div class="p-4 relative">
        <button class="absolute top-4 right-4 text-2xl font-bold hover:text-primary-light dark:hover:text-primary-dark focus:outline-none" on:click={onClose}>
          &times;
        </button>
        {#if description}
          <h2 class="text-2xl font-bold mb-4 text-primary-light dark:text-primary-dark">
            {title}
          </h2>
          <p class="text-sm mb-2 text-secondary-light dark:text-secondary-dark">
            {description}
          </p>
        {:else}
          <h2 class="text-2xl font-bold mb-2 text-primary-light dark:text-primary-dark">
            {title}
         </h2>
        {/if}
      </div>
      
      <!-- Modal body content -->
      <div class="flex-1 overflow-y-auto">
        <slot></slot>
      </div>
      
      <!-- Modal footer -->
      <div class="px-6 py-3 rounded-b-lg border-t border-neutral-light dark:border-neutral-dark bg-surface-light dark:bg-surface-dark text-primary-light dark:text-primary-dark">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
{/if}
