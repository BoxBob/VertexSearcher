import { ethers } from 'ethers';

export const UNISWAP_V2_FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)'
];

export const UNISWAP_V2_PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
];

export const ARB_CONTRACT_ABI = [
    'constructor()',
    'event ArbitrageExecuted(address indexed tokenA, address indexed tokenB, address indexed tokenC, uint256 amountIn, uint256 profit)',
    'function executeTrade(address _tokenA, address _tokenB, address _tokenC, uint256 _amountInA) external',
    'function owner() external view returns (address)',
    'function uniswapRouter() external view returns (address)',
    'function withdraw(address _tokenAddress) external'
];

export const ADDRESSES = {
  UNISWAP_V2_FACTORY: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  UNISWAP_V2_ROUTER: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  ARB_CONTRACT: '0xYOUR_DEPLOYED_CONTRACT_ADDRESS',
  TOKEN_A: {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    decimals: 18,
    symbol: 'WETH'
  },
  TOKEN_B: {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    decimals: 18,
    symbol: 'DAI'
  },
  TOKEN_C: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    decimals: 6,
    symbol: 'USDC'
  }
};

export const AMOUNT_TO_TRADE_WEI = ethers.utils.parseUnits('1.0', ADDRESSES.TOKEN_A.decimals);
export const POLLING_INTERVAL_MS = 5000;
export const FLASHBOTS_RELAY_URL = 'https://relay.flashbots.net';
export const MIN_PROFIT_PERCENTAGE = 0.005;
