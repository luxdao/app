import { Address, Chain } from 'viem';
import { GovernanceType } from './fractal';

export type TheGraphConfig = {
  space: number; // for dev
  slug: string; // for dev
  id: string; // for prod
};

// Network prefixes for URL routing
export type NetworkPrefix =
  // Lux Ecosystem Mainnets
  | 'lux'
  | 'hanzo'
  | 'zoo'
  | 'pars'
  | 'spc'
  // Lux Ecosystem Testnets
  | 'lux-test'
  | 'hanzo-test'
  | 'pars-test'
  // EVM Networks
  | 'eth'
  | 'oeth'
  | 'matic'
  | 'base'
  | 'sep'
  // Development
  | 'local';

type ContractsBase = {
  gnosisSafeL2Singleton: Address;
  gnosisSafeProxyFactory: Address;
  compatibilityFallbackHandler: Address;

  multiSendCallOnly: Address;

  moduleProxyFactory: Address;

  linearVotingErc20MasterCopy: Address;
  linearVotingErc20RolesWhitelistingMasterCopy: Address;
  linearVotingErc721MasterCopy: Address;
  linearVotingErc721RolesWhitelistingMasterCopy: Address;

  linearVotingErc20V1MasterCopy: Address;
  linearVotingErc20RolesWhitelistingV1MasterCopy: Address;
  linearVotingErc721V1MasterCopy: Address;
  linearVotingErc721RolesWhitelistingV1MasterCopy: Address;

  moduleGovernorMasterCopy: Address;
  moduleFractalMasterCopy: Address;

  freezeGuardGovernorMasterCopy: Address;
  freezeGuardMultisigMasterCopy: Address;

  freezeVotingErc20MasterCopy: Address;
  freezeVotingErc721MasterCopy: Address;
  freezeVotingMultisigMasterCopy: Address;

  votesErc20MasterCopy: Address;
  votesErc20LockableMasterCopy?: Address;
  votesERC20StakedV1MasterCopy?: Address;

  claimErc20MasterCopy: Address;

  daoAutonomousAdminV1MasterCopy: Address;

  paymaster: {
    daoPaymasterV1MasterCopy: Address;
    linearERC20VotingV1ValidatorV1: Address;
    linearERC721VotingV1ValidatorV1: Address;
  };

  keyValuePairs: Address;

  daoRolesCreationModule: Address;
  daoRolesModificationModule: Address;
  daoSablierStreamManagementModule: Address;

  rolesProtocol: Address;
  erc6551Registry: Address;
  rolesAccount1ofNMasterCopy: Address;
  rolesElectionsEligibilityMasterCopy: Address;
  sablierV2Batch: Address;
  sablierV2LockupDynamic: Address;
  sablierV2LockupTranched: Address;
  sablierV2LockupLinear: Address;
  disperse: Address;
};

// Base type containing properties common to all network configs
type NetworkConfigBase = {
  order: number;
  chain: Chain;
  rpcEndpoint: string;
  safeBaseURL: string;
  etherscanBaseURL: string;
  etherscanAPIUrl: string;
  addressPrefix: NetworkPrefix;
  nativeTokenIcon: string;
  isENSSupported: boolean;
  daoSubgraph: TheGraphConfig;
  sablierSubgraph: TheGraphConfig;
  moralis: {
    chainSupported: boolean;
    deFiSupported: boolean;
  };
  staking: {
    lido?: {
      stETHContractAddress: Address;
      rewardsAddress: Address;
      withdrawalQueueContractAddress: Address;
    };
  };
  createOptions: GovernanceType[];
  stablecoins: {
    usdc: Address;
  };
};

// Type for networks *with* Account Abstraction
type NetworkConfigWithAA = NetworkConfigBase & {
  contracts: ContractsBase & {
    // accountAbstraction is REQUIRED here
    accountAbstraction: {
      entryPointv07: Address;
      lightAccountFactory: Address;
    };
  };
  // bundlerMinimumStake is REQUIRED here
  bundlerMinimumStake: bigint;
};

// Type for networks *without* Account Abstraction
type NetworkConfigWithoutAA = NetworkConfigBase & {
  contracts: ContractsBase & {
    // accountAbstraction is OPTIONAL and UNDEFINED here
    accountAbstraction?: undefined;
  };
  // bundlerMinimumStake is OPTIONAL and UNDEFINED here
  bundlerMinimumStake?: undefined;
};

// The final NetworkConfig is a union of the two possibilities
export type NetworkConfig = NetworkConfigWithAA | NetworkConfigWithoutAA;
