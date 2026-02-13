import { useCallback } from 'react';
import { Address } from 'viem';
import {
  GovernorProposal,
  DAOKey,
  ERC721ProposalVote,
  FractalProposalState,
  GaslessVotingDaoData,
  GovernanceType,
  ProposalVote,
  ProposalVotesSummary,
} from '../types';
import { useAccountListeners } from './listeners/account';
import { useGovernanceListeners } from './listeners/governance';
import { useKeyValuePairsListener } from './listeners/keyValuePairs';
import { useRolesStore } from './roles/useRolesStore';
import { useGlobalStore } from './store';

/**
 * useDAOStoreListener orchestrates communication between various real-time listeners and Global store.
 * Underlying listeners could get updates from whatever source(on-chain, WebSocket, etc.), which then would be reflected in the store.
 */
export const useDAOStoreListener = ({ daoKey }: { daoKey: DAOKey | undefined }) => {
  const {
    setGovernanceAccountData,
    setGovernanceLockReleaseAccountData,
    getDaoNode,
    getGovernance,
    getGuard,
    setProposal,
    setProposalVote,
    updateProposalState,
    setGuardAccountData,
    setGaslessVotingData,
  } = useGlobalStore();

  const { setHatKeyValuePairData } = useRolesStore();

  const governance = daoKey ? getGovernance(daoKey) : undefined;
  const lockedVotesTokenAddress = governance?.lockReleaseAddress;
  const votesTokenAddress = governance?.votesTokenAddress;
  const moduleGovernorAddress = governance?.moduleGovernorAddress;
  const erc20StrategyAddress =
    governance?.linearVotingErc20Address ||
    governance?.linearVotingErc20WithRolesWhitelistingAddress;
  const erc721StrategyAddress =
    governance?.linearVotingErc721Address ||
    governance?.linearVotingErc721WithRolesWhitelistingAddress;

  const node = daoKey ? getDaoNode(daoKey) : undefined;
  const parentSafeAddress = node?.subgraphInfo?.parentAddress;

  const guard = daoKey ? getGuard(daoKey) : undefined;
  const governorGuardAddress =
    governance?.type === GovernanceType.GOVERNOR_ERC20 ||
    governance?.type === GovernanceType.GOVERNOR_ERC721
      ? guard?.freezeGuardContractAddress
      : undefined;
  const multisigGuardAddress =
    governance?.type === GovernanceType.MULTISIG ? guard?.freezeGuardContractAddress : undefined;
  const freezeVotingType = guard?.freezeVotingType;
  const freezeVotingAddress = guard?.freezeVotingContractAddress;
  const freezeProposalCreatedTime = guard?.freezeProposalCreatedTime;
  const freezeProposalPeriod = guard?.freezeProposalPeriod;
  const freezePeriod = guard?.freezePeriod;

  const onProposalCreated = useCallback(
    (proposal: GovernorProposal) => {
      if (daoKey) {
        setProposal(daoKey, proposal);
      }
    },
    [daoKey, setProposal],
  );

  const onProposalExecuted = useCallback(
    (proposalId: string) => {
      if (daoKey) {
        updateProposalState(daoKey, proposalId, FractalProposalState.EXECUTED);
      }
    },
    [daoKey, updateProposalState],
  );

  const onGovernanceAccountDataUpdated = useCallback(
    (governanceAccountData: { balance: bigint; delegatee: Address }) => {
      if (daoKey) {
        setGovernanceAccountData(daoKey, governanceAccountData);
      }
    },
    [daoKey, setGovernanceAccountData],
  );

  const onLockReleaseAccountDataUpdated = useCallback(
    (lockReleaseAccountData: { balance: bigint; delegatee: Address }) => {
      if (daoKey) {
        setGovernanceLockReleaseAccountData(daoKey, lockReleaseAccountData);
      }
    },
    [daoKey, setGovernanceLockReleaseAccountData],
  );

  const onERC20VoteCreated = useCallback(
    (proposalId: string, votesSummary: ProposalVotesSummary, vote: ProposalVote) => {
      if (daoKey) {
        setProposalVote(daoKey, proposalId, votesSummary, vote);
      }
    },
    [daoKey, setProposalVote],
  );

  const onERC721VoteCreated = useCallback(
    (proposalId: string, votesSummary: ProposalVotesSummary, vote: ERC721ProposalVote) => {
      if (daoKey) {
        setProposalVote(daoKey, proposalId, votesSummary, vote);
      }
    },
    [daoKey, setProposalVote],
  );

  useGovernanceListeners({
    lockedVotesTokenAddress,
    votesTokenAddress,
    moduleGovernorAddress,
    erc20StrategyAddress,
    erc721StrategyAddress,
    onProposalCreated,
    onProposalExecuted,
    onGovernanceAccountDataUpdated,
    onLockReleaseAccountDataUpdated,
    onERC20VoteCreated,
    onERC721VoteCreated,
  });

  const onGuardAccountDataLoaded = useCallback(
    (guardAccountData: { userHasFreezeVoted: boolean; userHasVotes: boolean }) => {
      if (daoKey) {
        setGuardAccountData(daoKey, guardAccountData);
      }
    },
    [daoKey, setGuardAccountData],
  );

  const onGovernanceAccountDataLoaded = useCallback(
    (accountData: { balance: bigint; delegatee: Address }) => {
      if (daoKey) {
        setGovernanceAccountData(daoKey, accountData);
      }
    },
    [daoKey, setGovernanceAccountData],
  );

  const onGovernanceLockReleaseAccountDataLoaded = useCallback(
    (accountData: { balance: bigint; delegatee: Address }) => {
      if (daoKey) {
        setGovernanceLockReleaseAccountData(daoKey, accountData);
      }
    },
    [daoKey, setGovernanceLockReleaseAccountData],
  );

  useAccountListeners({
    votesTokenAddress,
    governorGuardAddress,
    multisigGuardAddress,
    freezeVotingType: freezeVotingType !== null ? freezeVotingType : undefined,
    freezeVotingAddress: freezeVotingAddress !== null ? freezeVotingAddress : undefined,
    freezeProposalCreatedTime:
      freezeProposalCreatedTime !== null ? freezeProposalCreatedTime : undefined,
    freezeProposalPeriod: freezeProposalPeriod !== null ? freezeProposalPeriod : undefined,
    freezePeriod: freezePeriod !== null ? freezePeriod : undefined,
    lockReleaseAddress: lockedVotesTokenAddress,
    parentSafeAddress: parentSafeAddress || undefined,
    onGuardAccountDataLoaded,
    onGovernanceAccountDataLoaded,
    onGovernanceLockReleaseAccountDataLoaded,
  });

  const onRolesDataFetched = useCallback(
    ({
      contextChainId,
      rolesTreeId,
      streamIdsToRoleIds,
    }: {
      contextChainId: number;
      rolesTreeId: number | null | undefined;
      streamIdsToRoleIds: { roleId: bigint; streamId: string }[];
    }) => {
      // TODO: Implement setting to global store in scope of ENG-632
      if (daoKey) {
        setHatKeyValuePairData({
          daoKey,
          contextChainId,
          rolesTreeId,
          streamIdsToRoleIds,
        });
      }
    },
    [setHatKeyValuePairData, daoKey],
  );

  const onGaslessVotingDataFetched = useCallback(
    (gasslesVotingData: GaslessVotingDaoData) => {
      if (daoKey) {
        setGaslessVotingData(daoKey, gasslesVotingData);
      }
    },
    [daoKey, setGaslessVotingData],
  );

  useKeyValuePairsListener({
    safeAddress: node?.safe?.address,
    onRolesDataFetched,
    onGaslessVotingDataFetched,
  });
};
