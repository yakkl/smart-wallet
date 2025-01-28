// listeners/contentListeners.ts
import { ListenerManager } from '$lib/plugins/ListenerManager';
import { browser_ext } from '$lib/common/environment';
import { globalListenerManager } from '$lib/plugins/GlobalListenerManager';

export const contentListenerManager = new ListenerManager();

// Register contentListenerManager globally
globalListenerManager.registerContext('content', contentListenerManager);

function handleMessageFromDapp(message: any, sender: any, sendResponse: any) {
  console.log('Message from dapp:', message);
}

export function addContentListeners() {
  console.log('Adding content listeners...');
  contentListenerManager.add(browser_ext.runtime.onMessage, handleMessageFromDapp);
}

export function removeContentListeners() {
  console.log('Removing content listeners...');
  contentListenerManager.removeAll();
}
