// Transaction-related state interface
export interface TransactionState {
  blockchain: string;
  address: string;
  txStatus: string;
  txBlockchain: string;
  txNetworkTypeName: string;
  txURL: string;
  txHash: string;
  txToAddress: string;
  txValue: string;
  txmaxFeePerGas: string;
  txmaxPriorityFeePerGas: string;
  txGasPercentIncrease: number;
  txGasLimit: bigint;
  txGasLimitIncrease: number;
  txNonce: number;
  txStartTimestamp: string;
  txHistoryTransactions: any[];
  historyCount: number;
  recipientPays: boolean;
}

// Gas-related state interface
export interface GasState {
  gasEstimate: number;
  gasEstimateUSD: string;
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
  gasBase: number;
  gasTotalEstimateUSD: string;
  gasBaseUSD: string;
  gasTrend: string;
  trendColor: string;
  lastTrendValue: number;
  lowGas: number;
  lowGasUSD: string;
  marketGas: number;
  marketGasUSD: string;
  priorityGas: number;
  priorityGasUSD: string;
  selectedGas: string;
  lowPriorityFee: number;
  marketPriorityFee: number;
  priorityPriorityFee: number;
}

// UI-related state interface
export interface UIState {
  amountTabOpen: boolean;
  feesTabOpen: boolean;
  activityTabOpen: boolean;
  errorFields: boolean;
  error: boolean;
  warning: boolean;
  warningValue: string; // Deprecate
  errorValue: string; // Deprecate
  message: string;
  showConfirm: boolean;
  showContacts: boolean;
  showVerify: boolean;
}

// Value-related state interface
export interface ValueState {
  toAddressValueUSD: string;
  value: bigint;
  valueType: string;
  valueCrypto: string;
  valueUSD: string;
  totalUSD: string;
  smartContract: boolean;
  currencyLabel: string;
  currencyFormat: Intl.NumberFormat | undefined;
}

// Config-related state interface
export interface ConfigState {
  checkGasPricesProvider: string;
  checkGasPricesInterval: number;
  riskFactorMaxFee: number;
  riskFactorPriorityFee: number;
}
