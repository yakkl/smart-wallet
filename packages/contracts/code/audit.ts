async function auditTransaction(txHash: string) {
  const receipt = await provider.getTransactionReceipt(txHash);
  if (receipt && receipt.logs.length > 0) {
      console.log(`Auditing transaction ${txHash}:`);
      decodeLogs(receipt.logs);

      // Additional audit logic can be added here
  } else {
      console.log(`No logs found in transaction ${txHash}.`);
  }
}

// Example usage
auditTransaction(txHash);
