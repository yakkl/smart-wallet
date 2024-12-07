<script lang="ts">
  import { ethers } from "ethers";

  async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
      try {
        //@ts-ignore
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts.length > 0) {
          console.log("Connected wallet address:", accounts[0]);
          // @ts-ignore
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          console.log("Signer:", signer);
        }
      } catch (err) {
        console.error("Failed to connect wallet:", err);
      }
    } else {
      alert("Ethereum is not supported in your browser. Please install MetaMask or another compatible wallet.");
    }
  }
</script>

<!-- add classes -->
<button onclick={connectWallet}>Connect Wallet</button>
