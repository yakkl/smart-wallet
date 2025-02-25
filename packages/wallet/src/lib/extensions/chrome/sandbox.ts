import { log } from "$lib/plugins/Logger";

// This script runs in a restricted environment
window.addEventListener("message", (event) => {
    if (event.origin !== (process.env.DEV_DEBUG ? import.meta.env.VITE_CHROME_DEV_ID : import.meta.env.VITE_CHROME_PROD_ID)) {
      log.info("<><><><> Sandbox - YAKKL event ignored:", event.data, event);
      return;
    }
    log.info("<><><><> Sandbox - Third party event received:", event.data, event);
});
