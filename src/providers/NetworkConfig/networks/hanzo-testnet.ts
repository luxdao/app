import { Chain } from 'wagmi/chains';
import { GovernanceType } from '../../../types';
import { NetworkConfig } from '../../../types/network';

const ZERO = '0x0000000000000000000000000000000000000000';

// Define Hanzo Network Testnet chain
const hanzoTestnet: Chain = {
  id: 36962,
  name: 'Hanzo Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HANZO',
    symbol: 'HANZO',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-test.hanzo.ai'],
    },
    public: {
      http: ['https://rpc-test.hanzo.ai'],
    },
  },
  blockExplorers: {
    default: { name: 'Hanzo Explorer', url: 'https://explorer-test.hanzo.ai' },
  },
  testnet: true,
};

const chain = hanzoTestnet;

export const hanzoTestnetConfig: NetworkConfig = {
  order: 101,
  chain,
  rpcEndpoint: 'https://rpc-test.hanzo.ai',
  safeBaseURL: '',
  etherscanBaseURL: 'https://explorer-test.hanzo.ai',
  etherscanAPIUrl: '',
  addressPrefix: 'hanzo-test',
  nativeTokenIcon: '/images/coin-icon-hanzo.svg',
  isENSSupported: false,
  daoSubgraph: {
    space: 0,
    slug: 'hanzo-testnet',
    id: 'hanzo-testnet',
  },
  sablierSubgraph: {
    space: 0,
    slug: 'hanzo-testnet',
    id: 'hanzo-testnet',
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

export default hanzoTestnetConfig;
