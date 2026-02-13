import { getContract, Hex, PublicClient } from 'viem';
import { create } from 'zustand';
import { SablierV2LockupLinearAbi } from '../../assets/abi/SablierV2LockupLinear';
import { convertStreamIdToBigInt } from '../../hooks/streams/useCreateSablierStream';
import { RolesStore } from '../../types/roles';
import { initialHatsStore, sanitize } from './rolesStoreUtils';

const streamIdToHatIdMap = new Map<string, BigInt>();
const getStreamIdToHatIdMap = () => {
  return Array.from(streamIdToHatIdMap.entries()).map(([streamId, roleId]) => ({
    streamId,
    roleId,
  }));
};

const useRolesStore = create<RolesStore>()((set, get) => ({
  ...initialHatsStore,
  getHat: roleId => {
    const matches = get().rolesTree?.roleItems.filter(h => h.id === roleId);

    if (matches === undefined || matches.length === 0) {
      return null;
    }

    if (matches.length > 1) {
      throw new Error('multiple hats with the same ID');
    }

    return matches[0];
  },
  getPayment: (roleId, streamId) => {
    const hat = get().getHat(roleId);

    if (!hat) {
      return null;
    }

    const matches = hat.payments.filter(p => p.streamId === streamId);

    if (matches.length === 0) {
      return null;
    }

    if (matches.length > 1) {
      throw new Error('multiple payments with the same ID');
    }

    return matches[0];
  },
  setHatKeyValuePairData: args => {
    const { rolesTreeId, contextChainId, streamIdsToRoleIds, daoKey } = args;
    for (const { roleId, streamId } of streamIdsToRoleIds) {
      streamIdToHatIdMap.set(streamId, roleId);
    }
    set(state => {
      if (rolesTreeId === undefined) {
        return {
          ...initialHatsStore,
        };
      }
      if (rolesTreeId === null) {
        return {
          ...initialHatsStore,
          rolesTree: null,
        };
      }
      return {
        ...state,
        rolesTreeId: { [daoKey]: rolesTreeId },
        contextChainId,
        streamsFetched: false,
      };
    });
  },

  setRolesTree: async params => {
    let rolesTree = await sanitize(
      params.rolesTree,
      params.rolesAccountImplementation,
      params.rolesElectionsImplementation,
      params.erc6551Registry,
      params.rolesProtocol,
      params.chainId,
      params.publicClient,
      params.sablierSubgraphClient,
      params.whitelistingVotingStrategy,
    );
    const streamIdsToRoleIdsMap = getStreamIdToHatIdMap();
    if (rolesTree) {
      rolesTree = {
        ...rolesTree,
        roleItems: rolesTree.roleItems.map(roleHat => {
          const filteredStreamIds = streamIdsToRoleIdsMap
            .filter(ids => ids.roleId === BigInt(roleHat.id))
            .map(ids => ids.streamId);

          return {
            ...roleHat,
            payments: roleHat.isTermed
              ? roleHat.payments.filter(payment => filteredStreamIds.includes(payment.streamId))
              : roleHat.payments,
          };
        }),
      };
    }

    set(() => ({ rolesTree }));
  },
  refreshWithdrawableAmount: async (roleId: Hex, streamId: string, publicClient: PublicClient) => {
    const payment = get().getPayment(roleId, streamId);
    if (!payment) return;

    const streamContract = getContract({
      abi: SablierV2LockupLinearAbi,
      address: payment.contractAddress,
      client: publicClient,
    });

    const bigintStreamId = convertStreamIdToBigInt(streamId);

    const newWithdrawableAmount = await streamContract.read.withdrawableAmountOf([bigintStreamId]);
    const currentHatsTree = get().rolesTree;

    if (!currentHatsTree) return;
    set(() => ({
      rolesTree: {
        ...currentHatsTree,
        roleItems: currentHatsTree.roleItems.map(roleHat => {
          if (roleHat.id !== roleId) return roleHat;
          return {
            ...roleHat,
            payments: roleHat.payments.map(p =>
              p.streamId === streamId ? { ...p, withdrawableAmount: newWithdrawableAmount } : p,
            ),
          };
        }),
      },
    }));
  },
  updateCurrentTermStatus: (roleId: Hex, termStatus: 'inactive' | 'active') => {
    const currentHatsTree = get().rolesTree;
    if (!currentHatsTree) return;

    set(() => ({
      rolesTree: {
        ...currentHatsTree,
        roleItems: currentHatsTree.roleItems.map(roleHat => {
          if (roleHat.id !== roleId) return roleHat;
          return {
            ...roleHat,
            roleTerms: {
              ...roleHat.roleTerms,
              currentTerm: roleHat.roleTerms.currentTerm
                ? {
                    ...roleHat.roleTerms.currentTerm,
                    termStatus,
                  }
                : undefined,
            },
          };
        }),
      },
    }));
  },
  resetRoles: () =>
    set(state => ({
      ...initialHatsStore,
      rolesTreeId: state.rolesTreeId,
      contextChainId: state.contextChainId,
    })),
}));

export { useRolesStore };
