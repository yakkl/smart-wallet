import { isBrowserEnv, browserSvelte, browser_ext } from '$lib/common/environment';

// WIP - do not use
export async function restartExtension() {
  try {
    console.log('Restarting extension...');

    // Reopen the extension popup after reload
    browser_ext.runtime.reload();

    // Open the extension popup after a slight delay
    setTimeout(() => {
      browser_ext.windows.create({
        url: browser_ext.runtime.getURL('popup.html'),
        type: 'popup',
        width: 400,
        height: 600,
      });
    }, 1000); // Adjust delay as needed to allow the extension to reload
  } catch (error) {
    console.log('[ERROR]: Failed to restart extension:', error);
  }
}
