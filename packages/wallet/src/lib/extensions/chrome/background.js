"use strict";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Background actions for the extension...
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showExtensionPopup = showExtensionPopup;
exports.showPopup = showPopup;
exports.showPopupDapp = showPopupDapp;
exports.estimateGas = estimateGas;
// command to debug output
// npx tsc src/lib/extensions/chrome/background.ts src/lib/extensions/chrome/content.ts src/lib/extensions/chrome/inpage.ts --noEmit --skipLibCheck
var storage_1 = require("$lib/common/storage");
var constants_1 = require("$lib/common/constants");
var dataModels_1 = require("$lib/models/dataModels");
var detect_browser_1 = require("detect-browser");
var utils_1 = require("$lib/common/utils");
var upgrades_1 = require("$lib/upgrades/upgrades");
var alchemy_sdk_1 = require("alchemy-sdk");
var dexie_1 = require("dexie");
var browser_polyfill_wrapper_1 = require("$lib/browser-polyfill-wrapper");
var browser_ext = null;
function initializeBrowserExt() {
    browser_ext = (0, browser_polyfill_wrapper_1.getBrowserExt)();
}
// (() => {
initializeBrowserExt();
// })();
// Example: const browser_ext = ensureBrowserExt();
//  browser_ext.runtime.onInstalled.addListener(handleOnInstalledUpdated);
// function ensureBrowserExt(): Browser {
//   const ext = getBrowserExt();
//   if (!ext) {
//     throw new Error('Browser extension API not available');
//   }
//   return ext;
// }
// Another option:
// function isBrowserExtAvailable(ext: any): ext is Browser {
//   return ext && typeof ext.runtime !== 'undefined';
// }
// const browser_ext = getBrowserExt();
// if (isBrowserExtAvailable(browser_ext)) {
//   browser_ext.runtime.onInstalled.addListener(handleOnInstalledUpdated);
// } else {
//   console.log('Browser extension API not available');
// }
function setIconLock() {
    return __awaiter(this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (!browser_ext) {
                        console.log("background: setIconLock - browser_ext is not initialized");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, browser_ext.action.setIcon({
                            path: {
                                16: "/images/logoBullLock16x16.png",
                                32: "/images/logoBullLock32x32.png",
                                48: "/images/logoBullLock48x48.png",
                                128: "/images/logoBullLock128x128.png"
                            }
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    console.log("Error setting lock icon:", e_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function setIconUnlock() {
    return __awaiter(this, void 0, void 0, function () {
        var e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (!browser_ext) {
                        console.log("background: setIconUnLock - browser_ext is not initialized");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, browser_ext.action.setIcon({
                            path: {
                                16: "/images/logoBull16x16.png",
                                32: "/images/logoBull32x32.png",
                                48: "/images/logoBull48x48.png",
                                128: "/images/logoBull128x128.png"
                            }
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_2 = _a.sent();
                    console.log("Error setting unlock icon:", e_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// NOTE: Any console.log output only shows up in the YAKKL® Smart Wallet console and NOT the dApp. Inpagejs and content.js will show up in the dApp only!
// There can be multiple browser tabs attempting to communicate with the backend service. Use the sender.tab.id as an index so the communication is with the correct
// tab
// eslint-disable-next-line prefer-const
var requestsExternal = new Map();
// let dappParams = []; // Handles actual params passed from dapps
// let metaDataParams = []; // Handles metadata passed from dapps
// let dappPort;
// eslint-disable-next-line prefer-const
var portsDapp = [];
// eslint-disable-next-line prefer-const
var portsInternal = [];
// eslint-disable-next-line prefer-const
var providers = new Map();
var portsExternal = new Map();
var openWindows = new Map();
var openPopups = new Map();
// let favIconDapp: string;
// let domainDapp: string;
// let titleDapp: string;
// let messageDapp: string;
// let contextDapp: string;
// let transactionDapp;
// let mainWindowId;
var mainPort;
var idleAutoLockCycle = 3; // 3 (default) 'idle' counter ticks before being able to lock the account
var BlacklistDatabase = /** @class */ (function (_super) {
    __extends(BlacklistDatabase, _super);
    function BlacklistDatabase() {
        var _this = _super.call(this, "BlacklistDatabase") || this;
        _this.version(1).stores({
            domains: 'domain'
        });
        return _this;
    }
    return BlacklistDatabase;
}(dexie_1.default));
var db = new BlacklistDatabase();
db.version(1).stores({
    domains: 'domain'
});
// Extract the domain from a URL
function extractDomain(url) {
    var domain = new URL(url).hostname;
    if (domain.startsWith('www.')) { // May want to be more flexible and check number of '.', if more than one then reverse domain string and travers until second '.' and remove from that point onward, and then reverse the string back
        return domain.slice(4);
    }
    return domain;
}
function initializeDatabase(override) {
    return __awaiter(this, void 0, void 0, function () {
        var count, response, data, e_3;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 8, , 9]);
                    if (!(override === true)) return [3 /*break*/, 2];
                    return [4 /*yield*/, ((_a = db.domains) === null || _a === void 0 ? void 0 : _a.clear())];
                case 1:
                    _d.sent();
                    _d.label = 2;
                case 2: return [4 /*yield*/, ((_b = db.domains) === null || _b === void 0 ? void 0 : _b.count())];
                case 3:
                    count = _d.sent();
                    if (!(count === 0)) return [3 /*break*/, 7];
                    return [4 /*yield*/, fetch(browser_ext.runtime.getURL("/data/lists.json"))];
                case 4:
                    response = _d.sent();
                    return [4 /*yield*/, response.json()];
                case 5:
                    data = _d.sent();
                    // Bulk add to Dexie
                    return [4 /*yield*/, ((_c = db.domains) === null || _c === void 0 ? void 0 : _c.bulkAdd(data.blacklist.map(function (domain) { return ({ domain: domain }); })))];
                case 6:
                    // Bulk add to Dexie
                    _d.sent();
                    _d.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8:
                    e_3 = _d.sent();
                    console.log(e_3);
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
// Check if domain is blacklisted
function isBlacklisted(domain) {
    return __awaiter(this, void 0, void 0, function () {
        var found;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ((_a = db.domains) === null || _a === void 0 ? void 0 : _a.get({ domain: domain }))];
                case 1:
                    found = _b.sent();
                    return [2 /*return*/, !!found];
            }
        });
    });
}
try {
    browser_ext.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) { return __awaiter(void 0, void 0, void 0, function () {
        var domain, url;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!changeInfo.url) return [3 /*break*/, 2];
                    domain = extractDomain(changeInfo.url);
                    return [4 /*yield*/, isBlacklisted(domain)];
                case 1:
                    if (_b.sent()) {
                        if (changeInfo.url.endsWith('yid=' + ((_a = tab.id) === null || _a === void 0 ? void 0 : _a.toString()))) {
                            // The user said 'continue to site'
                            console.log('Phishing warning but user elected to proceed to:', changeInfo.url);
                            // Bypasses check since it has already been done. If the yid=<whatever the id is> is at the end then it will bypass
                        }
                        else {
                            console.log('Warning: Attempting to navigate to a known or potential phishing site.', changeInfo.url);
                            url = browser_ext.runtime.getURL('/phishing.html?flaggedSite=' + changeInfo.url + '&yid=' + tab.id);
                            browser_ext.tabs.update(tabId, { url: url });
                        }
                    }
                    _b.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    }); });
}
catch (e) {
    console.log(e);
}
// Call as soon as possible...
try {
    if (!browser_ext.runtime.onInstalled.hasListener(handleOnInstalledUpdated)) {
        browser_ext.runtime.onInstalled.addListener(handleOnInstalledUpdated);
    }
}
catch (error) {
    console.log('background.js - onInstalled error', error);
}
try {
    if (!browser_ext.runtime.onConnect.hasListener(onConnect)) {
        browser_ext.runtime.onConnect.addListener(onConnect);
    }
}
catch (error) {
    console.log('background.js - onConnect error', error);
}
try {
    if (!browser_ext.idle.onStateChanged.hasListener(onIdleListener)) {
        browser_ext.idle.onStateChanged.addListener(onIdleListener);
    }
}
catch (error) {
    console.log('background.js - onStateChanged error', error);
}
try {
    if (!browser_ext.alarms.onAlarm.hasListener(handleOnAlarm)) {
        browser_ext.alarms.onAlarm.addListener(handleOnAlarm);
    }
}
catch (error) {
    console.log('background.js - onAlarm error', error);
}
try {
    browser_ext.runtime.onSuspend.addListener(handleOnSuspend);
}
catch (error) {
    console.log('background.js - onSuspend error', error);
}
// try {
//   browser_ext!.runtime.onMessage.addListener(handleOnMessage); // For onetime messages
// } catch (error) {
//   console.log('background.js - onMessage error',error);
// }
try {
    browser_ext.tabs.onRemoved.addListener(function (tabId) {
        try {
            if (tabId && portsExternal.size > 0) {
                portsExternal.delete(tabId);
            }
        }
        catch (error) {
            console.log('background.js - tab error', error);
        }
    });
}
catch (error) {
    console.log('background.js - tab error', error);
}
/*********************************/
// EIP-6963 
try {
    browser_ext.runtime.onConnect.addListener(function (port) {
        port.onMessage.addListener(function (message) {
            // console.log('Received message from content script:', message);
            // Handle the message from the content script
            if (message.type === 'YAKKL_REQUEST:EIP6963') {
                var id_1 = message.id, method = message.method, params = message.params;
                // console.log('Received EIP-6963 request:', method, params);
                // Process the request or forward it to the Ethereum node
                handleRequest(method, params).then(function (result) {
                    // console.log('Sending EIP-6963 response:', result);
                    port.postMessage({ id: id_1, result: result, type: 'YAKKL_RESPONSE:EIP6963' });
                }).catch(function (error) {
                    port.postMessage({ id: id_1, error: error.message, type: 'YAKKL_RESPONSE:EIP6963' });
                });
            }
        });
    });
}
catch (error) {
    console.log('background.js - EIP6963 error', error);
}
function handleRequest(method, params) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Implement your request handling logic here
            // For example, you can call the Ethereum node or perform other actions
            return [2 /*return*/, { success: true }];
        });
    });
}
/*********************************/
// Supposed to fire when extension is about to close but...
function handleOnSuspend() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, setIconLock()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleOnInstalledUpdated(details) {
    return __awaiter(this, void 0, void 0, function () {
        var platform, count, e_4;
        var _this = this;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 12, , 13]);
                    return [4 /*yield*/, browser_ext.runtime.getPlatformInfo()];
                case 1:
                    platform = _b.sent();
                    openWindows.clear();
                    openPopups.clear();
                    if (!(details && details.reason === "install")) return [3 /*break*/, 5];
                    return [4 /*yield*/, initializeDatabase(false)];
                case 2:
                    _b.sent();
                    // This only happens on initial install to set the defaults
                    dataModels_1.yakklStoredObjects.forEach(function (element) { return __awaiter(_this, void 0, void 0, function () {
                        var error_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, (0, storage_1.setObjectInLocalStorage)(element.key, element.value)];
                                case 1:
                                    _a.sent();
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_1 = _a.sent();
                                    console.log("Error setting default for ".concat(element.key, ":"), error_1);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, browser_ext.runtime.setUninstallURL(encodeURI("https://yakkl.com?userName=&utm_source=yakkl&utm_medium=extension&utm_campaign=uninstall&utm_content=" + "".concat(constants_1.VERSION) + "&utm_term=extension"))];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, setLocalObjectStorage(platform, false)];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    if (!(details && details.reason === "update")) return [3 /*break*/, 8];
                    if (!(details.previousVersion !== browser_ext.runtime.getManifest().version)) return [3 /*break*/, 8];
                    return [4 /*yield*/, initializeDatabase(true)];
                case 6:
                    _b.sent(); // This will clear the db and then import again
                    return [4 /*yield*/, setLocalObjectStorage(platform, false)];
                case 7:
                    _b.sent(); //true); // Beta version to 1.0.0 will not upgrade due to complete overhaul of the extension. After 1.0.0, upgrades will be handled.
                    _b.label = 8;
                case 8: return [4 /*yield*/, ((_a = db.domains) === null || _a === void 0 ? void 0 : _a.count())];
                case 9:
                    count = _b.sent();
                    if (!(count === 0)) return [3 /*break*/, 11];
                    return [4 /*yield*/, initializeDatabase(false)];
                case 10:
                    _b.sent();
                    _b.label = 11;
                case 11: return [3 /*break*/, 13];
                case 12:
                    e_4 = _b.sent();
                    console.log(e_4);
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/];
            }
        });
    });
}
function setLocalObjectStorage(platform_1) {
    return __awaiter(this, arguments, void 0, function (platform, upgradeOption) {
        var yakklSettings, prevVersion, yakklPreferences_1, browserPlatform, e_5;
        var _a, _b, _c, _d, _e;
        if (upgradeOption === void 0) { upgradeOption = false; }
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, (0, storage_1.getObjectFromLocalStorage)("settings")];
                case 1:
                    yakklSettings = _f.sent();
                    prevVersion = (_a = yakklSettings === null || yakklSettings === void 0 ? void 0 : yakklSettings.version) !== null && _a !== void 0 ? _a : '0.0.0';
                    if (upgradeOption) {
                        (0, upgrades_1.upgrade)(prevVersion, constants_1.VERSION);
                    }
                    return [4 /*yield*/, (0, storage_1.getObjectFromLocalStorage)("preferences")];
                case 2:
                    yakklPreferences_1 = _f.sent();
                    if (yakklPreferences_1) {
                        idleAutoLockCycle = (_b = yakklPreferences_1.idleAutoLockCycle) !== null && _b !== void 0 ? _b : 3;
                    }
                    else {
                        idleAutoLockCycle = 3;
                    }
                    if (!yakklSettings) return [3 /*break*/, 4];
                    yakklSettings.previousVersion = yakklSettings.version;
                    yakklSettings.version = constants_1.VERSION;
                    yakklSettings.updateDate = new Date().toISOString();
                    yakklSettings.upgradeDate = yakklSettings.updateDate;
                    yakklSettings.lastAccessDate = yakklSettings.updateDate;
                    if (platform !== null) {
                        browserPlatform = (0, detect_browser_1.detect)();
                        yakklSettings.platform.arch = platform.arch;
                        yakklSettings.platform.os = platform.os;
                        yakklSettings.platform.browser = (_c = browserPlatform === null || browserPlatform === void 0 ? void 0 : browserPlatform.name) !== null && _c !== void 0 ? _c : '';
                        yakklSettings.platform.browserVersion = (_d = browserPlatform === null || browserPlatform === void 0 ? void 0 : browserPlatform.version) !== null && _d !== void 0 ? _d : '';
                        yakklSettings.platform.platform = (_e = browserPlatform === null || browserPlatform === void 0 ? void 0 : browserPlatform.type) !== null && _e !== void 0 ? _e : '';
                    }
                    return [4 /*yield*/, (0, storage_1.setObjectInLocalStorage)('settings', yakklSettings)];
                case 3:
                    _f.sent();
                    _f.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    e_5 = _f.sent();
                    console.log('setLocalObjectStorage Error', e_5);
                    throw e_5;
                case 6: return [2 /*return*/];
            }
        });
    });
}
function onDisconnectListener(port) {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    if (browser_ext.runtime.lastError) {
                        console.log('background.js - lastError', browser_ext.runtime.lastError);
                    }
                    if (!port) return [3 /*break*/, 3];
                    if (!(port.name === "yakkl")) return [3 /*break*/, 2];
                    return [4 /*yield*/, setIconLock()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    port.onDisconnect.removeListener(onDisconnectListener);
                    if (mainPort === port) {
                        mainPort = undefined;
                    }
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.log('background.js - onDisconnectListener error', error_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// TODO: Fix this to have a better type of parameters
// This section registers when the content and background services are connected.
function onConnect(port) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 11, , 12]);
                    if (!port) {
                        throw "Port was undefined for onConnect.";
                    }
                    // TBD - Think about this. Is it really the only port?????????
                    mainPort = port;
                    if (port.sender && port.sender.tab && port.name === constants_1.YAKKL_EXTERNAL) {
                        portsExternal.set(port.sender.tab.id, port);
                    }
                    else if (port.name === constants_1.YAKKL_DAPP) {
                        portsDapp.push(port);
                    }
                    else {
                        portsInternal.push(port);
                    }
                    // TBD - NOTE: May want to move to .sendMessage for sending popup launch messages!!!!!!!
                    // May want to revist this and simplify
                    if (port.onDisconnect && port.onDisconnect.hasListener && !port.onDisconnect.hasListener(onDisconnectListener)) {
                        port.onDisconnect.addListener(onDisconnectListener);
                    }
                    _a = port.name;
                    switch (_a) {
                        case "yakkl": return [3 /*break*/, 1];
                        case constants_1.YAKKL_SPLASH: return [3 /*break*/, 3];
                        case constants_1.YAKKL_INTERNAL: return [3 /*break*/, 4];
                        case constants_1.YAKKL_EXTERNAL: return [3 /*break*/, 5];
                        case constants_1.YAKKL_ETH: return [3 /*break*/, 6];
                        case constants_1.YAKKL_DAPP: return [3 /*break*/, 7];
                        case constants_1.YAKKL_PROVIDER_EIP6963: return [3 /*break*/, 8];
                    }
                    return [3 /*break*/, 9];
                case 1: return [4 /*yield*/, setIconUnlock()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 10];
                case 3:
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-ignore
                    if (port.onMessage && port.onMessage.hasListener && !port.onMessage.hasListener(onPopupLaunch)) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        //@ts-ignore
                        port.onMessage.addListener(onPopupLaunch);
                    }
                    return [3 /*break*/, 10];
                case 4:
                    // Now find out the message payload
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-ignore
                    if (port.onMessage && port.onMessage.hasListener && !port.onMessage.hasListener(onPortInternalListener)) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        //@ts-ignore
                        port.onMessage.addListener(onPortInternalListener);
                    }
                    return [3 /*break*/, 10];
                case 5:
                    // Now find out the message payload
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-ignore
                    if (port.onMessage && port.onMessage.hasListener && !port.onMessage.hasListener(onPortExternalListener)) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        //@ts-ignore
                        port.onMessage.addListener(onPortExternalListener);
                    }
                    return [3 /*break*/, 10];
                case 6:
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-ignore
                    if (port.onMessage && port.onMessage.hasListener && !port.onMessage.hasListener(onEthereumListener)) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        //@ts-ignore
                        port.onMessage.addListener(onEthereumListener);
                    }
                    return [3 /*break*/, 10];
                case 7:
                    // dappPort = port;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-ignore
                    if (port.onMessage && port.onMessage.hasListener && !port.onMessage.hasListener(onDappListener)) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        //@ts-ignore
                        port.onMessage.addListener(onDappListener);
                    }
                    return [3 /*break*/, 10];
                case 8:
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-ignore
                    if (port.onMessage && port.onMessage.hasListener && !port.onMessage.hasListener(onEIP6963Listener)) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        //@ts-ignore
                        port.onMessage.addListener(onEIP6963Listener);
                    }
                    return [3 /*break*/, 10];
                case 9: throw "Message ".concat(port.name, " is not supported");
                case 10: return [3 /*break*/, 12];
                case 11:
                    error_3 = _b.sent();
                    console.log("YAKKL: " + error_3);
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    });
}
// Onetime messages
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleOnMessage(request, sender) {
    try {
        if (request && request.method) {
            switch (request.method) {
                case '':
                    break;
            }
        }
    }
    catch (error) {
        console.log(error);
    }
}
function onPortInternalListener(event) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(event && event.method)) return [3 /*break*/, 5];
                    _a = event.method;
                    switch (_a) {
                        case 'int_screen': return [3 /*break*/, 1];
                        case 'close': return [3 /*break*/, 2];
                    }
                    return [3 /*break*/, 4];
                case 1:
                    // browser_ext!.storage.local.get(STORAGE_YAKKL_PREFERENCES).then(async (result: any) => {
                    //   const yakkl = result['yakklPreferences'];
                    //   yakkl.preferences.screenWidth = event.data.availWidth;
                    //   yakkl.preferences.screenHeight = event.data.availHeight;
                    //   await browser_ext!.storage.local.set({"preferences": yakkl});
                    // });
                    updateScreenPreferences(event);
                    return [3 /*break*/, 5];
                case 2: return [4 /*yield*/, setIconLock()];
                case 3:
                    _b.sent();
                    openPopups.clear();
                    openWindows.clear();
                    // browser_ext!.storage.session.clear();
                    return [3 /*break*/, 5];
                case 4: return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function updateScreenPreferences(event) {
    return __awaiter(this, void 0, void 0, function () {
        var yakklPreferences_2, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (typeof browser_ext === 'undefined') {
                        console.log('Browser extension API is not available.');
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, (0, storage_1.getObjectFromLocalStorage)('yakklPreferences')];
                case 2:
                    yakklPreferences_2 = _a.sent();
                    if (!yakklPreferences_2) return [3 /*break*/, 4];
                    yakklPreferences_2.preferences.screenWidth = event.data.availWidth;
                    yakklPreferences_2.preferences.screenHeight = event.data.availHeight;
                    return [4 /*yield*/, (0, storage_1.setObjectInLocalStorage)('preferences', yakklPreferences_2)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    console.log('yakklPreferences not found.');
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_4 = _a.sent();
                    console.log('Error updating yakklPreferences:', error_4);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function checkDomain(domain) {
    return __awaiter(this, void 0, void 0, function () {
        var yakklBlockList, e_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, storage_1.getObjectFromLocalStorage)("yakklBlockList")];
                case 1:
                    yakklBlockList = _a.sent();
                    if (yakklBlockList) {
                        if (yakklBlockList.find(function (obj) { return obj.domain === domain; })) {
                            return [2 /*return*/, Promise.resolve(true)];
                        }
                    }
                    return [2 /*return*/, Promise.resolve(false)];
                case 2:
                    e_6 = _a.sent();
                    console.log(e_6);
                    Promise.reject(e_6);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
function onPortExternalListener(event, sender) {
    return __awaiter(this, void 0, void 0, function () {
        var yakklCurrentlySelected, error, externalData, _a, response, block, value_1, value, chainId, supported, value, value, error_5;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    _o.trys.push([0, 22, , 23]);
                    if (!event.method) return [3 /*break*/, 20];
                    yakklCurrentlySelected = void 0;
                    error = false;
                    externalData = event;
                    externalData.sender = sender;
                    switch (event.method) {
                        case 'yak_dappsite':
                            // This is a WIP. DappIndicator.svelte is done and the messaging here is complete. Content.ts needs to send the site to here!
                            browser_ext.runtime.sendMessage({ method: event.method }); // This sends the message to the UI for it to display 'DAPP'. Later we can add which site if we need to.
                            return [2 /*return*/];
                        case 'yak_checkdomain':
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            checkDomain(event.params[0]).then(function (result) {
                                // WIP - Need to update the background.ts in yakkl to build the db from the json file and then have the inpage.ts send the domain to content.ts which will ask background.ts to check it. If it's flagged, then we'll redirect to this page. My concern is the performance of this. We'll need to test it.
                            });
                            break;
                    }
                    return [4 /*yield*/, (0, storage_1.getObjectFromLocalStorage)("yakklCurrentlySelected")];
                case 1:
                    // This needs to be checked. If the user has never selected a default account then the needed values will not be present and errors will occur.
                    // If this occurs, close the approval popup, launch Yakkl Extension, select a default account and a default network type (default is mainnet), close Yakkl and then connect the Dapp.
                    yakklCurrentlySelected = (_o.sent());
                    if (!yakklCurrentlySelected || ((_c = (_b = yakklCurrentlySelected.shortcuts) === null || _b === void 0 ? void 0 : _b.accountName) === null || _c === void 0 ? void 0 : _c.trim().length) === 0 || ((_e = (_d = yakklCurrentlySelected.shortcuts) === null || _d === void 0 ? void 0 : _d.address) === null || _e === void 0 ? void 0 : _e.trim().length) === 0) {
                        if (error)
                            return [2 /*return*/];
                        if (!error) {
                            error = true;
                            requestsExternal.set(event.id.toString(), { data: 'It appears that your currently selected account in Yakkl has not been set or initialized. After this window closes, login to the Yakkl Browser Extension as normal. If no account is showing on the card then select an account from the account list. Then select which network to use. By default this is the `LIVE - Mainnet` but you can also select from the `SIM` types if you only want to simulate/test first before allow this dApp to have access to any account. Once you have selected the account and network type simply logout or close the window. Now, re-run the dApp request again. If there is still an issue then please open a ticket detailing with this information. Thank you!' });
                            showDappPopup('/dapp/popups/warning.html?requestId=' + Number(event.id).toString());
                            return [2 /*return*/];
                        }
                    }
                    requestsExternal.set(Number(event.id).toString(), { data: externalData });
                    if (externalData === null || externalData === void 0 ? void 0 : externalData.metaDataParams) {
                        // favIconDapp = externalData.metaDataParams.icon;
                        // domainDapp = externalData.metaDataParams.domain;
                        // titleDapp = externalData.metaDataParams.title;
                        // messageDapp = externalData.metaDataParams.message;
                        // contextDapp = externalData.metaDataParams.context;
                        switch (event.method) {
                            case 'eth_sendTransaction':
                            case 'eth_estimateGas':
                            case 'eth_signTypedData_v3':
                            case 'eth_signTypedData_v4':
                            case 'personal_sign':
                            case 'wallet_addEthereumChain':
                                // transactionDapp = externalData.metaDataParams.transaction;
                                break;
                        }
                    }
                    _a = event.method;
                    switch (_a) {
                        case 'eth_requestAccounts': return [3 /*break*/, 2];
                        case 'wallet_requestPermissions': return [3 /*break*/, 2];
                        case 'eth_sendTransaction': return [3 /*break*/, 3];
                        case 'eth_signTypedData_v3': return [3 /*break*/, 4];
                        case 'eth_signTypedData_v4': return [3 /*break*/, 4];
                        case 'personal_sign': return [3 /*break*/, 4];
                        case 'eth_estimateGas': return [3 /*break*/, 5];
                        case 'eth_getBlockByNumber': return [3 /*break*/, 8];
                        case 'wallet_addEthereumChain': return [3 /*break*/, 9];
                        case 'wallet_switchEthereumChain': return [3 /*break*/, 10];
                        case 'eth_chainId': return [3 /*break*/, 14];
                        case 'net_version': return [3 /*break*/, 16];
                    }
                    return [3 /*break*/, 18];
                case 2:
                    showDappPopup('/dapp/popups/approve.html?requestId=' + Number(event.id).toString());
                    return [3 /*break*/, 19];
                case 3:
                    showDappPopup('/dapp/popups/transactions.html?requestId=' + Number(event.id).toString());
                    return [3 /*break*/, 19];
                case 4:
                    showDappPopup('/dapp/popups/sign.html?requestId=' + Number(event.id).toString());
                    return [3 /*break*/, 19];
                case 5:
                    if (!((_f = yakklCurrentlySelected === null || yakklCurrentlySelected === void 0 ? void 0 : yakklCurrentlySelected.shortcuts) === null || _f === void 0 ? void 0 : _f.chainId)) return [3 /*break*/, 7];
                    return [4 /*yield*/, estimateGas(yakklCurrentlySelected.shortcuts.chainId, event.params, process.env.VITE_ALCHEMY_API_KEY_PROD)];
                case 6:
                    response = _o.sent();
                    sender.postMessage({ id: event.id, method: event.method, type: 'YAKKL_RESPONSE', result: response });
                    _o.label = 7;
                case 7: return [3 /*break*/, 19];
                case 8:
                    if ((_g = yakklCurrentlySelected === null || yakklCurrentlySelected === void 0 ? void 0 : yakklCurrentlySelected.shortcuts) === null || _g === void 0 ? void 0 : _g.chainId) {
                        block = (_h = event === null || event === void 0 ? void 0 : event.params[0]) !== null && _h !== void 0 ? _h : 'latest';
                        getBlock(yakklCurrentlySelected.shortcuts.chainId, block, process.env.VITE_ALCHEMY_API_KEY_PROD).then(function (result) {
                            value_1 = result;
                            sender.postMessage({ id: event.id, method: event.method, type: 'YAKKL_RESPONSE', result: value_1 });
                        });
                    }
                    return [3 /*break*/, 19];
                case 9:
                    sender.postMessage({ id: event.id, method: event.method, type: 'YAKKL_RESPONSE', result: null });
                    return [3 /*break*/, 19];
                case 10:
                    value = null;
                    if (!(((_j = event === null || event === void 0 ? void 0 : event.params) === null || _j === void 0 ? void 0 : _j.length) > 0)) return [3 /*break*/, 13];
                    chainId = event.params[0];
                    supported = (0, utils_1.supportedChainId)(chainId);
                    if (!supported) return [3 /*break*/, 13];
                    return [4 /*yield*/, (0, storage_1.getObjectFromLocalStorage)("yakklCurrentlySelected")];
                case 11:
                    yakklCurrentlySelected = (_o.sent());
                    if (!((_k = yakklCurrentlySelected === null || yakklCurrentlySelected === void 0 ? void 0 : yakklCurrentlySelected.shortcuts) === null || _k === void 0 ? void 0 : _k.chainId)) return [3 /*break*/, 13];
                    value = yakklCurrentlySelected.shortcuts.chainId === chainId ? null : chainId;
                    if (!value) return [3 /*break*/, 13];
                    yakklCurrentlySelected.shortcuts.chainId = chainId;
                    return [4 /*yield*/, (0, storage_1.setObjectInLocalStorage)('yakklCurrentlySelected', yakklCurrentlySelected)];
                case 12:
                    _o.sent();
                    _o.label = 13;
                case 13:
                    sender.postMessage({ id: event.id, method: event.method, type: 'YAKKL_RESPONSE', result: value });
                    return [3 /*break*/, 19];
                case 14: return [4 /*yield*/, (0, storage_1.getObjectFromLocalStorage)("yakklCurrentlySelected")];
                case 15:
                    yakklCurrentlySelected = (_o.sent());
                    if ((_l = yakklCurrentlySelected === null || yakklCurrentlySelected === void 0 ? void 0 : yakklCurrentlySelected.shortcuts) === null || _l === void 0 ? void 0 : _l.chainId) {
                        value = yakklCurrentlySelected.shortcuts.chainId;
                        sender.postMessage({ id: event.id, method: event.method, type: 'YAKKL_RESPONSE', result: value });
                    }
                    else {
                        sender.postMessage({ id: event.id, method: event.method, type: 'YAKKL_RESPONSE', result: 1 }); // Default to mainnet
                    }
                    return [3 /*break*/, 19];
                case 16: return [4 /*yield*/, (0, storage_1.getObjectFromLocalStorage)("yakklCurrentlySelected")];
                case 17:
                    yakklCurrentlySelected = (_o.sent());
                    if ((_m = yakklCurrentlySelected === null || yakklCurrentlySelected === void 0 ? void 0 : yakklCurrentlySelected.shortcuts) === null || _m === void 0 ? void 0 : _m.chainId) {
                        value = yakklCurrentlySelected.shortcuts.chainId.toString();
                        sender.postMessage({ id: event.id, method: event.method, type: 'YAKKL_RESPONSE', result: value });
                    }
                    return [3 /*break*/, 19];
                case 18: return [3 /*break*/, 19];
                case 19: return [3 /*break*/, 21];
                case 20:
                    sender.postMessage({ id: event.id, method: event.method, type: 'YAKKL_RESPONSE', error: { code: 4200, message: 'The requested method is not supported by this Ethereum provider.' } });
                    _o.label = 21;
                case 21: return [3 /*break*/, 23];
                case 22:
                    error_5 = _o.sent();
                    sender.postMessage({ id: event.id, method: event.method, type: 'YAKKL_RESPONSE', error: { code: -1, message: error_5 } });
                    return [3 /*break*/, 23];
                case 23: return [2 /*return*/];
            }
        });
    });
}
function onDappListener(event, sender) {
    return __awaiter(this, void 0, void 0, function () {
        var data, data, data, requestData, sender_1, data, requestData, sender_2;
        return __generator(this, function (_a) {
            try {
                switch (event === null || event === void 0 ? void 0 : event.method) {
                    case 'get_warning':
                        if (Number(event === null || event === void 0 ? void 0 : event.id) >= 0) {
                            data = requestsExternal.get(Number(event.id).toString());
                            if (data) {
                                sender.postMessage({ method: 'get_warning', data: data });
                            }
                            else {
                                // post a message to close the popup
                                // send to content.ts an error!!
                            }
                        }
                        else {
                            throw 'No id is present - rejected';
                        }
                        break;
                    case 'get_params':
                        if (Number(event === null || event === void 0 ? void 0 : event.id) >= 0) {
                            data = requestsExternal.get(Number(event.id).toString());
                            if (data) {
                                sender.postMessage({ method: 'get_params', data: data });
                            }
                            else {
                                sender.postMessage({ method: 'reject' });
                            }
                        }
                        else {
                            throw 'No id is present - rejected';
                        }
                        break;
                    case 'error':
                        {
                            data = requestsExternal.get(Number(event.id).toString());
                            if (data) {
                                requestData = data.data;
                                sender_1 = requestData.sender;
                                if (sender_1) {
                                    sender_1.postMessage({ id: event.id, method: event.method, type: 'YAKKL_RESPONSE', data: event.response.data });
                                }
                            }
                        }
                        break;
                    default: // Relays to content.ts
                        {
                            data = requestsExternal.get(Number(event.id).toString());
                            if (data) {
                                requestData = data.data;
                                sender_2 = requestData.sender;
                                if (sender_2) {
                                    sender_2.postMessage(event);
                                }
                                else {
                                    throw 'Connection to port has been disconnected - rejected';
                                }
                            }
                            else {
                                throw 'No data is present - rejected';
                            }
                        }
                        break;
                }
            }
            catch (error) {
                console.log(error);
                sender.postMessage({ id: event.id, method: event.method, type: 'YAKKL_RESPONSE', data: { code: -1, message: error } });
            }
            return [2 /*return*/];
        });
    });
}
function showDappPopup(request) {
    return __awaiter(this, void 0, void 0, function () {
        var popupId_1, error_6;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    popupId_1 = openPopups.get('popupId');
                    if (!popupId_1) return [3 /*break*/, 1];
                    browser_ext.windows.get(popupId_1).then(function (_result) { return __awaiter(_this, void 0, void 0, function () {
                        var _this = this;
                        return __generator(this, function (_a) {
                            browser_ext.windows.update(popupId_1, { focused: true }).then(function (__result) {
                                return;
                            }).catch(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    showPopupDapp(request);
                                    return [2 /*return*/];
                                });
                            }); });
                            return [2 /*return*/];
                        });
                    }); }).catch(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            showPopupDapp(request);
                            return [2 /*return*/];
                        });
                    }); });
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, showPopupDapp(request)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_6 = _a.sent();
                    console.log('background.js - showDappPopup error:', error_6);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Has to check the method here too since this function gets called from different places
