import type { PriceProvider } from "$lib/common/interfaces";
import type { Blockchain } from "./Blockchain";
import type { GasProvider } from "./GasProvider";
import type { Provider } from "./Provider";
import { EthereumGasProvider } from "./providers/fees/ethereum/EthereumGasProvider";

export class GasProviderFactory {
    static async createProviders(
        provider: Provider,
        blockchain: Blockchain,
        priceProvider: PriceProvider
    ): Promise<GasProvider[]> {
        return [
            await EthereumGasProvider.create(
                provider,
                blockchain,
                priceProvider
            )
            // Add other providers here as needed
        ];
    }
}
