import type { Settings } from '$lib/common/interfaces';
import { getObjectFromLocalStorage, setObjectInLocalStorage } from '$lib/common/storage';
import { setIconLock } from '$lib/utilities';
import type { Alarms } from 'webextension-polyfill';
import { browser_ext } from './utils';

type AlarmsAlarm = Alarms.Alarm;


export async function clearAlarm(alarmName: string | undefined): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    browser_ext!.alarms.get(alarmName).then(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      browser_ext!.alarms.clear(alarmName).then(() => {
        // Noop
      });
    });
  } catch (error) {
    console.log('background.js - clear',error);
  }
}

export async function handleOnAlarm(alarm: AlarmsAlarm): Promise<void> {
  try {
    let yakklSettings;
    // try/catch should catch an invalid alarm object
    if (alarm.name === "yakkl-lock-alarm") {
      // Set the lock icon
      await setIconLock();
      yakklSettings = await getObjectFromLocalStorage("settings") as Settings;
      if (yakklSettings) {
        yakklSettings.isLocked = true;
        yakklSettings.isLockedHow = 'idle_system';
        yakklSettings.updateDate = new Date().toISOString();
        await setObjectInLocalStorage('settings', yakklSettings);
        // send a browser notification letting the user know that yakkl locked due to timeout
        // This may need to be sent from the UI layer
        browser_ext!.notifications.create('yakkl-lock', {
          type: 'basic',
          iconUrl: browser_ext!.runtime.getURL('/images/logoBullLock48x48.png'),
          title: 'Security Notification',
          message: 'YAKKL is locked and requires a login due to idle timeout.',
        }).catch((error: any) => {
          console.log('background.js - handleOnAlarm',error);
        });

        // post a message to show login screen
        browser_ext!.runtime.sendMessage({method: 'yak_lockdown'});
      }

      await clearAlarm("yakkl-lock-alarm"); // Clear the alarm so since it forwarded everything
    }
  } catch (error) {
    console.log('background.js - alarm',error);
  }
}
