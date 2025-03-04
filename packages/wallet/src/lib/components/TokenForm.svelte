<script lang="ts">
  import { createForm } from 'svelte-forms-lib';
  import * as yup from 'yup';
  import Modal from './Modal.svelte';
  import { VERSION, type TokenData } from '$lib/common';
	import { log } from '$lib/plugins/Logger';

  interface Props {
    show?: boolean;
    token?: TokenData | null;
    className?: string;
    onSubmit?: (token: TokenData) => void;
  }

  let { show = $bindable(false), token=null, className='z-[999]', onSubmit }: Props = $props();

  const { form, errors, handleChange, handleSubmit, updateInitialValues } = createForm({
    initialValues: {
      address: '',
      name: '',
      alias: '',
      symbol: '',
      decimals: 18,
      chainId: 1,
      logoURI: '',
      customDefault: 'custom',
      isNative: false, // These are optional fields for later use
      isStablecoin: false, // These are optional fields for later use
      description: '', // These are optional fields for later use
    },
    validationSchema: yup.object().shape({
      address: yup.string().required('Please enter a token address'),
      name: yup.string().required('Please enter a token name'),
      alias: yup.string().optional(),
      symbol: yup.string().required('Please enter a token symbol'),
      decimals: yup.number().required('Please enter the token decimals'),
      chainId: yup.number().required('Please enter the chain ID'),
      logoURI: yup.string().optional(),
    }),
    onSubmit: (values) => {
      try {
        const updatedToken: TokenData = {
          ...values,
          customDefault: 'custom', // Ensure customDefault is always 'custom'
          symbol: values.symbol.toUpperCase(), // Ensure symbol is always uppercase
          balance: token?.balance ?? 0n,
          quantity: token?.quantity ?? 0,
          price: {
            price: 0,
            isNative: false,
            provider: '',
            lastUpdated: new Date(),
            chainId: token?.chainId ?? 1,
            currency: '',
            status: token?.price?.status ?? 0,
            message: token?.price?.message ?? '',
          },
          change: token?.change ?? [],
          value: token?.value ?? 0,
          tags: token?.tags ?? [],
          version: token?.version ?? VERSION,
        };

        onSubmit(updatedToken);
        resetForm();
        show = false;
      } catch (error) {
        log.error('TokenForm: Error:', false, error);
      }
    },
  });

  function resetForm() {
    updateInitialValues({
      address: '',
      name: '',
      alias: '',
      symbol: '',
      decimals: 18,
      chainId: 1,
      logoURI: '',
      customDefault: 'custom',
      isNative: false, // These are optional fields for later use
      isStablecoin: false, // These are optional fields for later use
      description: '', // These are optional fields for later use
    });
  }

  $effect(() => {
    if (token) {
      updateInitialValues({
        address: token.address,
        name: token.name,
        alias: token.alias ?? '',
        symbol: token.symbol,
        decimals: token.decimals,
        chainId: token.chainId ?? 1,
        logoURI: token.logoURI ?? '',
        customDefault: 'custom',
        isNative: token.isNative ?? false,
        isStablecoin: token.isStablecoin ?? false,
        description: token.description ?? '',
      });
    }
  });
</script>

<Modal bind:show title={token ? 'Edit Token' : 'Add Token'}>
  <form onsubmit={handleSubmit} class="space-y-4 p-6">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Name <span class="text-red-500">*</span></label>
      <input type="text" id="name" required placeholder="Enter the token name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-800" bind:value={$form.name} onchange={handleChange} />
      {#if $errors.name}
        <p class="mt-2 text-sm text-red-600">{$errors.name}</p>
      {/if}
    </div>

    <div>
      <label for="address" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Address <span class="text-red-500">*</span></label>
      <input type="text" id="address" required placeholder="Enter the token contract address" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focusring:indigo-500 sm:text-sm text-gray-800" bind:value={$form.address} onchange={handleChange} />
      {#if $errors.address}
        <p class="mt-2 text-sm text-red-600">{$errors.address}</p>
      {/if}
    </div>

    <div>
      <label for="alias" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Alias</label>
      <input type="text" id="alias" placeholder="Enter an alias like an ENS (optional)" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-800" bind:value={$form.alias} onchange={handleChange} />
      {#if $errors.alias}
        <p class="mt-2 text-sm text-red-600">{$errors.alias}</p>
      {/if}
    </div>

    <div>
      <label for="symbol" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Symbol <span class="text-red-500">*</span></label>
      <input type="text" id="symbol" required placeholder="Enter the token symbol" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focusring:indigo-500 sm:text-sm text-gray-800" bind:value={$form.symbol} onchange={handleChange} />
      {#if $errors.symbol}
        <p class="mt-2 text-sm text-red-600">{$errors.symbol}</p>
      {/if}
    </div>

    <div>
      <label for="decimals" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Decimals <span class="text-red-500">*</span></label>
      <input type="number" id="decimals" step="1" required placeholder="Enter the decimals token uses" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focusring:indigo-500 sm:text-sm text-gray-800" bind:value={$form.decimals} onchange={handleChange} />
      {#if $errors.decimals}
        <p class="mt-2 text-sm text-red-600">{$errors.decimals}</p>
      {/if}
    </div>

    <div>
      <label for="chainid" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Chain ID <span class="text-red-500">*</span></label>
      <input type="text" id="chainid" step="1" required placeholder="Enter the chain ID" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focusring:indigo-500 sm:text-sm text-gray-800" bind:value={$form.chainId} onchange={handleChange} />
      {#if $errors.chainId}
        <p class="mt-2 text-sm text-red-600">{$errors.chainId}</p>
      {/if}
    </div>

    <div>
      <label for="logoURI" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Logo URI</label>
      <input type="text" id="logoURI" placeholder="Enter the URL (https://...) for the logo" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-800" bind:value={$form.logoURI} onchange={handleChange} />
      {#if $errors.logoURI}
        <p class="mt-2 text-sm text-red-600">{$errors.logoURI}</p>
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
