// @ts-nocheck
// Mock implementation of the webextension-polyfill
const mockBrowser = {
  runtime: {
    id: 'mock-extension-id',
    getURL: (path) => `chrome-extension://mock-extension-id/${path}`,
    // Add other runtime methods as needed
  },
  // Add other namespaces as needed
};

module.exports = mockBrowser;
