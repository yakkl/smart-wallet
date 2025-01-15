  import { browserSvelte } from '$lib/utilities/browserSvelte';
import { goto } from '$app/navigation';
import { getSettings } from '$lib/common/stores';
import { PATH_LOGIN, PATH_REGISTER } from '$lib/common/constants';
import type { Settings } from '$lib/common/interfaces';

let yakklSettings: Settings | null;

// Routes based on init or isLocked settings else go to register or nothing
export function routeCheckWithSettings() {
  if (browserSvelte) {
    getSettings().then(result => {
      yakklSettings = result;

      if (yakklSettings !== null) {
        if (yakklSettings.init === false) {
          goto(PATH_REGISTER);
        }
        if (yakklSettings.isLocked === true) {
          goto(PATH_LOGIN);
        }
      } else {
        goto(PATH_REGISTER);
      }
    });
  }
  // nothing
}
