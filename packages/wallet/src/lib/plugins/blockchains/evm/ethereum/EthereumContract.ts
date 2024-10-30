/* eslint-disable @typescript-eslint/no-explicit-any */
import { AbstractContract } from '$plugins/Contract';
import type { BigNumberish, TransactionRequest, TransactionResponse } from '$lib/common';
import type { Provider } from '$plugins/Provider';
import type { Signer } from '$plugins/Signer';
import { ethers } from 'ethers';
import { EthersConverter } from '$plugins/utilities/EthersConverter';
import type { FunctionFragment, EventFragment } from 'ethers';

export class EthereumContract extends AbstractContract {
  private contract: ethers.Contract;
  interface: ethers.Interface;

  constructor ( address: string, abi: any[], providerOrSigner: Provider | Signer ) {
    super( address, abi, providerOrSigner );
    this.contract = new ethers.Contract( address, abi, providerOrSigner as any );
    this.interface = new ethers.Interface( abi );
  }

  async call( functionName: string, ...args: any[] ): Promise<any> {
    try {
      if ( !this.interface.getFunction( functionName ) ) {
        throw new Error( `Function ${ functionName } does not exist on contract` );
      }

      return await this.contract[ functionName ]( ...args );
    } catch ( error ) {
      console.error( `Error calling ${ functionName }:`, error );
      throw error;
    }
  }

  async estimateGas( functionName: string, ...args: any[] ): Promise<BigNumberish> {
    try {
      if ( !this.interface.getFunction( functionName ) ) {
        throw new Error( `Function ${ functionName } does not exist on contract` );
      }

      // Get the function from the contract
      const contractFunction = ( this.contract as any )[ functionName ];
      if ( typeof contractFunction !== 'function' ) {
        throw new Error( `${ functionName } is not a function` );
      }

      // Estimate gas using the bound estimateGas function
      const estimation = await contractFunction.estimateGas( ...args );
      return BigInt( estimation.toString() );
    } catch ( error ) {
      console.error( `Error estimating gas for ${ functionName }:`, error );
      throw error;
    }
  }

  async populateTransaction( functionName: string, ...args: any[] ): Promise<TransactionRequest> {
    try {
      if ( !this.interface.getFunction( functionName ) ) {
        throw new Error( `Function ${ functionName } does not exist on contract` );
      }

      // Get the function from the contract
      const contractFunction = ( this.contract as any )[ functionName ];
      if ( typeof contractFunction !== 'function' ) {
        throw new Error( `${ functionName } is not a function` );
      }

      // Populate the transaction using the bound populateTransaction function
      const tx = await contractFunction.populateTransaction( ...args );
      return EthersConverter.ethersTransactionRequestToTransactionRequest( tx );
    } catch ( error ) {
      console.error( `Error populating transaction for ${ functionName }:`, error );
      throw error;
    }
  }

  async sendTransaction( functionName: string, ...args: any[] ): Promise<TransactionResponse> {
    try {
      if ( !this.interface.getFunction( functionName ) ) {
        throw new Error( `Function ${ functionName } does not exist on contract` );
      }

      const tx = await this.contract[ functionName ]( ...args );
      return EthersConverter.ethersTransactionResponseToTransactionResponse( tx );
    } catch ( error ) {
      console.error( `Error sending transaction for ${ functionName }:`, error );
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
}
