import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

async function getAccounts() {
    const accounts = await provider.listAccounts();
    console.log("Accounts:", accounts);
    for (let i = 0; i < accounts.length; i++) {
        const balance = await provider.getBalance(accounts[i]);
        console.log(`Account ${i}: ${accounts[i]} has balance: ${balance}`);
    }
}

getAccounts();
