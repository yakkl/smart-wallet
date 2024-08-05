// BlockchainFactory.ts
import type { Provider, Blockchain } from '$plugins';
import { Ethereum } from '$plugins/blockchains/evm/ethereum/Ethereum';
// Import other blockchains here

/**
 * Factory class to create instances of different blockchains.
 */
class BlockchainFactory {
  /**
   * Creates a blockchain instance based on the provided name.
   * @param name - The name of the blockchain to create.
   * @param providers - The list of providers for the blockchain.
   * @returns An instance of the specified blockchain.
   * @throws Will throw an error if the blockchain name is unsupported.
   */
  static createBlockchain(name: string, providers: Provider[]): Blockchain {
    switch (name) {
      case 'Ethereum':
        return new Ethereum(providers);
      // Add cases for other blockchains
      default:
        throw new Error(`Unsupported blockchain: ${name}`);
    }
  }
}

export default BlockchainFactory;
