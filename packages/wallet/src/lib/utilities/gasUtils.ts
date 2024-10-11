/* eslint-disable @typescript-eslint/no-explicit-any */
// gasUtils.ts
import type { SwapToken } from '$lib/common/interfaces';
import type { Provider } from '$lib/plugins/Provider';
import type { UniswapV3SwapManager } from '$plugins/UniswapV3SwapManager';
import { ethers } from 'ethers';
import { Token } from '$lib/plugins/Token';

export async function estimateGasFee(
  fromToken: SwapToken,
  toToken: SwapToken,
  amount: string,
  provider: Provider,
  swapManager: UniswapV3SwapManager,
  blockchain: any
): Promise<string> {
  try {
    const signer = provider.getSigner();
    const fromAddress = await signer.getAddress();

    let gasEstimate: bigint = 0n;
    let gasPrice: bigint = 0n;

    if (fromToken.isNative) {
      // Estimating gas for native (ETH) to token swap
      const swapTx = await swapManager.populateSwapTransaction(
        Token.fromSwapToken(fromToken, blockchain, provider),
        Token.fromSwapToken(toToken, blockchain, provider),
        ethers.parseUnits(amount, fromToken.decimals),
        0n, // Set a minimum amount out of 0 for estimation
        fromAddress,
        Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes deadline
      );

      gasEstimate = await provider.estimateGas({
        ...swapTx,
        value: ethers.parseUnits(amount, fromToken.decimals)
      });
    } else {
      // Estimating gas for token to token or token to ETH swap
      const tokenContract = new ethers.Contract(
        fromToken.address,
        ['function approve(address spender, uint256 amount) public returns (bool)'],
        signer as any
      );

      // Estimate gas for approval
      const approvalGasEstimate = await tokenContract.approve.estimateGas(
        swapManager.getRouterAddress(),
        ethers.parseUnits(amount, fromToken.decimals)
      );

      // Estimate gas for swap
      const swapTx = await swapManager.populateSwapTransaction(
        Token.fromSwapToken(fromToken, blockchain, provider),
        Token.fromSwapToken(toToken, blockchain, provider),
        ethers.parseUnits(amount, fromToken.decimals),
        0n, // Set a minimum amount out of 0 for estimation
        fromAddress,
        Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes deadline
      );

      const swapGasEstimate = await provider.estimateGas(swapTx);

      gasEstimate = approvalGasEstimate + swapGasEstimate;
    }

    // Get current gas price
    gasPrice = await provider.getGasPrice();

    // Calculate total gas fee in wei
    const gasFeeWei = gasEstimate * gasPrice;

    // Convert gas fee to ETH and format it
    const gasFeeETH = ethers.formatEther(gasFeeWei);

    // Get current ETH price in USD
    const ethPriceUSD = await getETHPriceInUSD(); // You need to implement this function

    // Calculate gas fee in USD
    const gasFeeUSD = parseFloat(gasFeeETH) * ethPriceUSD;

    return `$${gasFeeUSD.toFixed(2)}`;
  } catch (error) {
    console.error('Error estimating gas fee:', error);
    return 'Unable to estimate';
  }
}

async function getETHPriceInUSD(): Promise<number> {
  
  return 2000;
}
