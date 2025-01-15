import { handleOnMessage, handleOnTabUpdated, handleOnAlarm, onIdleListener, handleOnTabRemoved } from './handlers';
import { browser_ext } from './utils';

export function initializeEvents() {
    browser_ext.runtime.onMessage.addListener(handleOnMessage);
    browser_ext.tabs.onUpdated.addListener(handleOnTabUpdated);
    browser_ext.alarms.onAlarm.addListener(handleOnAlarm);
    browser_ext.idle.onStateChanged.addListener(onIdleListener);
    browser_ext.tabs.onRemoved.addListener(handleOnTabRemoved);
}
