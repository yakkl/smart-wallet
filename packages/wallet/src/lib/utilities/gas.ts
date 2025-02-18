// main.ts
import { get } from "svelte/store";
import { yakklGasTransStore, yakklConnectionStore } from "$lib/common/stores";
import type { GasFeeTrend, BlocknativeResponse, GasTransStore, EstimatedPrice } from '$lib/common/interfaces';
import { timerManager } from "$lib/plugins/TimerManager";
import { log } from "$plugins/Logger";

const now = () => +Date.now() / 1000;

// let gasPriceIntervalID: NodeJS.Timeout | undefined = undefined;
let providerGasCB: string | null = null;
const gasFeeTrend: GasFeeTrend[] = [];

async function checkGasPricesCB() {
  try {
    // if (gasPriceIntervalID) {
    if (timerManager.isRunning('gas_checkGasPrices')) {
      if (get(yakklConnectionStore) === true) {
        const results = await fetchBlocknativeData();
        yakklGasTransStore.set({ provider: providerGasCB, id: timerManager.getIntervalID('gas_checkGasPrices'), results });
      }
    }
  } catch (error) {
    log.error(error);
  }
}

function setGasCBProvider(provider: string | null) {
  providerGasCB = provider;
}

export function stopCheckGasPrices() {
  try {
    // if (gasPriceIntervalID) {
      // clearInterval(gasPriceIntervalID);
      timerManager.stopTimer('gas_checkGasPrices');
      setGasCBProvider(null);
      // gasPriceIntervalID = undefined;
    // }
  } catch (error) {
    log.error(error);
  }
}

export function startCheckGasPrices(provider = 'blocknative', seconds = 5) {
  try {
    if (seconds > 0) {
      // if (gasPriceIntervalID) {
      if (timerManager.isRunning('gas_checkGasPrices')) {
        return; // Already running
      }
      setGasCBProvider(provider);
      // if (!gasPriceIntervalID) {
      if (timerManager.isRunning('gas_checkGasPrices')) {
        // gasPriceIntervalID = setInterval(checkGasPricesCB, 1000 * seconds);
        timerManager.addTimer('gas_checkGasPrices', checkGasPricesCB, 1000 * seconds);
      }
    }
  } catch (error) {
    log.error(error);
    timerManager.stopTimer('gas_checkGasPrices');
    // if (gasPriceIntervalID && Number(gasPriceIntervalID) > 0) {
    //   clearInterval(gasPriceIntervalID);
    //   gasPriceIntervalID = undefined;
    // }
  }
}

const memoizeAsync = <T>(fn: () => Promise<T>): () => Promise<T> => {
  const CACHE_DURATION = 10;
  let lastRunTs = 0;
  let cache: T;

  return async () => {
    const isCacheExpired = now() - lastRunTs > CACHE_DURATION;

    if (isCacheExpired) {
      lastRunTs = now();
      cache = await fn();
    }

    return cache;
  };
};

const debounce = <T>(fn: () => Promise<T>): () => Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return () =>
    new Promise((resolve) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => resolve(fn()), 500);
    });
};

const getBlocknativeData = memoizeAsync<BlocknativeResponse>(async () =>
  (
    await fetch(
      "https://api.blocknative.com/gasprices/blockprices?confidenceLevels=99&confidenceLevels=95&confidenceLevels=90&confidenceLevels=80&confidenceLevels=70"
    )
  ).json()
);

const getEtherscanData = memoizeAsync(async () =>
  (
    await fetch(
      "https://api.etherscan.io/api?module=gastracker&action=gasoracle"
    )
  ).json()
);

const getEGSData = memoizeAsync(async () =>
  (
    await fetch(
      `https://ethgasstation.info/api/ethgasAPI.json?api-key=3923e07fd996632e1fbc897c859aa90a1f604bab3a2c22efa2780109db6f`
    )
  ).json()
);

export { debounce, getBlocknativeData, getEtherscanData, getEGSData };

export const fetchBlocknativeData = debounce(async () => {
  try {
    const response = await getBlocknativeData();
    if (response?.blockPrices) {
      const blockPrices = response.blockPrices[0];
      const estimatedPrices: EstimatedPrice[] = blockPrices.estimatedPrices;

      const fastest = estimatedPrices.find((price: EstimatedPrice) => price.confidence === 99)!;
      const faster = estimatedPrices.find((price: EstimatedPrice) => price.confidence === 95)!;
      const fast = estimatedPrices.find((price: EstimatedPrice) => price.confidence === 90)!;
      const standard = estimatedPrices.find((price: EstimatedPrice) => price.confidence === 80)!;
      const slow = estimatedPrices.find((price: EstimatedPrice) => price.confidence === 70)!;

      if (gasFeeTrend.length > 4) {
        gasFeeTrend.shift();
      }
      gasFeeTrend.push({
        blocknumber: blockPrices.blockNumber,
        baseFeePerGas: blockPrices.baseFeePerGas,
        maxPriorityFeePerGas: fastest.maxPriorityFeePerGas,
        maxFeePerGas: fastest.maxFeePerGas,
        timestamp: now()
      });

      const sum = gasFeeTrend.reduce((accumulator, currentValue) => accumulator + currentValue.baseFeePerGas, 0);
      const avg = sum / gasFeeTrend.length;

      const results: GasTransStore['results'] = {
        blockNumber: blockPrices.blockNumber,
        estimatedTransactionCount: blockPrices.estimatedTransactionCount,
        gasProvider: 'blocknative',
        actual: {
          baseFeePerGas: blockPrices.baseFeePerGas,
          fastest: { maxPriorityFeePerGas: fastest.maxPriorityFeePerGas, maxFeePerGas: fastest.maxFeePerGas },
          faster: { maxPriorityFeePerGas: faster.maxPriorityFeePerGas, maxFeePerGas: faster.maxFeePerGas },
          fast: { maxPriorityFeePerGas: fast.maxPriorityFeePerGas, maxFeePerGas: fast.maxFeePerGas },
          standard: { maxPriorityFeePerGas: standard.maxPriorityFeePerGas, maxFeePerGas: standard.maxFeePerGas },
          slow: { maxPriorityFeePerGas: slow.maxPriorityFeePerGas, maxFeePerGas: slow.maxFeePerGas }
        },
        gasFeeTrend: {
          baseFeePerGasAvg: avg,
          mostRecentFees: gasFeeTrend
        }
      };

      return results;
    } else {
      return {} as GasTransStore['results'];
    }
  } catch (error) {
    log.error(error);
    return {} as GasTransStore['results'];
  }
});

export const fetchEtherscanData = debounce(async () => {
  try {
    const {
      result: { SafeGasPrice, ProposeGasPrice, FastGasPrice },
    } = await getEtherscanData();

    return [
      parseInt(FastGasPrice, 10),
      parseInt(ProposeGasPrice, 10),
      parseInt(SafeGasPrice, 10)
    ];
  } catch (error) {
    log.error(error);
    return [0, 0, 0];
  }
});

export const fetchEGSData = debounce(async () => {
  try {
    const { fast, safeLow, average } = await getEGSData();

    return [fast / 10, average / 10, safeLow / 10];
  } catch (error) {
    log.error(error);
    return [0, 0, 0];
  }
});
