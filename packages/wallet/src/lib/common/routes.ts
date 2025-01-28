  import { browserSvelte } from '$lib/utilities/browserSvelte';
import { goto } from '$app/navigation';
import { getSettings } from '$lib/common/stores';
import { PATH_LEGAL, PATH_LOGIN, PATH_REGISTER } from '$lib/common/constants';
import type { Settings } from '$lib/common/interfaces';

let yakklSettings: Settings | null;

// Routes based on init or isLocked settings else go to register or nothing
export function routeCheckWithSettings() {
  if (browserSvelte) {
    getSettings().then(result => {
      yakklSettings = result;

      if (yakklSettings !== null) {
        if (yakklSettings?.legal?.termsAgreed !== true) {
          console.log('Terms not agreed - 1');
          goto(PATH_LEGAL);
        }
        if (yakklSettings.init === false) {
          console.log('register');
          goto(PATH_REGISTER);
        }
        if (yakklSettings.isLocked === true) {
          console.log('login');
          goto(PATH_LOGIN);
        }
      }
    });
  }
  // Would default a goto but you can't do that except in a browser
}
