import { writable } from 'svelte/store';

export const stateStore = writable(false); // false = closed, true = open

export function setStateStore(value: boolean) {
  stateStore.set(value);
}

// Make sure to set this to false when the ui is closed or suspended
