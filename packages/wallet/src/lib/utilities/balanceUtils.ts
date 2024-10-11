/* eslint-disable @typescript-eslint/no-explicit-any */
// balanceUtils.ts
import type { SwapToken } from '$lib/common/interfaces';
import type { BigNumberish } from '$lib/common';

export async function getTokenBalance(
  token: SwapToken,
  address: string,
  provider: any,
  tokenService: any
): Promise<BigNumberish> {
  try {
    if ( !token ) return 0n;

    console.log( 'getTokenBalance', token, address, provider, tokenService );
  
    if ( token.isNative ) {
      return await provider.getBalance( address );
    }

    return await tokenService.getBalance( token.address, address );
  } catch ( error ) {
    console.log( 'getTokenBalance - error', error );
    return 0n;
  }
}
