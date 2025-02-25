console.error.bind(console)
console.error = (...args) => {
  // Keep logging but trap it for future sending to monitoring

  // TBD - Mayve override all console: .log, .warning, .error, .info and push to capture in local storage and then clear the console
  // console.log( ...args );
  error( ...args );
}

function error( message, ...args ) {
  // Capture the current stack trace
  const stack = new Error().stack;

  if ( stack ) {
    // Find the caller line in the stack trace
    const callerInfo = stack.split( "\n" )[ 3 ].trim();
    console.trace(`%c[ERROR-3RDPARTY] %c${callerInfo} - ${message}`,
            "color: orange; font-weight: bold;",
            "color: inherit;",
            ...args);
  } else {
    console.log( message, ...args );
  }
}
