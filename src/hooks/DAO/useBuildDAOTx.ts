import { useCallback } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { TxBuilderFactory } from '../../models/TxBuilderFactory';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useGlobalStore } from '../../store/store';
import {
  GovernorERC20DAO,
  GovernorERC721DAO,
  GovernorGovernance,
  GovernanceType,
  SafeMultisigDAO,
  SubDAO,
  VotingStrategyType,
} from '../../types';
import useNetworkPublicClient from '../useNetworkPublicClient';
import { useCurrentDAOKey } from './useCurrentDAOKey';

const useBuildDAOTx = () => {
  const {
    contracts: {
      compatibilityFallbackHandler,
      votesErc20MasterCopy,
      votesErc20LockableMasterCopy,
      keyValuePairs,
      gnosisSafeProxyFactory,
      gnosisSafeL2Singleton,
      moduleProxyFactory,
      multiSendCallOnly,
      claimErc20MasterCopy,
      moduleFractalMasterCopy,
      linearVotingErc20MasterCopy,
      linearVotingErc721MasterCopy,
      moduleGovernorMasterCopy,
      freezeGuardGovernorMasterCopy,
      freezeGuardMultisigMasterCopy,
      freezeVotingErc20MasterCopy,
      freezeVotingErc721MasterCopy,
      freezeVotingMultisigMasterCopy,
    },
  } = useNetworkConfigStore();
  const { daoKey } = useCurrentDAOKey();
  const { getGovernance } = useGlobalStore();
  const user = useAccount();

  const publicClient = useNetworkPublicClient();

  const buildDao = useCallback(
    async (
      daoData: GovernorERC20DAO | GovernorERC721DAO | SafeMultisigDAO | SubDAO,
      parentAddress?: Address,
      parentTokenAddress?: Address,
    ) => {
      let isGovernor = false;

      if (!user.address) {
        return;
      }

      if (
        daoData.governance === GovernanceType.GOVERNOR_ERC20 ||
        daoData.governance === GovernanceType.GOVERNOR_ERC721
      ) {
        isGovernor = true;
      }

      const txBuilderFactory = new TxBuilderFactory(
        publicClient,
        isGovernor,
        daoData,
        compatibilityFallbackHandler,
        votesErc20MasterCopy,
        keyValuePairs,
        gnosisSafeProxyFactory,
        gnosisSafeL2Singleton,
        moduleProxyFactory,
        freezeGuardGovernorMasterCopy,
        freezeGuardMultisigMasterCopy,
        freezeVotingErc20MasterCopy,
        freezeVotingErc721MasterCopy,
        freezeVotingMultisigMasterCopy,
        multiSendCallOnly,
        claimErc20MasterCopy,
        moduleFractalMasterCopy,
        linearVotingErc20MasterCopy,
        linearVotingErc721MasterCopy,
        moduleGovernorMasterCopy,
        votesErc20LockableMasterCopy,
        parentAddress,
        parentTokenAddress,
      );

      await txBuilderFactory.setupSafeData();
      let parentStrategyType: VotingStrategyType | undefined;
      let parentStrategyAddress: Address | undefined;

      if (daoKey) {
        const governance = getGovernance(daoKey);
        const governorGovernance = governance as GovernorGovernance;
        if (governance.isGovernor && governorGovernance.votingStrategy) {
          parentStrategyType = governorGovernance.votingStrategy.strategyType;
          if (
            parentStrategyType === VotingStrategyType.LINEAR_ERC721 &&
            governance.linearVotingErc721Address
          ) {
            parentStrategyAddress = governance.linearVotingErc721Address;
          }
        }
      }

      const daoTxBuilder = txBuilderFactory.createDaoTxBuilder({
        attachFractalModule: (daoData as SubDAO).attachFractalModule,
        parentStrategyType,
        parentStrategyAddress,
      });

      const buildSafeTxParams = {
        shouldSetName: true, // We KNOW this will always be true because the DAO UI doesn't allow creating a safe without a name
        shouldSetSnapshot: daoData.snapshotENS !== '',
      };

      // Build Tx bundle based on governance type (Governor or Multisig)
      const safeTx = isGovernor
        ? await daoTxBuilder.buildGovernorTx(buildSafeTxParams)
        : await daoTxBuilder.buildMultisigTx(buildSafeTxParams);

      return {
        predictedSafeAddress: txBuilderFactory.predictedSafeAddress!,
        createSafeTx: txBuilderFactory.createSafeTx!,
        safeTx,
      };
    },
    [
      user.address,
      publicClient,
      compatibilityFallbackHandler,
      votesErc20MasterCopy,
      votesErc20LockableMasterCopy,
      keyValuePairs,
      gnosisSafeProxyFactory,
      gnosisSafeL2Singleton,
      moduleProxyFactory,
      freezeGuardGovernorMasterCopy,
      freezeGuardMultisigMasterCopy,
      freezeVotingErc20MasterCopy,
      freezeVotingErc721MasterCopy,
      freezeVotingMultisigMasterCopy,
      multiSendCallOnly,
      claimErc20MasterCopy,
      moduleFractalMasterCopy,
      linearVotingErc20MasterCopy,
      linearVotingErc721MasterCopy,
      moduleGovernorMasterCopy,
      getGovernance,
      daoKey,
    ],
  );

  return [buildDao] as const;
};

export default useBuildDAOTx;
