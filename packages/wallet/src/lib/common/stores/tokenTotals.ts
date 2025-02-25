import { derived, type Readable } from 'svelte/store';
import { yakklCombinedTokenStore } from '$lib/common/stores';
import { log } from "$lib/plugins/Logger";
import { DEBUG_ALL_LOGS } from '../constants';
import { computeTokenValue } from '$lib/common/computeTokenValue'; // Utility function to ensure accurate calculations

// Type definition for the store value
export type TokenTotals = {
  portfolioTotal: number;
  formattedTotal: string;
  chainTotals: {
    byChain: Record<number, number>;
    formatted: Record<string, string>;
  };
};

// Debugging flag (set to true when troubleshooting)
const DEBUG_LOGS = DEBUG_ALL_LOGS;

export const tokenTotals: Readable<TokenTotals> = derived(
  yakklCombinedTokenStore,
  (tokens, set) => {
    if (!tokens || tokens.length === 0) {
      log.warn("No tokens found in yakklCombinedTokenStore. Skipping calculations.");
      set({
        portfolioTotal: 0,
        formattedTotal: "$0.00",
        chainTotals: { byChain: {}, formatted: {} }
      });
      return;
    }

    let portfolioTotal = 0;
    const chainTotals: Record<number, number> = {};

    // Process all tokens
    tokens.forEach(token => {
      if (!token) return;

      const { value } = computeTokenValue(token); // Compute accurate token value
      portfolioTotal += value;

      const chainId = token.chainId ?? -1; // Default to -1 if undefined
      chainTotals[chainId] = (chainTotals[chainId] ?? 0) + value;
    });

    // Format portfolio total
    const formattedTotal = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(portfolioTotal);

    // Format totals per blockchain
    const formattedChainTotals = Object.entries(chainTotals).reduce(
      (acc, [chainId, total]) => {
        acc[chainId] = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(total);
        return acc;
      },
      {} as Record<string, string>
    );

    if (DEBUG_LOGS) {
      // log.debug("======== Portfolio Total ========", portfolioTotal, formattedTotal);
      // log.debug("======== Chain Totals ==========", chainTotals, formattedChainTotals);
    }

    // Update store
    set({
      portfolioTotal,
      formattedTotal,
      chainTotals: {
        byChain: chainTotals,
        formatted: formattedChainTotals
      }
    });
  },
  { // Initial Value
    portfolioTotal: 0,
    formattedTotal: "$0.00",
    chainTotals: { byChain: {}, formatted: {} }
  }
);





// // lib/stores/tokenTotals.ts
// import { derived, type Readable } from 'svelte/store';
// import { yakklCombinedTokenStore } from '$lib/common/stores';
// import { log } from "$lib/plugins/Logger"; // Ensure logger is available
// import { DEBUG_ALL_LOGS } from '../constants';
// import { BigNumber } from '../bignumber';
// import { computeTokenValue } from '../tokenValueCompute';

// // Type definition for the store value
// export type TokenTotals = {
//   portfolioTotal: number;
//   formattedTotal: string;
//   chainTotals: {
//     byChain: Record<number, number>;
//     formatted: Record<string, string>;
//   };
// };

// // Debugging flag (set to true when troubleshooting)
// const DEBUG_LOGS = DEBUG_ALL_LOGS;

// export const tokenTotals: Readable<TokenTotals> = derived(
//   yakklCombinedTokenStore,
//   (tokens, set) => {
//     if (!tokens || tokens.length === 0) {
//       log.warn("No tokens found in yakklCombinedTokenStore. Skipping calculations.");
//       return;
//     }

//     if (DEBUG_LOGS) // log.debug("!!!!!!!!!!!!!!!!!!!!!!!!!!!!! --------------- Derived tokenTotals triggered with tokens: ---------------- !!!!!!!!!!!!!!!!!!!!!!!!!!!!", tokens);

//     // Calculate total portfolio value
//     const portfolioTotal = tokens.reduce((sum, token) => {
//       if (!token) return sum;

//       // Ensure correct numeric parsing
//       // let balance: number = 0;

//       // if (typeof token.balance === "string") {
//       //   balance = parseFloat(token.balance); // Convert string balance to number
//       // } else if (BigNumber.isBigNumber(token.balance)) {
//       //   balance = parseFloat(token.balance.toString()); // Convert BigNumber to string and then to number
//       // } else if (typeof token.balance === "object" && token.balance._hex) {
//       //   balance = parseFloat(BigNumber.from(token.balance).toString()); // Convert hex BigNumber to number
//       // }

//       // // Correct balance scaling with decimals
//       // const adjustedBalance = balance ? balance / (10 ** (token.decimals ?? 18)) : 0;

//       // const price = token.price?.price ?? 0;
//       // const value = adjustedBalance * price;

//       if (DEBUG_LOGS) {
//         // log.debug(
//         //   `Token: ${token.symbol} | Raw Balance: ${token.balance} | Adjusted: ${adjustedBalance} | ` +
//         //   `Price: ${price} | Value: ${value}`
//         // );
//       }

//       // return sum + value;

//       const { value } = computeTokenValue(token);
//       return sum + value;
//     }, 0);

//     // log.debug("Total Portfolio Value:", portfolioTotal);

//     // Format portfolio total
//     const formattedTotal = new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     }).format(portfolioTotal);

