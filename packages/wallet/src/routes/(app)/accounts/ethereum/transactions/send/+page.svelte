<script lang="ts">
  import { browserSvelte } from '$lib/utilities/browserSvelte';
	import { goto } from "$app/navigation";
	import { yakklGasTransStore, yakklPricingStore, yakklContactsStore, getYakklContacts, yakklConnectionStore, getProfile, getSettings, getMiscStore, yakklCurrentlySelectedStore } from '$lib/common/stores';
	import { decryptData } from '$lib/common/encryption';
	import { createForm } from 'svelte-forms-lib';
	import * as yup from 'yup';
	import { Popover, Tabs, TabItem, Timeline, TimelineItem, Spinner, Button, Hr } from 'flowbite-svelte';
	import { handleOpenInTab, formatValue, getChainId, deepCopy } from '$lib/utilities/utilities';
	import { getLengthInBytes, wait } from '$lib/common/utils';
  import { onDestroy, onMount } from 'svelte';
  import { ETH_BASE_EOA_GAS_UNITS, ETH_BASE_SCA_GAS_UNITS, PATH_LOGOUT } from '$lib/common/constants';
	import { startCheckGasPrices, stopCheckGasPrices, debounce } from '$lib/utilities/gas';
	import ErrorNoAction from '$lib/components/ErrorNoAction.svelte';
	import Warning from '$lib/components/Warning.svelte';
	import WalletManager from '$lib/plugins/WalletManager';
  import type { Wallet } from '$lib/plugins/Wallet';
	import { isEthereum } from '$lib/plugins/BlockchainGuards';
	import { BigNumber, isEncryptedData, toHex, type AccountData, type Currency, type CurrentlySelectedData, type Profile, type ProfileData, type TransactionRequest, type TransactionResponse, type YakklContact, type YakklCurrentlySelected } from '$lib/common';
	import type { BigNumberish } from '$lib/common/bignumber';
	import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
  import type { TransactionState, GasState, UIState, ValueState, ConfigState } from '$lib/common/stateInterfaces';
  import { log } from '$plugins/Logger';

	// Toast
	import { Toast } from 'flowbite-svelte';
  import { slide } from 'svelte/transition';
	import Contacts from '$lib/components/Contacts.svelte';
	import PincodeVerify from '$lib/components/PincodeVerify.svelte';
  // Toast

