import { setIconLock, setIconUnlock } from './ui';
import { isBlacklisted, initializeDatabase } from './database';
import { browser_ext } from './utils';

// Handles runtime.onMessage
export async function handleOnMessage(message: any, sender: any, sendResponse: (response?: any) => void) {
    try {
        switch (message.type) {
            case 'createNotification': {
                const { notificationId, title, messageText } = message.payload;
                await browser_ext.notifications.create(notificationId, {
                    type: 'basic',
                    iconUrl: browser_ext.runtime.getURL('/images/logoBullLock48x48.png'),
                    title: title || 'Notification',
                    message: messageText || 'Default message.'
                });
                sendResponse({ success: true });
                break;
            }
            case 'startLockIconTimer': {
                startLockIconTimer();
                sendResponse({ success: true });
                break;
            }
            case 'stopLockIconTimer': {
                stopLockIconTimer();
                sendResponse({ success: true });
                break;
            }
            default: {
                sendResponse({ success: false, error: 'Unknown message type.' });
            }
        }
    } catch (error: any) {
        console.log('Error handling message:', error);
        sendResponse({ success: false, error: error.message || 'Unknown error occurred.' });
    }
}

// Handles tabs.onUpdated
export async function handleOnTabUpdated(tabId: number, changeInfo: any, tab: any) {
    try {
        if (changeInfo.url) {
            const domain = new URL(changeInfo.url).hostname;
            if (await isBlacklisted(domain)) {
                console.warn(`Blocked phishing domain: ${domain}`);
                const phishingWarningUrl = browser_ext.runtime.getURL(`/phishing.html?site=${domain}&tabId=${tabId}`);
                browser_ext.tabs.update(tabId, { url: phishingWarningUrl });
            }
        }
    } catch (error) {
        console.log('Error in handleOnTabUpdated:', error);
    }
}

// Handles alarms.onAlarm
export async function handleOnAlarm(alarm: any) {
    try {
        if (alarm.name === 'yakkl-lock-alarm') {
            console.log('Lock alarm triggered, locking the wallet.');
            await setIconLock();
        }
    } catch (error) {
        console.log('Error in handleOnAlarm:', error);
    }
}

// Handles idle.onStateChanged
export async function onIdleListener(state: string) {
    try {
        if (state === 'idle') {
            console.log('System is idle. Preparing to lock...');
            browser_ext.alarms.create('yakkl-lock-alarm', { delayInMinutes: 3 });
        } else if (state === 'active') {
            browser_ext.alarms.clear('yakkl-lock-alarm');
            console.log('System is active. Lock alarm cleared.');
        }
    } catch (error) {
        console.log('Error in onIdleListener:', error);
    }
}

// Handles tabs.onRemoved
export function handleOnTabRemoved(tabId: number) {
    try {
        console.log(`Tab ${tabId} removed.`);
        // Cleanup resources for the tab if necessary
    } catch (error) {
        console.log('Error in handleOnTabRemoved:', error);
    }
}

// Lock icon timer management
let lockIconTimer: ReturnType<typeof setInterval> | null = null;

export function startLockIconTimer() {
    if (!lockIconTimer) {
        lockIconTimer = setInterval(async () => {
            console.log('Lock icon timer tick.');
            // Your lock icon logic
            await setIconLock();
        }, 10000); // 10 seconds
    }
}

export function stopLockIconTimer() {
    if (lockIconTimer) {
        clearInterval(lockIconTimer);
        lockIconTimer = null;
    }
}
