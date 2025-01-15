import { browser_ext } from './utils';

export async function setIconLock() {
    await browser_ext.action.setIcon({
        path: {
            16: "/images/logoBullLock16x16.png",
            32: "/images/logoBullLock32x32.png",
            48: "/images/logoBullLock48x48.png",
            128: "/images/logoBullLock128x128.png"
        }
    });
}

export async function setIconUnlock() {
    await browser_ext.action.setIcon({
        path: {
            16: "/images/logoBull16x16.png",
            32: "/images/logoBull32x32.png",
            48: "/images/logoBull48x48.png",
            128: "/images/logoBull128x128.png"
        }
    });
}

export async function showPopup(url: string) {
    const popup = await browser_ext.windows.create({
        url,
        type: "popup",
        width: 428,
        height: 926,
        focused: true
    });
    return popup;
}
