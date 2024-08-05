// ProviderFactory.ts
import type { Provider } from '$plugins/Provider';
import { Alchemy } from '$plugins/providers/alchemy/Alchemy';
// Import other providers here

interface ProviderOptions {
  name: string;
  apiKey?: string | null;
  chainId?: number;
}
/**
 * Factory class to create instances of different providers.
 */
class ProviderFactory {
  static createProvider(options: ProviderOptions): Provider {
    const { name, apiKey, chainId } = options;
    let provider;

    switch (name) {
      case 'Alchemy':
        provider = new Alchemy({ apiKey, chainId }); // Pass the options to the Alchemy constructor
        return provider;
      // Add cases for other providers
      default:
        throw new Error(`Unsupported provider: ${name}`);
    }
  }
}

export default ProviderFactory;
