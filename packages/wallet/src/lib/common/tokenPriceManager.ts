import { writable, get } from "svelte/store";
import { yakklCombinedTokenStore } from "$lib/common/stores";
import { log } from "$lib/plugins/Logger";
import { PriceManager } from "$lib/plugins/PriceManager";
import { createPriceUpdater } from "./createPriceUpdater";
import { timerManager } from "$lib/plugins/TimerManager";
import type { TokenData } from "$lib/common/interfaces";
import { TIMER_TOKEN_PRICE_CYCLE_TIME } from "./constants";

let priceManager: PriceManager | null = null;
let priceUpdater: any | null = null;

const fetchingActive = writable(false); // Prevents duplicate fetches

// NOTE: May want to pass in priceManager as a parameter to allow for different configurations
export async function updateTokenPrices() {

  if (get(fetchingActive)) return; // Prevent concurrent fetches
  fetchingActive.set(true);

  try {
    const tokens: TokenData[] = get(yakklCombinedTokenStore);  // Ensure we're working with the correct store
    if (tokens.length === 0) {
      return;
    }

    const updatedTokens: TokenData[] = await priceUpdater.fetchPrices(tokens);
    if (!updatedTokens || updatedTokens.length === 0) {
      log.warn("updateTokenPrices: Fetched prices returned empty.");
      return;
    }

    yakklCombinedTokenStore.update(() => updatedTokens);
  } catch (error) {
    log.error("updateTokenPrices: Failed to update token prices", error);
  } finally {
    fetchingActive.set(false);
  }
}

if (timerManager && !timerManager.hasTimer("tokenPriceUpdater")) {
  if (!priceManager) {
    priceManager = new PriceManager();
  }
  if (!priceUpdater) {
    priceUpdater = createPriceUpdater(priceManager);
  }
  // Setup a timer to call `updateTokenPrices()` every 30s
  timerManager.addTimer("tokenPriceUpdater", async () => {
    await updateTokenPrices();
  }, TIMER_TOKEN_PRICE_CYCLE_TIME); // Every 30 seconds or whatever you set it at
}

if (timerManager && !timerManager.isRunning("tokenPriceUpdater")) {
  timerManager.startTimer("tokenPriceUpdater");
}
