import { Address } from 'viem';

export interface FeaturedDAO {
  name: string;
  description: string;
  address: Address;
  chainId: number;
  addressPrefix: string;
  logo?: string;
  category: 'ecosystem' | 'product' | 'community' | 'research';
  domain?: string;
}

// Lux Ecosystem Featured DAOs
// These are the official Lux product and ecosystem DAOs

export const FEATURED_DAOS: FeaturedDAO[] = [
  // ===== Lux Network DAOs (Chain ID: 96369) =====
  {
    name: 'Lux Foundation',
    description: 'Core governance for the Lux Network ecosystem',
    address: '0x0000000000000000000000000000000000000001', // TODO: Deploy
    chainId: 96369,
    addressPrefix: 'lux',
    logo: '/images/dao/lux-foundation.svg',
    category: 'ecosystem',
    domain: 'foundation.lux.network',
  },

  // ===== Hanzo Network DAOs (Chain ID: 36963) =====
  {
    name: 'Hanzo AI',
    description: 'AI infrastructure and model governance',
    address: '0x0000000000000000000000000000000000000001', // TODO: Deploy
    chainId: 36963,
    addressPrefix: 'hanzo',
    logo: '/images/dao/hanzo-ai.svg',
    category: 'ecosystem',
    domain: 'dao.hanzo.ai',
  },

  // ===== Zoo Network DAOs (Chain ID: 200200) =====
  {
    name: 'Zoo Labs',
    description: 'Decentralized AI and Science research coordination',
    address: '0x0000000000000000000000000000000000000001', // TODO: Deploy
    chainId: 200200,
    addressPrefix: 'zoo',
    logo: '/images/dao/zoo-labs.svg',
    category: 'research',
    domain: 'labs.zoo.ngo',
  },

  // ===== Pars Network DAOs (Chain ID: 7070) =====
  {
    name: 'Pars Governance',
    description: 'Pars Network protocol governance',
    address: '0x0000000000000000000000000000000000000001', // TODO: Deploy
    chainId: 7070,
    addressPrefix: 'pars',
    logo: '/images/dao/pars.svg',
    category: 'ecosystem',
    domain: 'gov.pars.network',
  },

  // ===== SPC Network DAOs (Chain ID: 36911) =====
  {
    name: 'SPC Governance',
    description: 'SPC Network protocol governance',
    address: '0x0000000000000000000000000000000000000001', // TODO: Deploy
    chainId: 36911,
    addressPrefix: 'spc',
    logo: '/images/dao/spc.svg',
    category: 'ecosystem',
    domain: 'gov.spc.network',
  },

  // ===== Lux Product DAOs (Sub-DAOs on Lux Network 96369) =====
  {
    name: 'Lux Exchange',
    description: 'Decentralized exchange governance and treasury',
    address: '0x0000000000000000000000000000000000000001', // TODO: Deploy
    chainId: 96369,
    addressPrefix: 'lux',
    logo: '/images/dao/lux-exchange.svg',
    category: 'product',
    domain: 'exchange.lux.finance',
  },
  {
    name: 'Lux Wallet',
    description: 'Multi-chain wallet development and security',
    address: '0x0000000000000000000000000000000000000001', // TODO: Deploy
    chainId: 96369,
    addressPrefix: 'lux',
    logo: '/images/dao/lux-wallet.svg',
    category: 'product',
    domain: 'wallet.lux.finance',
  },
  {
    name: 'Lux Market',
    description: 'NFT and RWA marketplace governance',
    address: '0x0000000000000000000000000000000000000001', // TODO: Deploy
    chainId: 96369,
    addressPrefix: 'lux',
    logo: '/images/dao/lux-market.svg',
    category: 'product',
    domain: 'market.lux.finance',
  },
  {
    name: 'Lux Finance',
    description: 'DeFi protocol and treasury management',
    address: '0x0000000000000000000000000000000000000001', // TODO: Deploy
    chainId: 96369,
    addressPrefix: 'lux',
    logo: '/images/dao/lux-finance.svg',
    category: 'product',
    domain: 'defi.lux.finance',
  },
  {
    name: 'Lux App',
    description: 'Consumer app and mobile development',
    address: '0x0000000000000000000000000000000000000001', // TODO: Deploy
    chainId: 96369,
    addressPrefix: 'lux',
    logo: '/images/dao/lux-app.svg',
    category: 'product',
    domain: 'app.lux.network',
  },
  {
    name: 'Lux Impact',
    description: 'Social impact and sustainability initiatives',
    address: '0x0000000000000000000000000000000000000001', // TODO: Deploy
    chainId: 96369,
    addressPrefix: 'lux',
    logo: '/images/dao/lux-impact.svg',
    category: 'community',
    domain: 'impact.lux.network',
  },

  // ===== Ethereum Mainnet DAOs (Chain ID: 1) =====
  {
    name: 'Zen Vote',
    description: 'Mindful governance and community decisions',
    address: '0x0000000000000000000000000000000000000001', // TODO: Deploy
    chainId: 1,
    addressPrefix: 'eth',
    logo: '/images/dao/zen-vote.svg',
    category: 'community',
    domain: 'zen.vote',
  },
];

// Get featured DAOs by chain
export const getFeaturedDAOsByChain = (chainId: number): FeaturedDAO[] => {
  return FEATURED_DAOS.filter(dao => dao.chainId === chainId);
};

// Get featured DAOs by category
export const getFeaturedDAOsByCategory = (category: FeaturedDAO['category']): FeaturedDAO[] => {
  return FEATURED_DAOS.filter(dao => dao.category === category);
};

// Get all ecosystem DAOs (one per chain)
export const getEcosystemDAOs = (): FeaturedDAO[] => {
  const seen = new Set<number>();
  return FEATURED_DAOS.filter(dao => {
    if (dao.category === 'ecosystem' && !seen.has(dao.chainId)) {
      seen.add(dao.chainId);
      return true;
    }
    return false;
  });
};

// Chain ID to network name mapping
export const CHAIN_NAMES: Record<number, string> = {
  // Lux Ecosystem Mainnets
  96369: 'Lux Mainnet',
  36963: 'Hanzo Network',
  200200: 'Zoo Network',
  7070: 'Pars Network',
  36911: 'SPC Network',
  // Lux Ecosystem Testnets
  96368: 'Lux Testnet',
  96370: 'Lux Devnet',
  36962: 'Hanzo Testnet',
  7071: 'Pars Testnet',
  // EVM Networks
  1: 'Ethereum',
  10: 'Optimism',
  137: 'Polygon',
  8453: 'Base',
  11155111: 'Sepolia',
  // Development
  1337: 'Localhost',
  31337: 'Anvil',
};
