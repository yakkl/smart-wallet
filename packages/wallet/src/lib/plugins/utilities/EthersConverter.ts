import { ethers as ethersv6 } from 'ethers-v6';
import type {
  EVMTransactionRequest,
  TransactionResponse,
  TransactionReceipt,
  Log,
  BigNumberish,
  TransactionRequest,
  AccessList,
} from '$lib/common';
import { log } from '../Logger';

export class EthersConverter {
  static toEthersHex(value: BigNumberish | null | undefined): string | null | undefined {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && value.startsWith('0x')) return value;
    return '0x' + BigInt(value.toString()).toString(16);
  }

  static transactionToEthersTransaction(transaction: EVMTransactionRequest): ethersv6.TransactionRequest {
    return {
      to: transaction.to ?? undefined,
      from: transaction.from ?? undefined,
      nonce: transaction.nonce === -1 ? undefined : transaction.nonce,
      gasLimit: this.toEthersHex(transaction.gasLimit),
      gasPrice: this.toEthersHex(transaction.gasPrice),
      maxPriorityFeePerGas: this.toEthersHex(transaction.maxPriorityFeePerGas),
      maxFeePerGas: this.toEthersHex(transaction.maxFeePerGas),
      data: transaction.data?.toString() ?? undefined,
      value: this.toEthersHex(transaction.value),
      chainId: this.toEthersHex(transaction.chainId) ?? undefined,
      accessList: transaction.accessList ?? undefined,
      customData: transaction.customData,
      type: transaction.type,
    };
  }

  static async ethersTransactionResponseToTransactionResponse(tx: ethersv6.TransactionResponse): Promise<TransactionResponse> {
    return {
      hash: tx.hash,
      to: tx.to ?? '',
      from: tx.from,
      nonce: tx.nonce,
      gasLimit: tx.gasLimit,
      gasPrice: tx.gasPrice,
      data: tx.data,
      value: tx.value,
      chainId: tx.chainId,
      blockNumber: tx.blockNumber ?? undefined,
      blockHash: tx.blockHash ?? undefined,
      timestamp: new Date().getTime(),
      confirmations: await tx.confirmations(),
      type: tx.type ?? undefined,
      accessList: tx.accessList ?? undefined,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      maxFeePerGas: tx.maxFeePerGas,
      wait: async (confirmations?: number): Promise<TransactionReceipt> => {
        const receipt = await tx.wait(confirmations);
        if (!receipt) {
          throw new Error('Transaction receipt is null');
        }
        return this.ethersTransactionReceiptToTransactionReceipt(receipt);
      }
    };
  }

  static async ethersTransactionReceiptToTransactionReceipt(receipt: ethersv6.TransactionReceipt): Promise<TransactionReceipt> {
    return {
      to: receipt.to ?? '',
      from: receipt.from,
      contractAddress: receipt.contractAddress ?? undefined,
      transactionIndex: receipt.index,
      root: receipt.root ?? undefined,
      gasUsed: receipt.gasUsed,
      logsBloom: receipt.logsBloom,
      blockHash: receipt.blockHash,
      transactionHash: receipt.hash,
      logs: receipt.logs.map(this.ethersLogToLog),
      blockNumber: receipt.blockNumber,
      confirmations: await receipt.confirmations(),
      cumulativeGasUsed: receipt.cumulativeGasUsed,
      effectiveGasPrice: receipt.gasPrice ?? undefined,
      byzantium: true,
      type: receipt.type,
      status: receipt.status !== null ? receipt.status : undefined
    };
  }

  static ethersLogToLog( log: ethersv6.Log ): Log {
    return {
      blockNumber: log.blockNumber,
      blockHash: log.blockHash,
      transactionIndex: log.transactionIndex,
      removed: log.removed,
      address: log.address,
      data: log.data,
      topics: [...log.topics],
      transactionHash: log.transactionHash,
      logIndex: log.index
    };
  }

  static ethersTransactionRequestToTransactionRequest( tx: ethersv6.TransactionRequest ): TransactionRequest | null {
    try {
      if ( !tx ) return null;
      return {
        to: tx.to as string,
        from: tx.from as string,
        nonce: tx.nonce as number,
        gasLimit: tx.gasLimit ? BigInt( tx.gasLimit.toString() ) : undefined,
        gasPrice: tx.gasPrice ? BigInt( tx.gasPrice.toString() ) : undefined,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? BigInt( tx.maxPriorityFeePerGas.toString() ) : undefined,
        maxFeePerGas: tx.maxFeePerGas ? BigInt( tx.maxFeePerGas.toString() ) : undefined,
        data: tx.data as string,
        value: tx.value ? BigInt( tx.value.toString() ) : null,
        chainId: tx.chainId as number,
        accessList: this.convertAccessList( tx.accessList ),
        customData: tx.customData,
        type: tx.type,
      };
    } catch ( error ) {
      log.error( 'Error converting ethers transaction request to transaction request:', false, error );
      return null;
    }
  }

  private static convertAccessList(accessList: ethersv6.AccessListish | null | undefined): AccessList | undefined {
    if (!accessList) return undefined;

    if (Array.isArray(accessList)) {
      return accessList.map(item => {
        if (Array.isArray(item)) {
          // Handle [address, storageKeys[]] format
          return {
            address: item[0],
            storageKeys: item[1]
          };
        } else {
          // Handle { address, storageKeys } format
          return {
            address: item.address,
            storageKeys: item.storageKeys
          };
        }
      });
    }

    // Handle { address: storageKeys[] } format
    return Object.entries(accessList).map(([address, storageKeys]) => ({
      address,
      storageKeys
    }));
  }

}

// Example usage:
// import { EthersConverter } from './EthersConverter';

// // In EthereumSigner class
// async signTransaction(transaction: EVMTransactionRequest): Promise<string> {
//   const ethersTx = EthersConverter.transactionToEthersTransaction(transaction);
//   return await this.wallet.signTransaction(ethersTx);
// }

// // In EthereumProvider class
// async sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
//   const ethersTx = EthersConverter.transactionToEthersTransaction(transaction);
//   const txResponse = await this.provider.sendTransaction(ethersTx);
//   return EthersConverter.ethersTransactionResponseToTransactionResponse(txResponse);
// }
