import { browserSvelte } from '$lib/utilities/browserSvelte';

// import browser from 'webextension-polyfill';
import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
import type { Browser } from 'webextension-polyfill';
let browser_ext: Browser;
if (browserSvelte) browser_ext = getBrowserExt();

function isResponseWithSuccess(response: any): response is { success: string } {
  return response && typeof response.success === 'boolean';
}

export async function sendNotificationPing() {
  try {
    const response = await browser_ext.runtime.sendMessage({
      type: 'ping',
    });
    if (isResponseWithSuccess(response)) {
      if (response?.success) {
        console.log('Ping response status:', response.success);
      }
    }
  } catch (error) {
    console.log('No Pong response:', error);
  }
}

export async function sendNotification(title: string, messageText: string) {
  try {
    const response = await browser_ext.runtime.sendMessage({
      type: 'createNotification',
      payload: {
        notificationId: 'yakkl-notification',
        title: title,
        messageText: messageText,
      },
    });
    if (isResponseWithSuccess(response)) {
      if (response?.success) {
        console.log('Notification created successfully');
      }
    }
  } catch (error) {
    console.log('Error sending notification message:', error);
  }
}

export async function sendNotificationStartLockIconTimer() {
  try {
    const response = await browser_ext.runtime.sendMessage({
      type: 'startLockIconTimer',
    });
  } catch (error) {
    console.log('startLockIconTimer error:', error);
  }
}

export async function sendNotificationStopLockIconTimer() {
  try {
    const response = await browser_ext.runtime.sendMessage({
      type: 'stopLockIconTimer',
    });
  } catch (error) {
    console.log('stopLockIconTimer error:', error);
  }
}

