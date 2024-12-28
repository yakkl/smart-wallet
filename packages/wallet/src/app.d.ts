/// <reference types="@sveltejs/kit" />
/// <reference types="webextension-polyfill" />

// See https://kit.svelte.dev/docs/types#app.d.ts
// for information about these interfaces
declare global {
  const browser_ext: typeof import('webextension-polyfill');

  declare namespace App {
    // interface Locals {}
    // interface Platform {}
    // interface Session {}
    // interface Stuff {}
  }
}

export {};
