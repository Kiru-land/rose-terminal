// api/getContractBalances.js

import { ethers } from 'ethers';
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Ethereum provider (e.g., Infura, Alchemy)
    const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL);

    // Contract address
    const contractAddress = '0xdB02B6a7cfe9d4DE7D2dC585EFc27a24b6345aD1';

    // ERC20 token address
    const erc20TokenAddress = '0xdB02B6a7cfe9d4DE7D2dC585EFc27a24b6345aD1';

    // ERC20 ABI (minimal)
    const erc20Abi = [
        // Read-Only Functions
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)"
    ];

    // Create ERC20 contract instance
    const erc20Contract = new ethers.Contract(erc20TokenAddress, erc20Abi, provider);

    try {
        // Get Ether balance of the contract
        const etherBalanceWei = await provider.getBalance(contractAddress);
        const etherBalance = ethers.utils.formatEther(etherBalanceWei);

        // Get ERC20 token balance of the contract
        const erc20BalanceRaw = await erc20Contract.balanceOf(contractAddress);
        const erc20Decimals = await erc20Contract.decimals();
        const erc20Balance = ethers.utils.formatUnits(erc20BalanceRaw, erc20Decimals);

        // Divide the ERC20 balance by the Ether balance
        const result = parseFloat(erc20Balance) / parseFloat(etherBalance);

        // Query the price of ETH from an API (commented out for now)
        // const ethPriceResponse = await fetch('https://api.example.com/eth-price');
        // const ethPriceData = await ethPriceResponse.json();
        // const ethPrice = ethPriceData.price;

        // Generate a timestamp as the key
        const timestamp = Date.now().toString(); // Convert to string for the KV key

        // Store the timestamp as key and price as value in Vercel KV database
        await kv.set(timestamp, result);

        res.status(200).json({ success: true, timestamp, result });
    } catch (error) {
        console.error('Error in getContractBalances:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}