// EIP-6969 - A proposal of giving back some of the gas fees to developers.
// Article in Blockworks - https://blockworks.co/news/ethereum-proposal-developers-revenuers

	let wallet: Wallet;

	let currentlySelected: YakklCurrentlySelected | null;
	let yakklMiscStore: string;
	let profile: Profile | null;
	let	txGasLimit: BigNumberish = 21000n;
	let historyCount = 10; // The maximum amount of history transaction to retrieve;

	let amountTab;
	let feesTab;
	let activityTab;

	let pincode = '';

  let toAddress: string;
  let toAddressValue = 0n;

	let maxFeePerGasOverride: BigNumberish = 0n;
	let maxPriorityFeePerGasOverride: BigNumberish = 0n;
	let riskFactorMaxFee: number = 0;//1; //2;  // gwei - We add this to maxFeePerGas that comes back from the provider
	let riskFactorPriorityFee: number = 0;//.25;  // Adding a little more incentive for the validators

	let greaterThan0 = true;
	let hexData: string;  // Optional hex data to send with the transfer
  let checkGasPricesProvider = 'blocknative';
  let checkGasPricesInterval = 10; // Seconds
	let value: BigNumberish = 0n;
	let	txmaxPriorityFeePerGas = '0.0';

  ////////////////////

	// let blockchain: string = $state('Ethereum');
	// let address: string = $state('');
	// let txStatus = $state('');
	// let txBlockchain = $state('Ethereum');
	// let txNetworkTypeName = $state('Mainnet');
	// let txURL = $state('');
	// let	txHash = $state('');
	// let	txToAddress = $state('');
	// let	txValue = $state('0.0');
	// let	txmaxFeePerGas = $state('0.0');
	// let txGasPercentIncrease = $state(0);
	// let txGasLimitIncrease = $state(0); // This increases the intrinsic gas limit by the amount specified. It is based on the size of optional data * 68. So, if 100 wordsof data is sent then the gas limit will increase by 6800. This is to help to prevent out of gas errors for when the user sends option hex data with the transaction.
	// let	txNonce = $state(0);
	// let	txStartTimestamp = $state('');
	// let txHistoryTransactions: any[] = $state([]);
	// let recipientPays = $state(false); // This is for the future when we allow the user to select who pays the gas fees
	// let amountTabOpen = $state(true);
	// let feesTabOpen = $state(false);
	// let activityTabOpen = $state(false);
	// let errorFields = $state(false); // Turns the amount tab red if there is an error
	// let toAddressValueUSD = $state('0');
	// let gasEstimate = $state(0);
	// let gasEstimateUSD = $state('');
	// let maxFeePerGas: BigNumberish = $state(0n);
	// let maxPriorityFeePerGas: BigNumberish = $state(0n);
	// let gasBase = $state(0);
	// let gasBaseUSD = $state('$0.00');
	// let gasTotalEstimateUSD = $state('');
	// let gasTrend = $state('flat');
	// let trendColor = $state('text-yellow-500');
	// let lastTrendValue: number = $state(0);
	// let lowGas: number = $state(0);
	// let lowGasUSD = $state("$0.00");
	// let marketGas: number = $state(0);
	// let marketGasUSD = $state("$0.00");
	// let priorityGas: number = $state(0);
	// let priorityGasUSD = $state("$0.00");
	// let lowPriorityFee: BigNumberish = $state(0n);
	// let marketPriorityFee: BigNumberish = $state(0n);
	// let priorityPriorityFee: BigNumberish = $state(0n);
	// let selectedGas = $state('market');  // If 'custom' then the user updated the value themselves so don't override with a warning.
	// let totalUSD = $state('0');
	// let smartContract = $state(false);
	// let valueType = $state('crypto'); // Other value is 'fiat'. This represents if the user want to enter how much in crypto or how much in fiat money. Example, .0004551 or $50.00
	// let valueCrypto = $state('0.0'); // Maintains the crypto value of the valueUSD
	// let valueUSD = $state('0.0'); // Maintains the currency equivalent of the valueCrypto
	// let error = $state(false);
	// let errorValue: string = $state();
  // let warning = $state(false);
  // let warningValue: string = $state();
	// let showContacts = $state(false);
	// let showVerify = $state(false);
	// let currencyLabel: string = $state();
  // let currencyFormat: Intl.NumberFormat = $state();

  // Look for key in the response body: {"jsonrpc":"2.0","id":44,"error":{"code":-32000,"message":"transaction underpriced: gas tip cap 0, minimum needed 1"}}
  // processing response error (body="{\"jsonrpc\":\"2.0\",\"id\":44,\"error\":{\"code\":-32000,\"message\":\"transaction underpriced: gas tip cap 0, minimum needed 1\"}}", error={"code":-32000}, requestBody=...)

  ////////////////////

  let priorityClass = $state('border border-gray-100 ');
	let marketClass = $state('border-white border-2 animate-pulse ');
	let lowClass = $state('border border-gray-100 ');
	let unitPrice: number = $state(0);
	let blockNumber: number = $state();
	let estimatedTransactionCount: number = $state();
	let gasLimit: number = $state(21000); //BigNumberish;
	let gasEstimateUSDNumber: number = $state();
	let gasTotalEstimateUSDNumber: any = $state();

  let transactionState = $state<TransactionState>({
    blockchain: 'Ethereum',
    address: '',
    txStatus: '',
    txHash: '',
    txToAddress: '',
    txValue: '0.0',
    txmaxFeePerGas: '0.0',
    txmaxPriorityFeePerGas: '0.0',
    txGasLimit: 21000n,
    txNonce: 0,
    txStartTimestamp: '',
    txHistoryTransactions: [],
    historyCount: 10,
    txBlockchain: 'Ethereum',
    txNetworkTypeName: 'Mainnet',
    txURL: '',
    txGasPercentIncrease: 0,
    txGasLimitIncrease: 0,
    recipientPays: false,
  });

  let gasState = $state<GasState>({
    gasEstimate: 0,
    gasEstimateUSD: '',
    maxFeePerGas: 0,
    maxPriorityFeePerGas: 0,
    gasBase: 0,
    gasBaseUSD: '$0.00',
    gasTrend: 'flat',
    trendColor: 'text-yellow-500',
    lowGas: 0,
    lowGasUSD: '$0.00',
    marketGas: 0,
    marketGasUSD: '$0.00',
    priorityGas: 0,
    priorityGasUSD: '$0.00',
    selectedGas: 'market',
    gasTotalEstimateUSD: '',
    lastTrendValue: 0,
    lowPriorityFee: 0,
    marketPriorityFee: 0,
    priorityPriorityFee: 0,
  });

  let uiState = $state<UIState>({
    amountTabOpen: true,
    feesTabOpen: false,
    activityTabOpen: false,
    errorFields: false,
    showContacts: false,
    showVerify: false,
    error: false,
    warning: false,
    warningValue: undefined,
    errorValue: undefined,
  });

  let valueState = $state<ValueState>({
    toAddressValueUSD: '0',
    value: 0n,
    valueType: 'crypto',
    valueCrypto: '0.0',
    valueUSD: '0.0',
    totalUSD: '0',
    currencyLabel: '',
    currencyFormat: undefined,
    smartContract: false,
  });

  let configState = $state<ConfigState>({
    checkGasPricesProvider: 'blocknative',
    checkGasPricesInterval: 10,
    riskFactorMaxFee: 0,
    riskFactorPriorityFee: 0,
  });

	//////// Toast
	let toastStatus = $state(false);
  let toastCounter = 3;
  let toastMessage = $state('Success');
  let toastType = 'success'; // 'success', 'warning', 'error'

  function toastTrigger(count=3, msg='Success') {
    toastStatus = true;
    toastCounter = count;
    toastMessage = msg;
    timeout();
  }

  function timeout(): NodeJS.Timeout | void {
    if (--toastCounter > 0)
      return setTimeout(timeout, 1000);
    toastStatus = false;
  }

	onMount(() => {
		try {
			if (browserSvelte) {
				yakklMiscStore = getMiscStore();
				currentlySelected = $yakklCurrentlySelectedStore;

				wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], currentlySelected!.shortcuts.network.chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_ETHEREUM);

				valueState.currencyLabel = (currentlySelected!.preferences.currency as Currency).code ?? 'USD';
				valueState.currencyFormat = Intl.NumberFormat(currentlySelected!.preferences.locale ?? 'en-US', {style: "currency", currency: valueState.currencyLabel});

				transactionState.blockchain = currentlySelected!.shortcuts.network.blockchain;
				transactionState.address = currentlySelected!.shortcuts.address;

        // log.debug('onMount: transactionState', transactionState);
        // log.debug('onMount: currentlySelected', currentlySelected);

				checkSettings(); // If all good then returns else redirects to logout. This will force a new login.
				startGasPricingChecks();
				handleRecycle();
				loadContacts();

				checkValue();

				// May can remove this later if we still want to enable all tabs
				amountTab = document.getElementById("amount") as HTMLButtonElement;
				amountTab.disabled = false;

        activityTab = document.getElementById("activity") as HTMLButtonElement;
				activityTab.disabled = false;

        feesTab = document.getElementById("fees") as HTMLButtonElement;
				feesTab.disabled = false; //true;

				valueState.valueType = 'crypto';
				(document.getElementById("showCrypto") as HTMLInputElement).checked = true;
				(document.getElementById("showUSD") as HTMLInputElement).checked = false;
			}
		} catch(e) {
			log.error(e);
			uiState.errorValue = e as string;
			uiState.error = true;  // This 'should' show an error message but being in the onMount it may not.
		}
	});

	onDestroy(() => {
		try {
			clearValues(); // Clear all values
			stopCheckGasPrices();
		} catch(e) {
			log.error(`Send: onDestroy: ${e}`);
		}
	});

  function startGasPricingChecks() {
		try {
      // log.debug('startGasPricingChecks', checkGasPricesProvider, checkGasPricesInterval);

			startCheckGasPrices(checkGasPricesProvider, checkGasPricesInterval);

			// if (currentlySelected && currentlySelected!.shortcuts.value?.valueOf() as bigint > 0n) {
			// 	startCheckGasPrices(checkGasPricesProvider, checkGasPricesInterval);
			// } else {
			// 	stopCheckGasPrices();
			// }
		} catch(e) {
			log.error(e);
			clearVerificationValues();
		}
  }

	// Allows for dynamic update on changes to value fields
	async function onBlur(e: any) {
		try {
			toAddress = $form.toAddress;

			if ($form.toAddress) {
				// Checks to see if address belongs to a smart contract. If so, then it will have a larger base gas fee.
				const blockchain = wallet.getBlockchain();
				if (blockchain.isSmartContractSupported()) {
					valueState.smartContract = await blockchain.isSmartContract($form.toAddress) ?? false;
				} else {
					valueState.smartContract = false;
				}
			}

			if (valueState.valueType !== 'fiat') {
				valueState.valueUSD = valueState.currencyFormat ? valueState.currencyFormat.format(Number($form.toAddressValue) * Number(unitPrice)) : '0.00'; // Fixed to 2 decimal places but may need to pull from locale
			} else {
				valueState.valueCrypto = Number(Number($form.toAddressValue) / Number(unitPrice)).toString();
			}

			valueState.toAddressValueUSD = valueState.valueUSD;
			valueState.totalUSD = valueState.currencyFormat ? valueState.currencyFormat.format(Number(valueState.valueUSD) + gasTotalEstimateUSDNumber) : '0.00';
		} catch(e) {
			log.error(e);
		}
	}

	const { form, errors, handleChange, handleSubmit } = createForm({
		initialValues: { toAddress: '', toAddressValue: '', maxPriorityFeePerGasOverride: '0', maxFeePerGasOverride: '0', hexData: '' },
		validationSchema: yup.object().shape({
			toAddress: yup
      	.string()
				.required('Please enter the crypto address you wish to send to')
				.matches(/^(0x)?[0-9a-fA-F]{40}$|^.*\.eth$/, 'Must be a valid address or ENS name'),
			toAddressValue: yup
				.string()
				.trim()
				.required('Please enter the amount of ETH you wish to send')
				.matches(
					/^[0-9.]{1,}$/,
					'Only numbers are allowed since this is a value field'),
			hexData: yup
      	.string()
				.optional(),
			maxPriorityFeePerGasOverride: yup
				.string()
				.trim()
				.required('Please enter or accept the amount of estimate Gas Fees for this transaction in gwei')
				.matches(
					/^[0-9.]{1,}$/,
					'Only numbers are allowed since this is a value field'),
			maxFeePerGasOverride: yup
				.string()
				.trim()
				.required('Please enter or accept the max Gas Fee you are willing to pay for this transaction in gwei')
				.matches(
					/^[0-9.]{1,}$/,
					'Only numbers are allowed since this is a value field'),
		}),
		onSubmit: async (data) => {
			try {
        uiState.showVerify = true; // Show the PincodeVerify modal and let it follow the process from there
			} catch (e) {
        log.error(e);
				uiState.errorValue = e as string;
				uiState.error = true;
			}
		}
	});

	function isChecked(id: string) {
		if (browserSvelte) {
			try {
				const element = document.getElementById(id) as HTMLInputElement;
				if (element) {
					return element.checked;
				}
			} catch(e) {
				log.error(e);
				return false
			}
			return false;
		}
	}

	// $form validation - not pincode validation
	async function validate(data: any) {
		try {
			let address = data.toAddress;
			let resolvedAddr = null;

			// Always need to verify verification values to be safe
			let profile = await getProfile();
			if (!profile) {
				throw 'No profile found';
			}

			maxPriorityFeePerGasOverride = BigNumber.from(data.maxPriorityFeePerGasOverride);
			maxFeePerGasOverride = BigNumber.from(data.maxFeePerGasOverride);

			toAddressValue = EthereumBigNumber.fromEther(valueState.valueType != 'fiat' ? data.toAddressValue : valueState.valueCrypto).toBigInt() as bigint;

			if (data.hexData && data.hexData.length > 0) {
				if (data.hexData !== '0x') {
					hexData = toHex(data.hexData);
				} else {
					hexData = data.hexData;
				}
			}	else {
				data.hexData = hexData = '0x';
			}

			const blockchain = wallet.getBlockchain();
			if (isEthereum(blockchain)) {
				resolvedAddr = await blockchain.resolveName(address);
			} else {
				// Handle cases where the blockchain is not Ethereum
			}

			if (resolvedAddr) {
				address = resolvedAddr;
			}

			if (!blockchain.isAddress(address)) {
				uiState.warningValue = `Wallet Address ${address} is not a valid address. This can be verified on a platform like https://etherscan.io. A valid toAddress is required.`;
				uiState.warning = true;
				clearVerificationValues();
				return;
			}

      toAddress = address;

			const feePerGas: number = BigNumber.from(gasState.maxFeePerGas).toNumber() as number;
			if ( feePerGas < gasState.gasEstimate) {
				uiState.warningValue = "The transaction Max Fee Per Gas Unit is LESS than the estimated Gas Fee. This may result in a slow transaction or no transaction at all. Keeping the Max Fee Per Gas Unit equal or greater than the estimated Gas Fee increases the possibility of a faster transaction time."
				clearVerificationValues();
				uiState.warning = true;
			} else {
				// Sending to yourself with $0 amount is a good way to cancel a transaction if it has not gone through!
				// By sending to yourself, you can cancel a pending transaction. Gas fees are ALWAYS paid!
				if (greaterThan0) {
					if ($yakklConnectionStore) {
						handleProgress("amountTab", "activityTab");
						await processTransaction();  // This is the STARTING POINT! Accept the defaults for now
					} else {
						clearVerificationValues();
						uiState.warningValue = 'Your Internet connection appears to be down at the moment. Try again later.';
						uiState.warning = true;
					}
				} else {
					clearVerificationValues();
					uiState.errorValue = "There are insufficient funds for this transaction.";
					uiState.error = true;
				}
			}
		} catch (e) {
			log.error(e);
			clearVerificationValues();
			uiState.errorValue = e as string;
			uiState.error = true;
		}
	}

	async function loadContacts() {
		try {
			$yakklContactsStore = await getYakklContacts(); // Don't really need this now. The $yakklContactsStore is already set in the store
		} catch(e) {
			log.error(e);
			clearVerificationValues();
		}
	}

	async function loadTransactionHistory(networkType: string, address: string, historyCount: number) {
    try {
      let subDomainName = $yakklCurrentlySelectedStore?.shortcuts.network.explorer; //txNetworkTypeName.toLowerCase() !== 'mainnet' ? txNetworkTypeName.toLowerCase() + '.' : '';
      let apiSubDomainName = transactionState.txNetworkTypeName.toLowerCase() !== 'mainnet' ? 'api-' + transactionState.txNetworkTypeName.toLowerCase() : 'api';

      currentlySelected = $yakklCurrentlySelectedStore;
      const etherscanUrl = `https://${apiSubDomainName}.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${historyCount}&sort=desc&apikey=${import.meta.env.VITE_ETHERSCAN_API_KEY}`; // TODO: Change this to send to our edges and change keys

      if (!$yakklConnectionStore) {
        throw 'Warning. Your Internet connection appears to be down. Try again later.';
      }

      const response = await fetch(etherscanUrl);
      const contentType = response.headers.get('content-type');

      let data: any;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType && contentType.includes('text/html')) {
        data = await response.text();
        // throw new Error(`Received HTML instead of JSON: ${data}`);
        log.error(`Received HTML instead of JSON: ${data}`);
      } else {
        // throw new Error('Unsupported content type: ' + contentType);
        log.error('Unsupported content type: ' + contentType);
      }

      // Throw error if there is an error in the data - later

      transactionState.txHistoryTransactions = [];
      for (let element of data.result) {
        let yakklHistory = {
          id: currentlySelected!.id,
          type: 'etherscan',
          chainId: getChainId(networkType),
          formattedTimestamp: new Date(parseInt(element.timeStamp) * 1000),
          explorer: subDomainName + '/tx/' + element.hash,  //'https://' + subDomainName + 'etherscan.io/tx/' + element.hash,
          blockNumber: element.blockNumber, // From here down comes from etherscan. Above here is our data
          timestamp: element.timeStamp,
          hash: element.hash,
          nonce: element.nonce,
          blockHash: element.blockHash,
          transactionIndex: element.transactionIndex,
          from: element.from,
          to: element.to,
          value: formatValue(transactionState.blockchain, element.value),  // TODO: Change this to support EthereumBigNumber
          gas: element.gas,
          gasPrice: element.gasPrice,
          isError: element.isError,
          txtreceipt_status: element.txreceipt_status,
          input: element.input,
          contractAddress: element.contractAddress,
          cumulativeGasUsed: element.cumulativeGasUsed,
          gasUsed: element.gasUsed,
          confirmations: element.confirmations,
          methodId: element.methodId,
          functionName: element.functionName,
        };

        // Example of a history transaction for Sepolia:
        // {
        // 	blockNumber: "3844890",
        // 	timeStamp: "1688751360",
        // 	hash: "0x9f0a3aa982ffd0637e59207fdca8852ea27bb60c6d312c3562d23fda906032e4",
        // 	nonce: "0",
        // 	blockHash: "0x8fbdee9b285695bd4c11a73623f5461a8c0d82709cae26dd3558976d597c6df7",
        // 	transactionIndex: "16",
        // 	from: "0xb14a122382cd291f13dbc233abdedbca226fa93e",
        // 	to: "0xef9bdacbf5cd84bc66df3a2dc0c8bf22e221cb34",
        // 	value: "15000000000000000",
        // 	gas: "21000",
        // 	gasPrice: "600000010",
        // 	isError: "0",
        // 	txreceipt_status: "1",
        // 	input: "0x",
        // 	contractAddress: "",
        // 	cumulativeGasUsed: "10684268",
        // 	gasUsed: "21000",
        // 	confirmations: "2514084",
        // 	methodId: "0x",
        // 	functionName: ""
        // },

        transactionState.txHistoryTransactions.push(yakklHistory);
      }
    } catch (e) {
      log.error(e);
      uiState.errorValue = e as string;
      uiState.error = true;
      clearVerificationValues();
    }
  }

	async function checkSettings() {
		try {
			const yakklSettings = await getSettings();
			if (yakklSettings === null || yakklSettings === undefined || yakklSettings.init == false || yakklSettings.isLocked === true) {
					goto(PATH_LOGOUT); // This will reset.
			}
		} catch(e) {
			log.error(e);
			goto(PATH_LOGOUT); // This is a catch all for now
		}
	}

	async function checkValue() {
		try {
			if (browserSvelte) {
				try {
					currentlySelected = $yakklCurrentlySelectedStore;
					value = currentlySelected!.shortcuts.value ?? 0n;

					if (value.valueOf() as bigint <= 0n) {
						greaterThan0 = false;
						uiState.error = true;
						uiState.errorValue = `The current account, ${currentlySelected!.shortcuts.address}, has a 0 balance - there are insufficient funds in this account.`;
					}
				} catch (e) {
					uiState.error = true;
					uiState.errorValue = e as string;
				}
			}
		} catch(e) {
			log.error(e);
		}
	}

	function handleClose() {
		try {
			uiState.error=false;
			uiState.warning=false;
			// ???? or leave it
			// clearValues();
			// goto(PATH_WELCOME);
		} catch(e) {
			log.error(e);
		}
	}

  // Returns the profile if the pincode is correct or null if it is not
	async function verifyWithPin(pin: string): Promise<Profile | null>{
		try {
      // If no pin passed then it has not be set by the user yet via PincodeVerify.
      if (!pin) {
        return null;
      }

			let profile: Profile | null = await getProfile();
			if (profile === null) {
				throw 'Profile was not found.';
			}

			let profileEncrypted = null;

			if (isEncryptedData(profile.data)) {
				profileEncrypted = deepCopy(profile);
				await decryptData(profile?.data, yakklMiscStore).then(result => {
					(profile as Profile).data = result as ProfileData;
				});
			}

			if (pin === (profile.data as ProfileData).pincode) {
				profile = null;
				return profileEncrypted;
			} else {
				throw 'PINCODE did not match. Please try again.';
			}
		} catch(e) {
			log.error(e);
			uiState.errorValue = e as string;
			uiState.error = true;
			return null;
		}
	}

	// unblockIncrease is a percentage increase (100 is added to it and then multiplied)
	// It MUST be as an integer and not a float. Example, 10% increase would be 10 and not .10

  async function processTransaction(unblockIncrease = 0, nonce = -1, hash: string = '', cancel = false, eoa=true) {
		try {
			currentlySelected = deepCopy($yakklCurrentlySelectedStore); // Allows for a deep copy of the store that does not impact the actual store

			profile = await verifyWithPin(deepCopy(pincode)); // Verifies one more time. deepCopy is used to ensure that the pincode has not changed
			if (!profile) {
				throw 'Unable to verify your PINCODE. Please try again.'; //YAKKL pincode not valid. Please try again.';
			}

			// Create a transaction object
			// Override values are set at submit time so we use those
			// If cancel = true then have from and to be the same address, value = 0 and increase gas

			const priorityFeePerGas = Math.max(Number(gasState.maxPriorityFeePerGas), Number(maxPriorityFeePerGasOverride));// EthereumBigNumber.max(maxPriorityFeePerGas, maxPriorityFeePerGasOverride).toString(); //BigNumber.max(maxPriorityFeePerGas, maxPriorityFeePerGasOverride));
			let feePerGas = Math.max(Number(gasState.maxFeePerGas), Number(maxFeePerGasOverride)); //EthereumBigNumber.max(maxFeePerGas, maxFeePerGasOverride);

			// Check unblockIncrease and add it to the maxFeePerGasOverride
			if (unblockIncrease > 0) {
				transactionState.txGasPercentIncrease += unblockIncrease;
				feePerGas = Math.max(Number(gasState.maxFeePerGas) * ((100+transactionState.txGasPercentIncrease)/100), Number(gasState.maxFeePerGas)); // In gwei, bumps up the gas fee by the percentage to aid in unblocking transactions
			}

			const transaction: TransactionRequest = {
				type: 2,
				from: transactionState.address ? transactionState.address : '',
				to: cancel === false ? toAddress : currentlySelected!.shortcuts.address, // Allows for sending to yourself to cancel a transaction
				value: cancel === true ? 0n : EthereumBigNumber.toWei(toAddressValue).value, //parseEther(toAddressValue.toString()), // If cancel is true then set value to 0
				chainId: currentlySelected!.shortcuts.network.chainId,
				gasLimit: gasLimit,
				maxPriorityFeePerGas: EthereumBigNumber.toGwei(priorityFeePerGas).value, //parseUnits(priorityFeePerGas.toString(), 'gwei'),   // In gwei
				maxFeePerGas: EthereumBigNumber.toGwei(feePerGas).value, // parseUnits(feePerGas.toString(), 'gwei'),
				data: hexData.length > 0 ? hexData : '0x',
				hash: hash,
				nonce: nonce,
			};

			// let hexTransaction = convertToHexStrings(transaction,['type', 'nonce']);
			// All 'tx' prefix variables are available for the UI and misc
			transactionState.txBlockchain = transactionState.blockchain;
			transactionState.txNetworkTypeName = currentlySelected!.shortcuts.network.name;

			transactionState.txURL = $yakklCurrentlySelectedStore?.shortcuts.network.explorer + '/address/' + transactionState.address;
			transactionState.txHash = transaction.hash ?? '';
			transactionState.txToAddress = transaction.to ?? '';
			transactionState.txValue = transaction.value?.toString() ?? '0.0';
			transactionState.txmaxFeePerGas = transaction.maxFeePerGas?.toString() ?? '0';
			txmaxPriorityFeePerGas = transaction.maxPriorityFeePerGas?.toString() ?? '0';
			txGasLimit = transaction.gasLimit as bigint;
			transactionState.txNonce = Number(transaction.nonce);
			transactionState.txStartTimestamp = Date.now().toString();

			let privateKey: string | null | undefined = null;

			if (isEncryptedData(currentlySelected?.data)) {
				let result = await decryptData(currentlySelected?.data, yakklMiscStore);
				let data = result as CurrentlySelectedData;
				if (isEncryptedData(data.account?.data)) {
					let result = await decryptData(data.account.data, yakklMiscStore);
					let accountData = result as AccountData;
					privateKey = accountData.privateKey;
				} else {
					privateKey = data ? data?.account?.data.privateKey : null;
				}
			} else {
				privateKey = currentlySelected?.data ? ((currentlySelected?.data as CurrentlySelectedData).account?.data as AccountData).privateKey : null;
			}

			if (privateKey === null) {
				throw 'Private key was not obtained';
			}

			await wallet.setSigner(privateKey!);

			const tx: TransactionResponse = await wallet.sendTransaction(transaction);

			clearVerificationValues(); // Clear verification values as soon as possible
			if (tx) {
				toastTrigger(2, 'Sending to the blockchain...');
				transactionState.txStatus = 'pending';
				transactionState.txHash = tx.hash;

				transactionState.txURL = $yakklCurrentlySelectedStore?.shortcuts.network.explorer + '/tx/';
				transactionState.txURL += tx.hash;

				transactionState.txNonce = Number(tx.nonce);

				const result = await tx.wait();
				transactionState.txStatus = 'mined';

				toastTrigger(2, 'Success - Processed on the Blockchain!');
				wait(2000); // So that Etherscan has time to update
				handleRecycle(); // Adds transactions again to the store OR we need to remove txTransactions etc from clearValues()
				clearValues();
			} else {
     	  throw 'No transaction was returned. Something went wrong.';
    	}
		} catch(e: any) {
      // Verify if the error is a response error and if so, process it for a more accurate error message
			uiState.errorValue = e?.message ?? e;
			uiState.error = true;
      log.error(e);
		} finally {
			log.info('processTransaction: Clearing verification values.');
			clearVerificationValues();
		}
  }

	// May want to remove this if we still want to keep all tabs open
	function handleProgress(currentTab: string, nextTab: string) {
		switch (currentTab) {
			case "amountTab":
				uiState.amountTabOpen = false;
				break;

			case "activityTab":
				uiState.activityTabOpen = false;
				break;

			case "feesTab":
				uiState.feesTabOpen = false;
				break;
		}

		switch (nextTab) {
			case "amountTab":
				uiState.amountTabOpen = true;
				break;

			case "activityTab":
				uiState.activityTabOpen = true;
				break;

			case "feesTab":
				uiState.feesTabOpen = true;
				break;
		}

	}

	function handleCurrentTab(currentTab: string) {
		switch (currentTab) {
			case "amountTab":
				uiState.amountTabOpen = true;
				uiState.feesTabOpen = false;
				uiState.activityTabOpen = false;
				break;

			case "feesTab":
				uiState.amountTabOpen = false;
				uiState.feesTabOpen = true;
				uiState.activityTabOpen = false;
				break;

			case "activityTab":
				uiState.activityTabOpen = true;
				uiState.amountTabOpen = false;
				uiState.feesTabOpen = false;
				break;

		}
	}

	function handleMax() {
		// May need to reduce based on estimated fees
		try {
			$form.toAddressValue = EthereumBigNumber.toEtherString($yakklCurrentlySelectedStore!.shortcuts.value) ?? '0.0';
		} catch(e) {
			log.error(e);
			clearVerificationValues();
		}
	}

	function handleCancelReset() {
		try {
		} catch(e) {
			clearValues();
			log.error(e);
		}
	}

	function clearValues() {
		try {
			clearVerificationValues();
			toAddressValue = 0n;
			valueState.valueCrypto = '0.0';
			valueState.valueUSD = '0.0';
			$form.toAddress = toAddress =	'';
			$form.toAddressValue = '';
			$form.hexData = hexData = '';
			$form.maxPriorityFeePerGasOverride = (gasState.maxPriorityFeePerGas = 0).toString();
			$form.maxFeePerGasOverride = (gasState.maxFeePerGas = 0).toString();
			uiState.amountTabOpen = true;
			uiState.feesTabOpen = false;
			uiState.errorFields = false;
			transactionState.txNetworkTypeName = 'Mainnet';
			transactionState.txURL = '';
			transactionState.txHash = '';
			transactionState.txToAddress = '';
			transactionState.txValue = '0.0';
			transactionState.txGasPercentIncrease = 0; // This is a percentage increase to the gas fee to aid in unblocking transactions and must be an integer and not a float
			transactionState.txmaxFeePerGas = '0.0';
			txmaxPriorityFeePerGas = '0.0';
			txGasLimit = 21000n;
			transactionState.txGasLimitIncrease = 0;
			transactionState.txNonce = 0;
			transactionState.recipientPays = false;
			transactionState.txStartTimestamp = '';
			transactionState.txHistoryTransactions = [];
			valueState.valueType = 'crypto';
		} catch(e) {
			log.error(e);
		}
	}

	// Simply clear only the popup verfication values
	function clearVerificationValues() {
		if (browserSvelte) {
			try {
				pincode = '';
			} catch(e) {
				log.error(e);
			}
		}
	}

	function handleGasSelect(select: string) {
		try {
			let selectedClass = 'border-2 animate-pulse ';
			let nonSelectedClass = 'border ';

			gasState.selectedGas = select;

			priorityClass = nonSelectedClass;
			marketClass = nonSelectedClass;
			lowClass = nonSelectedClass;

			if (select === 'priority') {
				priorityClass = selectedClass;
				gasState.maxPriorityFeePerGas = gasState.priorityPriorityFee;
				gasState.maxFeePerGas = gasState.priorityGas;
			} else if (select === 'low') {
				lowClass = selectedClass;
				gasState.maxPriorityFeePerGas = gasState.lowPriorityFee;
				gasState.maxFeePerGas = gasState.lowGas;
			} else {
				marketClass = selectedClass;
				gasState.maxPriorityFeePerGas = gasState.marketPriorityFee;
				gasState.maxFeePerGas = gasState.marketGas;
			}
		} catch(e) {
			log.error(e);
			clearVerificationValues();
		}
	}

  function handleContact(contact: YakklContact) {
		try {
			toAddress = $form.toAddress = contact.address;
			uiState.showContacts = false;
		} catch(e) {
			log.error(e);
			clearVerificationValues();
		}
  }

	// increase is a percent like 10% = 10 and not .10
	async function handleSpeedUp(increase=10, nonce: number, hash: string) {
		try {
			// log.debug('handleSpeedUp', increase, nonce, hash);

			await processTransaction(increase, nonce, hash, false);
			// processTransaction - keep from and to the same, keep value the same and raise maxFeePerGas & raise maxPriorityFeePerGas (optional for priorityfee) higher so that the validators take it! NOTE: Gas fee is ALWAYS charged!!
		} catch(e) {
			log.error(e);
			clearVerificationValues();
		}
	}

	// increase is a percent like 10% = 10 and not .10
	// Default is 20 = (10 * 2)
	function handleCancel(increase=10, nonce: number, hash: string) {
		try {
			// log.debug('handleCancel', increase*2, nonce, hash);

			processTransaction(increase*2, nonce, hash, true); // setting cancel = true (last param) will send a cancel transaction
		} catch(e) {
			log.error(e);
			clearVerificationValues();
		}
	}

	function handleOpenAddress(url: string) {
		try {
			let URL = url.toLowerCase();
			if (transactionState.txNetworkTypeName.toLowerCase() !== 'mainnet') {
				if ( URL.includes(transactionState.txNetworkTypeName.toLowerCase() + '.')) {
					URL = url;
				} else {
					URL = url.replace('https://', 'https://' + transactionState.txNetworkTypeName.toLowerCase() + '.');
				}
			}
			handleOpenInTab(URL);
		} catch(e) {
			log.error(e);
		} finally {
			clearVerificationValues();
		}
	}

	// function handleRecycle() {
	const handleRecycle = debounce(async () => {
		try {
			// Let this finish when it finishes
			loadTransactionHistory($yakklCurrentlySelectedStore!.shortcuts.network.type, $yakklCurrentlySelectedStore!.shortcuts.address, historyCount);
		} catch(e) {
			clearVerificationValues();
			log.error(e);
		}
	});

	function handleSendRequest() {
		uiState.showVerify = true;
    // Pincode is disabled for now
	}

	// The calling function should compute the increase and then call this function. For example, count the wordsin the data field, multiply by 68 and then call this function
	function handleIncreaseGasLimit(increase: number) {
		try {
			if (increase > 0) {
				transactionState.txGasLimitIncrease = increase;
				gasLimit = gasLimit + transactionState.txGasLimitIncrease;
			}
		} catch(e) {
			log.error(e);
		}
	}

	// First verfication for the pincode. The second verification is done in the processTransaction function
	function handlePin(pin: string) {
		try {
			pincode = pin; // Set global pincode
      handleApprove();
		} catch(e) {
			log.error(e);
      handleReject();
		}
	}

	async function handleApprove() {
		try {
			uiState.showVerify = false;
			await validate($form); // Validates form data and then calls processTransaction
		} catch(e) {
			log.error(e);
			clearVerificationValues();
		}
	}

	function handleReject() {
		try {
			uiState.showVerify = false;
			uiState.warning = true;
			uiState.warningValue = 'Transaction failed - You have rejected or Pincode was not validated. No transaction was sent.';
		} catch(e) {
			log.error(e);
			clearValues(); // Clear everything out on reject. Leave the values so the user can try again.
		}
	}

	function handleSetFiatValue() {
		$form.toAddressValue = valueState.valueUSD;
		valueState.valueType = 'fiat';
	}

	function handleSetCryptoValue() {
		$form.toAddressValue = valueState.valueCrypto;
		valueState.valueType = 'crypto';
	}

  //////// Toast

	$effect(() => {
		if ($errors.toAddress ||
			$errors.hexData ||
			$errors.maxFeePerGasOverride ||
			$errors.maxPriorityFeePerGasOverride ||
			$errors.toAddressValue ){
				uiState.errorFields = true;
			} else {
				uiState.errorFields = false;
			}
	});

	$effect(() => {
		try {
			transactionState.txNetworkTypeName = $yakklCurrentlySelectedStore!.shortcuts.network.name ?? 'Mainnet';
			transactionState.txBlockchain = $yakklCurrentlySelectedStore!.shortcuts.network.blockchain ?? 'Ethereum';

			startGasPricingChecks(); // It will start the interval if not already. If it already exists then it will return

			gasLimit = valueState.smartContract === true ? ETH_BASE_SCA_GAS_UNITS : ETH_BASE_EOA_GAS_UNITS; // These are the norms for gas units it takes for the different eth transactions
			if ($form.hexData) {
				handleIncreaseGasLimit(getLengthInBytes($form.hexData) * 68); // 68 may need to be more dynamic in the future. This is for EOA transactions that have hex data
			} else {
				gasLimit = valueState.smartContract === true ? ETH_BASE_SCA_GAS_UNITS : ETH_BASE_EOA_GAS_UNITS;
				transactionState.txGasLimitIncrease = 0;
			}

			// $yakklGasTransStore and $yakklPricingStore are used to get the gas prices and the current price of ether or other crypto used for gas fees.
			// These types of stores can be used as is and do not need to be set in the store. They are used to get the values from the store. The others do need to be set due to the way the store is used.
			// unitPrice = $yakklPricingStore?.price.valueOf() as number ?? 0;
      unitPrice = $yakklPricingStore?.price ?? 0;

			if (valueState.valueType !== 'fiat') {
				valueState.valueUSD = Number(Number($form.toAddressValue) * unitPrice).toFixed(2); // Fixed to 2 decimal places but may need to pull from locale
			} else {
				valueState.valueCrypto = Number(Number($form.toAddressValue) / unitPrice).toString();
			}

			if ($yakklGasTransStore) {
				blockNumber = $yakklGasTransStore.results.blockNumber;
				estimatedTransactionCount = $yakklGasTransStore.results.estimatedTransactionCount;

				const nextTrendValue = Math.round($yakklGasTransStore.results.gasFeeTrend.baseFeePerGasAvg);

				gasState.lowPriorityFee = $yakklGasTransStore.results.actual.slow.maxPriorityFeePerGas + riskFactorPriorityFee;
				gasState.marketPriorityFee = $yakklGasTransStore.results.actual.fast.maxPriorityFeePerGas + riskFactorPriorityFee;
				gasState.priorityPriorityFee = $yakklGasTransStore.results.actual.fastest.maxPriorityFeePerGas + riskFactorPriorityFee;

				gasState.lowGas = $yakklGasTransStore.results.actual.slow.maxFeePerGas + riskFactorMaxFee;
				gasState.marketGas = $yakklGasTransStore.results.actual.fast.maxFeePerGas + riskFactorMaxFee;
				gasState.priorityGas = $yakklGasTransStore.results.actual.fastest.maxFeePerGas + riskFactorMaxFee;

				gasState.lowGasUSD = valueState.currencyFormat ? valueState.currencyFormat.format(Number(gasLimit * ((gasState.lowGas * 1) / (10 ** 9)) * (unitPrice * 1))) : '0.00';
				gasState.marketGasUSD = valueState.currencyFormat ? valueState.currencyFormat.format(Number(gasLimit * ((gasState.marketGas * 1) / (10 ** 9)) * (unitPrice * 1))): '0.00';
				gasState.priorityGasUSD = valueState.currencyFormat ? valueState.currencyFormat.format(Number(gasLimit * ((gasState.priorityGas * 1) / (10 ** 9)) * (unitPrice * 1))) : '0.00';

				gasState.gasBase = $yakklGasTransStore.results.actual.baseFeePerGas;
				gasState.gasBaseUSD = valueState.currencyFormat ? valueState.currencyFormat.format(Number(gasLimit * ((gasState.gasBase * 1) / (10 ** 9)) * (unitPrice * 1))) : '0.00';

				switch(gasState.selectedGas) {
					case 'priority':
						gasState.maxFeePerGas = gasState.priorityGas;
						gasState.maxPriorityFeePerGas = gasState.priorityPriorityFee;
						break;
					case 'low':
						gasState.maxFeePerGas = gasState.lowGas;
						gasState.maxPriorityFeePerGas = gasState.lowPriorityFee;
						break;
					default: // market
						gasState.maxFeePerGas = gasState.marketGas;
						gasState.maxPriorityFeePerGas = gasState.marketPriorityFee;
						break;
				}

				gasState.gasEstimate = Number(gasState.gasBase) + Number(gasState.maxPriorityFeePerGas);  // Base fee + validator tip

				handleGasSelect(gasState.selectedGas);

				if (gasState.lastTrendValue !== 0) {
					if (nextTrendValue > gasState.lastTrendValue) {
						gasState.gasTrend = 'higher';
						gasState.trendColor = 'text-red-500';
					} else if (nextTrendValue < gasState.lastTrendValue) {
						gasState.gasTrend = 'lower';
						gasState.trendColor = 'text-green-500';
					} else {
						gasState.gasTrend = 'flat';
						gasState.trendColor = 'text-yellow-500';
					}
				}

				gasState.lastTrendValue = nextTrendValue;
				// gasState.maxPriorityFeePerGas = gasState.maxPriorityFeePerGas;
				// maxFeePerGas = Math.round(maxFeePerGas);
			}

			if (gasState.gasEstimate) {
				gasEstimateUSDNumber = gasLimit * (((gasState.gasEstimate * 1) / (10 ** 9)) * (Number(unitPrice) * 1));
				gasState.gasEstimateUSD = valueState.currencyFormat ? valueState.currencyFormat.format(gasEstimateUSDNumber) : '0.00';

				gasTotalEstimateUSDNumber = gasLimit * (((gasState.gasEstimate * 1) / (10 ** 9)) * (Number(unitPrice) * 1));
				gasState.gasTotalEstimateUSD = valueState.currencyFormat ? valueState.currencyFormat.format(gasTotalEstimateUSDNumber) : '0.00';

				valueState.toAddressValueUSD = valueState.currencyFormat ? valueState.currencyFormat.format(Number(valueState.valueUSD)) : '0.00';
				valueState.totalUSD = valueState.currencyFormat ? valueState.currencyFormat.format(Number(valueState.valueUSD) + gasTotalEstimateUSDNumber) : '0.00';
			}

		} catch(e) {
			log.error(e);
		}
	});
