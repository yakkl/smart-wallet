<script lang="ts">
  import { browser as browserSvelte} from '$app/environment';
  import { ethers } from 'ethers';
  import { createForm } from "svelte-forms-lib";
  import * as yup from 'yup';
  import {onMount} from 'svelte';
  import { goto } from "$app/navigation";
  import { incrementProperty } from '$lib/utilities';
  import { getWallet } from '$lib/utilities/ethereum';
  // import { getTransactionCount, setProvider } from '$lib/plugins/networks/ethereum/providers';
  import { deepCopy, getSymbol } from '$lib/utilities';
  import { Confetti } from "svelte-confetti";
  import { setSettingsStorage, getSettings, yakklMiscStore, setProfileStorage, setYakklCurrentlySelectedStorage, setYakklPrimaryAccountsStorage, getYakklPrimaryAccounts, getYakklAccounts,  setYakklAccountsStorage, getProfile } from '$lib/common/stores';
  import { encryptData, decryptData } from '$lib/common/encryption';
  import { DEFAULT_DERIVED_PATH_ETH, PATH_WELCOME, PATH_ACCOUNTS_ETHEREUM_CREATE_PRIMARY, YAKKL_ZERO_ADDRESS } from '$lib/common/constants';
  import Cancel from '$lib/components/Cancel.svelte';
  import ErrorNoAction from '$lib/components/ErrorNoAction.svelte';
	import { AccountTypeCategory, isEncryptedData, type CurrentlySelectedData, type PrimaryAccountData, type Profile, type ProfileData, type YakklAccount, type YakklCurrentlySelected, type YakklPrimaryAccount } from '$lib/common';
	import { dateString } from '$lib/common/datetime';

  let currentlySelected: YakklCurrentlySelected;
  
  let error = false;
  let errorValue: any;
  // let msgType = 'ERROR! - ';
  let showConfetti = false;
  let elements;
  let selected = '24';
  let mtop = '';
  let subAccounts = true;


  async function processSecretPhaseRecovery(data: any) {
    if (browserSvelte) {
      try {
        createPortfolioAccount(data.secretPhrase);
        clearData(data);
      } catch (e) {
        errorValue = e
        clearData(data);
        error = true;
      }
    }
  }

  // This form can only be called from within the app (after login) so it can restore a portfolio account and all of its subaccounts

  // A derivative of this is used by the emergency kit code to restore everything within the app (after login)

  // TODO: May want to call not recreate the creation of the account!!

  async function createPortfolioAccount(mnemonic=null) {
    try {
      if ( browserSvelte ) {
        let id: string = '';
        let yakklSettings;
        let profile;
        let yakklCurrentlySelected: YakklCurrentlySelected;
        let accountName = 'Portfolio Account 1';
        let ethWallet;
        let mnemonic='';
        let preferences;
        let displayDate;
        let derivedPath = DEFAULT_DERIVED_PATH_ETH; // Account gets created with '/0/0' appended to represent the first
        // let assetKey = {name: currentlySelected.shortcuts.blockchain, class: 'Token', subClass: ''};
        // let asset;

        // Could always pull first item from yakklAssets (should already have been loaded into storage)
        // let yakklAssets = await getYakklAssets();
        // if (yakklAssets) {
        //   asset = yakklAssets.find(item => item.name === assetKey.name && item.class === assetKey.class);
        // }

        // if (!asset) {
        //   asset = yakklAssets[0];
        // }

        yakklSettings = await getSettings();
        if (!yakklSettings) {
          // noop but could load the defaults. For now we will error out!
          throw 'The settings data has not been initialized. This could be due to not yet registered or data could be incomplete which requires registering again. If unable to re-register then uninstall and reinstall. No Ethereum data will be impacted.';
        }

        id = yakklSettings.id;


// TODO: Fix this!!

        profile = await getProfile();
        // profile = await verify(userName.toLowerCase().trim().replace('.nfs.id', '')+'.nfs.id'+password );
        if (!profile) {
          errorValue = `User  was not found OR password is not correct`; //${data.userName}
          // clearData(data);
          throw errorValue;
        }

        if (!profile.data || !$yakklMiscStore) {
          throw 'Profile data does not appear to be encrypted. Please register or re-register. Thank you.';
        }
        
        if (isEncryptedData(profile.data)) {
          await decryptData(profile.data, $yakklMiscStore).then(result => {
            profile.data = result as ProfileData;
          });
        }

        (profile.data as ProfileData).meta = {};        
        preferences = profile.preferences;

        let index = (profile.data as ProfileData).accountIndex ?? 0;
        derivedPath = `${DEFAULT_DERIVED_PATH_ETH}${index}'/0/0`;
        
        let entropy;

        if (!mnemonic) {
          // Use this instead of createRandom to create 24 words instead of 12 - 32 words= 24 words and 16 words= 12 words

          // v6.0.0+
          let words= ethers.randomBytes(!preferences ? 32 : (!preferences.words? 32 : preferences.words));
          let randomMnemonic = ethers.Mnemonic.fromEntropy(words);
          ethWallet = ethers.HDNodeWallet.fromMnemonic(randomMnemonic, derivedPath); //ethers.Wallet.fromPhrase(randomMnemonic.phrase);    

          // entropy = ethers.randomBytes(!preferences ? 32 : (!preferences.words? 32 : preferences.bytes));
          // let randomMnemonic = ethers.HDNode.entropyToMnemonic(entropy);
          // mnemonicObject = randomMnemonic;
          // ethWallet = ethers.Wallet.fromMnemonic(randomMnemonic, derivedPath);       
        } else {
          // v6.0.0+
          const mnemonicObject = ethers.Mnemonic.fromPhrase(mnemonic);
          ethWallet = ethers.HDNodeWallet.fromMnemonic(mnemonicObject, derivedPath);

          // entropy = ethers.HDNode.mnemonicToEntropy(mnemonic);
          // ethWallet = ethers.Wallet.fromMnemonic(mnemonic, derivedPath);
        }

        if ( !ethWallet ) {
          throw "The Ethereum Wallet (Portfolio Account) was not able to be created. Please try again.";
        } 

        let currentDate = dateString();                          
        displayDate = new Date(currentDate);

        (profile.data as ProfileData).accountIndex = index+1;  // PortfolioAccount index for path

        let yakklAccount: YakklAccount = {
          id: profile.id,
          index: index,
          blockchain: currentlySelected!.shortcuts.network.blockchain,
          // network: yakklNetworks.find(item => item.name === 'Ethereum'),
          smartContract: false,
          address: ethWallet.address,
          alias: '',
          accountType: AccountTypeCategory.PRIMARY,
          name: !accountName ? `Top Level Account ${index+1}` : accountName,
          description: '',
          // assetKey: assetKey,
          primaryAccount: null,  // If subaccount then it must be a valid primaryaccount else undefined
          data: {
            extendedKey: ethWallet.extendedKey,
            privateKey: ethWallet.privateKey,
            publicKey: ethWallet.publicKey,
            publicKeyUncompressed: ethWallet.publicKey,//ethWallet.signingKey.publicKey,
            path: ethWallet.path ? ethWallet.path : derivedPath,     
            pathIndex: index,
            fingerPrint: ethWallet.fingerprint,
            parentFingerPrint: ethWallet.parentFingerprint,
            chainCode: ethWallet.chainCode,
            assignedTo: [],    // Who are the parties that have responsibility for this account
          },
          value: 0n, 
          class: "Default",  // This is only used for enterprise like environments. It can be used for departments like 'Finance', 'Accounting', '<whatever>'
          level: 'L1',
          isSigner: true,
          avatar: '', // Default is identityicon but can be changed to user/account avatar
          tags: [currentlySelected!.shortcuts.network.blockchain, 'primary'],
          includeInPortfolio: true,   // This only applys to the value in this primary account and not any of the derived accounts from this primary account
          connectedDomains: [], 
          createDate: currentDate,
          updateDate: currentDate,
          version: '',
        };

        let yakklPrimaryAccount: YakklPrimaryAccount = {
          id: yakklAccount.id,
          name: yakklAccount.name,
          address: yakklAccount.address,
          value: yakklAccount.value,
          index: index,  // for the primary account path index
          data: {
            privateKey: ethWallet.privateKey,
            publicKey: ethWallet.publicKey,
            path: ethWallet.path ? ethWallet.path : derivedPath,
            pathIndex: index,
            fingerPrint: ethWallet.fingerprint,
            parentFingerPrint: ethWallet.parentFingerprint,
            chainCode: ethWallet.chainCode,
            extendedKey: ethWallet.extendedKey,
            mnemonic: ethWallet.mnemonic?.phrase,
            entropy: entropy,
            password: ethWallet.mnemonic?.password,
            publicKeyUncompressed: ethWallet.publicKey,//ethWallet.signingKey.publicKey,
            wordCount: ethWallet.mnemonic?.phrase.split(" ").length,
            wordListLocale: ethWallet.mnemonic?.wordlist.locale,
          },
          account: yakklAccount,  // yakklAccount.primaryAccount is always undefined here since it is the primary account
          subIndex: 0,  // for the subaccount derived path index
          subAccounts: [], // Always empty since the primary account is the start of the tree
          createDate: yakklAccount.createDate,
          updateDate: yakklAccount.updateDate,
          version: '',
        }

        let yakklPrimaryAccountEnc = deepCopy(yakklPrimaryAccount) as YakklPrimaryAccount;

        await encryptData(yakklPrimaryAccount.data, $yakklMiscStore).then(result => {
          yakklPrimaryAccountEnc.data = result;
        });

        yakklPrimaryAccountEnc.account = yakklAccount;
        
        await encryptData(yakklAccount.data, $yakklMiscStore).then(result => {
          yakklPrimaryAccountEnc.account.data = result;
        });

        let yakklPrimaryAccounts: YakklPrimaryAccount[] = [];
        let primaryAccountsStorage = await getYakklPrimaryAccounts();
        
        if (primaryAccountsStorage?.length > 0) {
          yakklPrimaryAccounts = primaryAccountsStorage;
        }

        if (yakklPrimaryAccountEnc) {
          yakklPrimaryAccounts.push(yakklPrimaryAccountEnc);
          // yakklPrimaryAccounts = [...yakklPrimaryAccountEnc, yakklPrimaryAccounts.length + 1]; // This version causes reactivity of any variables using '$:' syntax
          await setYakklPrimaryAccountsStorage(yakklPrimaryAccounts);
        }

        let profileIndex = (profile.data as ProfileData).primaryAccounts.push(yakklPrimaryAccountEnc);

        let yakklAccounts: any[] = [];
        let accountsStorage = await getYakklAccounts();
      
        if (accountsStorage?.length > 0) {
          yakklAccounts = accountsStorage;
        }

        yakklPrimaryAccountEnc.account.primaryAccount = null;

        yakklAccounts.push(yakklPrimaryAccountEnc.account);
        await setYakklAccountsStorage(yakklAccounts);

        // TODO: May want to remove this
        await ethWallet.signMessage($yakklMiscStore).then(result => {
          (profile.data as ProfileData).sig = result;
        });

        let profileEnc: Profile = deepCopy(profile); // Need deep copy...

        await encryptData(profileEnc.data, $yakklMiscStore).then(result => {
          profileEnc.data = result;
        });

        if (profileEnc) {
          await setProfileStorage(profileEnc);
          yakklSettings.init = currentlySelected!.shortcuts.init = true;
          yakklSettings.isLocked = currentlySelected!.shortcuts.isLocked = false;
          await setSettingsStorage(yakklSettings);

          accountName = yakklAccount.name;

          // currentlySelected.network = yakklAccount.network;
          yakklCurrentlySelected = currentlySelected; // This store needs to have been initialized for the first use and then kept updated from there

          yakklCurrentlySelected!.id = profile.id;
          yakklCurrentlySelected!.preferences.locale = preferences.locale;
          yakklCurrentlySelected!.preferences.currency = preferences.currency;

          // Originally had this due to have .preferences set as ? (undefined)
          // setDefinedProperty<PreferencesShort, keyof PreferencesShort>(yakklCurrentlySelected.preferences, 'currency', preferences.currency);
            
          yakklCurrentlySelected!.shortcuts.blockchain = yakklAccount.blockchain;
          yakklCurrentlySelected!.shortcuts.symbol = getSymbol(yakklAccount.blockchain);
          yakklCurrentlySelected!.shortcuts.isLocked = false;
          yakklCurrentlySelected!.shortcuts.showTestNetworks = preferences.showTestNetworks as boolean;
          yakklCurrentlySelected!.shortcuts.profile.name = (profile.data as ProfileData).name;
          yakklCurrentlySelected!.shortcuts.profile.email = (profile.data as ProfileData).email;
          yakklCurrentlySelected!.shortcuts.primary = yakklPrimaryAccountEnc;
          yakklCurrentlySelected!.shortcuts.address = yakklAccount.address;
          yakklCurrentlySelected!.shortcuts.accountName = accountName;
          yakklCurrentlySelected!.shortcuts.accountType = AccountTypeCategory.PRIMARY;
          yakklCurrentlySelected!.shortcuts.smartContract = false;

          (yakklCurrentlySelected!.data as CurrentlySelectedData).primaryAccount = yakklPrimaryAccountEnc;
          (yakklCurrentlySelected!.data as CurrentlySelectedData).account = yakklAccount;

          yakklCurrentlySelected!.createDate = yakklAccount.createDate;
          yakklCurrentlySelected!.updateDate = yakklAccount.updateDate;

          let currentDeepCopy = deepCopy(yakklCurrentlySelected);
          await setYakklCurrentlySelectedStorage(yakklCurrentlySelected!);
          currentlySelected = currentDeepCopy;

          // Create subAccounts if enabled
          if (subAccounts) {
            let derivedIndex = 0;
            
            while (true) {
              const dPath = `${DEFAULT_DERIVED_PATH_ETH}${index}'/0/${derivedIndex}}`;
              
              // v6.0.0+
              // const ethWallet = ethers.HDNodeWallet.fromMnemonic(mnemonicObject, dPath);

              // It will throw an error if the mnemonic is not valid
              const randomMnemonic = (yakklPrimaryAccount.data as PrimaryAccountData).mnemonic as string;
              const ethWallet = ethers.HDNodeWallet.fromPhrase(randomMnemonic, derivedPath); 
              const wallet = getWallet(ethWallet.privateKey);


              const transactionCount = await wallet.getTransactionCount();

              if (transactionCount === 0) {
                break;
              }

              let addressDerived = wallet.address;
              // yakklPrimaryAccount.subIndex += 1;
              incrementProperty(yakklPrimaryAccount, 'subIndex');

                      // Get networks
              // let yakklNetworks = await getYakklNetworks();
              // $yakklNetworksStore = yakklNetworks;

              let yakklAccount: YakklAccount = {
                id: profile.id,
                index: (yakklPrimaryAccount.subIndex ?? 0 > 0 ? (yakklPrimaryAccount.subIndex ?? 1) -1 : 0),
                blockchain: currentlySelected!.shortcuts.network.blockchain,
                // network: yakklNetworks.find(item => item.name === 'Ethereum'),
                smartContract: false,
                address: addressDerived,
                alias: '',
                accountType: AccountTypeCategory.SUB,
                name:`Account ${yakklPrimaryAccount.subIndex}`,
                description: '',
                // assetKey: assetKey,
                primaryAccount: yakklPrimaryAccount,  // If subaccount then it must be a valid primaryaccount else undefined
                data: {
                  extendedKey: ethWallet.extendedKey,
                  privateKey: ethWallet.privateKey,
                  publicKey: ethWallet.publicKey,
                  publicKeyUncompressed: ethWallet.publicKey,//ethWallet.signingKey.publicKey,
                  path: ethWallet.path ? ethWallet.path : dPath,
                  pathIndex: ethWallet.index,
                  fingerPrint: ethWallet.fingerprint,
                  parentFingerPrint: ethWallet.parentFingerprint,
                  chainCode: ethWallet.chainCode,
                  assignedTo: [],    // Who are the parties that have responsibility for this account
                },
                value: 0n, 
                class: "Default",  // This is only used for enterprise like environments. It can be used for departments like 'Finance', 'Accounting', '<whatever>'
                level: 'L1',
                isSigner: true,
                avatar: '', // Default is identityicon but can be changed to user/account avatar
                tags: [currentlySelected!.shortcuts.network.blockchain, 'sub'],
                includeInPortfolio: true,   // This only applys to the value in this primary account and not any of the derived accounts from this primary account
                connectedDomains: [], 
                createDate: currentDate,
                updateDate: currentDate,
                version: '',
              };

              let yakklAccountEnc = deepCopy(yakklAccount) as YakklAccount;
              await encryptData(yakklAccount.data, $yakklMiscStore).then(result => {
                yakklAccountEnc.data = result;
              });
              if (yakklPrimaryAccount.subAccounts) {
                yakklPrimaryAccount.subAccounts.push(yakklAccountEnc);
              }              // Maybe verify profileIndex is valid
              (profile.data as ProfileData).primaryAccounts[profileIndex-1] = yakklPrimaryAccount;

              setYakklPrimaryAccountsStorage((profile.data as ProfileData).primaryAccounts);  // sets the full list

              let profileEnc = deepCopy(profile);
              await encryptData(profile.data, $yakklMiscStore).then(result => {
                profileEnc.data = result;
              });

              await setProfileStorage(profileEnc);

              derivedIndex++;
            };
          }

          showConfetti = true;
          goto(PATH_WELCOME);
        }
      }
    } catch (e) {
      error = true;
      errorValue = `Your Wallet did not initialize for the following reason: ${e}`;
      console.log(errorValue);
    }
  }


  // const { form, errors, state, isValid, handleChange, handleSubmit } = createForm({
  //   initialValues: { 
  //     userName: "",
  //     password: "", 
  //     confirmPassword: "",
  //     secretPhrase: ""
  //   },
  //   validationSchema: yup.object().shape({
  //     userName: yup.string().required('Please enter your username'),
  //     password: yup
  //       .string()
  //       .required('Please enter your password. It must be at least 8 characters')
  //       .matches(
  //       /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
  //       "Must Contain at least 8 Characters (12 Characters are best), One Uppercase, One Lowercase, One Number and one special case Character"
  //       ),
  //     confirmPassword: yup
  //       .string()
  //       .oneOf([yup.ref('password'), null], 'Passwords must match'),
  //   }),
  //   onSubmit: data => {
  //     try {
  //       elements = document.querySelectorAll("[data-id]");
  //       srp = "";
  //       if (elements) {
  //         elements.forEach(el => {
  //           srp += el.value + ' ';
  //         });
  //         data.secretPhrase = srp.trim();

  //         processSecretPhaseRecovery(data);
  //       } else {
  //         throw 'Your Secret Phrase does not seem to correct. Check the formatting. You can enter each word and it MUST BE IN ORDER -OR- paste the whole phrase after copying from your backup into any field.';
  //       }
  //     } catch(e) {
  //       errorValue = e;
  //       error = true;
  //       clearData(data);
  //     }
  //   }
  // });

  const { form, errors, state, isValid, handleChange, handleSubmit } = createForm<FormData>({
    initialValues: { 
      userName: "",
      password: "", 
      confirmPassword: "",
      secretPhrase: ""
    },
    validationSchema: yup.object().shape({
      userName: yup.string().required('Please enter your username'),
      password: yup
        .string()
        .required('Please enter your password. It must be at least 8 characters')
        .matches(
          /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
          "Must Contain at least 8 Characters (12 Characters are best), One Uppercase, One Lowercase, One Number and one special case Character"
        ),
      confirmPassword: yup
        .string()
        .oneOf([yup.ref('password'), undefined], 'Passwords must match'),
      // alias: yup
      //   .string(),
    }),
    onSubmit: (data) => {
      try {
        const elements = document.querySelectorAll<HTMLInputElement>("[data-id]");
        let srp = "";
        if (elements) {
          elements.forEach(el => {
            srp += el.value + ' ';
          });
          data.secretPhrase = srp.trim();

          processSecretPhaseRecovery(data);
        } else {
          throw new Error('Your Secret Phrase does not seem to correct. Check the formatting. You can enter each word and it MUST BE IN ORDER -OR- paste the whole phrase after copying from your backup into any field.');
        }
      } catch(e) {
        console.error(e);
        clearData(data);
      }
    }
  });

  interface FormData {
    userName: string;
    password: string;
    confirmPassword: string;
    secretPhrase: string;
  }

  function clearData(data: FormData) {
    $form.userName = data.userName = "";
    $form.password = data.password = "";
    $form.confirmPassword = data.confirmPassword = "";
    data.secretPhrase = "";
    const elements = document.querySelectorAll<HTMLInputElement>("[data-id]");
    elements.forEach(el => {
      el.value = "";
    });
  }


  function hideShowWords() {
    let count = parseInt(selected);

    let element: HTMLElement | null;
    let element_text: HTMLElement | null;

    for (let wordCount = 13; wordCount <= 24; wordCount++) {
      element_text = document.getElementById(`word_text_${wordCount}`);
      element = document.getElementById(`word_${wordCount}`);

      if (element_text && element) {
        // Show and then toggle - this covers fringe cases
        element_text.style.display = "block";
        element.style.display = "block";
      }
    }

    for (let wordCount = 24; wordCount > count; wordCount--) {
      element_text = document.getElementById(`word_text_${wordCount}`);
      element = document.getElementById(`word_${wordCount}`);

      if (element_text && element) {
        if (element_text.style.display === "none") {
          element_text.style.display = "block";
        } else {
          element_text.style.display = "none";
        }

        if (element.style.display === "none") {
          element.style.display = "block";
        } else {
          element.style.display = "none";
        }
      }
    }

    let mtop: string;
    switch (count) {
      case 12:
        mtop = '-mt-[9rem]';
        break;
      case 15:
        mtop = '-mt-[6.5rem]';
        break;
      case 18:
        mtop = '-mt-[4.25rem]';
        break;
      case 21:
        mtop = '-mt-[2.5rem]';
        break;
      case 24: // Our default
        mtop = '';
        break;
      default:
        mtop = '';
        break;
    }
  }


  function toggleVisability() {
    let x = document.getElementById("password") as HTMLInputElement | null;
    if (x && x.type) {
      if (x.type === "password") {
        x.type = "text";
      } else {
        x.type = "password";
      }
    }
    // make better
    x = document.getElementById("confirmPassword") as HTMLInputElement | null;
    if (x && x.type) {
      if (x.type === "password") {
        x.type = "text";
      } else {
        x.type = "password";
      }
    }
  }

  function toggleWordsVisability() {
    elements = document.querySelectorAll("[data-id]") as NodeListOf<HTMLInputElement>;
    elements.forEach(el => {
      if (el.type === "password") {
        el.type = "text";
      } else {
        el.type = "password";
      }
    });
  }

  function handlePaste(e: any){
    e.preventDefault();
  }

  onMount( () => {
    try {
      hideShowWords();
      // This applies to the whole page which may not be ideal but works if only pasting the SRP
      // TBD - may want to look at which field the paste event originated from and go from there instad of 
      // overriding the entire list on each paste.
      document.addEventListener("paste", function (e: ClipboardEvent) {
        // Check if clipboard data exists
        if (e.clipboardData) {
          // Get the target element and check if it's an HTMLInputElement
          const target = e.target as HTMLInputElement;
          if (target && target.type === "text") {
            let data = e.clipboardData.getData('Text');
            // Split clipboard text into single words
            const words = data.split(' ');

            // Find all other text inputs with [data-id] attribute
            const nodes = document.querySelectorAll<HTMLInputElement>("[data-id]");

            // Set input value to the relative word
            nodes.forEach((node, index) => {
              node.value = words[index] || '';
            });
          }
        }
      });

      // Remove later after testing...

			// if (!currentlySelected.shortcuts.providerObject) {
			// 	let providerObject = setProvider(currentlySelected.shortcuts.provider, currentlySelected.shortcuts.blockchain, currentlySelected.shortcuts.chainId,  currentlySelected.data.providerKey);
			// 	if (providerObject === null) {
			// 		// Try the mainnet instead
			// 		currentlySelected.shortcuts.type = 'Mainnet';
			// 		providerObject = setProvider(currentlySelected.shortcuts.provider, currentlySelected.shortcuts.blockchain, currentlySelected.shortcuts.chainId,  currentlySelected.data.providerKey);
			// 	}
			// 	currentlySelected.shortcuts.providerObject = providerObject;
			// }

			// provider = {
			// 	name: PROVIDERS.ALCHEMY,
			// 	chainId: toHex(currentlySelected.shortcuts.chainId),
			// 	privateKey: null,
			// };

    } catch (e) {
      console.log(e);
      errorValue = e;
      error = true;
    }
  });

  function handleCancel(e: any) {
    // If the user hits cancel and YAKKL_ZERO_ADDRESS then they need to create a new account
    if (currentlySelected!.shortcuts.address === YAKKL_ZERO_ADDRESS) {
      goto(PATH_ACCOUNTS_ETHEREUM_CREATE_PRIMARY);
    } else {
      goto(PATH_WELCOME);
    }
  }

  function handleSubaccounts(e: any) {
    subAccounts = !subAccounts;
  }

