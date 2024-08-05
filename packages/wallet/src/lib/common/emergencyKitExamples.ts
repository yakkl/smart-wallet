/* eslint-disable @typescript-eslint/no-unused-vars */

// import { EmergencyKitManager } from './emergencykit';
// import type { EmergencyKitAccountData } from './interfaces';

// Browser environment
// async function handleDownloadInBrowser() {
  /**
  const ekAccountData: EmergencyKitAccountData = {
   id: id,
    registered: registered,
    email: email,
    userName: userName,
    blockchain: blockchain,
    portfolioAddress: address,
    portfolioName: primaryAccountName,
    subPortfolioAddress: addressDerived,
    subPortfolioName: accountName,
    privateKey: privateKey,
    mnemonic: mnemonic,
    createDate: createDate,
    updateDate: updateDate,
    version: VERSION,
    hash: '', 
  };
  */
 
  /** 
  const passwordOrSaltedKey = "your-secure-password"; // Or your derived SaltedKey object

  const emergencyKit = await EmergencyKitManager.createEmergencyKit([ekAccountData], true, passwordOrSaltedKey);
  await EmergencyKitManager.downloadEmergencyKit(emergencyKit);
  */
// }



// Node.js or other non-browser environment
// async function handleDownloadInNode() {
//   const ekAccountData: EmergencyKitAccountData = {
//     id: id,
//     registered: registered,
//     email: email,
//     userName: userName,
//     blockchain: blockchain,
//     portfolioAddress: address,
//     portfolioName: primaryAccountName,
//     subPortfolioAddress: addressDerived,
//     subPortfolioName: accountName,
//     privateKey: privateKey,
//     mnemonic: mnemonic,
//     createDate: createDate,
//     updateDate: updateDate,
//     version: VERSION,
//     hash: '',
//   };

//   const passwordOrSaltedKey = "your-secure-password"; // Or your derived SaltedKey object

//   const emergencyKit = await EmergencyKitManager.createEmergencyKit([ekAccountData], true, passwordOrSaltedKey);
//   await EmergencyKitManager.downloadEmergencyKit(emergencyKit, path.join(__dirname, `emergency-kit-${emergencyKit.id}.json`));
// }

// async function handleImportFromNode() {
//   const passwordOrSaltedKey = "your-secure-password"; // Or your derived SaltedKey object
//   const emergencyKitPath = path.join(__dirname, 'path-to-your-emergency-kit.json');
//   const emergencyKit = await EmergencyKitManager.importEmergencyKit(emergencyKitPath, passwordOrSaltedKey);
//   console.log(emergencyKit);
// }

// async function handleImportFromS3() {
//   const passwordOrSaltedKey = "your-secure-password"; // Or your derived SaltedKey object
//   const s3Source = { bucket: 'your-bucket-name', key: 'path/to/your/emergency-kit.json' };
//   const emergencyKit = await EmergencyKitManager.importEmergencyKit(s3Source, passwordOrSaltedKey);
//   console.log(emergencyKit);
// }

