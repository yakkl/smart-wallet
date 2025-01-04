import { browser as browserSvelte} from "$app/environment";
// import browser from 'webextension-polyfill';
import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
import type { Browser } from 'webextension-polyfill';
let browser_ext: Browser;
if (browserSvelte) browser_ext = getBrowserExt();

export async function sendNotificationPing() {
  browser_ext.runtime.sendMessage({
    type: 'ping',
  }).then((response: any) => {
    if (response?.status) {
      console.log(response.status);
    }
    console.log('Pong response:', response);
  }).catch((error) => {
    console.log('No Pong response', error);
  });
}

export async function sendNotification(title: string, messageText: string) {
  browser_ext.runtime.sendMessage({
    type: 'createNotification',
    payload: {
      notificationId: 'yakkl-notication',
      title: title,
      messageText: messageText,
    },
  }).then((response: any) => {
    // if (response?.success) {
    //   console.log('Notification created successfully');
    // }
    // console.log('Notification response:', response);
  }).catch((error) => {
    console.log('Error sending notification message:', error);
  });
}
