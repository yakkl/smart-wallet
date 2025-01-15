export function extractDomain(url: string | URL): string {
    const domain = new URL(url).hostname;
    return domain.startsWith("www.") ? domain.slice(4) : domain;
}

// export const browser_ext = typeof browser !== "undefined" ? browser : chrome;
import browser from 'webextension-polyfill';
export const browser_ext = browser;
