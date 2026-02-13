import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { legacy } from '@luxdao/contracts';
import { Question } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { erc721Abi, getContract } from 'viem';
import { useAccount } from 'wagmi';
import { TOOLTIP_MAXW } from '../../constants/common';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import useBlockTimestamp from '../../hooks/utils/useBlockTimestamp';
import { useCanUserCreateProposal } from '../../hooks/utils/useCanUserSubmitProposal';
import { useDAOStore } from '../../providers/App/AppProvider';
import { GovernorGovernance, GovernorProposal, GovernanceType } from '../../types';
import { DEFAULT_DATE_TIME_FORMAT, formatCoin } from '../../utils/numberFormats';
import { AlertBanner } from '../ui/AlertBanner';
import { DAOTooltip } from '../ui/DAOTooltip';
import ContentBox from '../ui/containers/ContentBox';
import DisplayTransaction from '../ui/links/DisplayTransaction';
import EtherscanLink from '../ui/links/EtherscanLink';
import { InfoBoxLoader } from '../ui/loaders/InfoBoxLoader';
import InfoRow from '../ui/proposal/InfoRow';
import ProposalCreatedBy from '../ui/proposal/ProposalCreatedBy';
import Divider from '../ui/utils/Divider';
import { GovernorOrSnapshotProposalAction } from './ProposalActions/GovernorOrSnapshotProposalAction';
import { VoteContextProvider } from './ProposalVotes/context/VoteContext';

function ProposalDetailsSection({
  proposal,
  startBlockTimeStamp,
}: {
  proposal: GovernorProposal;
  startBlockTimeStamp: number;
}) {
  const { t } = useTranslation(['proposal', 'common', 'navigation']);
  const { eventDate, startBlock, deadlineMs, proposer, transactionHash } = proposal;

  return (
    <ContentBox
      containerBoxProps={{
        border: '1px solid',
        borderColor: 'color-neutral-900',
        borderRadius: '0.75rem',
        my: 0,
      }}
      title={t('proposalSummaryTitle')}
    >
      <Divider
        variant="darker"
        width="calc(100% + 4rem)"
        mx="-2rem"
        mt={2}
      />
      <Box mx={-2}>
        <InfoRow
          property={t('votingSystem')}
          value={t('singleSnapshotVotingSystem')}
        />
        <InfoRow
          property={t('proposalSummaryStartDate')}
          value={format(startBlockTimeStamp * 1000, DEFAULT_DATE_TIME_FORMAT)}
          tooltip={formatInTimeZone(startBlockTimeStamp * 1000, 'GMT', DEFAULT_DATE_TIME_FORMAT)}
        />
        <InfoRow
          property={t('proposalSummaryEndDate')}
          value={format(deadlineMs, DEFAULT_DATE_TIME_FORMAT)}
          tooltip={formatInTimeZone(deadlineMs, 'GMT', DEFAULT_DATE_TIME_FORMAT)}
        />
        <Flex
          marginTop={4}
          flexWrap="wrap"
          alignItems="center"
        >
          <Text
            color="color-neutral-300"
            w="full"
          >
            {t('snapshotTaken')}
          </Text>
          <EtherscanLink
            type="block"
            value={startBlock.toString()}
            pl={0}
            isTextLink
          >
            <Flex
              alignItems="center"
              justifyContent="space-between"
            >
              {format(eventDate, DEFAULT_DATE_TIME_FORMAT)}
            </Flex>
          </EtherscanLink>
        </Flex>
        <ProposalCreatedBy proposer={proposer} />
        {transactionHash && (
          <Flex
            marginTop={4}
            alignItems="center"
            flexWrap="wrap"
          >
            <Text
              color="color-neutral-300"
              w="full"
            >
              {t('transactionHash')}
            </Text>
            <DisplayTransaction txHash={transactionHash} />
          </Flex>
        )}
      </Box>
    </ContentBox>
  );
}