//     // Calculate totals by blockchain network
//     const chainTotals = tokens.reduce((acc, token) => {
//       if (!token) return acc;

//       const chainId = token.chainId ?? -1; // Default to -1 if undefined

//       let balance: number = 0;

//       if (typeof token.balance === "string") {
//         balance = parseFloat(token.balance); // Convert string balance to number
//       } else if (BigNumber.isBigNumber(token.balance)) {
//         balance = parseFloat(token.balance.toString()); // Convert BigNumber to string and then to number
//       } else if (typeof token.balance === "object" && token.balance._hex) {
//         balance = parseFloat(BigNumber.from(token.balance).toString()); // Convert hex BigNumber to number
//       }

//       const adjustedBalance = balance ? balance / (10 ** (token.decimals ?? 18)) : 0;
//       const price = token.price?.price ?? 0;
//       const value = adjustedBalance * price;

//       // log.debug(`Token: ${token.symbol} | ChainID: ${chainId} | Value: ${value}`);

//       acc[chainId] = (acc[chainId] ?? 0) + value;
//       return acc;
//     }, {} as Record<number, number>);

//     // Format totals per blockchain
//     const formattedChainTotals = Object.entries(chainTotals).reduce(
//       (acc, [chainId, total]) => {
//         acc[chainId] = new Intl.NumberFormat('en-US', {
//           style: 'currency',
//           currency: 'USD',
//           minimumFractionDigits: 2,
//           maximumFractionDigits: 2
//         }).format(total);
//         return acc;
//       },
//       {} as Record<string, string>
//     );

//     if (DEBUG_LOGS) {
//       // log.debug(">>>>>>>>>>>>>>>>>>>>>>>>> Formatted Portfolio Total: <<<<<<<<<<<<<<<<<<<<<<<", formattedTotal);
//       // log.debug("Formatted Chain Totals:", formattedChainTotals);
//     }

//     // Set the derived store value
//     set({
//       portfolioTotal,
//       formattedTotal,
//       chainTotals: {
//         byChain: chainTotals,
//         formatted: formattedChainTotals
//       }
//     });

//   },
//   { // Initial Value
//     portfolioTotal: 0,
//     formattedTotal: "$0.00",
//     chainTotals: { byChain: {}, formatted: {} }
//   }
// );



// export const tokenTotals: Readable<TokenTotals> = derived(
//   yakklCombinedTokenStore,
//   (tokens, set) => {
//     if (DEBUG_LOGS) // log.debug("Derived tokenTotals triggered with tokens:", tokens);

//     // Calculate total portfolio value
//     const portfolioTotal = tokens.reduce((sum, token) => {
//       if (!token) return sum;

//       // Corrected balance scaling with decimals
//       const adjustedBalance = token.balance
//         ? Number(token.balance) / (10 ** (token.decimals ?? 18))
//         : 0;

//       // log.debug('Token:', token, 'Adjusted Balance:', adjustedBalance);

//       const value = adjustedBalance * (token.price?.price ?? 0);

//       if (DEBUG_LOGS) {
//         // log.debug(
//           `Token: ${token.symbol} | Balance: ${token.balance} (Adjusted: ${adjustedBalance}) | ` +
//           `Price: ${token.price?.price ?? 0} | Value: ${value}`
//         );
//       }

//       return sum + value;
//     }, 0);

//     // log.debug("Portfolio Total:", portfolioTotal);

//     // Format portfolio total
//     const formattedTotal = new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     }).format(portfolioTotal);

//     // Calculate totals by blockchain network
//     const chainTotals = tokens.reduce((acc, token) => {
//       if (!token) return acc;

//       const chainId = token.chainId ?? -1; // Default to -1 if undefined

//       const adjustedBalance = token.balance
//         ? Number(token.balance) / (10 ** (token.decimals ?? 18))
//         : 0;

//       // log.debug('Token:', token, 'Adjusted Balance:', adjustedBalance, 'token.balance:', token.balance, 'token.decimals:', token.decimals);

//       const value = adjustedBalance * (token.price?.price ?? 0);

//       // log.debug('Token value:', value, 'adjustedBalance:', adjustedBalance, 'Token price:', token.price?.price);

//       acc[chainId] = (acc[chainId] ?? 0) + value;
//       return acc;
//     }, {} as Record<number, number>);

//     // Format totals per blockchain
//     const formattedChainTotals = Object.entries(chainTotals).reduce(
//       (acc, [chainId, total]) => {
//         acc[chainId] = new Intl.NumberFormat('en-US', {
//           style: 'currency',
//           currency: 'USD',
//           minimumFractionDigits: 2,
//           maximumFractionDigits: 2
//         }).format(total);
//         return acc;
//       },
//       {} as Record<string, string>
//     );

//     if (DEBUG_LOGS) {
//       // log.debug("Portfolio Total:", portfolioTotal, formattedTotal);
//       // log.debug("Chain Totals:", chainTotals, formattedChainTotals);
//     }

//     // Set the derived store value
//     set({
//       portfolioTotal,
//       formattedTotal,
//       chainTotals: {
//         byChain: chainTotals,
//         formatted: formattedChainTotals
//       }
//     });
//   },
//   { // Initial Value
//     portfolioTotal: 0,
//     formattedTotal: "$0.00",
//     chainTotals: { byChain: {}, formatted: {} }
//   }
// );
