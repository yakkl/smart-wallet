/* eslint-disable @typescript-eslint/no-explicit-any */
// Debug related functions


// NOTE: DEPRECATED - USE Logger.ts INSTEAD


export function debug_log( message: string, ...args: any[] ): void {
  // Capture the current stack trace
  const stack = new Error().stack;

  if ( stack ) {
    // Find the caller line in the stack trace
    const callerInfo = stack.split( "\n" )[ 2 ].trim();
    console.log( `[Debug]: ${ callerInfo } - ${ message }`, ...args );
  } else {
    console.log( message, ...args );
  }
}

export function error_log( message: string, ...args: any[] ): void {
  // Capture the current stack trace
  const stack = new Error().stack;

  if ( stack ) {
    // Find the caller line in the stack trace
    const callerInfo = stack.split( "\n" )[ 2 ].trim();
    console.log( `[Error]: ${ callerInfo } - ${ message }`, ...args );
  } else {
    console.log( message, ...args );
  }
}
