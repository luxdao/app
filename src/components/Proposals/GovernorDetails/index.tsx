import { GridItem } from '@chakra-ui/react';
import { CONTENT_MAXW } from '../../../constants/common';
import { GovernorProposal } from '../../../types';
import { ProposalDetailsGrid } from '../../ui/containers/ProposalDetailsGrid';
import { useProposalCountdown } from '../../ui/proposal/useProposalCountdown';
import { ProposalInfo } from '../ProposalInfo';
import { GovernorProposalSummary } from '../ProposalSummary';
import ProposalVotes from '../ProposalVotes';

export function GovernorProposalDetails({ proposal }: { proposal: GovernorProposal }) {
  useProposalCountdown(proposal);

  return (
    <ProposalDetailsGrid>
      <GridItem
        colSpan={2}
        gap="1.5rem"
        maxW={CONTENT_MAXW}
      >
        <ProposalInfo proposal={proposal} />
        <ProposalVotes proposal={proposal} />
      </GridItem>
      <GridItem maxW={CONTENT_MAXW}>
        <GovernorProposalSummary proposal={proposal} />
      </GridItem>
    </ProposalDetailsGrid>
  );
}
