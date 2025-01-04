import { derived } from "svelte/store";
import { yakklTokenDataCustomStore, yakklTokenDataStore } from "./stores";

export const combinedTokenStore = derived(
    [yakklTokenDataStore, yakklTokenDataCustomStore],
    ([$yakklTokenDataStore, $yakklTokenDataCustomStore]) => [
      ...$yakklTokenDataStore,
      ...$yakklTokenDataCustomStore
    ]
  );

