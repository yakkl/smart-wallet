<script lang="ts">
  export let show = false;
  export let title = '';
  export let description = '';
  export let className = '';
  export let onCancel: () => void = () => {show = false};
  export let onClose: () => void = () => {show = false};

</script>

{#if show}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 flex items-center justify-center z-[999]">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="absolute inset-0 bg-black opacity-50" on:click={onClose}></div>
    <div class="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-50 rounded-lg shadow-lg w-full max-w-md mx-auto z-10 max-h-[80%] flex flex-col {className}">
      <div class="p-6 relative bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-50 ">
        <button class="absolute top-4 right-4 text-2xl font-bold hover:text-gray-900  dark:hover:text-gray-200 focus:outline-none" on:click={onClose}>
          &times;
        </button>
        <h2 class="text-2xl font-bold mb-4 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-50 ">{title}</h2>
        <p class="text-sm mb-4 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-50 ">{description}</p>
      </div>
      <div class="flex-1 overflow-y-auto">
        <slot></slot>
      </div>
      <div class="px-6 py-3 rounded-b-lg border-t border-gray-400 dark:border-gray-50 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-50 ">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
{/if}
