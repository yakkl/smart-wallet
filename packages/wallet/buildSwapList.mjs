// Fetches the uniswap token list and builds a list of tokens to swap
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Define constants
const TOKEN_URL = 'https://raw.githubusercontent.com/Uniswap/default-token-list/refs/heads/main/src/tokens/mainnet.json'; //'https://tokens.coingecko.com/uniswap/all.json';
const OUTPUT_DIR = path.resolve('./static/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'uniswap.json');

async function downloadTokenList() {
  try {
    console.log('Fetching token list from Uniswap defaults or CoinGecko...');
    const response = await fetch(TOKEN_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch token list: ${response.statusText}`);
    }

    const data = await response.json();

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Write data to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log(`Token list saved to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error downloading token list:', false, error);
  }
}

// Execute the download function
downloadTokenList();
