<script lang="ts">
  export let show = false;
  export let title = '';
  export let description = '';
  export let className = 'z-[999]';

  function closeModal() {
    show = false;
  }
</script>

{#if show}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 flex items-center justify-center {className}">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="absolute inset-0 bg-black opacity-50" on:click={closeModal}></div>
    <div class="bg-white rounded-lg shadow-lg w-full max-w-md mx-auto z-10 max-h-[80%] flex flex-col">
      <div class="p-6 relative">
        <button class="absolute top-4 right-4 text-2xl font-bold text-gray-500 hover:text-gray-700 focus:outline-none" on:click={closeModal}>
          &times;
        </button>
        <h2 class="text-2xl font-bold mb-4">{title}</h2>
        <p class="text-sm text-gray-500 mb-4">{description}</p>
      </div>
      <div class="flex-1 overflow-y-auto">
        <slot></slot>
      </div>
      <div class="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
{/if}
