import { yakklCombinedTokenStore, yakklTokenDataCustomStore, yakklTokenDataStore } from '$lib/common/stores';

export function resetTokenDataStoreValues() {
  yakklTokenDataCustomStore.update(tokens =>
    tokens.map(token => ({
      ...token,
      price: {
        ...token.price,
        price: 0,
        provider: '',
        lastUpdated: new Date(0),
        chainId: 1
      },
      pair: '',
      value: 0
    }))
  );
  yakklTokenDataStore.update(tokens =>
    tokens.map(token => ({
      ...token,
      price: {
        ...token.price,
        price: 0,
        provider: '',
        lastUpdated: new Date(0),
        chainId: 1
      },
      pair: '',
      value: 0
    }))
  );
  yakklCombinedTokenStore.update(tokens =>
    tokens.map(token => ({
      ...token,
      price: {
        ...token.price,
        price: 0,
        provider: '',
        lastUpdated: new Date(0),
        chainId: 1
      },
      pair: '',
      value: 0
    }))
  );
}
