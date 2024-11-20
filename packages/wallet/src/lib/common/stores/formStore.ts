// stores/formStore.ts
import { writable } from 'svelte/store';

export const isDirty = writable(false);

export function setDirty(value: boolean) {
  isDirty.set(value);
}

export function resetDirty() {
  isDirty.set(false);
}