function onPopupLaunch(m, p) {
    return __awaiter(this, void 0, void 0, function () {
        var error_7;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    if (!(m.popup && m.popup === "YAKKL: Splash")) return [3 /*break*/, 2];
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    return [4 /*yield*/, browser_ext.storage.session.get('windowId').then(function (result) { return __awaiter(_this, void 0, void 0, function () {
                            var windowId;
                            var _this = this;
                            return __generator(this, function (_a) {
                                windowId = undefined;
                                if (result) {
                                    windowId = result.windowId;
                                }
                                if (windowId) {
                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    browser_ext.windows.get(windowId).then(function (_result) { return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            browser_ext.windows.update(windowId, { focused: true }).then(function () {
                                                // result not currently used              
                                            }).catch(function (error) { console.log(error); });
                                            p.postMessage({ popup: "YAKKL: Launched" }); // Goes to +page@popup.svelte
                                            return [2 /*return*/];
                                        });
                                    }); }).catch(function () { return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            showPopup('');
                                            p.postMessage({ popup: "YAKKL: Launched" });
                                            return [2 /*return*/];
                                        });
                                    }); });
                                }
                                else {
                                    // TBD - Maybe look for any existing popup windows before creating a new one...
                                    // Maybe register a popup
                                    showPopup('');
                                    p.postMessage({ popup: "YAKKL: Launched" });
                                }
                                return [2 /*return*/];
                            });
                        }); })];
                case 1:
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    _a.sent();
                    _a.label = 2;
                case 2: return [3 /*break*/, 4];
                case 3:
                    error_7 = _a.sent();
                    console.log('background.js - ', error_7);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function showExtensionPopup() {
    return __awaiter(this, arguments, void 0, function (popupWidth, popupHeight, url // This should be undefined, null or ''
    ) {
        var pref, yakkl, _a, left, top_1, screenWidth, screenHeight, coord, error_8;
        if (popupWidth === void 0) { popupWidth = 428; }
        if (popupHeight === void 0) { popupHeight = 926; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, browser_ext.storage.local.get(constants_1.STORAGE_YAKKL_PREFERENCES)];
                case 1:
                    pref = _b.sent();
                    yakkl = pref['yakklPreferences'];
                    return [4 /*yield*/, browser_ext.windows.getCurrent()];
                case 2:
                    _a = _b.sent(), left = _a.left, top_1 = _a.top;
                    // Pull from settings and get pin information...
                    if (yakkl && yakkl.wallet) {
                        popupWidth = yakkl.wallet.popupWidth;
                        popupHeight = yakkl.wallet.popupHeight;
                        screenWidth = yakkl.screenWidth;
                        screenHeight = yakkl.screenHeight;
                        try {
                            // eslint-disable-next-line no-constant-condition
                            if (yakkl.wallet.pinned) {
                                switch (yakkl.wallet.pinnedLocation) {
                                    case 'TL':
                                        top_1 = 0;
                                        left = 0;
                                        break;
                                    case 'TR':
                                        top_1 = 0;
                                        left = screenWidth <= popupWidth ? 0 : screenWidth - popupWidth;
                                        break;
                                    case 'BL':
                                        top_1 = screenHeight <= popupWidth ? 0 : screenHeight - popupHeight;
                                        left = 0;
                                        break;
                                    case 'BR':
                                        top_1 = screenHeight <= popupWidth ? 0 : screenHeight - popupHeight;
                                        left = yakkl.screenWidth - popupWidth;
                                        break;
                                    case 'M':
                                        top_1 = screenHeight <= popupHeight ? 0 : screenHeight / 2 - popupHeight / 2;
                                        left = screenWidth <= popupWidth ? 0 : screenWidth / 2 - popupWidth / 2;
                                        break;
                                    default:
                                        coord = yakkl.wallet.pinnedLocation.split(',');
                                        if (coord) {
                                            left = parseInt(coord[0]) <= 0 ? 0 : parseInt(coord[0]);
                                            top_1 = parseInt(coord[1]) <= 0 ? 0 : parseInt(coord[1]);
                                        }
                                        else {
                                            left = 0;
                                            top_1 = 0;
                                        }
                                        break;
                                }
                            }
                        }
                        catch (error) {
                            console.log(error);
                            left = 0;
                            top_1 = 0;
                        }
                    }
                    else {
                        top_1 = 0;
                        left = 0;
                    }
                    return [2 /*return*/, browser_ext.windows.create({
                            url: "".concat(browser_ext.runtime.getURL((url ? url : "index.html"))),
                            type: "panel",
                            left: left,
                            top: top_1,
                            width: popupWidth,
                            height: popupHeight,
                            focused: true,
                        })];
                case 3:
                    error_8 = _b.sent();
                    console.log(error_8);
                    return [2 /*return*/, Promise.reject()]; // May want to do something else here.
                case 4: return [2 /*return*/];
            }
        });
    });
}
// TBD! - May need to set up a connection between UI and here
// Check the lastlogin date - todays date = days hash it using dj2 then use as salt to encrypt and send to here and send back on request where it is reversed or else login again
function showPopup(url) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            try {
                showExtensionPopup(428, 926, url).then(function (result) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                browser_ext.windows.update(result.id, { drawAttention: true });
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                return [4 /*yield*/, browser_ext.storage.session.set({ windowId: result.id })];
                            case 1:
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                _a.sent();
                                openWindows.set(result.id, result);
                                return [2 /*return*/];
                        }
                    });
                }); }).catch(function (error) {
                    console.log('background.js - YAKKL: ' + error); // need to send these area back to content.ts to inpage.ts to dapp so they can respond properly
                });
            }
            catch (error) {
                console.log('background.js - showPopup', error); // need to send these area back to content.ts to inpage.ts to dapp so they can respond properly
            }
            return [2 /*return*/];
        });
    });
}
function showPopupDapp(url) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            try {
                showExtensionPopup(428, 926, url).then(function (result) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        browser_ext.windows.update(result.id, { drawAttention: true });
                        openPopups.set('popupId', result.id);
                        return [2 /*return*/];
                    });
                }); }).catch(function (error) {
                    console.log('background.js - YAKKL: ' + error); // need to send these area back to content.ts to inpage.ts to dapp so they can respond properly
                });
            }
            catch (error) {
                console.log('background.js - showPopupDapp', error); // need to send these area back to content.ts to inpage.ts to dapp so they can respond properly
            }
            return [2 /*return*/];
        });
    });
}
function onEthereumListener(event) {
    try {
        console.log('background.js -', "yakkl-eth port: ".concat(event));
    }
    catch (error) {
        console.log(error);
    }
}
function onEIP6963Listener(event) {
    try {
        console.log('background.js -', "yakkl-eip6963 port: ".concat(event));
    }
    catch (error) {
        console.log(error);
    }
}
function onIdleListener(state) {
    return __awaiter(this, void 0, void 0, function () {
        var yakklSettings, yakklPreferences_3, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    yakklSettings = void 0;
                    if (state == 'active') {
                        clearAlarm("yakkl-lock-alarm");
                    }
                    if (!(state === "idle")) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, storage_1.getObjectFromLocalStorage)("settings")];
                case 1:
                    yakklSettings = (_a.sent());
                    if (!yakklSettings || yakklSettings.isLocked) {
                        // May be a good idea to monitor this if yakklSettings is failing
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, storage_1.getObjectFromLocalStorage)("preferences")];
                case 2:
                    yakklPreferences_3 = (_a.sent());
                    if (yakklPreferences_3.idleAutoLock) {
                        browser_ext.alarms.create("yakkl-lock-alarm", { when: Date.now() + (60000 * (idleAutoLockCycle > 0 ? idleAutoLockCycle : 1)) });
                    }
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_9 = _a.sent();
                    console.log('background.js - idleListener', error_9);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function clearAlarm(alarmName) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                browser_ext.alarms.get(alarmName).then(function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        browser_ext.alarms.clear(alarmName).then(function () {
                            // Noop
                        });
                        return [2 /*return*/];
                    });
                }); });
            }
            catch (error) {
                console.log('background.js - clear', error);
            }
            return [2 /*return*/];
        });
    });
}
function handleOnAlarm(alarm) {
    return __awaiter(this, void 0, void 0, function () {
        var yakklSettings, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    yakklSettings = void 0;
                    if (!(alarm.name === "yakkl-lock-alarm")) return [3 /*break*/, 6];
                    return [4 /*yield*/, (0, storage_1.getObjectFromLocalStorage)("settings")];
                case 1:
                    yakklSettings = (_a.sent());
                    if (!yakklSettings) return [3 /*break*/, 4];
                    yakklSettings.isLocked = true;
                    yakklSettings.isLockedHow = 'idle_system';
                    yakklSettings.updateDate = new Date().toISOString();
                    return [4 /*yield*/, (0, storage_1.setObjectInLocalStorage)('settings', yakklSettings)];
                case 2:
                    _a.sent();
                    // send a browser notification letting the user know that yakkl locked due to timeout
                    // This may need to be sent from the UI layer
                    browser_ext.notifications.create('yakkl-lock', {
                        type: 'basic',
                        iconUrl: browser_ext.runtime.getURL('/images/logoBullLock48x48.png'),
                        title: 'Security Notification',
                        message: 'YAKKL is locked and requires a login due to idle timeout.',
                    }).catch(function (error) {
                        console.log('background.js - handleOnAlarm', error);
                    });
                    // post a message to show login screen
                    browser_ext.runtime.sendMessage({ method: 'yak_lockdown' });
                    // Set the lock icon
                    return [4 /*yield*/, setIconLock()];
                case 3:
                    // Set the lock icon
                    _a.sent();
                    _a.label = 4;
                case 4: return [4 /*yield*/, clearAlarm("yakkl-lock-alarm")];
                case 5:
                    _a.sent(); // Clear the alarm so since it forwarded everything
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_10 = _a.sent();
                    console.log('background.js - alarm', error_10);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
/**********************************************************************************************************************/
// This section is for the Ethereum provider - Legacy version
function estimateGas(chainId, params, kval) {
    return __awaiter(this, void 0, void 0, function () {
        var provider, e_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    provider = new alchemy_sdk_1.Alchemy(getProviderConfig(chainId, kval));
                    return [4 /*yield*/, provider.transact.estimateGas(params)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    e_7 = _a.sent();
                    console.log(e_7);
                    return [2 /*return*/, undefined];
                case 3: return [2 /*return*/, undefined];
            }
        });
    });
}
function getBlock(chainId, block, kval) {
    return __awaiter(this, void 0, void 0, function () {
        var provider, e_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    provider = new alchemy_sdk_1.Alchemy(getProviderConfig(chainId, kval));
                    return [4 /*yield*/, provider.core.getBlock(block)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    e_8 = _a.sent();
                    console.log(e_8);
                    return [2 /*return*/, undefined];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// TODO: These items should now come from the Wallet.provider.getConfig() function or similar
// chainId must be hex
function getProviderConfig(chainId, kval) {
    try {
        var api = kval; // Set defaults
        var network = alchemy_sdk_1.Network.ETH_SEPOLIA;
        switch (chainId) {
            case "0xaa36a7": // Ethereum Sepolia
            case 11155111:
                api = kval;
                network = alchemy_sdk_1.Network.ETH_SEPOLIA;
                break;
            case "0x1": // Ethereum mainnet
            case "0x01":
            case 1:
            default:
                api = kval;
                network = alchemy_sdk_1.Network.ETH_MAINNET;
                break;
        }
        return {
            apiKey: api,
            network: network,
        };
    }
    catch (e) {
        console.log(e);
        return undefined;
    }
}
