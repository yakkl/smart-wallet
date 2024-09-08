<!-- EditControls.svelte -->
<script lang="ts">
  import { Edit2Icon, TrashIcon, ClipboardIcon } from 'svelte-feather-icons';
  import { fade } from 'svelte/transition';

  export let onEdit: () => void = () => {};
  export let onDelete: () => void = () => {};
  export let onCopy: () => void = () => {};
  export let controls: string[] = ['copy', 'edit', 'delete'];

  let copied = false;
  let edited = false;
  let deleted = false;
  let hoverText = '';

  function handleCopy() {
    onCopy();
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 1000);
  }

  function handleEdit() {
    onEdit();
    edited = true;
    setTimeout(() => {
      edited = false;
    }, 1000);
  }

  function handleDelete() {
    onDelete();
    deleted = true;
    setTimeout(() => {
      deleted = false;
    }, 1000);
  }

  function showHoverText(text: string) {
    hoverText = text;
    setTimeout(() => {
      hoverText = '';
    }, 1000);
  }
</script>

<div class="absolute top-2 right-2 flex items-center space-x-2 bg-white rounded-full p-1 shadow-md z-10">
  {#if controls.includes('copy')}
    <button
      type="button"
      class="text-gray-400 hover:text-gray-500 focus:outline-none relative"
      on:click|stopPropagation={handleCopy}
      on:mouseenter={() => showHoverText('Copy')}
      on:mouseleave={() => (hoverText = '')}
    >
      {#if copied}
        <div class="text-green-500" transition:fade={{ duration: 200 }}>
          <ClipboardIcon class="h-5 w-5" />
        </div>
      {:else}
        <ClipboardIcon class="h-5 w-5" />
      {/if}
      {#if hoverText === 'Copy'}
        <div
          class="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-md"
          transition:fade={{ duration: 200 }}
        >
          Copy
        </div>
      {/if}
    </button>
  {/if}
  {#if controls.includes('edit')}
    <button
      type="button"
      class="text-gray-400 hover:text-gray-500 focus:outline-none relative"
      on:click|stopPropagation={handleEdit}
      on:mouseenter={() => showHoverText('Edit')}
      on:mouseleave={() => (hoverText = '')}
    >
      {#if edited}
        <div class="text-blue-500" transition:fade={{ duration: 200 }}>
          <Edit2Icon class="h-5 w-5" />
        </div>
      {:else}
        <Edit2Icon class="h-5 w-5" />
      {/if}
      {#if hoverText === 'Edit'}
        <div
          class="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-md"
          transition:fade={{ duration: 200 }}
        >
          Edit
        </div>
      {/if}
    </button>
  {/if}
  {#if controls.includes('delete')}
    <button
      type="button"
      class="text-gray-400 hover:text-gray-500 focus:outline-none relative"
      on:click|stopPropagation={handleDelete}
      on:mouseenter={() => showHoverText('Delete')}
      on:mouseleave={() => (hoverText = '')}
    >
      {#if deleted}
        <div class="text-red-500" transition:fade={{ duration: 200 }}>
          <TrashIcon class="h-5 w-5" />
        </div>
      {:else}
        <TrashIcon class="h-5 w-5" />
      {/if}
      {#if hoverText === 'Delete'}
        <div
          class="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-md"
          transition:fade={{ duration: 200 }}
        >
          Delete
        </div>
      {/if}
    </button>
  {/if}
</div>
