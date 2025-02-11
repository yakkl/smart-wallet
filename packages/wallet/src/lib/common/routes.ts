import { browserSvelte } from '$lib/common/environment';
import { goto } from '$app/navigation';
import { get } from 'svelte/store';
import { PATH_LEGAL, PATH_LOGIN, PATH_REGISTER } from '$lib/common/constants';
import { yakklSettingsStore } from '$lib/common/stores';

// Routes based on init or isLocked settings else go to register or nothing
export async function routeCheckWithSettings() {
  if (browserSvelte) {
    const yakklSettings = get(yakklSettingsStore);
    if (yakklSettings !== null) {
      if (yakklSettings?.legal?.termsAgreed !== true) {
        console.log('Terms not agreed - 1');
        return await goto(PATH_LEGAL);
      }
      if (yakklSettings.init === false) {
        console.log('register');
        return await goto(PATH_REGISTER);
      }
      if (yakklSettings.isLocked === true) {
        console.log('login');
        return await goto(PATH_LOGIN);
      }
    }
  }
  // Would default a goto but you can't do that except in a browser
}
