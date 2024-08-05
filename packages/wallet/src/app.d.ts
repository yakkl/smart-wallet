/// <reference types="@sveltejs/kit" />
/// <reference types="webextension-polyfill" />

// See https://kit.svelte.dev/docs/types#the-app-namespace
// for information about these interfaces
declare namespace App {
	// interface Locals {}
	// interface Platform {}
	// interface Session {}
	// interface Stuff {}
}


declare global {
  const browser_ext: typeof import('webextension-polyfill');
}

export {};