</script>

{#if showConfetti}
<Confetti />
{/if}

<ErrorNoAction bind:show={error} bind:value={errorValue} />

<!-- <div class="modal" class:modal-open={error}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">ERROR</h3>
    <p class="py-4">{errorValue}</p>
    <div class="modal-action">
      <button class="btn" on:click={() => error = false}>Close</button>
    </div>
  </div>
</div> -->
  
<Cancel defaultClass="absolute right-3 top-3" />

<div class="flex flex-col h-full w-full relative justify-center left-0 z-5 text-base-content bg-base-100"> 
    <div class="">
        <span class="block w-full px-1 text-xl font-extrabold border-none text-center">Import - Secret Recovery Phrase</span>
    </div>

    <hr class="mb-3"/>

    <p class="ml-5 mr-5 p-2 text-small border-2 border-red-200 bg-red-50 text-red-900 rounded-md" aria-label="Private Key warning">
        Please be careful! <strong>This Secret Recovery Phrase is important!</strong>. 
        A bad actor could take the content of your wallet if they have access to your Private Key or Secret Recovery Phrase!
        This process will restore all of the accounts that were created by YAKKL only! If you imported existing private keys from another wallet then you will need to do so again.
    </p>

    <div class="pt-2 ml-5 mr-5 text-base-content">
        <div class="h-[650px]">
            <form class="px-5" on:submit|preventDefault={handleSubmit}>
                <div class="my-1">
                    <select id="words" bind:value={selected} on:change="{hideShowWords}"  class="block w-full px-4 md:py-2 py-1 text-xl font-normal text-base-content bg-clip-padding border border-solid border-gray-300 rounded-md ">
                        <option value="12">12 Word Secret Phrase</option>
                        <option value="15">15 Word Secret Phrase</option>
                        <option value="18">18 Word Secret Phrase</option>
                        <option value="21">21 Word Secret Phrase</option>
                        <option value="24" selected>24 Word Secret Phrase</option>
                    </select>
                    <input
                        id="userName"
                        class="block w-full px-4 md:py-2 py-1 mt-1 text-xl font-normal input input-bordered input-primary"
                        placeholder="Username"
                        bind:value="{$form.userName}"
                        on:change="{handleChange}"
                    />
                    {#if $errors.userName}
                    <small class="text-red-800 animate-pulse">{$errors.userName}</small>
                    {/if}
                    <input
                        id="password"
                        type="password"
                        class="block w-full px-4 md:py-2 py-1 mt-4 text-xl font-normal input input-bordered input-primary"
                        placeholder="Password"
                        autocomplete="off"
                        bind:value="{$form.password}"
                        on:change="{handleChange}"
                        required
                    />
                    {#if $errors.password}
                    <small class="text-red-800 animate-pulse">{$errors.password}</small>
                    {/if}
                    <!-- <input
                      id="alias"
                      class="input input-bordered input-primary w-full mt-2"
                      placeholder="(Optional) Enter account alias here..."
                      autocomplete="off"
                      bind:value={$form.alias}
                      on:change="{handleChange}"
                    /> -->          
                    <div class="flex ml-1">
                        <div>
                          <div class="form-check">
                            <input id="seePassword" on:click="{toggleVisability}" class="form-check-input appearance-none h-4 w-4 checkbox-primary rounded-full float-left mr-2 cursor-pointer" type="checkbox" value="">
                            <label class="form-check-label text-sm inline-block label-text" for="seePassword">
                              Show Password
                            </label>
                          </div>
                        </div>
                    </div>
                    <div class="flex ml-1 mt-2">
                      <div>
                        <div class="form-check">
                          <input id="subaccounts" on:click="{handleSubaccounts}" class="form-check-input appearance-none h-4 w-4 checkbox-primary rounded-full float-left mr-2 cursor-pointer" type="checkbox" value="" checked>
                          <label class="form-check-label text-sm inline-block label-text" for="subaccounts">
                            Recover Subportfolio Accounts
                          </label>
                        </div>
                      </div>
                    </div>
                </div>
                <hr/>
                <div class="flex ml-1 mt-4">
                    <div>
                      <div class="form-check">
                        <input id="seeWords" on:click="{toggleWordsVisability}" class="form-check-input appearance-none h-4 w-4 checkbox-primary rounded-full float-left mr-2 cursor-pointer" type="checkbox" value="">
                        <label class="form-check-label text-sm inline-block label-text" for="seePassword">
                          Show Secret Recovery Phrase Words
                        </label>
                      </div>
                    </div>
                </div>
                <div class="mt-4">
                    {#each  Array(24) as _, index (index)}
                    <div class="flex space-x-2 mb-3">
                        <span id="word_text_{index+1}" class="inline-block w-[5%] h-[35px] pt-1 text-md justify-center text-base-content">{index+1}.</span>
                        <input 
                            type="password" 
                            class="input input-bordered input-primary w-full"
                            id="word_{index+1}"
                            data-id="{index+1}"
                            aria-label="Word {index+1}"
                            autocomplete="off"
                            on:paste={handlePaste}
                        />
                    </div>
                    {/each}
                </div>

                <div class="{mtop} mb-20">
                    <div class="flex space-x-2 justify-center">
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-interactive-supports-focus -->
                        <button on:click|preventDefault={handleCancel} 
                            aria-label="Cancel"
                            class="btn-sm btn-accent uppercase rounded-full">
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            id="recover"
                            on:click="{handleSubmit}"
                            class="btn-sm btn-primary uppercase rounded-full ml-2"
                            aria-label="Confirm">
                            Recover
                        </button>
                    </div>
                </div>   
            </form>            
        </div>

    </div>
   
</div>

  
