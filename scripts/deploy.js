const { ethers } = require("hardhat")

// BSC Testnet USDT (BSC-USD): 0x337610d27c911199de22af778f990d827d6e6b6c
// On testnet, this is a test USDT with 18 decimals
const USDT_ADDRESSES = {
  bsctest: "0x337610d27c911199de22af778f990d827d6e6b6c",
  trontest: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", // mainnet TRC20 USDT - testnet may differ
}

async function main() {
  const network = hre.network.name
  console.log(`Deploying KwachaEscrow to ${network}...`)

  const [deployer] = await ethers.getSigners()
  console.log(`Deployer: ${deployer.address}`)
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} BNB`)

  const feeWallet = process.env.FEE_WALLET_ADDRESS || deployer.address
  const sellerFeeBps = 100 // 1%
  const buyerFeeBps = 100  // 1%

  console.log(`Fee wallet: ${feeWallet}`)
  console.log(`Seller fee: ${sellerFeeBps} bps (1%)`)
  console.log(`Buyer fee: ${buyerFeeBps} bps (1%)`)
  console.log(`USDT: ${USDT_ADDRESSES[network] || USDT_ADDRESSES.bsctest}`)

  const KwachaEscrow = await ethers.getContractFactory("KwachaEscrow")
  const escrow = await KwachaEscrow.deploy(
    USDT_ADDRESSES[network] || USDT_ADDRESSES.bsctest,
    feeWallet,
    sellerFeeBps,
    buyerFeeBps
  )

  await escrow.waitForDeployment()
  const address = await escrow.getAddress()

  console.log(`\n=== Deployment Complete ===`)
  console.log(`Contract address: ${address}`)
  console.log(`Network: ${network}`)
  console.log(`Fee wallet: ${feeWallet}`)
  console.log(`Seller fee: 1% (${sellerFeeBps} bps)`)
  console.log(`Buyer fee: 1% (${buyerFeeBps} bps)`)
  console.log(`\nSet in .env:`)
  if (network === "bsctest") {
    console.log(`VITE_ESCROW_CONTRACT_BSC=${address}`)
  } else {
    console.log(`VITE_ESCROW_CONTRACT_TRC20=${address}`)
  }

  // Verify on BscScan if API key provided
  if (process.env.BSCSCAN_API_KEY && network === "bsctest") {
    console.log("\nVerifying on BscScan...")
    try {
      await hre.run("verify:verify", {
        address,
        constructorArguments: [
          USDT_ADDRESSES[network] || USDT_ADDRESSES.bsctest,
          feeWallet,
          sellerFeeBps,
          buyerFeeBps,
        ],
      })
      console.log("Verified on BscScan")
    } catch (e) {
      console.log("Verification failed:", e.message)
    }
  }

  return address
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
