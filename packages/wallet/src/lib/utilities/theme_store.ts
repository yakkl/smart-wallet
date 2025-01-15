import { writable, type Writable } from "svelte/store";
// import { browser } from "$app/environment";
import { browserSvelte } from '$lib/utilities/browserSvelte';

export let theme: Writable<string | null>;

if (browserSvelte) {
    const storedTheme = localStorage.getItem("theme");
    theme = writable(storedTheme);
    theme.subscribe(value => {
      localStorage.setItem("theme", value === 'dark' ? 'dark' : 'light'); // YAKKL use the system default
    });
}
