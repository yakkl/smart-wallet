import { isBrowserEnv, browserSvelte, browser_ext } from '$lib/common/environment';
import { log } from '$lib/plugins/Logger';

// WIP - do not use
export async function restartExtension() {
  try {
    log.info('Restarting extension...');

    // Open the extension popup after a slight delay
    setTimeout(() => {
      browser_ext.windows.create({
        url: browser_ext.runtime.getURL('popup.html'),
        type: 'popup',
        width: 400,
        height: 600,
      });
    }, 2000); // Adjust delay as needed to allow the extension to reload

    // Reopen the extension popup after reload
    browser_ext.runtime.reload();
  } catch (error) {
    log.error('Failed to restart extension:', false, error);
  }
}
