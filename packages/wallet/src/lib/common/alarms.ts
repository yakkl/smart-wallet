import type { Alarms } from 'webextension-polyfill';
import { isBrowserEnv, browser_ext } from './environment';

type AlarmsAlarm = Alarms.Alarm;

export async function clearAlarm(alarmName: string): Promise<void> {
  if (!alarmName) {
    console.log('clearAlarm: No alarm name provided.');
    return;
  }

  if (!isBrowserEnv()) {
    console.log('clearAlarm: Does not believe to be in a browser environment.');
    // return; let it fail silently for now
  }

  try {
    const cleared = await browser_ext.alarms.clear(alarmName);
    if (cleared) {
      console.log(`Alarm "${alarmName}" cleared successfully.`);
    } 
  } catch (error) {
    console.log('[ERROR]: Clearing alarm:', error);
  }
}
