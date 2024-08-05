# YAKKL® Smart Wallet



## Features
1. Smart contract review if a customer wants to review a smart contract before signing. We break it down into a simple format that gets a summary, any buy/sell fees or transfer fees.






## Known Issues:
1. signTypedData - This allows for more flexibility of signing for developers and users alike. Prior to v0.30.2-beta, this option worked. A provider we use made a version change that caused breaking changes for v3 and v4 data. Most dApps don't use this but we are working on it.
2. An error or something has triggered the `send transaction` to show the 'Failed' dialog box for the DAPP Sending. Other options work.
3. Emergency Kit Recovery. We disabled this feature temporarily for at least the next few minor updates so that we can add more items to the encrypted recovery file and provide a new option that bundles all data points into one recovery file.  Also, a backend is also and enhancement for backup storage.
4. We will be releasing the ability to deploy and call smart contracts faster. Until then, we are not officially pushing this feature. This mainly deals with NFTs.
5. Removed the following from the manifest v3:
``` json
       "externally_connectable": {
      "ids": [ "*" ],
      "accepts_tls_channel_id": false
    },
```
This caused an error in the upcoming changes to the Chrome browser.

## FREE Limited Time Upgrade to Premier - Nov 1, 2023
During the current beta phase, all users can automatically upgrade to the Premier version at no cost until July 31, 2024. This only applies to beta users before the this official beta phase is over. This could be one month or longer.

## Building YAKKL
As of version 1.2 of Sveltekit, they are now creating an inline script in index.html and popup.html. This keeps the extension from running as it violates strict CSP that is maintained in the manifest file. 
- Automation: We run `buildSveltekitForCSP.cjs` that scans all of the html files in `./build` directory and creates a corresponding *.js file for each *.html file. It moves the inline script to the new javascript file and replaced the inline script in the html with a link to the js file. Also, had to make the `buildSveltekitForCSP.cjs` file a 'common javascript' file instead of 'js' or 'ts' so that require would work due to our setup.

### Building for Production
1. Make sure to use `ETHEREUM_PROD` version of the 'Alchemy' SDK
2. Comment ALL `console.log(...)` 
3. Make sure the `+layout.svelte` in both the 'app' level and the 'dapp' level are calling `blockContextMenu()` and `blockWindowResize()`. These will disable all but a direct menu link from within Google Chrome. This blocks right clicks and key board combinations.
## Wallet, Account, and Keys

Definition taken from Ethereum documentation:
>An account is NOT a wallet. An account is the keypair for a user-owned Ethereum account. A wallet is an interface or application that lets you interact with your Ethereum account.

You may hear people use account, keys or wallet interchangeble but they are different. YAKKL® Smart Wallet breaks it down like the following:

```bash
YAKKL® Smart Wallet - Contains a secure environment, good user experience, easily do all transaction needed from one app.
    - Account(s) - A collection of as many accounts as you want (no basic limitation). An Account represents the crypto network you are using, token or currency, transactions that you perform, balance of the account.
        - Keyring - Holds your public and private keys, any ... (TBD)

        
```

