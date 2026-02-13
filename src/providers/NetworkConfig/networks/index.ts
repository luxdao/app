import base from './base';
import hanzo from './hanzo';
import hanzoTestnet from './hanzo-testnet';
import localhost from './localhost';
import lux from './lux';
import luxTestnet from './lux-testnet';
import mainnet from './mainnet';
import optimism from './optimism';
import pars from './pars';
import parsTestnet from './pars-testnet';
import polygon from './polygon';
import sepolia from './sepolia';
import spc from './spc';
import zoo from './zoo';

// Production networks (always visible)
export const productionNetworks = {
  // Lux Ecosystem Mainnets (priority order)
  lux,
  hanzo,
  zoo,
  pars,
  spc,
  // EVM Networks
  mainnet,
  optimism,
  polygon,
  base,
};

// Testnet/dev networks (only visible in dev mode)
export const testNetworks = {
  luxTestnet,
  hanzoTestnet,
  parsTestnet,
  sepolia,
  localhost,
};

// Helper to check dev mode (safe for SSR/build time)
export const isDevMode = (): boolean => {
  try {
    return import.meta.env?.DEV === true || import.meta.env?.VITE_APP_FLAG_DEV === 'true';
  } catch {
    return false;
  }
};

// Get networks based on environment - use this function for dynamic access
export const getNetworks = () => isDevMode()
  ? { ...productionNetworks, ...testNetworks }
  : productionNetworks;

// Static networks export - includes all for routing/validation purposes
export const networks = { ...productionNetworks, ...testNetworks };

export const validPrefixes = new Set(Object.values(networks).map(network => network.addressPrefix));
