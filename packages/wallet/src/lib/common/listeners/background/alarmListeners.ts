import { clearAlarm } from "$lib/common/alarms";
import { isBrowserEnv, browser_ext } from "$lib/common/environment";
import { handleLockDown } from "$lib/common/handlers";
import { log } from "$lib/plugins/Logger";

export async function onAlarmListener(alarm: any) {
  try {
    if (isBrowserEnv()) {
      if (alarm.name === "yakkl-lock-alarm") {
        // NOTE: If this sendMessage is not working then move 'await NotificationService.sendSecurityAlert' here to make sure context is correct.
        log.debug('Yakkl Lock Alarm Triggered');
        await browser_ext.runtime.sendMessage({type: 'lockdown'});
      } else if (alarm.name === "yakkl-lock-notification") {
        log.debug('Yakkl Lock Notification Triggered');
        await browser_ext.runtime.sendMessage({type: 'lockdownImminent'});
      }
    } else {
      log.info('Yakkl may not be running as a browser extension context from the calling environment.');
    }
  } catch (error) {
    log.error('Background - onAlarmListener:', false, error);
  }
}
