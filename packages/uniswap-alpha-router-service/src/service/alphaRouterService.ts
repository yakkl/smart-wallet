// src/service/alphaRouterService.ts
import type { Token } from '@uniswap/sdk-core';
import type { AlphaRouterRequest, AlphaRouterResponse } from '../types';

export class AlphaRouterService {
  private worker: Worker;
  private pending: Map<string, {
    resolve: ( value: AlphaRouterResponse ) => void;
    reject: ( reason: any ) => void;
    timeout: NodeJS.Timeout;
  }>;

  constructor () {
    this.worker = new Worker(
      new URL( '../worker/alphaRouterWorker.ts', import.meta.url ),
      { type: 'module' }
    );
    this.pending = new Map();

    this.worker.onmessage = this.handleWorkerMessage.bind( this );
    this.worker.onerror = this.handleWorkerError.bind( this );
  }

  async getQuote(
    tokenIn: Token,
    tokenOut: Token,
    amount: string,
    fundingAddress: string,
    isExactIn: boolean = true
  ): Promise<AlphaRouterResponse> {
    const id = crypto.randomUUID();

    return new Promise( ( resolve, reject ) => {
      const timeout = setTimeout( () => {
        this.pending.delete( id );
        reject( new Error( 'Quote request timeout' ) );
      }, 30000 ); // 30 second timeout

      this.pending.set( id, { resolve, reject, timeout } );

      this.worker.postMessage( {
        id,
        request: {
          type: 'QUOTE',
          payload: {
            tokenIn,
            tokenOut,
            amount,
            fundingAddress,
            isExactIn
          }
        }
      } );
    } );
  }

  private handleWorkerMessage( event: MessageEvent ) {
    const { id, response } = event.data;
    const pending = this.pending.get( id );

    if ( pending ) {
      clearTimeout( pending.timeout );
      this.pending.delete( id );
      pending.resolve( response );
    }
  }

  private handleWorkerError( error: ErrorEvent ) {
    console.log( 'Worker error:', false, error );
    // Reject all pending requests
    this.pending.forEach( ( { reject, timeout } ) => {
      clearTimeout( timeout );
      reject( new Error( 'Worker error' ) );
    } );
    this.pending.clear();
  }

  dispose() {
    this.worker.terminate();
    this.pending.clear();
  }
}
