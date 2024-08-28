import { getCreateAddress } from "ethers";

// Replace with your deployment account address and nonce
const senderAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const nonce = 3; // Replace with the correct nonce

const contractAddress = getCreateAddress({
    from: senderAddress,
    nonce: nonce,
});

console.log("Expected contract address:", contractAddress);
