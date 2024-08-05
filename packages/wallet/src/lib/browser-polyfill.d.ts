import type { Browser } from 'webextension-polyfill';

declare global {
  interface Window {
    browser?: Browser;
  }
}

export {};
