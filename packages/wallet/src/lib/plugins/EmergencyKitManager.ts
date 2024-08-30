/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { decryptData, encryptData, isEncryptedData, VERSION, type SaltedKey } from '$lib/common';
import type {
  EmergencyKitAccountData,
  EmergencyKitData,
  EmergencyKitMetaData,
  EncryptedData,
  YakklAccount,
  YakklPrimaryAccount,
  YakklContact,
  YakklConnectedDomain,
  Preferences,
  Settings,
  Profile,
  YakklWatch,
  YakklChat,
  YakklBlocked,
  ProfileData
} from '$lib/common';

interface BulkEmergencyKitData {
  meta: EmergencyKitMetaData;
  data: {
    yakklPreferencesStore: EncryptedData;
    yakklSettingsStore: EncryptedData;
    profileStore: EncryptedData;
    yakklCurrentlySelectedStore: EncryptedData;
    yakklContactsStore: EncryptedData;
    yakklChatsStore: EncryptedData;
    yakklAccountsStore: EncryptedData;
    yakklPrimaryAccountsStore: EncryptedData;
    yakklWatchListStore: EncryptedData;
    yakklBlockedListStore: EncryptedData;
    yakklConnectedDomainsStore: EncryptedData;
  };
  cs: string;
}

// import * as fs from 'fs';
// import { promisify } from 'util';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import * as path from 'path';
// ADD other cloud/edge environment imports here
// When ready to implement S3, uncomment the following line
// import { S3 } from 'aws-sdk';
// Then do: npm install aws-sdk

// Add conditional import to handle server-side only
let fs: typeof import('fs') | undefined;
let promisify: typeof import('util').promisify | undefined;
if (typeof window === 'undefined') {
  // Use dynamic import to ensure it works in a server environment
  import('fs').then((module) => {
    fs = module;
  });
  import('util').then((module) => {
    promisify = module.promisify;
  });
}


export class EmergencyKitManager {
  static async createEmergencyKit(accountData: EmergencyKitAccountData[], encryptDownload: boolean, passwordOrSaltedKey: string | SaltedKey): Promise<EmergencyKitData> {
    const createDate = new Date().toISOString();
    const updateDate = createDate;
    const version = VERSION; // Your versioning logic
    const id = this.generateId(); // Generate a unique ID for the kit

    const encryptedAccounts = await Promise.all(accountData.map(async (account) => {
      const checksum = await this.createHash(JSON.stringify(account)); //encodeJSON(account)); // JSON.stringify(account));
      account.hash = checksum;
      return encryptDownload ? await encryptData(account, passwordOrSaltedKey) : account;
    }));

    const dataToEncrypt = JSON.stringify(encryptedAccounts); //encodeJSON(encryptedAccounts);// JSON.stringify(encryptedAccounts);
    const encryptedData = encryptDownload ? await encryptData(dataToEncrypt, passwordOrSaltedKey) : { data: dataToEncrypt, iv: '', salt: '' };
    const overallChecksum = await this.createHash(dataToEncrypt);

    const meta: EmergencyKitMetaData = {
      id,
      createDate,
      updateDate,
      version,
      type: "yakkl",
      registeredType: accountData[0].registered.type,
      portfolioName: accountData[0].portfolioName,
      subPortfolioName: accountData[0].subPortfolioName || '',
      subPortfolioAddress: accountData[0].subPortfolioAddress || '',
      hash: overallChecksum
    };

    const emergencyKit: EmergencyKitData = {
      id,
      data: encryptedData as EncryptedData,
      accounts: encryptedAccounts as EmergencyKitAccountData[],
      meta,
      cs: overallChecksum
    };

    return emergencyKit;
  }

  static async downloadEmergencyKit(emergencyKit: EmergencyKitData, filePath?: string) {
    if (typeof window !== 'undefined' && window.document) {
      // Browser environment
      this.downloadObjectAsJson(emergencyKit, `emergency-kit-${emergencyKit.id}.json`);
    } else if (filePath && fs && promisify) {
      // Node.js or other non-browser environment
      await this.saveJsonToFile(emergencyKit, filePath);
    } else {
      throw new Error('Download not supported in this environment');
    }
  }

  static async importEmergencyKit(source: File | string | { bucket: string, key: string }, passwordOrSaltedKey: string | SaltedKey): Promise<EmergencyKitData> {
    let fileContent: string;

    if (typeof source === 'string' && fs && promisify) {
      // Node.js or other non-browser environment
      const readFile = promisify(fs.readFile);
      fileContent = await readFile(source, 'utf-8');
    } else if (source instanceof File) {
      // Browser environment
      fileContent = await source.text();
    } else {
      fileContent = this.cloudImport('source'); // Dummy implementation
    }

    const emergencyKit: EmergencyKitData = JSON.parse(fileContent);

    // Decrypt the data if it is encrypted
    if (isEncryptedData(emergencyKit.data)) {
      emergencyKit.accounts = await decryptData<EmergencyKitAccountData[]>(emergencyKit.data, passwordOrSaltedKey);
    }

    return emergencyKit;
  }

