// Base coingecko API
import { fetchJson } from "@ethersproject/web";
import { get } from 'svelte/store';
import { yakklPricingStore, yakklConnectionStore, yakklCurrentlySelectedStore } from "$lib/common/stores";
import { PriceManager } from '$lib/plugins/PriceManager';
import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';
import { KrakenPriceProvider } from '$lib/plugins/providers/price/kraken/KrakenPriceProvider';
import { CoingeckoPriceProvider } from '$lib/plugins/providers/price/coingecko/CoingeckoPriceProvider';




// https://polygon.io/docs/crypto/get_v3_reference_exchanges - APIs to look at next (stocks and crypto)

let pricingIntervalID: string | number | NodeJS.Timeout | undefined=undefined;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let providerCB: string; // Note: If we decided to have multiple intervals running or alarms then we can add to an array

// Add other providers here
const priceManager = new PriceManager([
  { provider: new CoinbasePriceProvider(), weight: 5 },
  { provider: new KrakenPriceProvider(), weight: 4 },
  { provider: new CoingeckoPriceProvider(), weight: 1 }, // Coingecko does not update prices as frequently as other providers since we're using the public API.
  // Add other providers with their weights...
]);

// NOTE: The PriceManager will randomly pick a provider based on the weights given. The higher the weight the more likely it will be picked.
async function checkPricesCallback() {
  try {
    if (pricingIntervalID) {
      if (get(yakklConnectionStore) === true) {
        console.log('checkPrices:', get(yakklCurrentlySelectedStore)?.shortcuts.symbol); // Comment this out later

        const result = await priceManager.getPrice(get(yakklCurrentlySelectedStore)?.shortcuts.symbol+'-USD'); // This needs a better way. We will look into using a store. We need to pass in the pair as symbol-currency.
        yakklPricingStore.set({
          provider: result.provider,
          id: 'checkPricesCallback',
          price: result.price
        });

        console.log('checkPrices:', result);

      } else {
        console.log('checkPrices:', 'Internet connection may be down.'); // Comment this out later
      }
    }
  } catch (e) {
    console.log(`checkPricesCallback: ${e}`);    
  }
}


// This will get a price from the PriceManager. The provider will be randomly picked based on the weights given. May want to pass in a provider to use instead of picking a random one OR a new function to get a specific provider.
export async function getPrice(pair: string = 'ETH-USD') {
  return await priceManager.getPrice(pair);
}


// Use this function instead of -1 in checkPrices
export function stopCheckPrices() {
  if (pricingIntervalID && Number(pricingIntervalID) > 0) {
    clearInterval(pricingIntervalID);
    pricingIntervalID = undefined;
  } else {
    pricingIntervalID = undefined;
  }
}


// NOTE: This function is used to start the interval for checking prices. It will run every x seconds.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function startCheckPrices(seconds = 10): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (seconds > 0) {
        if (pricingIntervalID && Number(pricingIntervalID) > 0) {
          return resolve(); // Already running
        }
        pricingIntervalID = setInterval(checkPricesCallback, 1000 * seconds);
        resolve();
      } else {
        // Handle the case where seconds are less than or equal to 0
        if (pricingIntervalID && Number(pricingIntervalID) > 0) {
          clearInterval(pricingIntervalID);
          pricingIntervalID = undefined;
        }
        resolve();
      }
    } catch (e) {
      console.log(`startCheckPrices: ${e}`);
      reject(e);
    }
  });
}


// export async function getPrices(pairs: [string]) {
//   // Add an array of the pricing providers
//   // random index for the array
//   // switch statement matching the strings in the array
//   // default to coinbase
//   // transpose results to abstract schema

//   let pair: string;

//   try {
//     // Needs better gaits
//     pair = pairs[0];
//     if (get(yakklConnectionStore) === true) {
//       return await getPricesCoinbase(pair.toUpperCase());
//     } else {
//       console.log('Internet Connection:', 'May be offline for getPrices method.');
//     }

//   } catch (e) {
//     console.log(`getPrices: ${e}`);
//     return [];
//   }
// }

// export async function getPricesEtherscan(
//   assets: [string],
//   currencies: [string]
// ): Promise<[]> {
//   const coinIds = assets.map((a) => a).join(",")

//   const currencySymbols = currencies
//     .map((c) => c.toLowerCase())
//     .join(",");

//   try {
//     const json = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&include_last_updated_at=true&vs_currencies=${currencySymbols}`);

//     // TBD - May want to look at ajv json validator for future...

//     return json;
//   } catch (e) {
//     console.log(`getPricesEtherscan: ${e}`);
//     return [];
//   }
// }


// export async function getPricesCoinbase(pair: string) {
//   try {
//     const json = await fetchJson(`https://api.pro.coinbase.com/products/${pair}/ticker`);
//     return json;
//   } catch (e) {
//     console.log(`getPricesCoinbase: ${e}`);
//     return [];
//   }
// }

// export async function getPricesKraken(pair: string) {
//   try {
//     const json = await fetchJson(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
//     return json;
//   } catch (e) {
//     console.log(`getPricesKraken: ${e}`);
//     return [];
//   }
// }

// https://api.binance.us/api/v3/ticker/price?symbol=LTCBTC
// https://docs.binance.us/#market-data-endpoints

export async function getPricesBinanceUS(pair: string) {
  try {
    const json = await fetchJson(`https://api.binance.us/api/v3/ticker/price?symbol=${pair.toUpperCase()}`);
    return json;
  } catch (e) {
    console.log(e);
    return [];
  }
}


// Response Fields (trading pairs, ex. tBTCUSD)
// Index	Field	Type	Description
// [0]	BID	float	Price of last highest bid
// [1]	BID_SIZE	float	Sum of the 25 highest bid sizes
// [2]	ASK	float	Price of last lowest ask
// [3]	ASK_SIZE	float	Sum of the 25 lowest ask sizes
// [4]	DAILY_CHANGE	float	Amount that the last price has changed since yesterday
// [5]	DAILY_CHANGE_RELATIVE	float	Relative price change since yesterday (*100 for percentage change)
// [6]	LAST_PRICE	float	Price of the last trade
// [7]	VOLUME	float	Daily volume
// [8]	HIGH	float	Daily high
// [9]	LOW	float	Daily low

// Example response: [60134, 3.11775918, 60135, 6.29412191, -617, -0.01015621, 60134, 243.54258395, 61916, 60072]
// Last trade price: 60134 or [6]

export async function getPricesBitfinex(pair: string) {
  try {
    // https://api-pub.bitfinex.com/v2/ticker/tBTCUSD for a single pair
    const json = await fetchJson(`https://api-pub.bitfinex.com/v2/tickers?symbols=t${pair.toUpperCase().replace('-', '')}`); // t prefix for trading pairs on Bitfinex - tETHUSD or tBTCUSD
    return json[6];
  } catch (e) {
    console.log(e);
    return [];
  }
}

// Bitstamp has a number of nice features. This returned data show the percent of change in the last 24 hours
// {timestamp: "1723398353", open: "60940", high: "61868", low: "59959", last: "60192", volume: "1008.29813067", vwap: "60962", bid: "60173", ask: "60175", side: "1", open_24: "60652", percent_change_24: "-0.76"}
// We need the last price and the percent change in the last 24 hours
export async function getPricesBitstamp(pair: string) {
  try {
    const json = await fetchJson(`https://www.bitstamp.net/api/v2/ticker/${pair.toLowerCase().replace('-', '')}`);
    return json.last;
  } catch (e) {
    console.log(e);
    return [];
  }
}


