import { legacy } from '@luxdao/contracts';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { erc721Abi, getContract, Hex, toHex } from 'viem';
import { useAccount } from 'wagmi';
import useSnapshotProposal from '../../../../hooks/DAO/loaders/snapshot/useSnapshotProposal';
import useUserERC721VotingTokens from '../../../../hooks/DAO/proposal/useUserERC721VotingTokens';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../../../hooks/useNetworkPublicClient';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import {
  GovernorGovernance,
  GovernorProposal,
  ExtendedSnapshotProposal,
  FractalProposal,
  GovernanceType,
  MultisigProposal,
} from '../../../../types';

interface IVoteContext {
  canVote: boolean;
  canVoteLoading: boolean;
  hasVoted: boolean;
  hasVotedLoading: boolean;
}

const VoteContext = createContext<IVoteContext>({
  canVote: false,
  canVoteLoading: false,
  hasVoted: false,
  hasVotedLoading: false,
});

export const useVoteContext = () => {
  const voteContext = useContext(VoteContext);
  return voteContext;
};

export function VoteContextProvider({
  proposal,
  children,
  extendedSnapshotProposal,
}: {
  proposal: FractalProposal;
  extendedSnapshotProposal?: ExtendedSnapshotProposal;
  children: ReactNode;
}) {
  const [canVote, setCanVote] = useState(false);
  const [canVoteLoading, setCanVoteLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [hasVotedLoading, setHasVotedLoading] = useState(false);
  const { daoKey } = useCurrentDAOKey();
  const {
    governance,
    node: { safe },
  } = useDAOStore({ daoKey });
  const userAccount = useAccount();
  const { loadVotingWeight, snapshotProposal } = useSnapshotProposal(proposal);
  const { remainingTokenIds } = useUserERC721VotingTokens(null, proposal.proposalId, true);
  const publicClient = useNetworkPublicClient();

  const getHasVoted = useCallback(() => {
    setHasVotedLoading(true);
    if (snapshotProposal) {
      setHasVoted(
        !!extendedSnapshotProposal &&
          !!extendedSnapshotProposal.votes.find(vote => vote.voter === userAccount.address),
      );
    } else if (governance.isGovernor) {
      const governorProposal = proposal as GovernorProposal;
      if (governorProposal?.votes) {
        setHasVoted(!!governorProposal?.votes.find(vote => vote.voter === userAccount.address));
      }
    } else {
      const safeProposal = proposal as MultisigProposal;
      setHasVoted(
        !!safeProposal.confirmations?.find(
          confirmation => confirmation.owner === userAccount.address,
        ),
      );
    }
    setHasVotedLoading(false);
  }, [
    governance.isGovernor,
    snapshotProposal,
    proposal,
    userAccount.address,
    extendedSnapshotProposal,
  ]);

  const erc721VotingWeight = useCallback(async () => {
    const account = userAccount.address;
    const governorGovernance = governance as GovernorGovernance;
    if (!account || !governorGovernance.erc721Tokens) {
      return 0n;
    }
    const userVotingWeight = (
      await Promise.all(
        governorGovernance.erc721Tokens.map(async ({ address, votingWeight }) => {
          const tokenContract = getContract({
            abi: erc721Abi,
            address: address,
            client: publicClient,
          });
          const userBalance = await tokenContract.read.balanceOf([account]);
          return userBalance * votingWeight;
        }),
      )
    ).reduce((prev, curr) => prev + curr, 0n);
    return userVotingWeight;
  }, [governance, publicClient, userAccount.address]);

  const getCanVote = useCallback(
    async (remainingTokenIdsLength: number) => {
      setCanVoteLoading(true);
      let newCanVote = false;
      if (userAccount.address) {
        if (snapshotProposal) {
          const votingWeightData = await loadVotingWeight();
          newCanVote = votingWeightData.votingWeight >= 1;
        } else if (governance.type === GovernanceType.GOVERNOR_ERC20) {
          const governorProposal = proposal as GovernorProposal;
          const ozLinearVotingContract = getContract({
            abi: legacy.abis.LinearERC20Voting,
            address: governorProposal.votingStrategy,
            client: publicClient,
          });
          const votingWeight = await ozLinearVotingContract.read.getVotingWeight([
            userAccount.address,
            Number(proposal.proposalId),
          ]);
          newCanVote = votingWeight > 0n;
        } else if (governance.type === GovernanceType.GOVERNOR_ERC721) {
          const votingWeight = await erc721VotingWeight();
          newCanVote = votingWeight > 0n && remainingTokenIdsLength > 0;
        } else if (governance.type === GovernanceType.MULTISIG) {
          newCanVote = !!safe?.owners.includes(userAccount.address);
        } else {
          newCanVote = false;
        }
      }

      if (canVote !== newCanVote) {
        setCanVote(newCanVote);
      }
      setCanVoteLoading(false);
    },
    [
      userAccount.address,
      publicClient,
      canVote,
      snapshotProposal,
      governance.type,
      loadVotingWeight,
      safe?.owners,
      proposal,
      erc721VotingWeight,
    ],
  );

  const connectedUserRef = useRef<Hex>();
  useEffect(() => {
    const refValue = toHex(`${userAccount.address}-${remainingTokenIds.length}`);
    const isUserRefCurrent = connectedUserRef.current === refValue;
    if (!isUserRefCurrent) {
      connectedUserRef.current = refValue;
      getCanVote(remainingTokenIds.length);
    }
  }, [getCanVote, userAccount.address, remainingTokenIds.length]);

  const connectedUserVotingWeightRef = useRef<string>();
  useEffect(() => {
    const governorProposal = proposal as GovernorProposal;
    const refValue = `${governorProposal.proposalId}-${userAccount.address}`;
    const isRefValueCurrent = connectedUserVotingWeightRef.current === refValue;
    if (!isRefValueCurrent) {
      getHasVoted();
    }
  }, [getHasVoted, proposal, userAccount.address]);

  const memoizedValue = useMemo(() => {
    return {
      canVote,
      canVoteLoading,
      hasVoted,
      hasVotedLoading,
    };
  }, [canVote, canVoteLoading, hasVoted, hasVotedLoading]);

  return <VoteContext.Provider value={memoizedValue}>{children}</VoteContext.Provider>;
}
