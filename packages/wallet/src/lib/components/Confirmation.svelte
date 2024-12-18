<!-- Confirmation.svelte -->
<script lang="ts">
  import Modal from './Modal.svelte';

  interface Props {
    show: boolean;
    title?: string;
    message?: string;
    rejectText?: string;
    confirmText?: string;
    className?: string;
    onConfirm?: () => void;
    onReject?: () => void;
  }

  let {
    show = $bindable(false),
    title = 'Confirm',
    message = 'Are you sure you want to continue?',
    rejectText = 'Cancel',
    confirmText = 'Confirm',
    className = 'z-[999]',
    onConfirm = () => {},
    onReject = () => {show = false},
  }: Props = $props();
</script>

<Modal bind:show={show} title={title} {className}>
  <div class="p-6">
    <p class="text-sm text-gray-500">{message}</p>
    <div class="mt-4 flex justify-end">
      <button type="button" class="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onclick={onReject}>{rejectText}</button>
      <button type="button" class="ml-2 rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2" onclick={onConfirm}>{confirmText}</button>
    </div>
  </div>
</Modal>
