import { globalListenerManager } from "$lib/plugins/GlobalListenerManager";

export function removeListeners() {
  if (globalListenerManager) {
    globalListenerManager.removeAll();
  }
}
