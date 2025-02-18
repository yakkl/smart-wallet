import { writable, get } from "svelte/store";
import { yakklCombinedTokenStore } from "$lib/common/stores";
import { log } from "$lib/plugins/Logger";
import { PriceManager } from "$lib/plugins/PriceManager";
import { createPriceUpdater } from "./createPriceUpdater";
import { timerManager } from "$lib/plugins/TimerManager";
import type { TokenData } from "$lib/common/interfaces";
import { TOKEN_PRICE_CYCLE_TIME } from "./constants";

const fetchingActive = writable(false); // Prevents duplicate fetches

export async function updateTokenPrices() {
  let priceManager = new PriceManager();
  let priceUpdater = createPriceUpdater(priceManager);

  if (get(fetchingActive)) return; // Prevent concurrent fetches

  log.debug("updateTokenPrices - Starting price update...");
  fetchingActive.set(true);

  try {
    const tokens: TokenData[] = get(yakklCombinedTokenStore);  // Ensure we're working with the correct store
    log.debug("updateTokenPrices: Token List Before Fetch", tokens);

    if (tokens.length === 0) {
      log.debug("updateTokenPrices: No tokens to fetch prices for.");
      return;
    }

    log.debug("updateTokenPrices: Fetching prices for tokens...", tokens);

    const updatedTokens: TokenData[] = await priceUpdater.fetchPrices(tokens);

    if (!updatedTokens || updatedTokens.length === 0) {
      log.warn("updateTokenPrices: Fetched prices returned empty.");
      return;
    }

    log.debug("Before updating store:", get(yakklCombinedTokenStore));

    yakklCombinedTokenStore.update(() => updatedTokens);

    log.debug("After updating store:", get(yakklCombinedTokenStore));

  } catch (error) {
    log.error("updateTokenPrices: Failed to update token prices", error);
  } finally {
    fetchingActive.set(false);
  }
}

log.debug("Setting up token price updater timer...");

// Setup a timer to call `updateTokenPrices()` every 30s
timerManager.addTimer("tokenPriceUpdater", async () => {
  log.debug("Executing tokenPriceUpdater...");
  await updateTokenPrices();
}, TOKEN_PRICE_CYCLE_TIME); // Every 30 seconds

if (!timerManager.isRunning("tokenPriceUpdater")) {
  log.debug("Restarting token price updater timer...");
  timerManager.startTimer("tokenPriceUpdater");
}

log.debug("Token price updater timer started.");
