import { legacy } from '@luxdao/contracts';
import { hatIdToTreeId } from '@hatsprotocol/sdk-v1-core';
import { useCallback } from 'react';
import { Address, GetContractEventsReturnType, getContract } from 'viem';
import { logError } from '../../helpers/errorLogging';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';

export function useKeyValuePairsFetcher() {
  const publicClient = useNetworkPublicClient();
  const {
    contracts: { keyValuePairs, sablierV2LockupLinear },
  } = useNetworkConfigStore();
  const getHatsTreeId = useCallback(
    ({
      events,
      chainId,
    }: {
      events: GetContractEventsReturnType<typeof legacy.abis.KeyValuePairs> | undefined;
      chainId: number;
    }) => {
      if (!events) {
        return null;
      }

      // get most recent event where `topRoleId` was set
      const topRoleIdEvent = events
        .filter(event => event.args.key && event.args.key === 'topHatId')
        .pop();

      if (!topRoleIdEvent) {
        return null;
      }

      if (!topRoleIdEvent.args.value) {
        logError({
          message: "KVPairs 'topRoleIdEvent' without a value",
          network: chainId,
          args: {
            transactionHash: topRoleIdEvent.transactionHash,
            logIndex: topRoleIdEvent.logIndex,
          },
        });
        return undefined;
      }

      try {
        const topRoleId = BigInt(topRoleIdEvent.args.value);
        const treeId = hatIdToTreeId(topRoleId);
        return treeId;
      } catch (e) {
        logError({
          message: "KVPairs 'topRoleIdEvent' value not a number",
          network: chainId,
          args: {
            transactionHash: topRoleIdEvent.transactionHash,
            logIndex: topRoleIdEvent.logIndex,
          },
        });
        return undefined;
      }
    },
    [],
  );

  const getStreamIdsToHatIds = useCallback(
    ({
      events,
      chainId,
    }: {
      events: GetContractEventsReturnType<typeof legacy.abis.KeyValuePairs> | undefined;
      chainId: number;
    }) => {
      if (!events) {
        return [];
      }

      const roleIdToStreamIdEvents = events.filter(
        event => event.args.key && event.args.key === 'hatIdToStreamId',
      );

      const roleIdIdsToStreamIds = [];
      for (const event of roleIdToStreamIdEvents) {
        const roleIdToStreamId = event.args.value;
        if (roleIdToStreamId !== undefined) {
          const [roleId, streamId] = roleIdToStreamId.split(':');
          roleIdIdsToStreamIds.push({
            roleId: BigInt(roleId),
            streamId: `${sablierV2LockupLinear.toLowerCase()}-${chainId}-${streamId}`,
          });
          continue;
        }
        logError({
          message: "KVPairs 'hatIdToStreamId' without a value",
          network: chainId,
          args: {
            transactionHash: event.transactionHash,
            logIndex: event.logIndex,
          },
        });
      }
      return roleIdIdsToStreamIds;
    },
    [sablierV2LockupLinear],
  );

  const fetchKeyValuePairsData = useCallback(
    async ({ safeAddress }: { safeAddress?: Address }) => {
      if (!safeAddress) {
        return;
      }

      const keyValuePairsContract = getContract({
        abi: legacy.abis.KeyValuePairs,
        address: keyValuePairs,
        client: publicClient,
      });

      const events = await keyValuePairsContract.getEvents.ValueUpdated(
        { theAddress: safeAddress },
        { fromBlock: 0n },
      );

      return {
        events,
        rolesTreeId: getHatsTreeId({ events, chainId: publicClient.chain.id }),
        streamIdsToRoleIds: getStreamIdsToHatIds({ events, chainId: publicClient.chain.id }),
      };
    },
    [getHatsTreeId, getStreamIdsToHatIds, keyValuePairs, publicClient],
  );

  return { getHatsTreeId, getStreamIdsToHatIds, fetchKeyValuePairsData };
}
