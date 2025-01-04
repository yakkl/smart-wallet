/* eslint-disable @typescript-eslint/no-explicit-any */
// TokenManager.ts
import { Token } from '$plugins/Token';
import { EVMToken } from '$plugins/tokens/evm/EVMToken';
import type { Blockchain } from '$plugins/Blockchain';
import defaultTokens from '$plugins/tokens/defaultTokens.json';
import type { Provider } from './Provider';

export class TokenManager {
  private tokens: Map<string, Token> = new Map();
  private blockchain: Blockchain;
  private provider: Provider;

  constructor(blockchain: Blockchain, provider: Provider) {
    this.blockchain = blockchain;
    this.provider = provider;
    this.loadDefaultTokens();
  }

  public createToken(data: any): Token {
    if (this.blockchain.name === 'Ethereum') {
      return new EVMToken(
        data.address,
        data.name,
        data.symbol,
        data.decimals,
        data.logoURI,
        data.description,
        data.chainId,
        data.isNative,
        data.isStablecoin,
        this.blockchain,
        this.provider,
        data.privateKey
      );
    }
    throw new Error(`Unsupported blockchain: ${this.blockchain.name}`);
  }

  public addToken(token: Token) {
    const key = `${token.chainId}-${token.address}`; // This is now incorrect - maybe??
    this.tokens.set(key, token);
    this.saveTokens();
  }

  public getToken(address: string, chainId: number): Token | undefined {
    return this.tokens.get(`${chainId}-${address}`);
  }

  public getAllTokens(): Token[] {
    return Array.from(this.tokens.values());
  }

  public loadCustomTokens() {
    const savedTokens = localStorage.getItem('customTokens');
    if (savedTokens) {
      JSON.parse(savedTokens).forEach((tokenData: any) => {
        const token = this.createToken(tokenData);
        this.addToken(token);
      });
    }
  }

  private saveTokens() {
    const tokensArray = Array.from(this.tokens.values()).map(token => token.toJSON());
    localStorage.setItem('customTokens', JSON.stringify(tokensArray));
  }

  private loadDefaultTokens() {
    defaultTokens.forEach(tokenData => {
      const token = this.createToken(tokenData);
      this.addToken(token);
    });
  }

}
