import { stopLockIconTimer } from "$lib/extensions/chrome/iconTimer";
import { TimerManager } from "$lib/plugins/TimerManager";

export async function stopTimers() {
  try {
    // await stopLockIconTimer();

    const timerManager = TimerManager.getInstance();
    if (timerManager) {
      timerManager.stopAll();
    }

  } catch (error) {
    console.log('[ERROR]: Error stopping timers:', error);
  }
}

export async function removeTimers() {
  try {
    const timerManager = TimerManager.getInstance();
    if (timerManager) {
      timerManager.removeAll(); // Stops and then clears all timers
    }

  } catch (error) {
    console.log('[ERROR]: Error removing timers:', error);
  }
}
