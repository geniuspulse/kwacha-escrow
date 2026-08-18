require("@nomicfoundation/hardhat-toolbox")

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    bsctest: {
      url: "https://bsc-testnet-rpc.publicnode.com",
      accounts: process.env.DEPLOYER_PRIVATE_KEY 
        ? [process.env.DEPLOYER_PRIVATE_KEY] 
        : [],
      chainId: 97,
      gasPrice: 10000000000, // 10 gwei
    },
    trontest: {
      url: "https://nile.tron.tools",
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    }
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
  },
}