</script>

<PincodeVerify bind:show={uiState.showVerify} onVerified={handlePin} onRejected={handleReject} className="text-gray-600"/>

<ErrorNoAction bind:show={uiState.error} value={uiState.errorValue} handle={handleClose}/>
<Warning bind:show={uiState.warning} value={uiState.warningValue} />
<Contacts bind:show={uiState.showContacts} onContactSelect={handleContact} />

<Toast color="indigo" transition={slide} bind:toastStatus>
  {#if toastType === 'success'}
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  {/if}
  {toastMessage}
</Toast>

<div class="text-center min-h-[75rem] -mt-1 ">
	<div class="top-[.75rem] right-[1.5rem]">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<span role="button" onclick={handleCancelReset} class="inline-flex items-center rounded-full btn-tiny bg-secondary btn-primary hover:bg-secondary/50 px-2">Cancel/Reset</span>
	</div>
	<h2 class="text-xl tracking-tight font-extrabold text-gray-100 dark:text-white mt-1">
		<span class="lg:inline">Send/Transfer {transactionState.blockchain}</span>
	</h2>

	<hr class="mb-0.5 mt-0.5" />
		<form class="" onsubmit={handleSubmit}>

			<Tabs defaultClass="flex flex-wrap justify-center space-x-2 h-9"
				activeClasses="px-4 text-white border-b-2 animate-pulse text-lg border-purple-300 mt-2 font-extrabold dark:text-blue-500 dark:border-blue-500"
				contentClass=""
				inactiveClasses="px-4 border-b-2 border-transparent text-md text-gray-100 font-semibold hover:text-purple-200 hover:border-purple-200 dark:hover:text-gray-300 dark:text-gray-400">

				<TabItem id="amount" open={uiState.amountTabOpen} on:click={() => {handleCurrentTab("amountTab")}} style={uiState.errorFields ? "color:red" : uiState.errorFields ? "color:red": ""} title="Send">
					<div class="border rounded-lg border-gray-200 px-4 py-2 mt-2 ">
						<span class="text-gray-300 text-md -mt-1 font-bold">Send To</span>
						<div class="mt-2 text-left">
							<div class="flex flex-row">
								<div class="flex-col w-full">
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_interactive_supports_focus -->
									<div role="button" onclick={() => uiState.showContacts=true} class="flex flex-row mb-1">
										<span class="text-xs text-gray-100 mr-2 font-bold flex flex-col">Receiving Address</span>
										<span>
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-4 h-4 fill-gray-100 outline-gray-100 flex flex-col">
												<path d="M384 48c8.8 0 16 7.2 16 16V448c0 8.8-7.2 16-16 16H96c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16H384zM96 0C60.7 0 32 28.7 32 64V448c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H96zM240 256a64 64 0 1 0 0-128 64 64 0 1 0 0 128zm-32 32c-44.2 0-80 35.8-80 80c0 8.8 7.2 16 16 16H336c8.8 0 16-7.2 16-16c0-44.2-35.8-80-80-80H208zM512 80c0-8.8-7.2-16-16-16s-16 7.2-16 16v64c0 8.8 7.2 16 16 16s16-7.2 16-16V80zM496 192c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm16 144c0-8.8-7.2-16-16-16s-16 7.2-16 16v64c0 8.8 7.2 16 16 16s16-7.2 16-16V336z"/>
											</svg>
										</span>
									</div>
									<input
										id="toAddress"
										class="placeholder:italic block w-full px-4 md:py-2 py-1 leading-7 text-sm font-normal
										text-gray-700 bg-gray-100 bg-clip-padding border border-solid border-gray-300
										rounded-md transition ease-in-out m-0 focus:text-gray-700 focus:bg-white
										focus:border-blue-600 focus:outline-none"
										placeholder="Address of recipient"
										autocomplete="off"
										bind:value={$form.toAddress}
										onchange={handleChange}
										onblur={onBlur}
										required />
									{#if $errors.toAddress}
										<small class="text-red-600 font-bold animate-pulse">{$errors.toAddress}</small>
									{/if}
									{#if valueState.smartContract}
										<small class=" text-green-500 font-bold animate-pulse">*This is a smart contract address</small>
									{/if}
								</div>
							</div>

							<div class="flex flex-row mt-2">
								<div class="flex-col w-full">
									<span class="text-xs text-gray-100 font-bold mb-1 mr-1">Send Amount</span>
									<span class="text-xs text-gray-100 mb-1 mr-1">(Show as ETH</span>
									<input id="showCrypto" type="radio" name="show_how" class="radio radio-primary radio-xs mb-1" onclick={handleSetCryptoValue} />
									<span class="text-xs text-gray-100 mb-1 mx-1">Show as {valueState.currencyLabel}</span>
									<input id="showUSD" type="radio" name="show_how" class="radio radio-primary radio-xs mb-1" onclick={handleSetFiatValue} />
									<span class="text-xs text-gray-100 mb-1">)</span>
									<div class="flex flex-row">
										<input
											id="toAddressValue"
											class="placeholder:italic block w-full px-4 md:py-2 py-1 leading-7 text-md font-normal
											text-gray-700 bg-gray-100 bg-clip-padding border border-solid border-gray-300
											rounded-md transition ease-in-out m-0 focus:text-gray-700 focus:bg-white
											focus:border-blue-600 focus:outline-none"
											placeholder="Send amount"
											autocomplete="off"
											bind:value={$form.toAddressValue}
											onchange={handleChange}
											onblur={onBlur}
											required />
										{#if $errors.toAddressValue}
											<small class="text-red-600 font-bold animate-pulse">{$errors.toAddressValue}</small>
										{/if}
									</div>
									<div class="flex flex-row justify-between mt-1">
										<div class="mt-0">
											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<!-- svelte-ignore a11y_interactive_supports_focus -->
											<span role="button" onclick={handleMax} class="inline-flex items-center rounded-full bg-blue-100 hover:bg-blue-200 px-2.5 py-0.5 text-[10px]/3 font-normal text-blue-800">Send MAX ETH</span>
										</div>
										<div class="flex flex-col">
											<span class="text-xs text-gray-200 font-bold ml-3 ">Estimated gas/net fees: {gasState.gasEstimateUSD}</span>
											<span class="text-xs text-gray-200 font-bold ml-3 ">Estimated value: {valueState.toAddressValueUSD}</span>

											{#if transactionState.recipientPays}
											<div class="flex flex-row -ml-1 mt-1">
												<input type="checkbox"
													class="mr-1 h-3 w-3 cursor-pointer appearance-none rounded-sm border border-blue-800 bg-white bg-contain bg-center bg-no-repeat align-top transition duration-200 checked:border-blue-600 checked:bg-blue-600 focus:outline-none"
													id="recipientFees">
												<label class="inline-block text-xs/3 text-orange-500 dark:text-white font-bold" for="recipientFees">Recipient pays fees! (experimental)</label>
											</div>
											{/if}
										</div>
									</div>

									<!-- <div class="hidden hover:show"> -->
										<!-- <span class="text-xs text-gray-100 font-bold mb-1">Data (optional - also used by Smart Contracts)</span>
										<input
											id="hexData"
											class="placeholder:italic block w-full px-4 md:py-2 py-1 leading-7 text-md font-normal
											text-gray-700 bg-gray-100 bg-clip-padding border border-solid border-gray-300
											rounded-md transition ease-in-out m-0 focus:text-gray-700 focus:bg-white
											focus:border-blue-600 focus:outline-none"
											placeholder="Optional data in hex format"
											autocomplete="off"
											bind:value={$form.hexData}
											on:change={handleChange}
											on:blur={onBlur} />
										{#if $errors.hexData}
											<small class="text-red-600 font-bold animate-pulse">{$errors.hexData}</small>
										{/if} -->
									<!-- </div> -->

									{#if valueState.totalUSD !== '0'}
									<div class="w-full text-center mt-1">
										<span class="font-bold text-sm text-gray-100">Total estimated Amount: {valueState.totalUSD}</span>
									</div>
									{/if}
								</div>
							</div>
						</div>
					</div>

					<div class="mt-2">
						<button
							id="send"
							onclick={handleSendRequest}
							class="inline-block h-10 px-7 md:py-3 py-2 mt-.5 bg-indigo-600 text-gray-300 font-bold
							text-large leading-snug uppercase rounded-md shadow-md hover:bg-indigo-700
							hover:shadow-md focus:bg-indogo-700 focus:shadow-md focus:outline-none focus:ring-0
							active:bg-indigo-800 active:shadow-md transition duration-150 ease-in-out w-full"
							data-mdb-ripple="true"
							data-mdb-ripple-color="light">
							<div class="inline-flex items-center align-middle">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4 mr-2 ml-2 font-bold">
									<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
								</svg>
								<span>SEND</span>
							</div>
						</button>
					</div>
				</TabItem>

				<TabItem id="activity" open={uiState.activityTabOpen} on:click={() => {handleCurrentTab("activityTab")}} title="Activity">
					<!-- Total with all fees added should go here -->
					{#if valueState.totalUSD !== '0'}
					<div class="w-full text-center mt-2">
						<span class="font-bold text-lg text-gray-100">Total estimated amount: {valueState.totalUSD}</span>
					</div>
					{/if}

					<!-- Status window -->
					<!-- svelte-ignore unknown_code -->
					<div class="my-2 border border-white rounded-md w-full h-[8rem] text-white">
						<div class="text-left m-1 text-md break-all">
							<p>Most recent transaction history for: {transactionState.address}</p>
							<p>Blockchain: {transactionState.txBlockchain}</p>
							<p>Network type: {transactionState.txNetworkTypeName}</p>
							<p>Chain ID: {$yakklCurrentlySelectedStore?.shortcuts.chainId}</p>
						</div>
						<!-- svelte-ignore a11y_interactive_supports_focus -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div role="button" id="reload" onclick={handleRecycle} class="inline-flex items-center rounded-full btn-tiny bg-secondary btn-primary hover:bg-secondary/50 px-2">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
								<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
							</svg>
							REFRESH LIST
						</div>
					</div>

					<div class="m-4 mr-1 text-left text-base-content">
						<Timeline >
							<!-- order="vertical"> -->
							{#if transactionState.txStatus === 'pending'}
							<TimelineItem >
								<h3 class="flex items-center text-lg font-semibold text-base-content animate-pulse dark:text-white">Pending Transaction</h3>
								<time class="block mb-2 text-xs font-normal leading-none text-gray-400 dark:text-gray-500">{new Date(parseInt(transactionState.txStartTimestamp))}</time>

								<div class="w-full break-all ">
									<p class="text-sm font-semibold text-white">
										Sending/Transferring: {transactionState.txValue}
									</p>
									<p class="text-sm -mt-1 font-semibold text-white">
										To:
									</p>
									<p class="text-xs mt-0.5 font-normal text-white">
										{transactionState.txToAddress}
									</p>
									<p class="mt-1 text-sm font-semibold text-white">
										Transaction hash:
									</p>
									<p class="mt-0.5 text-xs font-normal text-white">
										{transactionState.txHash}
									</p>
									<p class="text-xs font-semibold text-white mt-1">
										Transaction nonce: {transactionState.txNonce}
									</p>
									<p class="text-sm font-normal text-gray-400 dark:text-gray-500 ">
										Transaction Gas Fee vs Current Network Gas Fee:
									</p>
									<p class="text-sm font-normal text-gray-400 dark:text-gray-500 ">
										{transactionState.txmaxFeePerGas} gwei -- {Math.round(Number(gasState.maxFeePerGas))} gwei{#if Number(gasState.maxFeePerGas) > Number(transactionState.txmaxFeePerGas)}: Network congested - May need to increase Gas Fee (click Speed Up) or continue to wait on network.{/if}
									</p>
								</div>
								<div class="flex flex-row mt-1">
									<Button size="xs" pill={true} on:click={() => handleSpeedUp(transactionState.txGasPercentIncrease > 0 ? transactionState.txGasPercentIncrease : 10, transactionState.txNonce, transactionState.txHash)} class="mr-2">Speed Up</Button>
									<Button size="xs" pill={true} color="alternative" on:click={() => handleCancel(transactionState.txGasPercentIncrease > 0 ? transactionState.txGasPercentIncrease : 10, transactionState.txNonce, transactionState.txHash)}>Cancel</Button>
									<Button class="ml-2" size="xs" pill={true} color="light" on:click={() => handleOpenInTab(transactionState.txURL)}>Details ></Button>
								</div>
							</TimelineItem>
							{/if}

						{#await transactionState.txHistoryTransactions}
							<div class="flex flex-row justify-center items-center">
								<Spinner color="yellow" size={6} />
							</div>
						{:then _}
							{#each transactionState.txHistoryTransactions as transaction}

							<TimelineItem >

								<div class="ml-4">
									{#if transaction.status === 'pending'}
									<h3 class="flex items-center text-lg font-semibold text-white">Pending Transaction</h3>
									{:else if (transaction.from === transactionState.address.toLowerCase()) && (transaction.to !== transactionState.address.toLowerCase())}
									<h3 class="flex items-center text-lg font-semibold text-white">Send Transaction</h3>
									{:else if (transaction.to === transactionState.address.toLowerCase()) && (transaction.from !== transactionState.address.toLowerCase())}
									<h3 class="flex items-center text-lg font-semibold text-white">Receive Transaction</h3>
									{:else if (transaction.from === transactionState.address.toLowerCase()) && (transaction.to === transactionState.address.toLowerCase())}
									<h3 class="flex items-center text-lg font-semibold text-white">Send/Receive/Cancel Transaction</h3>
									{:else}
									<h3 class="flex items-center text-lg font-semibold text-white">Error</h3>
									{/if}
									<time class="block mb-2 text-xs font-normal leading-none text-gray-300 dark:text-gray-200">{transaction.formattedTimestamp}</time>
								</div>

								<div class="w-full break-all ml-4">
									<p class="text-sm font-semibold text-white">
										{#if transaction.from === transaction.to}
										Canceled or non-value transaction: {transaction.value}
										{:else if transaction.to === transactionState.address}
										Receive transaction: {transaction.value}
										{:else}
										Send transaction: {transaction.value}
										{/if}
									</p>
									<p class="text-sm -mt-1 font-semibold text-white">
										{#if transaction.to === transactionState.address}
										From:
										{:else}
										To:
										{/if}
									</p>
									<p class="text-xs mt-0.5 font-normal text-white">
										{#if transaction.to === transactionState.address}
										{transaction.from}
										{:else}
										{transaction.to}
										{/if}
									</p>
									<p class="mt-1 text-sm font-semibold text-white">
										Transaction hash:
									</p>
									<p class="mt-0.5 text-xs font-normal text-white">
										{transaction.hash}
									</p>
									<p class="text-xs font-semibold text-white mt-1">
										Transaction nonce: {transaction.nonce}
									</p>
								</div>
								{#if transactionState.txStatus === 'pending'}
								<div class="flex flex-row mt-1">
									<Button size="xs" pill={true} on:click={() => handleSpeedUp(transactionState.txGasPercentIncrease, transaction.nonce, transaction.hash)} class="mr-2">Speed Up</Button>
									<Button size="xs" pill={true} color="alternative" on:click={() => handleCancel(transactionState.txGasPercentIncrease, transaction.nonce, transaction.hash)}>Cancel</Button>
								</div>
								{:else}
								<div class="flex flex-row mt-1">
									{#if $yakklCurrentlySelectedStore && $yakklCurrentlySelectedStore?.shortcuts.network.explorer.length > 0}
									<Button size="xs" pill={true} color="light" on:click={() => handleOpenInTab($yakklCurrentlySelectedStore ? $yakklCurrentlySelectedStore?.shortcuts.network.explorer + '/tx/' + transaction.hash : '')}>Details ></Button>
									{:else}
									<Button size="xs" pill={true} color="light">N/A</Button>
									{/if}
								</div>
								{/if}
							</TimelineItem>
							{/each}
						{/await}
						</Timeline>

						<Hr class="my-4 mx-auto md:my-10 w-48 h-1" />
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_interactive_supports_focus -->
						<div class="text-center mt-1 w-full flex flex-col mx-0" role="button" onclick={() => handleOpenAddress($yakklCurrentlySelectedStore?.shortcuts.network.explorer + '/address/' + transactionState.address)}>
							<div class="flex flex-row">
								<div class="flex flex-col">FULL history for this account can be found here:</div>
								<div class="flex flex-col">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="ml-1 w-4 h-4">
										<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
									</svg>
								</div>
							</div>
						</div>
					</div>
				</TabItem>

				<TabItem id="fees" open={uiState.feesTabOpen} on:click={() => {handleCurrentTab("feesTab")}} style={$errors.maxPriorityFeePerGasOverride? "color:red" : $errors.maxFeePerGasOverride ? "color:red": ""} title="Fees">
					<Popover class="text-sm z-10" triggeredBy="#maxPriorityFeePerGasOverride" placement="top">
						<h3 class="font-semibold text-gray-900 dark:text-white">Estimated Gas Fee</h3>
						<div class="grid grid-cols-4 gap-2">
								<div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
								<div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
								<div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
								<div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
						</div>
						<p class="py-2">The default value is the estimated Gas Fee from the blockchain. The Gas Fee is a transaction cost that can vary based on network traffic and validators. This fee can be edited if you desired. Any lower fee entered could poorly impact the transaction processing time.</p>
					</Popover>

					<Popover class="text-sm z-10" triggeredBy="#maxFeePerGasOverride" placement="top">
						<h3 class="font-semibold text-gray-900 dark:text-white">Gas Fee Limit (MAX)</h3>
						<div class="grid grid-cols-4 gap-2">
								<div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
								<div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
								<div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
								<div class="h-1 bg-orange-300 dark:bg-orange-400"></div>
						</div>
						<p class="py-2">The default value is the same as the estimated Gas Fee from the blockchain. Any fee lower than the Gas Estimate value could poorly impact the transaction processing time or potentially reverse the transaction.</p>
					</Popover>

					<div class="border rounded-lg border-gray-200 p-2 mt-4 ">

						<div class="w-full text-center mb-1">
							<span class="font-bold text-sm text-gray-100">(Optional) Advanced breakdown of fees</span>
						</div>
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_interactive_supports_focus -->
						<div role="button" onclick={() => handleOpenInTab('https://www.blocknative.com/gas-estimator?utm_source=yakkl')} class="flex flex-row mb-2 -mt-1 text-gray-100 items-center justify-center">
							<div class="flex flex-row underline">Transaction "Gas" Fee Tracker</div>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="flex flex-row ml-2 w-4 h-4">
								<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
							</svg>
						</div>

						{#if valueState.totalUSD !== '0'}
						<div class="w-full text-center mb-1">
							<span class="font-bold text-lg text-gray-100">Total estimated amount: {valueState.totalUSD}</span>
						</div>
						{/if}

						<div class="grid grid-cols-3 gap-2 text-gray-100">
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_interactive_supports_focus -->
							<div id="priority" role="button" onclick={() => {handleGasSelect('priority')}} class="{priorityClass} border-green-500 rounded-md shadow h-[10rem]">
								<div class="flex flex-col items-center justify-center">
									<div class="flex-row">
										<!-- Maybe an icon -->
										<span class="flex-row font-bold text-lg">Priority</span>
									</div>
									<div class="text-md font-medium">
										<span>priority fee</span>
									</div>
									<div class="text-lg">
										{Number(gasState.priorityPriorityFee).toFixed(2)} gwei
									</div>
									<div class="text-md font-medium">
										<span>max fee</span>
									</div>
									<div class="text-xl">
										{Math.round(gasState.priorityGas)} gwei
										 <!-- {priorityGas / (10 ** 9)} gwei -->
									</div>
									<div class="text-sm text-gray-100">
										est. {gasState.priorityGasUSD}
									</div>
									<div class="text-xs text-green-500 font-semibold">
										99% Probability
									</div>
								</div>
							</div>

							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_interactive_supports_focus -->
							<div id="market" role="button" onclick={() => {handleGasSelect('market')}} class="{marketClass} border-yellow-500 rounded-md shadow-xl h-[10rem]">
								<div class="flex flex-col items-center justify-center">
									<div class="flex-row">
										<!-- Maybe an icon -->
										<span class="flex-row font-bold text-lg">Market</span>
									</div>
									<div class="text-md font-medium">
										<span>priority fee</span>
									</div>
									<div class="text-lg">
										{Number(gasState.marketPriorityFee).toFixed(2)} gwei
									</div>
									<div class="text-md font-medium">
										<span>max fee</span>
									</div>
									<div class="text-xl">
										{Math.round(gasState.marketGas)} gwei
										<!-- {marketGas / (10 ** 9)} gwei -->
									</div>
									<div class="text-sm text-gray-100">
										est. {gasState.marketGasUSD}
									</div>
									<div class="text-xs text-yellow-500 font-semibold">
										90% Probability
									</div>
								</div>
							</div>

							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_interactive_supports_focus -->
							<div id="low" role="button" onclick={() => {handleGasSelect('low')}} class="{lowClass} border-amber-500 rounded-md shadow h-[10rem]">
								<div class="flex flex-col items-center justify-center">
									<div class="flex-row">
										<!-- Maybe an icon -->
										<span class="flex-row font-bold text-lg">Low</span>
									</div>
									<div class="text-md font-medium">
										<span>priority fee</span>
									</div>
									<div class="text-lg">
										{Number(gasState.lowPriorityFee).toFixed(2)} gwei
									</div>
									<div class="text-md font-medium">
										<span>max fee</span>
									</div>
									<div class="text-xl">
										{Math.round(gasState.lowGas)} gwei
										 <!-- {lowGas / (10 ** 9)} gwei -->
									</div>
									<div class="text-sm text-gray-100">
										est. {gasState.lowGasUSD}
									</div>
									<div class="text-xs text-amber-500 font-semibold">
										70% probability
									</div>
								</div>
							</div>

						</div>

						<div class="w-full text-center mt-2">
							<span class="text-gray-300 text-xs font-semibold">Fee cost trend since last check: <span class="{gasState.trendColor}">{gasState.gasTrend}</span></span>
						</div>

						<div class="w-full text-left mt-1 border border-yellow-300 rounded-md">
							<div class="w-full text-left ml-1">
								<span class="text-yellow-300 text-xs font-semibold">Base fee: {Number(gasState.gasBase).toFixed(2)} gwei - {gasState.gasBaseUSD}</span>
							</div>
						</div>
						<div class="w-full text-left mt-1 ml-1">
							<span class="text-gray-300 text-xs font-semibold">Current blockchain number: {blockNumber}</span>
						</div>
						<div class="w-full text-left mt-1 ml-1">
							<span class="text-gray-300 text-xs font-semibold">Estimated transaction count for block: {estimatedTransactionCount}</span>
						</div>

						<div class="w-full text-left mt-1 border border-green-300 rounded-md">
							<div class="w-full text-left">
								<span class="text-green-300 text-xs font-semibold">Priority fee: {Number(gasState.maxPriorityFeePerGas).toFixed(2)}</span>
							</div>
							<div class="w-full text-left">
								<span class="text-green-300 text-xs font-semibold">Max fee limit: {Math.round(Number(gasState.maxFeePerGas))}</span>
							</div>
						</div>

						<div class="w-full text-left mt-1 border border-amber-300 rounded-md">
							<div class="w-full text-center mb-1">
								<span class="font-bold text-xs text-gray-100">Overrides will be used instead of above dynamic numbers</span>
							</div>

							<div class="flex flex-row mt-2 ml-1 mb-1">
								<div class="flex flex-col w-[49%] text-center">
									<span class="text-gray-300 text-xs font-bold">Priority fee (tip) - gwei</span>
									<input
										id="maxPriorityFeePerGasOverride"
										class="placeholder:italic block mt-2 px-4 md:py-2 py-1 leading-5 text-md font-normal
										text-gray-700 bg-gray-100 bg-clip-padding border border-solid border-gray-300
										rounded-md transition ease-in-out m-0 focus:text-gray-700 focus:bg-white
										focus:border-blue-600 focus:outline-none"
										placeholder="Est. Gas Fee"
										autocomplete="off"
										bind:value={$form.maxPriorityFeePerGasOverride}
										onchange={handleChange}
										onblur={onBlur}
										required />
								</div>
								<div class="flex flex-col w-[49%] text-center">
									<span class="text-gray-300 text-xs font-bold">Max fee limit - gwei</span>
									<input
										id="maxFeePerGasOverride"
										class="placeholder:italic block ml-2 mt-2 px-4 md:py-2 py-1 leading-5 text-md font-normal
										text-gray-700 bg-gray-100 bg-clip-padding border border-solid border-gray-300
										rounded-md transition ease-in-out m-0 focus:text-gray-700 focus:bg-white
										focus:border-blue-600 focus:outline-none"
										placeholder="Gas Fee Limit"
										autocomplete="off"
										bind:value={$form.maxFeePerGasOverride}
										onchange={handleChange}
										onblur={onBlur}
										required />
								</div>
							</div>
							{#if $errors.maxPriorityFeePerGasOverride}
								<small class="text-red-600 font-bold animate-pulse">{$errors.maxPriorityFeePerGasOverride}</small>
							{/if}
							{#if $errors.maxFeePerGasOverride}
								<small class="text-red-600 font-bold animate-pulse">{$errors.maxFeePerGasOverride}</small>
							{/if}
						</div>
						<div class="flex flex-row mt-2">
							<div class="text-left flex flex-col">
								<p class="text-xs text-gray-200 font-bold">Total gwei: {Number(gasState.gasEstimate).toFixed(2)}</p>
								<p class="text-xs text-gray-200 font-bold">Total estimated fees: {gasState.gasTotalEstimateUSD}</p>
							</div>
						</div>
					</div>

				</TabItem>

		</Tabs>

	</form>

</div>

