async function monitorEvents(contractAddress: string) {
  const filter = {
      address: contractAddress,
      fromBlock: 'latest',
      topics: [
          contractInterface.getEventTopic('Transfer') // Example event
      ]
  };

  provider.on(filter, (log) => {
      console.log("New event detected:");
      decodeLogs([log]);
  });
}

// Example usage
const contractAddress = "0xYourContractAddressHere";
monitorEvents(contractAddress);
