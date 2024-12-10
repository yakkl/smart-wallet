<script lang="ts">
  import { onMount } from 'svelte';
  import * as yup from 'yup';
  import * as Sheet from "$lib/components/ui/sheet";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Switch } from "$lib/components/ui/switch";
  import { yakklPreferencesStore } from '$lib/common/stores';
  import type { Preferences } from '$lib/common/interfaces';
  import { SystemTheme } from '$lib/common/types';
  // import type { BuilderReturn } from '@melt-ui/svelte';

  let preferences: Preferences = $state();

  const themeOptions = [
    { value: SystemTheme.DARK, label: "Dark" },
    { value: SystemTheme.LIGHT, label: "Light" },
    { value: SystemTheme.SYSTEM, label: "System" }
  ];

  const onSelectedChange = (selectedValue: unknown) => {
    if (typeof selectedValue === 'string') {
      preferences.dark = selectedValue as SystemTheme;
    }
  };

  onMount(() => {
    const unsubscribe = yakklPreferencesStore.subscribe(value => {
      preferences = value;
    });

    return unsubscribe;
  });

  const preferencesSchema = yup.object().shape({
    idleDelayInterval: yup.number().min(1, 'Idle delay interval must be at least 1 second'),
    showTestNetworks: yup.boolean(),
    dark: yup.string().oneOf(Object.values(SystemTheme)),
    idleAutoLock: yup.boolean(),
    idleAutoLockCycle: yup.number().min(60, 'Auto lock cycle must be at least 1 minute'),
    locale: yup.string(),
    currency: yup.object().shape({
      code: yup.string(),
      symbol: yup.string(),
    }),
  });

  let errors: { [key: string]: string } = $state({});

  async function validateForm() {
    try {
      await preferencesSchema.validate(preferences, { abortEarly: false });
      errors = {};
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        errors = error.inner.reduce((acc, err) => {
          if (err.path) {
            acc[err.path] = err.message;
          }
          return acc;
        }, {} as { [key: string]: string });
      }
      return false;
    }
  }

  async function handleSubmit() {
    if (await validateForm()) {
      yakklPreferencesStore.set(preferences);
      console.log('Preferences saved:', preferences);
    }
  }

  let open = $state(false);

  export function openPreferences() {
    open = true;
  }
</script>

<div class="bg-white p-4">
  <Sheet.Root bind:open>
    <Sheet.Content side="right" class="w-[400px] sm:w-[540px]">
      <Sheet.Header>
        <Sheet.Title>Edit Preferences</Sheet.Title>
        <Sheet.Description>
          Adjust your preferences here. Click save when you're done.
        </Sheet.Description>
      </Sheet.Header>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="idleDelayInterval" class="text-right">Idle Delay Interval (seconds)</Label>
          <Input id="idleDelayInterval" type="number" bind:value={preferences.idleDelayInterval} min="1" class="col-span-3" />
          {#if errors.idleDelayInterval}
            <p class="text-red-500 text-sm col-start-2 col-span-3">{errors.idleDelayInterval}</p>
          {/if}
        </div>
        <div class="flex items-center justify-between">
          <Label for="showTestNetworks">Show Test Networks</Label>
          <Switch id="showTestNetworks" bind:checked={preferences.showTestNetworks} />
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="dark" class="text-right">Theme</Label>
          <div class="col-span-3">
            <Select.Root onSelectedChange={onSelectedChange}>
              <Select.Trigger class="w-full">
                <Select.Value placeholder="Select theme" />
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  <Select.Label>Theme</Select.Label>
                  {#each themeOptions as option}
                    <Select.Item value={option.value}>
                      {option.label}
                    </Select.Item>
                  {/each}
                </Select.Group>
              </Select.Content>
            </Select.Root>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <Label for="idleAutoLock">Idle Auto Lock</Label>
          <Switch id="idleAutoLock" bind:checked={preferences.idleAutoLock} />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="idleAutoLockCycle" class="text-right">Auto Lock Cycle (seconds)</Label>
          <Input id="idleAutoLockCycle" type="number" bind:value={preferences.idleAutoLockCycle} min="60" class="col-span-3" />
          {#if errors.idleAutoLockCycle}
            <p class="text-red-500 text-sm col-start-2 col-span-3">{errors.idleAutoLockCycle}</p>
          {/if}
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="locale" class="text-right">Locale</Label>
          <Input id="locale" bind:value={preferences.locale} class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="currencyCode" class="text-right">Currency Code</Label>
          <Input id="currencyCode" bind:value={preferences.currency.code} class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="currencySymbol" class="text-right">Currency Symbol</Label>
          <Input id="currencySymbol" bind:value={preferences.currency.symbol} class="col-span-3" />
        </div>
      </div>
      <Sheet.Footer>
        <Sheet.Close let:builder>
          <Button {builder} type="submit" on:click={handleSubmit}>
            Save changes
          </Button>
        </Sheet.Close>
      </Sheet.Footer>
    </Sheet.Content>
  </Sheet.Root>
</div>
