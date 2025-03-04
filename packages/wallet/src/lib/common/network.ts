// import { encodeJSON } from '$lib/utilities';
import { DEV_BASE_DELAY, DEV_MAX_RETRIES } from ".";

/**
 * Performs a RESTful POST request with exponential backoff.
 *
 * @param {string} url - The URL to send the POST request to.
 * @param {Object} data - The data to include in the POST request.
 * @param {number} attempt - The current attempt number (default is 1).
 * @param {number} delay - The delay in milliseconds between attempts (default is BASE_DELAY).
 * @returns - A promise that resolves with the response from the POST request.
 */

export async function postWithBackoff(url: string, data: object, attempt: number = 1, delay: number = DEV_BASE_DELAY) {
  return new Promise((resolve, reject) => {
    // perform the POST request
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),//encodeJSON(data),//JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        // if the response is successful, resolve the promise
        if (response.ok) {
          resolve(response);
        } else {
          // otherwise, check if we should retry
          if (attempt < DEV_MAX_RETRIES) {
            // calculate the next delay using an exponential backoff strategy
            const nextDelay = delay * 2;
            // retry the POST request after the next delay
            setTimeout(() => {
              postWithBackoff(url, data, attempt + 1, nextDelay)
                .then(resolve)
                .catch(reject);
            }, nextDelay);
          } else {
            console.log('[ERROR]: postWithBackoff - response:', response);
            // if we've exceeded the maximum number of retries, reject the promise
            reject(new Error(`POST request failed after ${DEV_MAX_RETRIES} attempts.`));
          }
        }
      })
      .catch(error => {
        // if there's an false, error, retry the POST request after the next delay
        if (attempt < DEV_MAX_RETRIES) {
          const nextDelay = delay * 2;
          setTimeout(() => {
            postWithBackoff(url, data, attempt + 1, nextDelay)
              .then(resolve)
              .catch(reject);
          }, nextDelay);
        } else {
          console.log('[ERROR]: postWithBackoff:', false, error);
          // if we've exceeded the maximum number of retries, reject the promise
          reject(new Error(`POST request failed after ${DEV_MAX_RETRIES} attempts. ${error}`));
        }
      });
  });
}

// Example call
// const url = 'https://example.com/api/items';
// const data = { name: 'Item 1', price: 10.0 };
// postWithBackoff(url, data)
//   .then(response => console.log(response))
//   .catch(error => console.log(error));

// A call for either POST or GET

/**
 * Performs a RESTful POST or GET request with exponential backoff.
 *
 * @param {string} url - The URL to send the request to.
 * @param {Object} options - The options for the request (e.g., method, body, headers).
 * @param {number} attempt - The current attempt number (default is 1).
 * @param {number} delay - The delay in milliseconds between attempts (default is BASE_DELAY).
 * @returns - A promise that resolves with the response from the request.
 */
export async function requestWithBackoff(url: string, options: object, attempt: number = 1, delay: number = DEV_BASE_DELAY) {
  return new Promise((resolve, reject) => {
    // perform the request
    fetch(url, options)
      .then(response => {
        // if the response is successful, resolve the promise
        if (response.ok) {
          resolve(response);
        } else {
          // otherwise, check if we should retry
          if (attempt < DEV_MAX_RETRIES) {
            // calculate the next delay using an exponential backoff strategy
            const nextDelay = delay * 2;
            // retry the request after the next delay
            setTimeout(() => {
              requestWithBackoff(url, options, attempt + 1, nextDelay)
                .then(resolve)
                .catch(reject);
            }, nextDelay);
          } else {
            console.log('[ERROR]: requestWithBackoff - response:', response);
            // if we've exceeded the maximum number of retries, reject the promise
            reject(new Error(`Request failed after ${DEV_MAX_RETRIES} attempts.`));
          }
        }
      })
      .catch(error => {
        // if there's an false, error, retry the request after the next delay
        if (attempt < DEV_MAX_RETRIES) {
          const nextDelay = delay * 2;
          setTimeout(() => {
            requestWithBackoff(url, options, attempt + 1, nextDelay)
              .then(resolve)
              .catch(reject);
          }, nextDelay);
        } else {
          console.log('[ERROR]: requestWithBackoff:', false, error);
          // if we've exceeded the maximum number of retries, reject the promise
          reject(new Error(`Request failed after ${DEV_MAX_RETRIES} attempts.  ${error}`));
        }
      });
  });
}

// POST Example
// const url = 'https://example.com/api/items';
// const options = {
//   method: 'POST',
//   body: JSON.stringify({ name: 'Item 1', price: 10.0 }),
//   headers: {
//     'Content-Type': 'application/json'
//   }
// };
// requestWithBackoff(url, options)
//   .then(response => console.log(response))
//   .catch(error => console.log(error));


// GET Example
// const url = 'https://example.com/api/items';
// const options = {
//   method: 'GET',
//   headers: {
//     'Content-Type': 'application/json'
//   }
// };
// requestWithBackoff(url, options)
//   .then(response => console.log(response))
//   .catch(error => console.log(error));

