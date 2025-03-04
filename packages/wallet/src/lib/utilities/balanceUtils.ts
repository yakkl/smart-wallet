/* eslint-disable @typescript-eslint/no-explicit-any */
// balanceUtils.ts
import type { SwapToken } from '$lib/common/interfaces';
import type { Provider } from '../plugins/Provider';
import type { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
import { log } from '$lib/plugins/Logger';

export async function getTokenBalance(
  token: SwapToken,
  address: string,
  provider: Provider | null,
  tokenService: TokenService<any> | null // TokenService and may want to change this for specific blockchain
): Promise<bigint> {  // Needs a better return type. It needs to be a BigNumberish plus a code and message. This would allow for 0n to be returned and for the code and message to be used to determine if there was an error or not
  try {
    if ( !token ) return 0n;
    if ( token.isNative ) {  // token.isNative needs to be implemented!
      if ( !provider ) return 0n;
      const retBal = await provider.getBalance( address );
      token.balance = retBal;
      return retBal
    }

    if ( !tokenService ) return 0n;
    const retBal = await tokenService.getBalance( token.address, address ); // address is the user's address. This checks the contract to see if it has the given userAddress registered and if it has a balance
    token.balance = retBal;
    return retBal;
  } catch ( error ) {
    log.error( 'getTokenBalance - error', false, error );
    return 0n;
  }
}