All typescript in this project attempts to follow [Google Style Guide](https://google.github.io/styleguide/tsguide.html).

This project uses Sveltekit as the main framework/compiler. The structure of the project is as follows:

```bash
<root>
    .env (dev values for keys etc...)
    .editorconfig
    .eslintrc.cjs
    .gitignore
    .npmrc
    .prettierrc
    ATTRIBUTIONS.md (contains license information from other open source projects)
    LICENSE
    README
    index.d.ts
    package.json -- NOTE: "autoprefixer": "^10.4.8" caused warnings so reverted back to v10.4.5 exactly
    postcss.config.cjs
    svelte.config.js
    tailwind.config.cjs
    tsconfig.json
    vite.config.js
    webpack.config.cjs (this works mainly for transforming the /src/extension_scripts since they are outside of svelte)
    /src
        app.css
        app.d.ts
        app.html (main app starting point)
        hooks.js (any hooks that we need to override)
        /routes (where all of the UI work is done plus other javascript/typescript that is managed by sveltekit)
        /lib (where we put generic [shared] svelte related code including 'interfaces' and 'types')
        /plugins (main entry point for ALL crypto network code or anything else needing to be a plugin)
            \common
            \networks
                \bitcoin (TBD)
                \evm
                    \ethereum 
                    \polygon
                    \polkadot
                    \... (other EVM based chains) (TBD)
                \solana
                \meme_coins (TBD)
        /extension_scripts (only browser extension related code and manifest)
        /data (may not be used in final version)
        /static
            /fonts
            /images
            /js
            favicon.png
            manifest.json (NOTE: This gets built and put here so don't edit it. Look at the /src/extension_scripts/manifest.json.mustache template)
```

Global tools: (the rest of the tools/libraries are local to the project. NOTE: you could make these local but up to you...)
    browserify
    jq

## Known Issues
This may not be an issue but it does occur for window.ethereum whenever certain wallet extensions are installed. For example, Tally Ho wallet sets the object 'window.ethereum' as non-configurable and/or non-writable. This makes it so that no other wallet can use 'window.ethereum' for dApps.

YAKKL can co-exist with most all wallets except for Tally Ho for the reason mentioned above. Simply remove the Tally Ho browser extension and reload your page. However, BEFORE removing it MAKE SURE to export the private keys and secret security phrase so that you can reuse it later if you don't like YAKKL or you can simply import your private keys into YAKKL.

> We could solve this by embedding our code in a variable for injection instead of loading from a file. If we did that then we would have to set the same 'configurable' and 'writable' attributes to 'false' which means we force YAKKL to be the only 'window.ethereum' wallet and we did not want to do that.

The best practice is to use the wallet's 'window.<whatever attribute>' (e.g., 'windows.yakkl') or 'window.web3' instead of MetaMask's 'window.ethereum' attribute. 'Window.ethereum' is NOT a standard! Early older wallets simply used 'window.ethereum' for convience and because wallets are hard to get right.

## Experimental

```<div class="bg-base-100 pointer-events-none sticky bottom-0 -mt-6 flex h-16 [mask-image:linear-gradient(transparent,#000000)]"></div>```

### Library versions before Aug 5, 2023

```bash
# A few of the libraries are pinned so that they do not update. We may want to keep an eye on them.

yakkl_smart_wallet@0.30.4 /Users/hansjones/projects/lambdastack/yakkl/crypto/wallet
├── @ethersproject/abstract-provider@5.7.0
├── @ethersproject/abstract-signer@5.7.0
├── @ethersproject/hash@5.7.0
├── @ethersproject/hdnode@5.7.0
├── @ethersproject/keccak256@5.7.0
├── @ethersproject/logger@5.7.0
├── @ethersproject/transactions@5.7.0
├── @ethersproject/wallet@5.7.0
├── @popperjs/core@2.11.7
├── @scure/bip32@1.2.0
├── @scure/bip39@1.2.0
├── @sentry/svelte@7.52.1
├── @sentry/sveltekit@7.52.1
├── @sveltejs/adapter-auto@1.0.3
├── @sveltejs/adapter-static@1.0.6
├── @sveltejs/kit@1.22.4
├── @tailwindcss/aspect-ratio@0.4.2
├── @tailwindcss/forms@0.5.3
├── @tailwindcss/line-clamp@0.4.4
├── @tailwindcss/typography@0.5.9
├── @types/bn.js@5.1.1
├── @types/date-fns@2.6.0
├── @types/webextension-polyfill@0.9.2
├── @typescript-eslint/eslint-plugin@5.57.1
├── @typescript-eslint/parser@5.57.1
├── @uniswap/token-lists@1.0.0-beta.31
├── @walletconnect/client@1.8.0
├── @walletconnect/qrcode-modal@1.8.0
├── @walletconnect/web3wallet@1.8.6
├── alchemy-sdk@2.8.3
├── autoprefixer@10.4.5
├── await-semaphore@0.1.3
├── bip39@3.1.0
├── bip44-constants@152.0.0
├── bn.js@5.2.1
├── buffer@6.0.3
├── cheerio@1.0.0-rc.12
├── classnames@2.3.2
├── clipboard@2.0.11
├── css-loader@6.7.3
├── d3@7.8.4
├── daisyui@3.5.0
├── date-fns@2.29.3
├── detect-browser@5.3.0
├── dinero.js@2.0.0-alpha.14
├── dotenv-webpack@8.0.1
├── dotenv@16.0.3
├── dts-cli@1.6.3
├── easyqrcodejs@4.4.13
├── eslint-config-prettier@8.8.0
├── eslint-plugin-svelte3@4.0.0
├── eslint@8.37.0
├── eth-crypto@2.6.0
├── eth-keyring-controller@7.0.2
├── ethereum-block-by-date@1.4.7
├── ethereum-blockies-base64@1.0.2
├── ethereum-cryptography@1.2.0
├── ethereumjs-wallet@1.0.2
├── ethers@6.6.7
├── events@3.3.0
├── flowbite-svelte@0.40.2
├── flowbite@1.8.1
├── fs@0.0.1-security
├── json-schema@0.4.0
├── jspdf@2.5.1
├── lodash@4.17.21
├── loglevel@1.8.1
├── mustache@4.2.0
├── openai@3.3.0
├── path@0.12.7
├── pexels@1.4.0
├── postcss@8.4.27
├── posthog-js@1.63.3
├── prettier-plugin-svelte@2.10.0
├── prettier@2.8.7
├── resolve@1.22.1
├── rollup@2.79.1
├── svelte-burger-menu@1.0.5
├── svelte-check@2.10.3
├── svelte-confetti@1.2.2
├── svelte-cryptocurrency-icons@0.3.1
├── svelte-forms-lib@2.0.1
├── svelte-french-toast@1.0.3
├── svelte-pincode@2.2.0
├── svelte-preprocess@4.10.7
├── svelte-use-form@2.6.2
├── svelte@3.59.2
├── sveltekit-adapter-chrome-extension@1.5.0
├── tailwindcss-dotted-background@1.0.1
├── tailwindcss@3.3.1
├── terser-webpack-plugin@5.3.7
├── theme-change@2.5.0
├── tiny-glob@0.2.9
├── ts-loader@9.4.2
├── tslib@2.5.0
├── tw-elements@1.0.0-alpha12
├── typescript@4.9.5
├── vite-plugin-iso-import@0.1.3
├── vite@4.4.7
├── vitest@0.22.1
├── webextension-polyfill@0.10.0
├── webpack-cli@4.10.0
├── webpack@5.78.0
├── yup@0.32.11
└── zxcvbn@4.4.2
```

### Version 0.30.5 installed libraries and their version numbers

```bash
yakkl_smart_wallet@0.30.5 /Users/hansjones/projects/lambdastack/yakkl/crypto/wallet
├── @ethersproject/abstract-provider@5.7.0
├── @ethersproject/abstract-signer@5.7.0
├── @ethersproject/hash@5.7.0
├── @ethersproject/hdnode@5.7.0
├── @ethersproject/keccak256@5.7.0
├── @ethersproject/logger@5.7.0
├── @ethersproject/transactions@5.7.0
├── @ethersproject/wallet@5.7.0
├── @popperjs/core@2.11.8
├── @scure/bip32@1.3.1
├── @scure/bip39@1.2.1
├── @sentry/svelte@7.61.1
├── @sentry/sveltekit@7.61.1
├── @sveltejs/adapter-auto@1.0.3
├── @sveltejs/adapter-static@1.0.6
├── @sveltejs/kit@1.22.4
├── @tailwindcss/aspect-ratio@0.4.2
├── @tailwindcss/forms@0.5.4
├── @tailwindcss/line-clamp@0.4.4
├── @tailwindcss/typography@0.5.9
├── @types/bn.js@5.1.1
├── @types/date-fns@2.6.0
├── @types/webextension-polyfill@0.9.2
├── @typescript-eslint/eslint-plugin@5.62.0
├── @typescript-eslint/parser@5.62.0
├── @uniswap/token-lists@1.0.0-beta.33
├── @walletconnect/client@1.8.0
├── @walletconnect/qrcode-modal@1.8.0
├── @walletconnect/web3wallet@1.8.8
├── alchemy-sdk@2.9.2
├── autoprefixer@10.4.5
├── await-semaphore@0.1.3
├── bip39@3.1.0
├── bip44-constants@152.0.0
├── bn.js@5.2.1
├── buffer@6.0.3
├── cheerio@1.0.0-rc.12
├── classnames@2.3.2
├── clipboard@2.0.11
├── css-loader@6.8.1
├── d3@7.8.5
├── daisyui@3.5.1
├── date-fns@2.30.0
├── detect-browser@5.3.0
├── dinero.js@2.0.0-alpha.14
├── dotenv-webpack@8.0.1
├── dotenv@16.3.1
├── dts-cli@1.6.3
├── easyqrcodejs@4.4.13
├── eslint-config-prettier@8.10.0
├── eslint-plugin-svelte3@4.0.0
├── eslint@8.46.0
├── eth-crypto@2.6.0
├── eth-keyring-controller@7.0.2
├── ethereum-block-by-date@1.4.9
├── ethereum-blockies-base64@1.0.2
├── ethereum-cryptography@1.2.0
├── ethereumjs-wallet@1.0.2
├── ethers@6.7.0
├── events@3.3.0
├── flowbite-svelte@0.40.2
├── flowbite@1.8.1
├── fs@0.0.1-security
├── json-schema@0.4.0
├── jspdf@2.5.1
├── lodash@4.17.21
├── loglevel@1.8.1
├── mustache@4.2.0
├── openai@3.3.0
├── path@0.12.7
├── pexels@1.4.0
├── postcss@8.4.27
├── posthog-js@1.75.3
├── prettier-plugin-svelte@2.10.1
├── prettier@2.8.8
├── resolve@1.22.1
├── rollup@2.79.1
├── svelte-burger-menu@1.0.5
├── svelte-check@2.10.3
├── svelte-confetti@1.2.4
├── svelte-cryptocurrency-icons@0.3.1
├── svelte-forms-lib@2.0.1
├── svelte-french-toast@1.2.0
├── svelte-pincode@2.2.0
├── svelte-preprocess@4.10.7
├── svelte-use-form@2.8.0
├── svelte@3.59.2
├── sveltekit-adapter-chrome-extension@1.5.0
├── tailwindcss-dotted-background@1.1.0
├── tailwindcss@3.3.3
├── terser-webpack-plugin@5.3.9
├── theme-change@2.5.0
├── tiny-glob@0.2.9
├── ts-loader@9.4.4
├── tslib@2.6.1
├── tw-elements@1.0.0-beta3
├── typescript@4.9.5
├── vite-plugin-iso-import@0.1.3
├── vite@4.4.8
├── vitest@0.22.1
├── webextension-polyfill@0.10.0
├── webpack-cli@4.10.0
├── webpack@5.88.2
├── yup@0.32.11
└── zxcvbn@4.4.2

```

