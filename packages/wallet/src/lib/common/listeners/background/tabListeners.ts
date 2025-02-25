import { browserSvelte } from "$lib/common/environment";
import { isBlacklisted } from "$lib/extensions/chrome/database";
import { portsExternal } from "$lib/extensions/chrome/ports";
import { log } from "$lib/plugins/Logger";

// Handles tabs.onUpdated
export async function onTabUpdatedListener(tabId: number, changeInfo: any, tab: any) {
  try {
    if (browserSvelte) {
      if (changeInfo.url) {
          const domain = new URL(changeInfo.url).hostname;
        if (await isBlacklisted(domain)) {
          if (changeInfo.url.endsWith('yid=' + tab.id?.toString())) {
            // The user said 'continue to site'
            log.info('Phishing warning but user elected to proceed to:', changeInfo.url);
            // Bypasses check since it has already been done. If the yid=<whatever the id is> is at the end then it will bypass
          } else {
            log.warn('Attempting to navigate to a known or potential phishing site.', changeInfo.url);
            const url = browser_ext.runtime.getURL('/phishing.html?flaggedSite=' + changeInfo.url + '&yid=' + tab.id);
            browser_ext.tabs.update(tabId, { url: url });
          }
        }
      }
    }
  } catch (error) {
    log.error('[ERROR]: Error in OnTabUpdatedListener - error:', error);
  }
}

// Handles tabs.onRemoved
// TODO: Review portsExternal and portsInternal
export function onTabRemovedListener(tabId: number) {
  try {
    if (browserSvelte) {
      if (tabId && portsExternal.size > 0) {
        portsExternal.delete(tabId);
      }
    }
  } catch (error) {
    log.error('Background - tab error',error);
  }
}
