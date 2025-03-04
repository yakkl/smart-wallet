/* eslint-disable @typescript-eslint/no-explicit-any */
import { AbstractContract } from '$plugins/Contract';
import { type BigNumberish, type TransactionRequest, type TransactionResponse } from '$lib/common';
import type { Provider } from '$plugins/Provider';
// import type { Signer } from '$plugins/Signer';
import { ethers as ethersv6 } from 'ethers-v6';
import { EthersConverter } from '$plugins/utilities/EthersConverter';
import type { FunctionFragment, EventFragment } from 'ethers-v6';
import { log } from '$lib/plugins/Logger';

export class EthereumContract extends AbstractContract {
  private contract: ethersv6.Contract;
  interface: ethersv6.Interface;

  // Added providerNative to the constructor - may need to be removed
  constructor ( address: string, abi: any[], provider: Provider ) {
    super( address, abi, provider );

    // Create contract instance with the given provider or fallback to default provider
    this.contract = new ethersv6.Contract(
      address,
      abi,
      provider.getSignerNative()
    );

    if ( !this.contract ) {
      throw new Error( 'Invalid contract' );
    }

    this.interface = new ethersv6.Interface( abi );
    if ( !this.interface ) {
      throw new Error( 'Invalid interface' );
    }
  }

  async call( functionName: string, ...args: any[] ): Promise<any> {
    try {
      if ( !functionName || !this.interface ) throw new Error( 'Invalid function name or invalid interface' );
      if ( !this.interface.getFunction( functionName ) ) throw new Error( `Function ${ functionName } does not exist on contract` );

      return await this.contract[ functionName ]( ...args );
    } catch ( error ) {
      log.error( `Error calling ${ functionName }:`, false, error );
      throw error;
    }
  }

  async estimateGas( functionName: string, ...args: any[] ): Promise<BigNumberish> {
    try {
      if ( !functionName || !this.interface ) throw new Error( 'Invalid function name or invalid interface' );
      if ( !this.interface.getFunction( functionName ) ) throw new Error( `Function ${ functionName } does not exist on contract` );

      // Get the function from the contract
      const contractFunction = ( this.contract as any )[ functionName ];
      if ( typeof contractFunction !== 'function' ) {
        throw new Error( `${ functionName } is not a function` );
      }

      // Estimate gas using the bound estimateGas function
      const estimation = await contractFunction.estimateGas( ...args );
      return BigInt( estimation.toString() );
    } catch ( error ) {
      log.error( `Error estimating gas for ${ functionName }:`, false, error );
      throw error;
    }
  }

  async populateTransaction( functionName: string, ...args: any[] ): Promise<TransactionRequest | null> {
    try {
      if ( !functionName || !this.interface ) throw new Error( 'Invalid function name or invalid interface' );
      if ( !this.interface.getFunction( functionName ) ) throw new Error( `Function ${ functionName } does not exist on contract` );

      // Get the function from the contract
      const contractFunction = ( this.contract as any )[ functionName ];
      if ( typeof contractFunction !== 'function' ) {
        throw new Error( `${ functionName } is not a function` );
      }

      // Populate the transaction using the bound populateTransaction function
      const tx = await contractFunction.populateTransaction( ...args );
      if ( !tx ) throw new Error( 'Invalid transaction from populate transaction' );
      return EthersConverter.ethersTransactionRequestToTransactionRequest( tx );
    } catch ( error ) {
      log.error( `Error populating transaction for ${ functionName }:`, false, error );
      throw error;
    }
  }

  async sendTransaction( functionName: string, ...args: any[] ): Promise<TransactionResponse> {
    try {
      if ( !this.interface.getFunction( functionName ) ) {
        throw new Error( `Function ${ functionName } does not exist on contract` );
      }

      const tx = await this.contract[ functionName ]( ...args );
      if ( !tx ) throw new Error( 'Invalid transaction from send transaction' );

      return EthersConverter.ethersTransactionResponseToTransactionResponse( tx );
    } catch ( error ) {
      log.error( `Error sending transaction for ${ functionName }:`, false, error );
      throw error;
    }
  }

  encodeFunctionData( functionName: string, args: any[] = [] ): string {
    if ( !this.interface.getFunction( functionName ) ) {
      throw new Error( `Function ${ functionName } does not exist on contract` );
    }
    return this.interface.encodeFunctionData( functionName, args );
  }

  on( eventName: string, listener: ( ...args: any[] ) => void ): void {
    this.contract.on( eventName, listener );
  }

  off( eventName: string, listener: ( ...args: any[] ) => void ): void {
    this.contract.off( eventName, listener );
  }

  once( eventName: string, listener: ( ...args: any[] ) => void ): void {
    this.contract.once( eventName, listener );
  }

  getFunctions(): Record<string, ( ...args: any[] ) => Promise<any>> {
    const functions: Record<string, ( ...args: any[] ) => Promise<any>> = {};

    // Get all function fragments from the interface
    const functionFragments = Object.values(
      Object.fromEntries(
        Object.entries( this.interface.fragments ).filter(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ( [ _, fragment ] ) => fragment.type === 'function'
        )
      )
    ) as FunctionFragment[];

    // Create function entries
    functionFragments.forEach( ( fragment ) => {
      functions[ fragment.name ] = ( ...args: any[] ) => this.call( fragment.name, ...args );
    } );

    return functions;
  }

  getEvents(): string[] {
    // Get all event fragments from the interface
    const eventFragments = Object.values(
      Object.fromEntries(
        Object.entries( this.interface.fragments ).filter(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ( [ _, fragment ] ) => fragment.type === 'event'
        )
      )
    ) as EventFragment[];

    return eventFragments.map( event => event.name );
  }

  // WIP
  //   async supportsPermit( tokenAddress: string ) {
  //   try {
  //     const token = new ethersv6.Contract( tokenAddress, [
  //       "function permit(address,address,uint256,uint256,uint8,bytes32,bytes32)"
  //     ], this.provider?.getProvider() );
  //     return !!( await token.estimateGas.permit() ); // If estimation does not revert, permit is likely supported
  //   } catch ( error ) {
  //     return false;
  //   }
  // }

  // WIP
  //   async permitAndApprove( token, owner, spender, value, nonce, deadline, v, r, s, signer ) {
  //   const tokenContract = new ethersv6.Contract( token, [
  //     "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)"
  //   ], signer );

  //   await tokenContract.permit( owner, spender, value, deadline, v, r, s );
  // }

  // WIP Usage:
  //   if( await supportsPermit( tokenAddress, provider )) {
  //   try {
  //     await permitAndApprove( tokenAddress, owner, spender, value, nonce, deadline, v, r, s, signer );
  //   } catch ( error ) {
  //     log.error( 'Permit failed, falling back to approve:', false, error );
  //     await tokenContract.approve( spender, value );
  //   }
  // } else {
  //   await tokenContract.approve( spender, value );
  // }

}
