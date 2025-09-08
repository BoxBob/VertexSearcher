import { ethers } from 'ethers';
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle';
import 'dotenv/config';
import { UNISWAP_V2_FACTORY_ABI, UNISWAP_V2_PAIR_ABI, ADDRESSES, FLASHBOTS_RELAY_URL } from './config.js';

export const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
export const searcherWallet = new ethers.Wallet(process.env.SEARCHER_PRIVATE_KEY, provider);

let flashbotsProvider = null;
export const getFlashbotsProvider = async () => {
  if (flashbotsProvider) return flashbotsProvider;
  flashbotsProvider = await FlashbotsBundleProvider.create(
    provider,
    searcherWallet,
    FLASHBOTS_RELAY_URL,
    'mainnet'
  );
  return flashbotsProvider;
};

export const getPairReserves = async (pairAddress, tokenA, tokenB) => {
  const pairContract = new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
  const [reserve0, reserve1] = await pairContract.getReserves();
  const token0 = await pairContract.token0();
  if (token0.toLowerCase() === tokenA.address.toLowerCase()) {
    return [reserve0, reserve1];
  } else {
    return [reserve1, reserve0];
  }
};

export const getPairAddress = async (tokenA_addr, tokenB_addr) => {
  const factoryContract = new ethers.Contract(ADDRESSES.UNISWAP_V2_FACTORY, UNISWAP_V2_FACTORY_ABI, provider);
  const pairAddress = await factoryContract.getPair(tokenA_addr, tokenB_addr);
  return pairAddress;
};
