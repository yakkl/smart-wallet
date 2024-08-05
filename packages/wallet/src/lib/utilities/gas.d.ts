// src/lib/utilities/gas.d.ts
declare module '$lib/utilities/gas' {
  interface EstimatedPrice {
    confidence: number;
    price: number;
    maxPriorityFeePerGas: number;
    maxFeePerGas: number;
  }

  interface BlockPrice {
    blockNumber: number;
    estimatedTransactionCount: number;
    baseFeePerGas: number;
    estimatedPrices: EstimatedPrice[];
  }

  interface BlocknativeResponse {
    blockPrices: BlockPrice[];
  }

  interface GasFeeTrend {
    blocknumber: number;
    baseFeePerGas: number;
    maxPriorityFeePerGas: number;
    maxFeePerGas: number;
    timestamp: number;
  }

  interface GasTransStore {
    provider: string | null;
    id: NodeJS.Timeout | undefined;
    results: {
      blockNumber: number;
      estimatedTransactionCount: number;
      gasProvider: string;
      actual: {
        baseFeePerGas: number;
        fastest: { maxPriorityFeePerGas: number; maxFeePerGas: number };
        faster: { maxPriorityFeePerGas: number; maxFeePerGas: number };
        fast: { maxPriorityFeePerGas: number; maxFeePerGas: number };
        standard: { maxPriorityFeePerGas: number; maxFeePerGas: number };
        slow: { maxPriorityFeePerGas: number; maxFeePerGas: number };
      };
      gasFeeTrend: {
        baseFeePerGasAvg: number;
        mostRecentFees: GasFeeTrend[];
      };
    };
  }

  export function fetchBlocknativeData(): Promise<GasTransStore['results']>;
  export function fetchEtherscanData(): Promise<number[]>;
  export function fetchEGSData(): Promise<number[]>;
  export function startCheckGasPrices(): void;
  export function debounce<T>(fn: () => Promise<T>): () => Promise<T>;
  export function startCheckGasPrices(provider?: string, seconds?: number): void;
  export function stopCheckGasPrices(): void;
}
