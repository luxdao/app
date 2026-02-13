import { TokenInfoResponse, TransferResponse } from '@safe-global/api-kit';
import { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types';
import { Address } from 'viem';
import {
  ERC20LockedTokenData,
  ERC721TokenData,
  StakedTokenExtraData,
  VotesTokenData,
} from './account';
import { DAOOwnedEntities } from './daoGeneral';
import { FreezeGuardType, FreezeVotingType } from './daoGovernance';
import { GovernorProposal, MultisigProposal, ProposalData } from './daoProposal';
import { DefiBalance, NFTBalance, TokenBalance, TokenEventType, TransferType } from './daoTreasury';
import { ProposalTemplate } from './proposalBuilder';
import { SafeInfoResponseWithGuard } from './safeGlobal';
import { SnapshotProposal } from './snapshot';

/**
 * The possible states of a DAO proposal, for both Token Voting (Governor) and Multisignature
 * (Safe) governance, as well as Snapshot specific states.
 *
 * @note it is required that Governor-specific states match those on the Governor contracts,
 * including casing and ordering.  States not specific to Governor must be placed at the end
 * of this enum.
 */
export enum FractalProposalState {
  /**
   * Proposal is created and can be voted on.  This is the initial state of all
   * newly created proposals.
   *
   * Governor / Multisig (all proposals).
   */
  ACTIVE = 'stateActive',

  /**
   * A proposal that passes enters the `TIMELOCKED` state, during which it cannot yet be executed.
   * This is to allow time for token holders to potentially exit their position, as well as parent DAOs
   * time to initiate a freeze, if they choose to do so. A proposal stays timelocked for the duration
   * of its `timelockPeriod`.
   *
   * Governor (all) and multisig *subDAO* proposals.
   */
  TIMELOCKED = 'stateTimeLocked',

  /**
   * Following the `TIMELOCKED` state, a passed proposal becomes `EXECUTABLE`, and can then finally
   * be executed on chain.
   *
   * Governor / Multisig (all proposals).
   */
  EXECUTABLE = 'stateExecutable',

  /**
   * The final state for a passed proposal.  The proposal has been executed on the blockchain.
   *
   * Governor / Multisig (all proposals).
   */
  EXECUTED = 'stateExecuted',

  /**
   * A passed proposal which is not executed before its `executionPeriod` has elapsed will be `EXPIRED`,
   * and can no longer be executed.
   *
   * Governor (all) and multisig *subDAO* proposals.
   */
  EXPIRED = 'stateExpired',

  /**
   * A failed proposal (as defined by its [BaseStrategy](../BaseStrategy.md) `isPassed` function). For a basic strategy,
   * this would mean it received more NO votes than YES or did not achieve quorum.
   *
   * Governor only.
   */
  FAILED = 'stateFailed',

  /**
   * Proposal fails due to a proposal being executed with the same nonce.
   * A multisig proposal is off-chain, and is signed with a specific nonce.
   * If a proposal with a nonce is executed, any proposal with the same or lesser
   * nonce will be impossible to execute, reguardless of how many signers it has.
   *
   * Multisig only.
   */
  REJECTED = 'stateRejected',

  /**
   * Quorum (or signers) is reached, the proposal can be 'timelocked' for execution.
   * Anyone can move the state from Timelockable to TimeLocked via a transaction.
   *
   * Multisig subDAO only, Governor DAOs move from ACTIVE to TIMELOCKED automatically.
   */
  TIMELOCKABLE = 'stateTimelockable',

  /**
   * Any Safe is able to have modules attached (e.g. Governor), which can act essentially as a backdoor,
   * executing transactions without needing the required signers.
   *
   * Safe Module 'proposals' in this sense are single state proposals that are already executed.
   *
   * This is a rare case, but third party modules could potentially generate this state so we allow
   * for badges to properly label this case in the UI.
   *
   * Third party Safe module transactions only.
   */
  MODULE = 'stateModule',

  /**
   * The proposal is pending, meaning it has been created, but voting has not yet begun. This state
   * has nothing to do with Fractal, and is used for Snapshot proposals only, which appear if the
   * DAO's snapshotENS is set.
   */
  PENDING = 'statePending',

  /**
   * The proposal is closed, and no longer able to be signed. This state has nothing to do with Fractal,
   * and is used for Snapshot proposals only, which appear if the DAO's snapshotENS is set.
   */
  CLOSED = 'stateClosed',
}

export type GnosisSafe = {
  // replaces SafeInfoResponseWithGuard and SafeWithNextNonce
  address: Address;
  owners: Address[];
  nonce: number;
  nextNonce: number;
  threshold: number;
  modulesAddresses: Address[];
  guard: Address | null;
};

export interface DAOSubgraph {
  // replaces Part of DaoInfo
  daoName: string | null;
  parentAddress: Address | null;
  childAddresses: Address[];
  daoSnapshotENS: string | null;
  proposalTemplatesHash: string | null;
  gasTankAddress?: Address;
}

// @todo should we add other DAO Module types here?
export enum DAOModuleType {
  // replaces FractalModuleType
  GOVERNOR, // Token Module
  FRACTAL, // CHILD GOVERNANCE MODULE
  UNKNOWN, // UNKNOWN MODULE
}

// @todo better typing here, SUBGRAPH has DAO type name,
export interface IDAO {
  // replaces DaoInfo
  safe: GnosisSafe | null;
  subgraphInfo: DAOSubgraph | null;
  modules: DAOModule[] | null;
}

export interface GovernanceActivity extends ActivityBase {
  proposer: Address | null;
  state: FractalProposalState | null;
  proposalId: string;
  targets: Address[];
  data?: ProposalData;
  title?: string;
}

export interface ActivityBase {
  eventDate: Date;
  transaction?: ActivityTransactionType;
  transactionHash: string;
}

export type ActivityTransactionType = SafeMultisigTransactionResponse;

export interface ITokenAccount {
  userBalance?: bigint;
  userBalanceString: string | undefined;
  delegatee: string | undefined;
  votingWeight?: bigint;
  votingWeightString: string | undefined;
}

export interface FractalStore extends Fractal {}

export interface Fractal {
  guard: FreezeGuard;
  guardAccountData: GuardAccountData;
  governance: FractalGovernance;
  treasury: DAOTreasury;
  governanceContracts: FractalGovernanceContracts;
  guardContracts: FractalGuardContracts;
}

export enum FractalTokenType {
  erc20 = 'ERC20',
  erc721 = 'ERC721',
}

export type FractalVotingStrategy = {
  address: Address;
  type: FractalTokenType;
  withWhitelist: boolean;
  version?: number;
};

export type FractalGovernanceContracts = {
  linearVotingErc20Address?: Address;
  linearVotingErc20WithRolesWhitelistingAddress?: Address;
  linearVotingErc721Address?: Address;
  linearVotingErc721WithRolesWhitelistingAddress?: Address;
  moduleGovernorAddress?: Address;
  votesTokenAddress?: Address;
  lockReleaseAddress?: Address;
  isLoaded: boolean;
  strategies: FractalVotingStrategy[];
};

export type SafeWithNextNonce = SafeInfoResponseWithGuard & { nextNonce: number };

export type DaoHierarchyStrategyType = 'ERC-20' | 'ERC-721' | 'MULTISIG';
export interface DaoHierarchyInfo {
  safeAddress: Address;
  daoName: string | null;
  daoSnapshotENS: string | null;
  parentAddress: Address | null;
  childAddresses: Address[];
  proposalTemplatesHash: string | null;
  modules: DAOModule[];
  votingStrategies: DaoHierarchyStrategyType[];
}

export interface DAOModule {
  moduleAddress: Address;
  moduleType: FractalModuleType;
}

export enum FractalModuleType {
  GOVERNOR,
  FRACTAL,
  UNKNOWN,
}

export interface FractalGuardContracts {
  freezeGuardContractAddress?: Address;
  freezeVotingContractAddress?: Address;
  freezeGuardType: FreezeGuardType | null;
  freezeVotingType: FreezeVotingType | null;
  isGuardLoaded?: boolean;
}

export interface FreezeGuard {
  freezeVotesThreshold: bigint | null; // Number of freeze votes required to activate a freeze
  freezeProposalCreatedTime: bigint | null; // Block number the freeze proposal was created at
  freezeProposalVoteCount: bigint | null; // Number of accrued freeze votes
  freezeProposalPeriod: bigint | null; // Number of blocks a freeze proposal has to succeed
  freezePeriod: bigint | null; // Number of blocks a freeze lasts, from time of freeze proposal creation
  isFrozen: boolean;
}

export interface GuardAccountData {
  userHasFreezeVoted: boolean;
  userHasVotes: boolean;
}

export type TransferWithTokenInfo = TransferResponse & { tokenInfo: TokenInfoResponse };
export interface DAOTreasury {
  totalUsdValue: number;
  assetsFungible: TokenBalance[];
  assetsNonFungible: NFTBalance[];
  assetsDeFi: DefiBalance[];
  transfers: TransferDisplayData[] | null;
}

export type FractalGovernance = GovernorGovernance | DAOGovernance | SafeMultisigGovernance;

export interface GovernorGovernance extends Governance {
  votingStrategy: VotingStrategyGovernor | undefined;
  votesToken: VotesTokenData | undefined;
  erc721Tokens?: ERC721TokenData[];
}

export interface DAOGovernance extends GovernorGovernance {
  lockedVotesToken?: VotesTokenData;
}
export interface SafeMultisigGovernance extends Governance {
  // This is here so that FractalGovernance can be used freely without
  // having to cast `as GovernorGovernance` in order to access `votesToken`.
  // `SafeMultisigGovernance` doesn't have this, so `undefined` is its only possible value.
  votesToken?: undefined;
}

export type Governance = {
  type?: GovernanceType;
  loadingProposals: boolean;
  allProposalsLoaded: boolean;
  proposals: FractalProposal[] | null;
  pendingProposals: string[] | null;
  proposalTemplates?: ProposalTemplate[] | null;
  tokenClaimContractAddress?: Address;
  isGovernor: boolean;
  erc20Token: ERC20LockedTokenData | undefined;
  stakedToken: StakedTokenExtraData | undefined;
} & DAOOwnedEntities;

export interface VotingStrategyGovernor extends VotingStrategy {
  strategyType?: VotingStrategyType;
}

interface BIFormattedPair {
  value: bigint;
  formatted?: string;
}

export interface VotingStrategy<Type = BIFormattedPair> {
  votingPeriod?: Type;
  quorumPercentage?: Type;
  quorumThreshold?: Type;
  timeLockPeriod?: Type;
  executionPeriod?: Type;
  proposerThreshold?: Type;
}

export enum GovernanceType {
  MULTISIG = 'labelMultisigGov',
  GOVERNOR_ERC20 = 'labelGovernorErc20Gov',
  GOVERNOR_ERC721 = 'labelGovernorErc721Gov',
}

export enum VotingStrategyType {
  LINEAR_ERC20 = 'labelLinearErc20',
  LINEAR_ERC20_ROLES_WHITELISTING = 'labelLinearErc20WithWhitelisting',
  LINEAR_ERC721 = 'labelLinearErc721',
  LINEAR_ERC721_ROLES_WHITELISTING = 'labelLinearErc721WithWhitelisting',
}

export type FractalProposal = GovernorProposal | MultisigProposal | SnapshotProposal;

export interface TransferDisplayData {
  eventType: TokenEventType;
  transferType: TransferType;
  executionDate: string;
  image: string;
  assetDisplay: string;
  fullCoinTotal: string | undefined;
  transferAddress: string;
  isLast: boolean;
  transactionHash: string;
  tokenId: string;
  tokenInfo?: TokenInfoResponse;
}

export enum SortBy {
  Newest = 'newest',
  Oldest = 'oldest',
}
