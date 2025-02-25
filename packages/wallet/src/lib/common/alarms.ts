import type { Alarms } from 'webextension-polyfill';
import { isBrowserEnv, browser_ext } from './environment';
import { log } from '$lib/plugins/Logger';

type AlarmsAlarm = Alarms.Alarm;

export async function clearAlarm(alarmName: string): Promise<void> {
  if (!alarmName) {
    log.warn('clearAlarm: No alarm name provided.');
    return;
  }

  if (!isBrowserEnv()) {
    log.warn('clearAlarm: Does not believe to be in a browser environment.');
    // return; let it fail silently for now
  }

  try {
    const cleared = await browser_ext.alarms.clear(alarmName);
    if (cleared) {
      log.info(`Alarm "${alarmName}" cleared successfully.`);
    }
  } catch (error) {
    log.error('Clearing alarm:', error);
  }
}
