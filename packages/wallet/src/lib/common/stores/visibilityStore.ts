import { writable } from 'svelte/store';

export const visibilityStore = writable(true); // false = closed, true = open