  static async readEmergencyKitMetadata(source: File | string): Promise<EmergencyKitMetaData | undefined> {
    let fileContent: string;

    if (typeof source === 'string' && typeof window === 'undefined') {
      // Node.js environment
      const fs = await import('fs');
      const { promisify } = await import('util');
      const readFile = promisify(fs.readFile);
      fileContent = await readFile(source, 'utf-8');
    } else if (source instanceof File) {
      // Browser environment
      fileContent = await source.text();
    } else {
      throw new Error('Unsupported source type');
    }

    const emergencyKit: EmergencyKitData = JSON.parse(fileContent);
    return emergencyKit.meta;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static cloudImport(source: File | string): string {
    return '';
  }

  private static downloadObjectAsJson(exportObj: any, exportName: string) {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));//encodeJSON(exportObj)); //JSON.stringify(exportObj));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", exportName);
      document.body.appendChild(downloadAnchorNode); // required for Firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e) {
      console.error(`Download failed: ${e}`);
    }
  }

  private static async saveJsonToFile(exportObj: any, filePath: string) {
    if (fs && promisify) {
      const writeFile = promisify(fs.writeFile);
      try {
        const dataStr = JSON.stringify(exportObj, null, 2); // Pretty print JSON
        await writeFile(filePath, dataStr, 'utf8');
        console.log(`Emergency kit saved to ${filePath}`);
      } catch (e) {
        console.error(`Failed to save emergency kit: ${e}`);
      }
    }
  }

  private static generateId(): string {
    return 'xxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
  }

  private static async createHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  static async createBulkEmergencyKit(
    preferences: Preferences,
    settings: Settings,
    profile: Profile,
    currentlySelected: any,
    contacts: YakklContact[],
    chats: YakklChat[],
    accounts: YakklAccount[],
    primaryAccounts: YakklPrimaryAccount[],
    watchList: YakklWatch[],
    blockedList: YakklBlocked[],
    connectedDomains: YakklConnectedDomain[],
    passwordOrSaltedKey: string | SaltedKey
  ): Promise<BulkEmergencyKitData> {
    const createDate = new Date().toISOString();
    const id = this.generateId();

    const encryptedData: BulkEmergencyKitData['data'] = {
      yakklPreferencesStore: await this.encryptWithChecksum(preferences, passwordOrSaltedKey),
      yakklSettingsStore: await this.encryptWithChecksum(settings, passwordOrSaltedKey),
      profileStore: await this.encryptWithChecksum(profile, passwordOrSaltedKey),
      yakklCurrentlySelectedStore: await this.encryptWithChecksum(currentlySelected, passwordOrSaltedKey),
      yakklContactsStore: await this.encryptWithChecksum(contacts, passwordOrSaltedKey),
      yakklChatsStore: await this.encryptWithChecksum(chats, passwordOrSaltedKey),
      yakklAccountsStore: await this.encryptWithChecksum(accounts, passwordOrSaltedKey),
      yakklPrimaryAccountsStore: await this.encryptWithChecksum(primaryAccounts, passwordOrSaltedKey),
      yakklWatchListStore: await this.encryptWithChecksum(watchList, passwordOrSaltedKey),
      yakklBlockedListStore: await this.encryptWithChecksum(blockedList, passwordOrSaltedKey),
      yakklConnectedDomainsStore: await this.encryptWithChecksum(connectedDomains, passwordOrSaltedKey),
    };

    const meta: EmergencyKitMetaData = {
      id,
      createDate,
      updateDate: createDate,
      version: VERSION,
      type: "yakkl_bulk",
      registeredType: (profile.data as ProfileData).registered.type,
      hash: await this.createHash(JSON.stringify(encryptedData))
    };

    
    const bulkEmergencyKit: BulkEmergencyKitData = {
      meta,
      data: encryptedData,
      cs: await this.createHash(JSON.stringify(meta) + JSON.stringify(encryptedData))
    };

    return bulkEmergencyKit;
  }

  static async importBulkEmergencyKit(source: File | string, passwordOrSaltedKey: string | SaltedKey): Promise<{
    newData: any,
    existingData: any
  }> {
    let fileContent: string;

    if (typeof source === 'string' && typeof window === 'undefined') {
      // Node.js environment
      const fs = await import('fs');
      const { promisify } = await import('util');
      const readFile = promisify(fs.readFile);
      fileContent = await readFile(source, 'utf-8');
    } else if (source instanceof File) {
      // Browser environment
      fileContent = await source.text();
    } else {
      throw new Error('Unsupported source type');
    }

    const bulkEmergencyKit: BulkEmergencyKitData = JSON.parse(fileContent);

    // Verify the overall checksum
    const calculatedCS = await this.createHash(JSON.stringify(bulkEmergencyKit.meta) + JSON.stringify(bulkEmergencyKit.data));
    if (calculatedCS !== bulkEmergencyKit.cs) {
      throw new Error('Data integrity check failed');
    }

    const newData: any = {};
    const existingData: any = {};

    for (const [key, encryptedValue] of Object.entries(bulkEmergencyKit.data)) {
      const decryptedData = await this.decryptWithChecksumVerification(encryptedValue, passwordOrSaltedKey);
      
      // Check if data already exists (you'll need to implement this check based on your data structure)
      const dataExists = await this.checkDataExists(key, decryptedData);

      if (dataExists) {
        existingData[key] = decryptedData;
      } else {
        newData[key] = decryptedData;
      }
    }

    return { newData, existingData };
  }

  static async downloadBulkEmergencyKit(bulkEmergencyKit: BulkEmergencyKitData) {
    if (typeof window !== 'undefined' && window.document) {
      // Browser environment
      this.downloadObjectAsJson(bulkEmergencyKit, `bulk-emergency-kit-${bulkEmergencyKit.meta.id}.json`);
    } else {
      throw new Error('Download not supported in this environment');
    }
  }

  static async readBulkEmergencyKitMetadata(source: File | string): Promise<EmergencyKitMetaData> {
    let fileContent: string;

    if (typeof source === 'string' && typeof window === 'undefined') {
      // Node.js environment
      const fs = await import('fs');
      const { promisify } = await import('util');
      const readFile = promisify(fs.readFile);
      fileContent = await readFile(source, 'utf-8');
    } else if (source instanceof File) {
      // Browser environment
      fileContent = await source.text();
    } else {
      throw new Error('Unsupported source type');
    }

    const bulkEmergencyKit: BulkEmergencyKitData = JSON.parse(fileContent);
    return bulkEmergencyKit.meta;
  }

  private static async encryptWithChecksum(data: any, passwordOrSaltedKey: string | SaltedKey): Promise<EncryptedData> {
    const jsonString = JSON.stringify(data);
    const checksum = await this.createHash(jsonString);
    const encryptedData = await encryptData({ cs: checksum, data }, passwordOrSaltedKey);
    return encryptedData;
  }

  private static async decryptWithChecksumVerification(encryptedData: EncryptedData, passwordOrSaltedKey: string | SaltedKey): Promise<any> {
    const decryptedData = await decryptData<{ cs: string, data: any }>(encryptedData, passwordOrSaltedKey);
    const calculatedChecksum = await this.createHash(JSON.stringify(decryptedData.data));
    
    if (calculatedChecksum !== decryptedData.cs) {
      throw new Error('Data integrity check failed');
    }

    return decryptedData.data;
  }

  private static async checkDataExists(key: string, data: any): Promise<boolean> {
    // Implement this method based on your data structure and storage mechanism
    // For example, you might check against a database or local storage
    // Return true if the data already exists, false otherwise
    return false; // Placeholder implementation
  }

  // Existing private methods (generateId, createHash, etc.) remain unchanged
  // ...
}


// Usage:
// Create a bulk emergency kit
// const bulkEmergencyKit = await EmergencyKitManager.createBulkEmergencyKit(
//   preferences,
//   settings,
//   profile,
//   currentlySelected,
//   contacts,
//   chats,
//   accounts,
//   primaryAccounts,
//   watchList,
//   blockedList,
//   connectedDomains,
//   password
// );

// Download the bulk emergency kit
// await EmergencyKitManager.downloadBulkEmergencyKit(bulkEmergencyKit);

// Read metadata from a bulk emergency kit file
// const metadata = await EmergencyKitManager.readBulkEmergencyKitMetadata(file);

// Import a bulk emergency kit
// const { newData, existingData } = await EmergencyKitManager.importBulkEmergencyKit(file, password);

// console.log('New data:', newData);
// console.log('Existing data:', existingData);



// For a single account emergency kit
// const singleAccountMetadata = await EmergencyKitManager.readEmergencyKitMetadata(file);
// console.log('Single Account Emergency Kit Metadata:', singleAccountMetadata);

// For a bulk emergency kit
// const bulkMetadata = await EmergencyKitManager.readBulkEmergencyKitMetadata(file);
// console.log('Bulk Emergency Kit Metadata:', bulkMetadata);
