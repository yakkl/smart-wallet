<!-- AccountForm.svelte -->
<script lang="ts">
  import { createForm } from 'svelte-forms-lib';
  import { ClipboardIcon } from 'svelte-feather-icons';
  import * as yup from 'yup';
  import type { YakklAccount } from '$lib/common';
  import Modal from './Modal.svelte';

  interface Props {
    show?: boolean;
    account?: YakklAccount | null;
    onSubmit?: (account: YakklAccount) => void;
  }

  let { show = $bindable(false), account = null, onSubmit = () => {} }: Props = $props();

  // Not using onCancel here but letting it fall through to the Modal component since we don't need to do anything special
  // export let onCancel: () => void = () => {show = false};

  const { form, errors, handleChange, handleSubmit, updateInitialValues } = createForm({
    initialValues: {
      name: '',
      alias: '',
      description: '',
    },
    validationSchema: yup.object().shape({
      name: yup.string().required('Please enter an account name'),
      alias: yup.string().optional(),
      description: yup.string().optional(),
    }),
    onSubmit: (values) => {
      if (account) {
        const updatedAccount: YakklAccount = {
          ...account,
          name: values.name,
          alias: values.alias,
          description: values.description,
        };
        onSubmit(updatedAccount);
      }
      show = false;
    },
  });


  function resetForm() {
    updateInitialValues({
      name: '',
      alias: '',
      description: '',
    });
  }

  function copyAddress(address: string) {
    navigator.clipboard.writeText(address);
  }

  $effect(() => {
    if (account) {
      updateInitialValues({
        name: account.name,
        alias: account.alias || '',
        description: account.description || '',
      });
    } else {
      resetForm();
    }
  });
</script>

<Modal bind:show title={account ? 'Edit Account' : 'Add Account'}>
  <form onsubmit={handleSubmit} class="space-y-4 p-6">
    <div>
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label class="block text-sm font-medium text-gray-700">Address</label>
      <div class="mt-1 flex items-center">
        <input
          type="text"
          class="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-800 bg-gray-100 cursor-not-allowed"
          value={account?.address || ''}
          disabled
        />
        <button
          type="button"
          class="ml-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onclick={() => copyAddress(account?.address || '')}
        >
          <ClipboardIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div>
      <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
      <input type="text" id="name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-800" bind:value={$form.name} onchange={handleChange} />
      {#if $errors.name}
        <p class="mt-2 text-sm text-red-600">{$errors.name}</p>
      {/if}
    </div>
    <div>
      <label for="alias" class="block text-sm font-medium text-gray-700">Alias</label>
      <input type="text" id="alias" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-800" bind:value={$form.alias} onchange={handleChange} />
      {#if $errors.alias}
        <p class="mt-2 text-sm text-red-600">{$errors.alias}</p>
      {/if}
    </div>
    <div>
      <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
      <textarea id="description" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-800" bind:value={$form.description} onchange={handleChange}></textarea>
      {#if $errors.description}
        <p class="mt-2 text-sm text-red-600">{$errors.description}</p>
      {/if}
    </div>
    <div class="pt-5">
      <div class="flex justify-end space-x-4">
        <button type="button" class="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onclick={() => show = false}>Cancel</button>
        <button type="button" class="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onclick={resetForm}>Reset</button>
        <button type="submit" class="rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Save</button>
      </div>
    </div>
  </form>
</Modal>
