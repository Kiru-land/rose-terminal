// api/getContractBalances.js

import { ethers } from 'ethers';
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Ethereum provider (e.g., Infura, Alchemy)
    const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL);

    // Contract address
    const contractAddress = '0xYourContractAddress';

    // ERC20 token address
    const erc20TokenAddress = '0xYourERC20TokenAddress';

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

        // Store the value in Vercel KV database
        await kv.set('balanceRatio', result);

        res.status(200).json({ success: true, result });
    } catch (error) {
        console.error('Error in getContractBalances:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}