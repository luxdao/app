import { legacy } from '@luxdao/contracts';
import { useCallback } from 'react';
import {
  Address,
  encodeAbiParameters,
  EncodeAbiParametersReturnType,
  encodeFunctionData,
  encodePacked,
  getCreate2Address,
  keccak256,
  parseAbiParameters,
} from 'viem';
import {
  linearERC20VotingV1SetupParams,
  linearERC20VotingWithWhitelistV1SetupParams,
  linearERC721VotingV1SetupParams,
  linearERC721VotingWithWhitelistV1SetupParams,
} from '../../constants/params';
import { getRandomBytes } from '../../helpers';
import { generateContractByteCodeLinear, generateSalt } from '../../models/helpers/utils';
import { useDAOStore } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import {
  GovernorGovernance,
  CreateProposalTransaction,
  ERC721TokenData,
  FractalTokenType,
  FractalVotingStrategy,
} from '../../types';
import { SENTINEL_MODULE } from '../../utils/address';
import { useCurrentDAOKey } from '../DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../useNetworkPublicClient';
import useVotingStrategiesAddresses from './useVotingStrategiesAddresses';

export const useInstallVersionedVotingStrategy = () => {
  const { daoKey } = useCurrentDAOKey();
  const {
    governance,
    governanceContracts,
    node: { safe },
  } = useDAOStore({ daoKey });

  const safeAddress = safe?.address;

  const publicClient = useNetworkPublicClient();
  const { getVotingStrategies } = useVotingStrategiesAddresses();

  const governorGovernance = governance as GovernorGovernance;
  const { votesToken, erc721Tokens } = governorGovernance;

  const {
    contracts: {
      rolesProtocol,
      linearVotingErc20V1MasterCopy,
      linearVotingErc721V1MasterCopy,
      linearVotingErc20RolesWhitelistingV1MasterCopy,
      linearVotingErc721RolesWhitelistingV1MasterCopy,
      moduleProxyFactory,
      accountAbstraction,
    },
  } = useNetworkConfigStore();

  const linearErc20SetupParams = useCallback(
    async (
      strategyToRemove: FractalVotingStrategy,
      tokenAddress: Address,
      moduleGovernorAddress: Address,
    ): Promise<EncodeAbiParametersReturnType> => {
      if (!accountAbstraction) {
        throw new Error('Account Abstraction addresses are not set');
      }

      const existingAbiAndAddress = {
        abi: legacy.abis.LinearERC20Voting,
        address: strategyToRemove.address,
      };

      const [
        existingVotingPeriod,
        existingQuorumNumerator,
        existingBasisNumerator,
        existingRequiredProposerWeight,
      ] = await publicClient.multicall({
        contracts: [
          {
            ...existingAbiAndAddress,
            functionName: 'votingPeriod',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'quorumNumerator',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'basisNumerator',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'requiredProposerWeight',
          },
        ],
        allowFailure: false,
      });

      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters(linearERC20VotingV1SetupParams),
        [
          safeAddress!,
          tokenAddress,
          moduleGovernorAddress,
          existingVotingPeriod,
          existingRequiredProposerWeight,
          existingQuorumNumerator,
          existingBasisNumerator,
          accountAbstraction.lightAccountFactory,
        ],
      );

      return encodeFunctionData({
        abi: legacy.abis.LinearERC20VotingV1,
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });
    },
    [publicClient, safeAddress, accountAbstraction],
  );

  const linearErc20WithWhitelistSetupParams = useCallback(
    async (
      strategyToRemove: FractalVotingStrategy,
      tokenAddress: Address,
      moduleGovernorAddress: Address,
    ): Promise<EncodeAbiParametersReturnType> => {
      if (!safeAddress) {
        throw new Error('No safe address');
      }

      if (!accountAbstraction) {
        throw new Error('Account Abstraction addresses are not set');
      }

      const existingAbiAndAddress = {
        abi: legacy.abis.LinearERC20VotingWithHatsProposalCreation,
        address: strategyToRemove.address,
      };

      const [
        existingVotingPeriod,
        existingQuorumNumerator,
        existingBasisNumerator,
        existingWhitelistedHatIds,
      ] = await publicClient.multicall({
        contracts: [
          {
            ...existingAbiAndAddress,
            functionName: 'votingPeriod',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'quorumNumerator',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'basisNumerator',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'getWhitelistedHatIds',
          },
        ],
        allowFailure: false,
      });

      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters(linearERC20VotingWithWhitelistV1SetupParams),
        [
          safeAddress,
          tokenAddress,
          moduleGovernorAddress,
          existingVotingPeriod,
          existingQuorumNumerator,
          existingBasisNumerator,
          rolesProtocol,
          existingWhitelistedHatIds,
          accountAbstraction.lightAccountFactory,
        ],
      );

      return encodeFunctionData({
        abi: legacy.abis.LinearERC20VotingWithHatsProposalCreationV1,
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });
    },
    [rolesProtocol, publicClient, safeAddress, accountAbstraction],
  );

  const linearErc721SetupParams = useCallback(
    async (
      strategyToRemove: FractalVotingStrategy,
      erc721TokenAddresses: ERC721TokenData[],
      moduleGovernorAddress: Address,
    ): Promise<EncodeAbiParametersReturnType> => {
      if (!accountAbstraction) {
        throw new Error('Account Abstraction addresses are not set');
      }

      const existingAbiAndAddress = {
        abi: legacy.abis.LinearERC721Voting,
        address: strategyToRemove.address,
      };

      const [
        existingVotingPeriod,
        existingQuorumThreshold,
        existingProposerThreshold,
        existingBasisNumerator,
      ] = await publicClient.multicall({
        contracts: [
          {
            ...existingAbiAndAddress,
            functionName: 'votingPeriod',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'quorumThreshold',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'proposerThreshold',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'basisNumerator',
          },
        ],
        allowFailure: false,
      });

      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters(linearERC721VotingV1SetupParams),
        [
          safeAddress!,
          erc721TokenAddresses.map(token => token.address),
          erc721TokenAddresses.map(token => token.votingWeight),
          moduleGovernorAddress,
          existingVotingPeriod,
          existingProposerThreshold,
          existingQuorumThreshold,
          existingBasisNumerator,
          accountAbstraction.lightAccountFactory,
        ],
      );

      return encodeFunctionData({
        abi: legacy.abis.LinearERC721VotingV1,
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });
    },
    [publicClient, safeAddress, accountAbstraction],
  );

  const linearErc721WithWhitelistSetupParams = useCallback(
    async (
      strategyToRemove: FractalVotingStrategy,
      erc721TokenAddresses: ERC721TokenData[],
      moduleGovernorAddress: Address,
    ): Promise<EncodeAbiParametersReturnType> => {
      if (!accountAbstraction) {
        throw new Error('Account Abstraction addresses are not set');
      }

      const existingAbiAndAddress = {
        abi: legacy.abis.LinearERC721VotingWithHatsProposalCreation,
        address: strategyToRemove.address,
      };

      const [
        existingVotingPeriod,
        existingQuorumThreshold,
        existingBasisNumerator,
        existingWhitelistedHatIds,
      ] = await publicClient.multicall({
        contracts: [
          {
            ...existingAbiAndAddress,
            functionName: 'votingPeriod',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'quorumThreshold',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'basisNumerator',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'getWhitelistedHatIds',
          },
        ],
        allowFailure: false,
      });

      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters(linearERC721VotingWithWhitelistV1SetupParams),
        [
          safeAddress!,
          erc721TokenAddresses.map(token => token.address),
          erc721TokenAddresses.map(token => token.votingWeight),
          moduleGovernorAddress,
          existingVotingPeriod,
          existingQuorumThreshold,
          existingBasisNumerator,
          rolesProtocol,
          existingWhitelistedHatIds,
          accountAbstraction.lightAccountFactory,
        ],
      );

      return encodeFunctionData({
        abi: legacy.abis.LinearERC721VotingWithHatsProposalCreationV1,
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });
    },
    [rolesProtocol, publicClient, safeAddress, accountAbstraction],
  );

  const setupParams = useCallback(
    async (
      strategyToRemove: FractalVotingStrategy,
      moduleGovernorAddress: Address,
      tokenAddress?: Address,
      erc721TokenAddresses?: ERC721TokenData[],
    ): Promise<EncodeAbiParametersReturnType> => {
      if (strategyToRemove.type === FractalTokenType.erc20) {
        if (!tokenAddress) {
          throw new Error('Expected token address');
        }
        if (strategyToRemove.withWhitelist) {
          return linearErc20WithWhitelistSetupParams(
            strategyToRemove,
            tokenAddress,
            moduleGovernorAddress,
          );
        } else {
          return linearErc20SetupParams(strategyToRemove, tokenAddress, moduleGovernorAddress);
        }
      } else {
        if (!erc721TokenAddresses) {
          throw new Error('Expected ERC721 tokens');
        }
        if (strategyToRemove.withWhitelist) {
          return linearErc721WithWhitelistSetupParams(
            strategyToRemove,
            erc721TokenAddresses,
            moduleGovernorAddress,
          );
        } else {
          return linearErc721SetupParams(
            strategyToRemove,
            erc721TokenAddresses,
            moduleGovernorAddress,
          );
        }
      }
    },
    [
      linearErc20SetupParams,
      linearErc20WithWhitelistSetupParams,
      linearErc721SetupParams,
      linearErc721WithWhitelistSetupParams,
    ],
  );

  const getMasterCopyAddress = useCallback(
    (strategyToRemove: FractalVotingStrategy): Address => {
      if (strategyToRemove.type === FractalTokenType.erc20) {
        if (strategyToRemove.withWhitelist) {
          return linearVotingErc20RolesWhitelistingV1MasterCopy;
        } else {
          return linearVotingErc20V1MasterCopy;
        }
      } else {
        if (strategyToRemove.withWhitelist) {
          return linearVotingErc721RolesWhitelistingV1MasterCopy;
        } else {
          return linearVotingErc721V1MasterCopy;
        }
      }
    },
    [
      linearVotingErc20RolesWhitelistingV1MasterCopy,
      linearVotingErc20V1MasterCopy,
      linearVotingErc721RolesWhitelistingV1MasterCopy,
      linearVotingErc721V1MasterCopy,
    ],
  );

  const getAddAndEnableStrategyTxs = useCallback(
    async (
      strategyToRemove: FractalVotingStrategy,
      moduleGovernorAddress: Address,
      tokenAddress?: Address,
      erc721TokenAddresses?: ERC721TokenData[],
    ): Promise<{
      deployTx: CreateProposalTransaction;
      enableTx: CreateProposalTransaction;
      newStrategy: FractalVotingStrategy;
    }> => {
      const encodedStrategySetupData = await setupParams(
        strategyToRemove,
        moduleGovernorAddress,
        tokenAddress,
        erc721TokenAddresses,
      );

      const masterAddress = getMasterCopyAddress(strategyToRemove);

      const strategyNonce = getRandomBytes();
      const deployVotingStrategyTx: CreateProposalTransaction = {
        targetAddress: moduleProxyFactory,
        functionName: 'deployModule',
        ethValue: {
          value: '0n',
          bigintValue: 0n,
        },
        parameters: [
          {
            signature: 'address',
            value: masterAddress,
          },
          {
            signature: 'bytes',
            value: encodedStrategySetupData,
          },
          {
            signature: 'uint256',
            value: strategyNonce.toString(),
          },
        ],
      };

      const strategySalt = generateSalt(encodedStrategySetupData, strategyNonce);

      const strategyByteCode = generateContractByteCodeLinear(masterAddress);
      const predictedStrategyAddress = getCreate2Address({
        from: moduleProxyFactory,
        salt: strategySalt,
        bytecodeHash: keccak256(encodePacked(['bytes'], [strategyByteCode])),
      });

      const enableDeployedVotingStrategyTx: CreateProposalTransaction = {
        targetAddress: moduleGovernorAddress,
        functionName: 'enableStrategy',
        ethValue: {
          value: '0n',
          bigintValue: 0n,
        },
        parameters: [{ signature: 'address', value: predictedStrategyAddress }],
      };
      return {
        deployTx: deployVotingStrategyTx,
        enableTx: enableDeployedVotingStrategyTx,
        newStrategy: {
          ...strategyToRemove,
          address: predictedStrategyAddress,
        },
      };
    },
    [setupParams, getMasterCopyAddress, moduleProxyFactory],
  );

  const buildInstallVersionedVotingStrategies = useCallback(async (): Promise<{
    newStrategies: FractalVotingStrategy[];
    installVersionedStrategyCreateProposalTxs: CreateProposalTransaction[];
  }> => {
    const { moduleGovernorAddress, strategies } = governanceContracts;
    if (!safeAddress) {
      throw new Error('No safe address');
    }
    if (!moduleGovernorAddress) {
      throw new Error('No module Governor address');
    }

    const votingStrategies = await getVotingStrategies();
    if (!votingStrategies) {
      throw new Error('No strategies found');
    }

    // Remove unversioned strategies. These do not support gasless voting
    const strategiesToRemove = strategies.filter(strategy => strategy.version === undefined);

    if (strategiesToRemove.length > 0) {
      let installVersionedStrategyCreateProposalTxs: CreateProposalTransaction[] = [];
      const getDisableStrategyTx = (strategy: FractalVotingStrategy): CreateProposalTransaction => {
        // Find the previous strategy for the one to disable
        let prevStrategy: Address = SENTINEL_MODULE;
        for (let j = 0; j < strategies.length; j++) {
          if (strategies[j].address === strategy.address) {
            break;
          }
          prevStrategy = strategies[j].address;
        }

        // Disable the old strategy
        return {
          targetAddress: moduleGovernorAddress,
          functionName: 'disableStrategy',
          ethValue: {
            value: '0n',
            bigintValue: 0n,
          },
          parameters: [
            {
              signature: 'address',
              value: prevStrategy,
            },
            {
              signature: 'address',
              value: strategy.address,
            },
          ],
        };
      };

      // Handle all the removals first
      // There can be multiple strategies to replace. Use reverse so we can get prevStrategy correctly
      const disableStrategyTxs: CreateProposalTransaction[] = strategiesToRemove
        .reverse()
        .map(getDisableStrategyTx);

      const deployAndEnablePromises = strategiesToRemove.map(oldStrategy =>
        getAddAndEnableStrategyTxs(
          oldStrategy,
          moduleGovernorAddress,
          votesToken?.address,
          erc721Tokens,
        ),
      );
      const deployAndEnableNewStrategyTxs = await Promise.all(deployAndEnablePromises);

      if (disableStrategyTxs.length === deployAndEnableNewStrategyTxs.length) {
        installVersionedStrategyCreateProposalTxs.push(
          ...disableStrategyTxs,
          ...deployAndEnableNewStrategyTxs.flatMap(tx => [tx.deployTx, tx.enableTx]),
        );

        return {
          installVersionedStrategyCreateProposalTxs,
          newStrategies: deployAndEnableNewStrategyTxs.map(tx => tx.newStrategy),
        };
      } else {
        throw new Error('Number of disabled strategies does not match number of new strategies');
      }
    } else {
      // The installed strategies already support gasless voting, so no need to replace with new ones
      return {
        installVersionedStrategyCreateProposalTxs: [],
        newStrategies: [],
      };
    }
  }, [
    governanceContracts,
    safeAddress,
    getVotingStrategies,
    getAddAndEnableStrategyTxs,
    votesToken?.address,
    erc721Tokens,
  ]);

  return {
    buildInstallVersionedVotingStrategies,
  };
};
