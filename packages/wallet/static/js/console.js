console.error.bind(console)
console.error = (...args) => {
  // Keep logging but trap it for future sending to monitoring

  // TBD - Mayve override all console: .log, .warning, .error, .info and push to capture in local storage and then clear the console
  console.log(...args);
}			
