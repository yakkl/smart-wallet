# YAKKL Smart Wallet

>NOTE: This repo is subject to the LICENSE titled "YAKKL Smart Wallet License" in this directory. The Smart Contracts are subject to the LICENSE titled "YAKKL Smart Contracts License" in the packages/contracts directory.

## Overview

YAKKL Smart Wallet is a multi-platform cryptocurrency wallet designed for seamless interactions with decentralized applications (dApps) across multiple blockchains. It consists of two main components:
1. **Browser Extension Wallet**: A secure, user-friendly browser extension for managing digital assets.
2. **Smart Contracts**: A set of smart contracts built using Foundry to enable secure and efficient blockchain interactions.

## Table of Contents

- [YAKKL Smart Wallet](#yakkl-smart-wallet)
  - [Overview](#overview)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Features](#features)
    - [Browser Extension Wallet](#browser-extension-wallet)
    - [Smart Contracts](#smart-contracts)
  - [Architecture](#architecture)
    - [Browser Extension Wallet](#browser-extension-wallet-1)
    - [Smart Contracts](#smart-contracts-1)
  - [Installation](#installation)
    - [Browser Extension Wallet Installation](#browser-extension-wallet-installation)
    - [Smart Contracts Installation](#smart-contracts-installation)
  - [Usage](#usage)
    - [Getting Started with the Browser Extension](#getting-started-with-the-browser-extension)
    - [Deploying and Interacting with Smart Contracts](#deploying-and-interacting-with-smart-contracts)
  - [Development](#development)
    - [VSCode arm64](#vscode-arm64)
      - [Terminal](#terminal)
    - [Setting Up the Development Environment](#setting-up-the-development-environment)
      - [Initial github setup](#initial-github-setup)
      - [Possible 402 Error](#possible-402-error)
    - [Building and Testing](#building-and-testing)
    - [Best Practices](#best-practices)
  - [Some Interesting Formulas:](#some-interesting-formulas)
    - [Step-by-Step Calculation (Higher Gas Price and Lower Gas Price)](#step-by-step-calculation-higher-gas-price-and-lower-gas-price)
    - [Step-by-Step Calculation](#step-by-step-calculation)
    - [Formula](#formula)
    - [Conclusion](#conclusion)
    - [Step-by-Step Calculation](#step-by-step-calculation-1)
    - [Conversion Steps](#conversion-steps)
    - [Conclusion](#conclusion-1)
  - [Contributing](#contributing)
  - [Support and Contact](#support-and-contact)
  - [Acknowledgements](#acknowledgements)
    - [Final Notes](#final-notes)
  - [EXPERIMENTAL](#experimental)

## Introduction

Provide a brief introduction to the YAKKL Smart Wallet, its purpose, and its importance in the cryptocurrency ecosystem. Highlight its multi-platform support and focus on security.

## Features

### Browser Extension Wallet
- **Multi-Chain Support**: Describe how the wallet supports multiple blockchains (e.g., Ethereum, Polygon, etc.).
- **User-Friendly Interface**: Discuss the intuitive UI/UX designed for both beginners and advanced users.
- **Secure Key Management**: Explain how the wallet securely manages private keys and offers options like hardware wallet integration.
- **dApp Integration**: Mention the seamless integration with decentralized applications directly from the browser.

### Smart Contracts
- **Efficient Gas Usage**: Highlight optimizations made for minimizing gas costs in smart contract interactions.
- **Secure and Audited**: Describe the security measures taken, such as contract audits and formal verification.
- **Modular and Extensible**: Explain the modular architecture that allows easy extension and customization of the smart contracts.

## Architecture

### Browser Extension Wallet
- **Technology Stack**: List the key technologies used (e.g., TypeScript, Svelte, Web3.js).
- **Core Components**: Provide a high-level overview of the core components, such as the UI layer, wallet provider, transaction handler, and dApp connector.

### Smart Contracts
- **Contract Structure**: Explain the structure of the smart contracts, including main contracts, libraries, and utility contracts.
- **Foundry Integration**: Describe how Foundry is used for building, testing, and deploying the smart contracts.

## Installation

### Browser Extension Wallet Installation
- **Prerequisites**: List the prerequisites for installing the browser extension (e.g., supported browsers).
- **Installation Steps**:
  1. Clone the repository.
  2. Build the extension using the provided scripts.
  3. Load the extension into the browser.
  4. Configuration steps (if any).

### Smart Contracts Installation
- **Prerequisites**: Mention the requirements for working with the smart contracts, such as Foundry, Node.js, etc.
- **Installation Steps**:
  1. Clone the repository.
  2. Install dependencies using Foundry's package manager.
  3. Compile the contracts.
  4. Deploy the contracts to a local or test network.

## Usage

### Getting Started with the Browser Extension
- **Creating a Wallet**: Guide users through creating a new wallet or importing an existing one.
- **Sending and Receiving Assets**: Provide instructions on how to send and receive cryptocurrency.
- **Connecting to dApps**: Explain how to connect the wallet to decentralized applications.

### Deploying and Interacting with Smart Contracts
- **Deploying Contracts**: Step-by-step instructions for deploying the smart contracts using Foundry.
- **Interacting with Contracts**: Examples of how to interact with the deployed contracts, including making transactions and reading data.

## Development

### VSCode arm64

If running on OSX and using Silcon chip (Apple M1, M2, M3, M4 series) then you're running in an arm64 architecture. Do not run using Rosetta (allows x86 applications to run on an arm64 architecture). You can tell if you click+right on the application icon in the Applications folder. If you see an option to run Rosetta make sure it is off. If you don't see that option then most likely you're running the arm64 version of VSCode which is good. 

#### Terminal

If you use an external terminal to run command line commands like pnpm, npm, etc then you should be good to go. However, if you open and run the VSCode Terminal then by default it will show i386 as the architecture `arch` command will reveal the architecture. This means that when you run sveltekit, webpack, rollup, etc then you may see an error that says something like `@rollup/Darwin ... arm64 not found` (that is not the exact error but it will look something like that). To resolve this, you can create a task.json file and put it in the .vscode directory in the root of the project:

```json
{
  // See https://go.microsoft.com/fwlink/?LinkId=733558
  // for the documentation about the tasks.json format
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Force shell to arm64",
      "type": "shell",
      "command": "exec arch -arm64 $SHELL",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared",
        "showReuseMessage": true,
        "clear": false
      },
      "runOptions": {
        "runOn": "folderOpen"
      }
    }
  ]
}
```

You may have to pull up the command pallet and look for `Tasks: Manage Automatic Tasks`, select that and pick `Allow Automatic Tasks`. Now, exit out of VSCode (all) and launch again. This will change the terminal architecture to arm64 for your sessions.

### Setting Up the Development Environment
- **Environment Setup**: Provide detailed instructions for setting up the development environment, including required tools and configurations.
- **Repository Structure**: Explain the structure of the repository and the purpose of each directory.

#### Initial github setup
#### Possible 402 Error
- git config --global http.postBuffer 157286400

This may be needed if you get a 402 error when pushing to github initially. The repo is large and the default buffer size may be too small. This would be a one time setup.

### Building and Testing
- **Building the Browser Extension**: Instructions for building the extension from source.
- **Testing the Smart Contracts**: Guide on running tests for the smart contracts using Foundry, including examples of test cases.

### Best Practices
- **Coding Standards**: Outline the coding standards followed in the project, such as code formatting, commenting, and documentation.
- **Security Practices**: List best practices for ensuring the security of both the browser extension and smart contracts.

## Some Interesting Formulas:

### Step-by-Step Calculation (Higher Gas Price and Lower Gas Price)
To determine how much 1,384,197 gas costs (example of deploying a good size and semi-complex smart contract at the time of this writing) when deploying your contract, you need to multiply the gas used by the gas price and convert the result to ETH. The total cost in ETH depends on the gas price at the time of the transaction.

### Step-by-Step Calculation

1. **Gas Used**: 1,384,197 gas
2. **Gas Price**: The gas price is usually given in **gwei** (1 gwei = \(10^{-9}\) ETH). Let's assume a gas price of 20 gwei for this example.
3. **Conversion from gwei to ETH**:
   - 1 gwei = \(10^{-9}\) ETH

### Formula

\[
\text{Total Cost in ETH} = \text{Gas Used} \times \text{Gas Price (in ETH)}
\]

Given:
- Gas Used = 1,384,197
- Gas Price = 20 gwei = 20 \times 10^{-9} \text{ ETH}

\[
\text{Total Cost in ETH} = 1,384,197 \times 20 \times 10^{-9} = 0.02768394 \text{ ETH}
\]

### Conclusion

If the gas price is 20 gwei, then deploying your contract with 1,384,197 gas would cost approximately **0.0277 ETH**. So, assume $2,652.76 per ETH, the cost would be approximately **$73.50 USD**.

To get the exact cost, you'd replace the gas price in the calculation with the actual gas price at the time of deployment. You can check the current gas price using tools like [Etherscan Gas Tracker](https://etherscan.io/gastracker) or directly from an Ethereum node.

-OR-

Given the current gas price of 5.486 gwei and the price of 1 ETH as $2,652.76, you can calculate the cost of deploying your contract in USD as follows.

### Step-by-Step Calculation

1. **Gas Used**: 1,384,197 gas
2. **Gas Price**: 5.486 gwei
3. **ETH to USD**: 1 ETH = \$2,652.76

### Conversion Steps

1. **Convert Gas Price to ETH**:
   - Gas Price in ETH = 5.486 gwei = \(5.486 \times 10^{-9}\) ETH

2. **Calculate Total Gas Cost in ETH**:
   \[
   \text{Total Cost in ETH} = \text{Gas Used} \times \text{Gas Price (in ETH)}
   \]
   \[
   \text{Total Cost in ETH} = 1,384,197 \times 5.486 \times 10^{-9} = 0.007596496142 \text{ ETH}
   \]

3. **Convert the Total Cost to USD**:
   \[
   \text{Total Cost in USD} = \text{Total Cost in ETH} \times \text{ETH to USD}
   \]
   \[
   \text{Total Cost in USD} = 0.007596496142 \times 2652.76 = 20.15 \text{ USD}
   \]

### Conclusion

With a gas price of 5.486 gwei and 1 ETH being \$2,652.76, deploying your contract with 1,384,197 gas would cost approximately **\$20.15 USD**.



## Contributing

We welcome contributions from the community! Please follow these steps to contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

Please refer to our [Contributing Guide](./CONTRIBUTING.md) for more details.

## Support and Contact

If you have any questions or need support, please contact us at:
- **Email**: [support@yakkl.com](mailto:support@yakkl.com)
- **Website**: [yakkl.com](http://yakkl.com?utm_source=github&utm_medium=referral)

## Acknowledgements

Thank those who have contributed to the development of YAKKL Smart Wallet, including open-source projects, libraries, and individual contributors.

---

### Final Notes

This outline provides a comprehensive structure for your `README.md`. It covers all major aspects of the YAKKL Smart Wallet, including installation, usage, development, and licensing. 

## EXPERIMENTAL

Testing shadcn UI controls. There are a few components but they are not functional:
- Profile.svelte
- Preferences.svelte

Files:
- tailwind.config.shadcn.js
- app.shadcn.css
- components.json

Directory:
- $lib/components/ui
