import { writable } from 'svelte/store';

// Shared store for UI state
export const isUsdModeStore = writable(false); // Default is quantity mode
