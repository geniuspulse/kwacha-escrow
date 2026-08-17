# Kwacha Escrow - Smart Contract Deployment Guide

## Prerequisites
- MetaMask with BNB for BSC gas
- TronLink with TRX for Tron gas
- Remix IDE (https://remix.ethereum.org) or Hardhat

## Deploy on BSC

1. Go to Remix IDE
2. Create new file `KwachaEscrow.sol`, paste contents from `contracts/KwachaEscrow.sol`
3. Compile with Solidity 0.8.20+
4. Connect MetaMask to BSC Mainnet (Chain ID: 56)
5. Deploy with constructor args:
   - `_usdtAddress`: `0x55d398326f99059fF775485246999027B3197955` (BSC USDT)
   - `_feeWallet`: Your platform fee collection wallet address
   - `_feeBps`: `80` (0.8% = 80 basis points)
6. Copy the deployed contract address
7. Set `VITE_ESCROW_CONTRACT_BSC` in your .env

## Deploy on Tron (TRC20)

1. Go to TronIDE (https://www.tronide.io) or use tronbox
2. Compile `KwachaEscrow.sol` with Solidity 0.8.20+
3. Connect TronLink to Tron Mainnet
4. Deploy with constructor args:
   - `_usdtAddress`: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` (TRC20 USDT)
   - `_feeWallet`: Your platform fee collection wallet address
   - `_feeBps`: `80` (0.8%)
5. Copy the deployed contract address
6. Set `VITE_ESCROW_CONTRACT_TRC20` in your .env

## Verify on Explorer
- BSC: https://bscscan.com/verifyContract
- Tron: https://tronscan.org/#/contract/{address}/code

## User Wallet Extensions
- BSC: Users install MetaMask
- TRC20: Users install TronLink
- The app auto-detects which wallet is installed
