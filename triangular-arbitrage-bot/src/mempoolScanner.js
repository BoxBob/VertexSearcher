import { ethers } from 'ethers';
import 'dotenv/config';
import { ADDRESSES } from './config.js';

const WSS_URL = process.env.WSS_PROVIDER_URL;
if (!WSS_URL) {
  throw new Error("WSS_PROVIDER_URL not found in .env file");
}
const UNISWAP_ROUTER_ADDRESS = ADDRESSES.UNISWAP_V2_ROUTER.toLowerCase();
let provider;
let wsConnectionInterval;

function connectWebSocket() {
  console.log('Connecting to WebSocket provider...');
  provider = new ethers.providers.WebSocketProvider(WSS_URL);
  provider.on('pending', (txHash) => {
    handlePendingTransaction(txHash);
  });
  provider._websocket.on('open', () => {
    console.log('✅ WebSocket Connection OPENED');
    if (wsConnectionInterval) {
        clearInterval(wsConnectionInterval);
        wsConnectionInterval = null;
    }
  });
  provider._websocket.on('close', (code) => {
    console.error(`❌ WebSocket Connection CLOSED. Code: ${code}`);
    console.log('Attempting to reconnect in 5 seconds...');
    provider.removeAllListeners('pending');
    if (!wsConnectionInterval) {
        wsConnectionInterval = setInterval(connectWebSocket, 5000);
    }
  });
  provider._websocket.on('error', (err) => {
    console.error('WebSocket Error:', err.message);
  });
}

async function handlePendingTransaction(txHash) {
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      return;
    }
    if (tx.to && tx.to.toLowerCase() === UNISWAP_ROUTER_ADDRESS) {
      console.log('---------------------------------');
      console.log('🚀 Potential Trigger Transaction Found!');
      console.log(`   Hash: ${tx.hash}`);
      console.log(`   From: ${tx.from}`);
      console.log(`   Gas Price: ${ethers.utils.formatUnits(tx.gasPrice, 'gwei')} Gwei`);
      console.log(`   Function Data: ${tx.data.substring(0, 10)}...`); 
    }
  } catch (err) {
    if (err.code === 'TIMEOUT' || err.message.includes('transaction not found')) {
    } else {
    }
  }
}

console.log("Starting Mempool Scanner Bot...");
connectWebSocket();
