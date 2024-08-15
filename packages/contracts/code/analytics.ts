async function gatherAnalytics(contractAddress: string, fromBlock: number, toBlock: number) {
  const filter = {
      address: contractAddress,
      fromBlock,
      toBlock,
  };

  const logs = await provider.getLogs(filter);
  decodeLogs(logs);

  // Further analysis can be done here, such as counting events, summing values, etc.
}

// Example usage
gatherAnalytics(contractAddress, 0, 'latest');
