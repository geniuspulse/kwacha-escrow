const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const USDT_ADDRESS = '0x337610d27c911199de22af778f990d827d6e6b6c';
const BSC_TESTNET_RPC = 'https://bsc-testnet-rpc.publicnode.com';
const FEE_BPS = 100;

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error('ERROR: Set DEPLOYER_PRIVATE_KEY env var');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('=== KwachaEscrow Deployment ===');
  console.log('Network: BSC Testnet (chainId 97)');
  console.log('Deployer:', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'BNB');

  if (balance === 0n) {
    console.error('\nERROR: Deployer has 0 BNB. Fund this address:');
    console.error('  Faucet: https://testnet.bnbchain.org/faucet-smart');
    console.error('  Address:', wallet.address);
    process.exit(1);
  }

  const abiPath = path.join(__dirname, '../artifacts/contracts_KwachaEscrow_sol_KwachaEscrow.abi');
  const binPath = path.join(__dirname, '../artifacts/contracts_KwachaEscrow_sol_KwachaEscrow.bin');
  const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  const bytecodeHex = fs.readFileSync(binPath, 'utf8').trim();
  const bytecode = '0x' + bytecodeHex;

  const feeWallet = process.env.FEE_WALLET_ADDRESS || wallet.address;

  console.log('\nConstructor args:');
  console.log('  USDT:', USDT_ADDRESS);
  console.log('  Fee wallet:', feeWallet);
  console.log('  Seller fee:', FEE_BPS, 'bps (1%)');
  console.log('  Buyer fee:', FEE_BPS, 'bps (1%)');

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  console.log('\nDeploying...');
  const contract = await factory.deploy(
    USDT_ADDRESS,
    feeWallet,
    FEE_BPS,
    FEE_BPS,
    { gasPrice: ethers.parseUnits('10', 'gwei') }
  );

  console.log('Tx hash:', contract.deploymentTransaction().hash);
  console.log('Waiting for confirmation...');

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log('\n=== Deployment Complete ===');
  console.log('Contract address:', address);
  console.log('Fee wallet:', feeWallet);
  console.log('\nAdd to .env:');
  console.log('VITE_ESCROW_CONTRACT_BSC=' + address);
  console.log('BscScan: https://testnet.bscscan.com/address/' + address);

  const sellerFee = await contract.sellerFeeBps();
  const buyerFee = await contract.buyerFeeBps();
  console.log('\nSanity check: sellerFeeBps=' + sellerFee + ' buyerFeeBps=' + buyerFee);

  return address;
}

main().catch((error) => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
