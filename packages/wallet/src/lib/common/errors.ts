import { log } from "$lib/plugins/Logger";

export class YakklError extends Error {
  code?: string;
  info?: Record<string, unknown>;

  constructor(message: string, code?: string, info?: Record<string, unknown>) {
    super(message);
    this.name = 'YakklError';
    this.code = code;
    this.info = info;
  }
}

export function makeError(message: string, code?: string, info?: Record<string, unknown>): YakklError {
  return new YakklError(message, code, info);
}

// Parses error messages from JSON-RPC responses
// and formats them into a more user-friendly structure.
export interface RPCParsedError {
  message: string;
  code: number;
  details?: {
    requestMethod?: string;
    url?: string;
    jsonrpc?: string;
    id?: number;
  };
}

export function parseJsonRpcError(errorString: string): RPCParsedError {
  try {
    // First, try to parse the entire string as JSON
    let parsed;
    try {
      // Handle cases where the error is already a JSON object
      parsed = typeof errorString === 'string' ? JSON.parse(errorString) : errorString;
    } catch {
      // If direct parsing fails, try to extract JSON portion
      const jsonMatch = errorString.match(/\{.*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    }

    if (parsed) {
      // Handle nested error object
      const errorObj = parsed.error || parsed;

      // Extract relevant information
      return {
        message: formatErrorMessage(errorObj.message || 'Unknown error'),
        code: errorObj.code || -1,
        details: {
          requestMethod: extractValue(errorString, 'requestMethod'),
          url: extractValue(errorString, 'url'),
          jsonrpc: parsed.jsonrpc,
          id: parsed.id
        }
      };
    }

    // Fallback for unparseable errors
    return {
      message: errorString,
      code: -1
    };
  } catch (e) {
    log.error('Error parsing error message:', false, e);
    return {
      message: errorString,
      code: -1
    };
  }
}

// Helper function to format error messages
// function formatErrorMessage(message: string): string {
//   // Remove any JSON syntax
//   message = message.replace(/[{}"\\]/g, '');

//   // Convert to sentence case and clean up
//   message = message.charAt(0).toUpperCase() + message.slice(1);

//   // Handle specific error cases
//   if (message.includes('transaction underpriced')) {
//     return 'Transaction failed: Gas price too low. Please try again with a higher gas price.';
//   }

//   // Add more specific error handling as needed

//   return message;
// }

// NOTE: Add a more comprehensive error handling
// function to cover more cases and provide better user feedback
// This function can be expanded with more specific error messages
export function formatErrorMessage(message: string): string {
  // Common Ethereum errors
  const errorMappings: Record<string, string> = {
    'transaction underpriced': 'Transaction failed: Gas price too low. Please try again with a higher gas price. Maybe add a tip as well.',
    'insufficient funds': 'Transaction failed: Insufficient funds to complete this transaction.',
    'nonce too low': 'Transaction failed: Please wait for your previous transaction to complete.',
    'already known': 'This transaction has already been submitted.',
    'replacement transaction underpriced': 'Cannot replace existing transaction: New gas price too low.',
    'gas limit reached': 'Transaction failed: Network is busy. Please try again later or increase gas limit.'
  };

  // Check for known error patterns
  for (const [pattern, friendlyMessage] of Object.entries(errorMappings)) {
    if (message.toLowerCase().includes(pattern.toLowerCase())) {
      return friendlyMessage;
    }
  }

  // Clean up the message if no specific mapping found
  message = message.replace(/[{}"\\]/g, '');
  message = message.charAt(0).toUpperCase() + message.slice(1);

  return message;
}

// Helper function to extract values from error string
function extractValue(errorString: string, key: string): string | undefined {
  const match = new RegExp(`${key}="([^"]*)"`, 'i').exec(errorString);
  return match ? match[1] : undefined;
}

// Usage example:
// try {
  // Your code that might throw an error
// } catch (error) {
//   const parsedError = parseJsonRpcError(error.toString());

  // You can now use the parsed error to show a user-friendly message
//   log.info('User friendly error:', parsedError.message);
//   log.info('Error code:', parsedError.code);
//   log.info('Additional details:', parsedError.details);
// }

// Status code	Name	                  Description
// 4001	        User Rejected Request	  The user rejected the request.
// 4100	        Unauthorized	          The requested method and/or account has not been authorized by the user.
// 4200	        Unsupported Method	    The Provider does not support the requested method.
// 4900	        Disconnected	          The Provider is disconnected from all chains.
// 4901	        Chain Disconnected	    The Provider is not connected to the requested chain.

export const ErrorCodes = {
  rpc: {
    invalidInput: -32000,
    resourceNotFound: -32001,
    resourceUnavailable: -32002,
    transactionRejected: -32003,
    methodNotSupported: -32004,
    limitExceeded: -32005,
    parse: -32700,
    invalidRequest: -32600,
    methodNotFound: -32601,
    invalidParams: -32602,
    internal: -32603,
  },
  provider: {
    userRejectedRequest: 4001,
    unauthorized: 4100,
    unsupportedMethod: 4200,
    disconnected: 4900,
    chainDisconnected: 4901,
  },
};

// export const errorValues = {
//   '-32700': {
//     standard: 'JSON RPC 2.0',
//     message:
//       'Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text.',
//   },
//   '-32600': {
//     standard: 'JSON RPC 2.0',
//     message: 'The JSON sent is not a valid Request object.',
//   },
//   '-32601': {
//     standard: 'JSON RPC 2.0',
//     message: 'The method does not exist / is not available.',
//   },
//   '-32602': {
//     standard: 'JSON RPC 2.0',
//     message: 'Invalid method parameter(s).',
//   },
//   '-32603': {
//     standard: 'JSON RPC 2.0',
//     message: 'Internal JSON-RPC error.',
//   },
//   '-32000': {
//     standard: 'EIP-1474',
//     message: 'Invalid input.',
//   },
//   '-32001': {
//     standard: 'EIP-1474',
//     message: 'Resource not found.',
//   },
//   '-32002': {
//     standard: 'EIP-1474',
//     message: 'Resource unavailable.',
//   },
//   '-32003': {
//     standard: 'EIP-1474',
//     message: 'Transaction rejected.',
//   },
//   '-32004': {
//     standard: 'EIP-1474',
//     message: 'Method not supported.',
//   },
//   '-32005': {
//     standard: 'EIP-1474',
//     message: 'Request limit exceeded.',
//   },
//   '4001': {
//     standard: 'EIP-1193',
//     message: 'User rejected the request.',
//   },
//   '4100': {
//     standard: 'EIP-1193',
//     message:
//       'The requested account and/or method has not been authorized by the user.',
//   },
//   '4200': {
//     standard: 'EIP-1193',
//     message: 'The requested method is not supported by this Ethereum provider.',
//   },
//   '4900': {
//     standard: 'EIP-1193',
//     message: 'The provider is disconnected from all chains.',
//   },
//   '4901': {
//     standard: 'EIP-1193',
//     message: 'The provider is disconnected from the specified chain.',
//   },
// };


// Class
export class ProviderRpcError extends Error {
  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ProviderRpcError';
    this.code = code;
    this.data = data;
  }

  code: number;
  data?: unknown;
}