function ProposalVotingSection({
  proposal,
  governorGovernance,
  proposalVotingWeight,
}: {
  proposal: GovernorProposal;
  governorGovernance: GovernorGovernance;
  proposalVotingWeight: string;
}) {
  const { t } = useTranslation(['proposal']);
  const { address } = useAccount();
  const { votesToken, type, erc721Tokens, votingStrategy } = governorGovernance;

  const isERC20 = type === GovernanceType.GOVERNOR_ERC20;
  const isERC721 = type === GovernanceType.GOVERNOR_ERC721;

  if (
    (isERC20 && (!votesToken || !votesToken.totalSupply || !votingStrategy?.quorumPercentage)) ||
    (isERC721 && (!erc721Tokens || !votingStrategy?.quorumThreshold))
  ) {
    return (
      <Box mt={4}>
        <InfoBoxLoader />
      </Box>
    );
  }

  return (
    <ContentBox
      containerBoxProps={{
        border: '1px solid',
        borderColor: 'color-neutral-900',
        borderRadius: '0.75rem',
        py: 4,
      }}
    >
      {/* Voting Power */}
      <Flex
        flexWrap="wrap"
        flexDirection="column"
        alignItems="flex-start"
        mx={-2}
      >
        <Flex
          alignItems="center"
          gap={1}
        >
          <Text
            color="color-neutral-300"
            w="full"
          >
            {t('votingPower')}
          </Text>
          <DAOTooltip
            label={t('votingPowerTooltip')}
            placement="left"
            maxW={TOOLTIP_MAXW}
          >
            <Icon
              as={Question}
              color="color-neutral-300"
            />
          </DAOTooltip>
        </Flex>

        <Text
          color="color-green-400"
          mt={1}
        >
          {proposalVotingWeight}
        </Text>
      </Flex>

      {address && (
        <VoteContextProvider proposal={proposal}>
          <GovernorOrSnapshotProposalAction proposal={proposal} />
        </VoteContextProvider>
      )}
    </ContentBox>
  );
}
export function GovernorProposalSummary({ proposal }: { proposal: GovernorProposal }) {
  const { daoKey } = useCurrentDAOKey();
  const { governance } = useDAOStore({ daoKey });
  const governorGovernance = governance as GovernorGovernance;
  const startBlockTimeStamp = useBlockTimestamp(Number(proposal.startBlock));

  const { t } = useTranslation(['proposal']);

  const { address } = useAccount();
  const publicClient = useNetworkPublicClient();
  const { votesToken, type } = governorGovernance;
  const { startBlock } = proposal;

  const [proposalVotingWeight, setProposalVotingWeight] = useState('0');

  const isERC20 = type === GovernanceType.GOVERNOR_ERC20;
  const isERC721 = type === GovernanceType.GOVERNOR_ERC721;

  const getErc721VotingWeight = useCallback(async () => {
    if (!address || !governorGovernance.erc721Tokens) {
      return 0n;
    }
    const userVotingWeight = (
      await Promise.all(
        governorGovernance.erc721Tokens.map(async ({ address: tokenAddress, votingWeight }) => {
          const tokenContract = getContract({
            abi: erc721Abi,
            address: tokenAddress,
            client: publicClient,
          });
          const userBalance = await tokenContract.read.balanceOf([address], {
            blockNumber: startBlock,
          });
          return userBalance * votingWeight;
        }),
      )
    ).reduce((prev, curr) => prev + curr, 0n);
    return userVotingWeight;
  }, [governorGovernance.erc721Tokens, publicClient, address, startBlock]);

  useEffect(() => {
    async function loadProposalVotingWeight() {
      if (address) {
        if (isERC20) {
          const strategyContract = getContract({
            abi: legacy.abis.LinearERC20Voting,
            address: proposal.votingStrategy,
            client: publicClient,
          });

          const pastVotingWeight = await strategyContract.read.getVotingWeight([
            address,
            Number(proposal.proposalId),
          ]);

          setProposalVotingWeight(
            formatCoin(pastVotingWeight, true, votesToken?.decimals, undefined, false),
          );
        } else if (isERC721) {
          const votingWeight = await getErc721VotingWeight();
          setProposalVotingWeight(votingWeight.toString());
        }
      }
    }

    loadProposalVotingWeight();
  }, [
    address,
    proposal.proposalId,
    proposal.votingStrategy,
    publicClient,
    votesToken?.decimals,
    isERC20,
    isERC721,
    getErc721VotingWeight,
    startBlock,
  ]);

  const { canUserCreateProposal } = useCanUserCreateProposal();

  const notEnoughVotingPowerAtTheTimeOfProposalCreation =
    proposalVotingWeight === '0' && canUserCreateProposal;

  return (
    <Flex
      flexDirection="column"
      gap="0.75rem"
    >
      <ProposalDetailsSection
        proposal={proposal}
        startBlockTimeStamp={startBlockTimeStamp}
      />

      <ProposalVotingSection
        proposal={proposal}
        governorGovernance={governorGovernance}
        proposalVotingWeight={proposalVotingWeight}
      />

      {notEnoughVotingPowerAtTheTimeOfProposalCreation && (
        <AlertBanner
          message={t('proposalSummaryNotEnoughVotingPower')}
          messageSecondary={t('proposalSummaryNotEnoughVotingPowerSecondary')}
          variant="warning"
          layout="vertical"
        />
      )}
    </Flex>
  );
}
