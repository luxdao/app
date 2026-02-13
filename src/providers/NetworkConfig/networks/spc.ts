import { Chain } from 'wagmi/chains';
import { GovernanceType } from '../../../types';
import { NetworkConfig } from '../../../types/network';

const ZERO = '0x0000000000000000000000000000000000000000';

// Define SPC Network chain
const spc: Chain = {
  id: 36911,
  name: 'SPC Network',
  nativeCurrency: {
    decimals: 18,
    name: 'SPC',
    symbol: 'SPC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.spc.network'],
    },
    public: {
      http: ['https://rpc.spc.network'],
    },
  },
  blockExplorers: {
    default: { name: 'SPC Explorer', url: 'https://explorer.spc.network' },
  },
  testnet: false,
};

const chain = spc;

export const spcConfig: NetworkConfig = {
  order: 5,
  chain,
  rpcEndpoint: 'https://rpc.spc.network',
  safeBaseURL: '',
  etherscanBaseURL: 'https://explorer.spc.network',
  etherscanAPIUrl: '',
  addressPrefix: 'spc',
  nativeTokenIcon: '/images/coin-icon-spc.svg',
  isENSSupported: false,
  daoSubgraph: {
    space: 0,
    slug: 'spc',
    id: 'spc',
  },
  sablierSubgraph: {
    space: 0,
    slug: 'spc',
    id: 'spc',
  },
  contracts: {
    gnosisSafeL2Singleton: ZERO,
    gnosisSafeProxyFactory: ZERO,
    compatibilityFallbackHandler: ZERO,
    multiSendCallOnly: ZERO,
    moduleProxyFactory: ZERO,
    linearVotingErc20MasterCopy: ZERO,
    linearVotingErc20RolesWhitelistingMasterCopy: ZERO,
    linearVotingErc721MasterCopy: ZERO,
    linearVotingErc721RolesWhitelistingMasterCopy: ZERO,
    linearVotingErc20V1MasterCopy: ZERO,
    linearVotingErc20RolesWhitelistingV1MasterCopy: ZERO,
    linearVotingErc721V1MasterCopy: ZERO,
    linearVotingErc721RolesWhitelistingV1MasterCopy: ZERO,
    moduleGovernorMasterCopy: ZERO,
    moduleFractalMasterCopy: ZERO,
    freezeGuardGovernorMasterCopy: ZERO,
    freezeGuardMultisigMasterCopy: ZERO,
    freezeVotingErc20MasterCopy: ZERO,
    freezeVotingErc721MasterCopy: ZERO,
    freezeVotingMultisigMasterCopy: ZERO,
    votesErc20MasterCopy: ZERO,
    votesErc20LockableMasterCopy: ZERO,
    votesERC20StakedV1MasterCopy: ZERO,
    claimErc20MasterCopy: ZERO,
    daoAutonomousAdminV1MasterCopy: ZERO,
    paymaster: {
      daoPaymasterV1MasterCopy: ZERO,
      linearERC20VotingV1ValidatorV1: ZERO,
      linearERC721VotingV1ValidatorV1: ZERO,
    },
    keyValuePairs: ZERO,
    daoRolesCreationModule: ZERO,
    daoRolesModificationModule: ZERO,
    daoSablierStreamManagementModule: ZERO,
    rolesProtocol: ZERO,
    erc6551Registry: ZERO,
    rolesAccount1ofNMasterCopy: ZERO,
    rolesElectionsEligibilityMasterCopy: ZERO,
    sablierV2Batch: ZERO,
    sablierV2LockupDynamic: ZERO,
    sablierV2LockupTranched: ZERO,
    sablierV2LockupLinear: ZERO,
    disperse: ZERO,
    accountAbstraction: {
      entryPointv07: ZERO,
      lightAccountFactory: ZERO,
    },
  },
  staking: {},
  moralis: {
    chainSupported: false,
    deFiSupported: false,
  },
  createOptions: [
    GovernanceType.MULTISIG,
    GovernanceType.GOVERNOR_ERC20,
    GovernanceType.GOVERNOR_ERC721,
  ],
  bundlerMinimumStake: 0n,
  stablecoins: {
    usdc: ZERO,
  },
};

export default spcConfig;
