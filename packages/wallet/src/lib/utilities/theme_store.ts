import { writable, type Writable } from "svelte/store";
import { browser } from "$app/environment";

export let theme: Writable<string | null>;

if (browser) {
    const storedTheme = localStorage.getItem("theme");
    theme = writable(storedTheme);
    theme.subscribe(value => {
      localStorage.setItem("theme", value === 'dark' ? 'dark' : 'light'); // YAKKL use the system default 
    });
}
