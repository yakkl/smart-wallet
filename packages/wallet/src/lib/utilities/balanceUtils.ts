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
    if ( token.isNative || token.symbol === 'ETH' ) {  // token.isNative needs to be implemented!
      return await provider.getBalance( address );
    }

    return await tokenService.getBalance( token.address, address ); // address is the user's address. This checks the contract to see if it has the given userAddress registered and if it has a balance
  } catch ( error ) {
    console.log( 'getTokenBalance - error', error );
    return 0n;
  }
}
