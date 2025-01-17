<!-- EditControls.svelte -->
<script lang="ts">
  import { Edit2Icon, TrashIcon, ClipboardIcon } from 'svelte-feather-icons';
  import { fade } from 'svelte/transition';

  interface Props {
    onEdit?: () => void;
    onDelete?: () => void;
    onCopy?: () => void;
    controls?: string[];
  }

  let {
    onEdit = () => {},
    onDelete = () => {},
    onCopy = () => {},
    controls = ['copy', 'edit', 'delete']
  }: Props = $props();

  let copied = $state(false);
  let edited = $state(false);
  let deleted = $state(false);
  let hoverText = $state('');

  function handleCopy(event: MouseEvent) {
    event.stopPropagation();
    onCopy();
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 1000);
  }

  function handleEdit(event: MouseEvent) {
    event.stopPropagation();
    onEdit();
    edited = true;
    setTimeout(() => {
      edited = false;
    }, 1000);
  }

  function handleDelete(event: MouseEvent) {
    event.stopPropagation();
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
      onclick={handleCopy}
      onmouseenter={() => showHoverText('Copy')}
      onmouseleave={() => (hoverText = '')}
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
      onclick={handleEdit}
      onmouseenter={() => showHoverText('Edit')}
      onmouseleave={() => (hoverText = '')}
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
      onclick={handleDelete}
      onmouseenter={() => showHoverText('Delete')}
      onmouseleave={() => (hoverText = '')}
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
