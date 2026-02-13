import { legacy, addresses } from '@luxdao/contracts';
import {
  getCompatibilityFallbackHandlerDeployment,
  getMultiSendCallOnlyDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
} from '@safe-global/safe-deployments';
import { Chain } from 'wagmi/chains';
import { GovernanceType } from '../../../types';
import { NetworkConfig } from '../../../types/network';
import {
  getSafeContractDeploymentAddress,
  getAddressFromContractDeploymentInfo,
} from './utils';

const SAFE_VERSION = '1.3.0';

// Define local development chain (Hardhat/Foundry default)
const localhost: Chain = {
  id: 1337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Local Explorer', url: 'http://localhost:8545' },
  },
  testnet: true,
};

const chain = localhost;
// Use localhost addresses for local development
const a = legacy.addresses?.localhost || addresses?.localhost || {};

export const localhostConfig: NetworkConfig = {
  order: 100,
  chain,
  rpcEndpoint: 'http://127.0.0.1:8545',
  safeBaseURL: '',
  etherscanBaseURL: '',
  etherscanAPIUrl: '',
  addressPrefix: 'local',
  nativeTokenIcon: '/images/coin-icon-eth.svg',
  isENSSupported: false,
  daoSubgraph: {
    space: 0,
    slug: 'local',
    id: 'local',
  },
  sablierSubgraph: {
    space: 0,
    slug: 'local',
    id: 'local',
  },
  contracts: {
    // Safe contracts - deployed to localhost via deploy-all.ts
    gnosisSafeL2Singleton: '0x04c89607413713ec9775e14b954286519d836fef',
    gnosisSafeProxyFactory: '0x4c4a2f8c81640e47606d3fd77b353e87ba015584',
    compatibilityFallbackHandler: '0x21df544947ba3e8b3c32561399e88b52dc8b2823',
    multiSendCallOnly: '0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2',

    moduleProxyFactory: '0xd8a5a9b31c3c0232e196d518e89fd8bf83acad43',

    // Voting strategies - deployed to localhost
    linearVotingErc20MasterCopy: '0x8198f5d8f8cffe8f9c413d98a0a55aeb8ab9fbb7',
    linearVotingErc20RolesWhitelistingMasterCopy: '0x8198f5d8f8cffe8f9c413d98a0a55aeb8ab9fbb7',
    linearVotingErc721MasterCopy: '0x0355b7b8cb128fa5692729ab3aaa199c1753f726',
    linearVotingErc721RolesWhitelistingMasterCopy: '0x0355b7b8cb128fa5692729ab3aaa199c1753f726',

    linearVotingErc20V1MasterCopy: '0x8198f5d8f8cffe8f9c413d98a0a55aeb8ab9fbb7',
    linearVotingErc20RolesWhitelistingV1MasterCopy: '0x8198f5d8f8cffe8f9c413d98a0a55aeb8ab9fbb7',
    linearVotingErc721V1MasterCopy: '0x0355b7b8cb128fa5692729ab3aaa199c1753f726',
    linearVotingErc721RolesWhitelistingV1MasterCopy: '0x0355b7b8cb128fa5692729ab3aaa199c1753f726',

    // Governor contracts - deployed to localhost
    moduleGovernorMasterCopy: '0xdc11f7e700a4c898ae5caddb1082cffa76512add',
    moduleFractalMasterCopy: '0x51a1ceb83b83f1985a81c295d1ff28afef186e02',

    // Freeze contracts - deployed to localhost
    freezeGuardGovernorMasterCopy: '0x202cce504e04bed6fc0521238ddf04bc9e8e15ab',
    freezeGuardMultisigMasterCopy: '0xf4b146fba71f41e0592668ffbf264f1d186b2ca8',

    freezeVotingErc20MasterCopy: '0x172076e0166d1f9cc711c77adf8488051744980c',
    freezeVotingErc721MasterCopy: '0x172076e0166d1f9cc711c77adf8488051744980c',
    freezeVotingMultisigMasterCopy: '0x4ee6ecad1c2dae9f525404de8555724e3c35d07b',

    // Token contracts - deployed to localhost
    votesErc20MasterCopy: '0xbec49fa140acaa83533fb00a2bb19bddd0290f25',
    votesErc20LockableMasterCopy: '0xbec49fa140acaa83533fb00a2bb19bddd0290f25',
    votesERC20StakedV1MasterCopy: '0xd84379ceae14aa33c123af12424a37803f885889',

    claimErc20MasterCopy: '0x46b142dd1e924fab83ecc3c08e4d46e82f005e0e',

    // Autonomous admin - deployed to localhost
    daoAutonomousAdminV1MasterCopy: '0x2b0d36facd61b71cc05ab8f3d2355ec3631c0dd5',

    paymaster: {
      daoPaymasterV1MasterCopy: '0x0000000000000000000000000000000000000000',
      linearERC20VotingV1ValidatorV1: '0x0000000000000000000000000000000000000000',
      linearERC721VotingV1ValidatorV1: '0x0000000000000000000000000000000000000000',
    },

    keyValuePairs: '0xfbc22278a96299d91d41c453234d97b4f5eb9b2d',

    daoRolesCreationModule: '0x0000000000000000000000000000000000000000',
    daoRolesModificationModule: '0x0000000000000000000000000000000000000000',
    daoSablierStreamManagementModule: '0x0000000000000000000000000000000000000000',

    rolesProtocol: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    erc6551Registry: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    rolesAccount1ofNMasterCopy: '0x0000000000000000000000000000000000000000',
    rolesElectionsEligibilityMasterCopy: '0x0000000000000000000000000000000000000000',
    sablierV2Batch: '0x0000000000000000000000000000000000000000',
    sablierV2LockupDynamic: '0x0000000000000000000000000000000000000000',
    sablierV2LockupTranched: '0x0000000000000000000000000000000000000000',
    sablierV2LockupLinear: '0x0000000000000000000000000000000000000000',
    disperse: '0x0000000000000000000000000000000000000000',

    accountAbstraction: {
      entryPointv07: '0x0000000000000000000000000000000000000000',
      lightAccountFactory: '0x0000000000000000000000000000000000000000',
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
    usdc: '0x0000000000000000000000000000000000000000',
  },
};

export default localhostConfig;