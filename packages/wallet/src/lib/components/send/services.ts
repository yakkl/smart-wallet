// File: services.ts
export const gasEstimates = async (gasPrice: string) => {
  // Mock API call to fetch gas estimates
  const mockEstimates = {
    low: 10,
    market: 20,
    priority: 30,
  };
  return new Promise((resolve) => setTimeout(() => resolve(mockEstimates), 1000));
};

export const sendTransaction = async (transaction: any) => {
  // Mock sending transaction
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.5) {
        resolve({ success: true, transactionHash: '0xabc123' });
      } else {
        reject(new Error('Transaction failed'));
      }
    }, 2000);
  });
};

