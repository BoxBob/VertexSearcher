import { ethers } from 'ethers';
import {
  provider,
  searcherWallet,
  getFlashbotsProvider,
  getPairAddress,
  getPairReserves,
} from './utils.js';
import {
  ADDRESSES,
  ARB_CONTRACT_ABI,
  AMOUNT_TO_TRADE_WEI,
  MIN_PROFIT_PERCENTAGE,
  POLLING_INTERVAL_MS,
} from './config.js';
import { simulateTriangularArb } from './arbitrage.js';

const arbContract = new ethers.Contract(ADDRESSES.ARB_CONTRACT, ARB_CONTRACT_ABI, searcherWallet);
const TOKEN_A = ADDRESSES.TOKEN_A;
const TOKEN_B = ADDRESSES.TOKEN_B;
const TOKEN_C = ADDRESSES.TOKEN_C;
let PAIR_AB_ADDRESS = '';
let PAIR_BC_ADDRESS = '';
let PAIR_CA_ADDRESS = '';

async function runBot() {
  console.log('Bot starting. Finding pair addresses...');
  try {
    PAIR_AB_ADDRESS = await getPairAddress(TOKEN_A.address, TOKEN_B.address);
    PAIR_BC_ADDRESS = await getPairAddress(TOKEN_B.address, TOKEN_C.address);
    PAIR_CA_ADDRESS = await getPairAddress(TOKEN_C.address, TOKEN_A.address);
    console.log(`Pair A-B (${PAIR_AB_ADDRESS})`);
    console.log(`Pair B-C (${PAIR_BC_ADDRESS})`);
    console.log(`Pair C-A (${PAIR_CA_ADDRESS})`);
  } catch (err) {
    console.error('Failed to get pair addresses. Exiting.', err);
    process.exit(1);
  }
  console.log('Starting polling loop...\n');
  provider.on('block', async (blockNumber) => {
    console.log(`--- New Block: ${blockNumber} ---`);
    await checkForOpportunity();
  });
}

async function checkForOpportunity() {
  const [reserves_AB, reserves_BC, reserves_CA] = await Promise.all([
    getPairReserves(PAIR_AB_ADDRESS, TOKEN_A, TOKEN_B),
    getPairReserves(PAIR_BC_ADDRESS, TOKEN_B, TOKEN_C),
    getPairReserves(PAIR_CA_ADDRESS, TOKEN_C, TOKEN_A),
  ]);
  const reservesPath = [reserves_AB, reserves_BC, reserves_CA];
  const simResult = simulateTriangularArb(AMOUNT_TO_TRADE_WEI, reservesPath);
  if (!simResult.isProfitable) {
    console.log('No profitable opportunity found.');
    return;
  }
  const expectedProfitPercent = 
    (parseFloat(ethers.utils.formatUnits(simResult.profit, TOKEN_A.decimals)) /
    parseFloat(ethers.utils.formatUnits(AMOUNT_TO_TRADE_WEI, TOKEN_A.decimals)))
  console.log(`!!! PROFITABLE OPPORTUNITY FOUND !!!`);
  console.log(`   Start Amount: ${ethers.utils.formatUnits(AMOUNT_TO_TRADE_WEI, TOKEN_A.decimals)} ${TOKEN_A.symbol}`);
  console.log(`   End Amount:   ${ethers.utils.formatUnits(simResult.amountOut, TOKEN_A.decimals)} ${TOKEN_A.symbol}`);
  console.log(`   Est. Profit:  ${ethers.utils.formatUnits(simResult.profit, TOKEN_A.decimals)} ${TOKEN_A.symbol} (~${(expectedProfitPercent * 100).toFixed(4)}%)`);
  if (expectedProfitPercent < MIN_PROFIT_PERCENTAGE) {
      console.log(`   Profit is below minimum threshold. Skipping.`);
      return;
  }
  await sendFlashbotsBundle(simResult.profit);
}

async function sendFlashbotsBundle(estimatedProfit) {
    const flashbotsProvider = await getFlashbotsProvider();
    const currentBlock = await provider.getBlockNumber();
    const targetBlock = currentBlock + 1;
    console.log(`Preparing bundle for block: ${targetBlock}`);
    const bribe = estimatedProfit.div(2);
    const gasLimit = 600000; 
    const effectiveGasPrice = bribe.div(gasLimit); 
    const arbitrageTx = await arbContract.populateTransaction.executeTrade(
        TOKEN_A.address,
        TOKEN_B.address,
        TOKEN_C.address,
        AMOUNT_TO_TRADE_WEI,
        {
            gasLimit: gasLimit,
            gasPrice: effectiveGasPrice,
        }
    );
    const signedTx = await searcherWallet.signTransaction(arbitrageTx);
    const bundle = [
        {
            signedTransaction: signedTx
        }
    ];
    console.log('Simulating bundle...');
    try {
        const simulation = await flashbotsProvider.simulate(bundle, targetBlock);
        if (simulation.results[0].error) {
            console.error('Bundle simulation failed:', simulation.results[0].error);
            return;
        }
        console.log('Simulation SUCCEEDED. Sending bundle to relay...');
        const bundleReceipt = await flashbotsProvider.sendRawBundle(bundle, targetBlock);
        console.log('Bundle submitted. Waiting for inclusion...');
        const waitResponse = await bundleReceipt.wait();
        if (waitResponse === 0) {
            console.log('✅ ✅ ✅ Bundle INCLUDED in block!');
        } else {
            console.log('Bundle was not included (e.g., another bot was faster, or block reorg).');
        }
    } catch (err) {
        console.error('Error during bundle simulation or submission:', err.message);
    }
}

runBot().catch((err) => {
  console.error(err);
  process.exit(1);
});
