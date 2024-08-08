/* eslint-disable @typescript-eslint/no-explicit-any */
import { decryptData, encryptData, isEncryptedData, VERSION, type SaltedKey } from '$lib/common';
import type { EmergencyKitAccountData, EmergencyKitData, EmergencyKitMetaData, EncryptedData } from '$lib/common';
// import { encodeJSON } from '$lib/utilities';

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

//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   private static cloudImport(source: File | string): string {
//     // AWS S3
//     // const s3 = new S3();
//     // const params = {
//     //   Bucket: source.bucket,
//     //   Key: source.key
//     // };
//     // const s3Object = await s3.getObject(params).promise();
//     // const fileContent = s3Object.Body?.toString('utf-8') || '';
//     // return fileContent;
//     return '';
//   }

}

