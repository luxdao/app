import { useEffect, useState } from 'react';
import { formatUnits } from 'viem';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useGlobalStore } from '../../../store/store';
import { GovernorGovernance, GovernanceType } from '../../../types/fractal';

export const useParentSafeVotingWeight = () => {
  const { daoKey } = useCurrentDAOKey();
  const { getGovernance, getDaoNode } = useGlobalStore();
  const [parentVotingQuorum, setParentVotingQuorum] = useState<bigint>();
  const [totalParentVotingWeight, setTotalParentVotingWeight] = useState<bigint>();

  useEffect(() => {
    if (!daoKey) {
      return;
    }
    const governance = getGovernance(daoKey);
    const safe = getDaoNode(daoKey).safe;
    if (!safe) {
      return;
    }

    switch (governance.type) {
      case GovernanceType.GOVERNOR_ERC20:
      case GovernanceType.GOVERNOR_ERC721:
        const governanceGovernor = governance as GovernorGovernance;

        if (governance.isGovernor === false || !governanceGovernor.votingStrategy) {
          return;
        }

        // Setup Governor parent total voting weight
        if (governanceGovernor.votesToken) {
          const totalSupplyFormatted = formatUnits(
            governanceGovernor.votesToken.totalSupply,
            governanceGovernor.votesToken.decimals,
          );

          if (totalSupplyFormatted.indexOf('.') === -1) {
            setTotalParentVotingWeight(BigInt(totalSupplyFormatted));
          } else {
            const supplyWithoutDecimals = totalSupplyFormatted.substring(
              0,
              totalSupplyFormatted.indexOf('.'),
            );
            setTotalParentVotingWeight(BigInt(supplyWithoutDecimals));
          }
        } else if (governanceGovernor.erc721Tokens) {
          const totalVotingWeight = governanceGovernor.erc721Tokens.reduce(
            (prev, curr) => curr.votingWeight * (curr.totalSupply || 1n) + prev,
            0n,
          );

          setTotalParentVotingWeight(totalVotingWeight);
        }

        // Setup Governor parent voting quorum
        const quorumThreshold =
          governanceGovernor.votingStrategy.quorumThreshold?.value ||
          governanceGovernor.votingStrategy.quorumPercentage?.value;
        if (!quorumThreshold) {
          throw new Error('Parent voting quorum is undefined');
        }
        setParentVotingQuorum(quorumThreshold);

        break;

      case GovernanceType.MULTISIG:
        setTotalParentVotingWeight(BigInt(safe.owners.length));
        setParentVotingQuorum(BigInt(safe.threshold));
    }
  }, [daoKey, getGovernance, getDaoNode]);

  return {
    totalParentVotingWeight,
    parentVotingQuorum,
  };
};
