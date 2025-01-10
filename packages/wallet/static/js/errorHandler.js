// This captures errors that are not caught by the application code nor third-party libraries.

window.onerror = function (message, source, lineno, colno, error) {
  console.log('Global Error Caught:', {
    message,
    source,
    lineno,
    colno,
    error,
  });
  return true;
};

window.addEventListener('error', (event) => {
  // console.log('Error Event Caught:', event);
  event.preventDefault();
});

// Handle unhandled promise rejections (e.g., async errors)
window.addEventListener('unhandledrejection', (event) => {
  console.log('Unhandled Promise Rejection:', event.reason);
  event.preventDefault();
});