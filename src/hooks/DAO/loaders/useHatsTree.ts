import { Tree } from '@hatsprotocol/sdk-v1-subgraph';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { createSablierSubgraphClient } from '../../../graphql';
import { hatsSubgraphClient } from '../../../graphql/hats';
import { useDAOStore } from '../../../providers/App/AppProvider';
import useIPFSClient from '../../../providers/App/hooks/useIPFSClient';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { DAORolesError } from '../../../store/roles/rolesStoreUtils';
import { useRolesStore } from '../../../store/roles/useRolesStore';
import useNetworkPublicClient from '../../useNetworkPublicClient';
import { CacheExpiry, CacheKeys } from '../../utils/cache/cacheDefaults';
import { getValue, setValue } from '../../utils/cache/useLocalStorage';
import { useCurrentDAOKey } from '../useCurrentDAOKey';

const useHatsTree = () => {
  const { t } = useTranslation('roles');
  const { daoKey } = useCurrentDAOKey();
  const {
    governanceContracts: {
      linearVotingErc20WithRolesWhitelistingAddress,
      linearVotingErc721WithRolesWhitelistingAddress,
      isLoaded: governanceContractsLoaded,
    },
  } = useDAOStore({ daoKey });
  const { rolesTreeId, contextChainId, setRolesTree, resetRoles } = useRolesStore();

  const ipfsClient = useIPFSClient();
  const {
    chain,
    getConfigByChainId,
    contracts: {
      rolesProtocol,
      erc6551Registry,
      rolesAccount1ofNMasterCopy: rolesAccountImplementation,
      rolesElectionsEligibilityMasterCopy: rolesElectionsImplementation,
    },
  } = useNetworkConfigStore();
  const publicClient = useNetworkPublicClient();

  const getHatsTree = useCallback(
    async (params: { rolesTreeId: number; contextChainId: number }) => {
      try {
        const tree = await hatsSubgraphClient.getTree({
          chainId: params.contextChainId,
          treeId: params.rolesTreeId,
          props: {
            hats: {
              props: {
                prettyId: true,
                status: true,
                details: true,
                eligibility: true,
                wearers: {
                  props: {},
                },
              },
            },
          },
        });

        const hatsWithFetchedDetails = await Promise.all(
          (tree.hats || []).map(async hat => {
            const ipfsPrefix = 'ipfs://';

            if (hat.details === undefined || !hat.details.startsWith(ipfsPrefix)) {
              return hat;
            }

            const hash = hat.details.split(ipfsPrefix)[1];
            const cacheKey = {
              cacheName: CacheKeys.IPFS_HASH,
              hash,
              chainId: params.contextChainId,
            } as const;

            const cachedDetails = getValue(cacheKey);

            if (cachedDetails) {
              return { ...hat, details: cachedDetails };
            }

            try {
              const detailsFromIpfs = await ipfsClient.cat(hash);
              const jsonStringDetails = JSON.stringify(detailsFromIpfs);
              setValue(cacheKey, jsonStringDetails, CacheExpiry.NEVER);
              return { ...hat, details: jsonStringDetails };
            } catch {
              return hat;
            }
          }),
        );

        const treeWithFetchedDetails: Tree = { ...tree, hats: hatsWithFetchedDetails };
        try {
          const config = getConfigByChainId(chain.id);
          const sablierSubgraphClient = createSablierSubgraphClient(config);
          await setRolesTree({
            rolesTree: treeWithFetchedDetails,
            chainId: BigInt(params.contextChainId),
            rolesProtocol,
            erc6551Registry,
            rolesAccountImplementation,
            rolesElectionsImplementation,
            publicClient,
            whitelistingVotingStrategy:
              linearVotingErc20WithRolesWhitelistingAddress ||
              linearVotingErc721WithRolesWhitelistingAddress,
            sablierSubgraphClient,
          });
        } catch (e) {
          if (e instanceof DAORolesError) {
            toast.error(e.message);
          }
        }
      } catch (e) {
        const config = getConfigByChainId(chain.id);
        const sablierSubgraphClient = createSablierSubgraphClient(config);
        setRolesTree({
          rolesTree: null,
          chainId: BigInt(params.contextChainId),
          rolesProtocol,
          erc6551Registry,
          rolesAccountImplementation,
          rolesElectionsImplementation,
          publicClient,
          sablierSubgraphClient,
        });
        const message = t('invalidRolesTreeIdMessage');
        toast.error(message);
        console.error(e, {
          message,
          args: {
            network: params.contextChainId,
            rolesTreeId: params.rolesTreeId,
          },
        });
      }
    },
    [
      chain.id,
      getConfigByChainId,
      erc6551Registry,
      rolesAccountImplementation,
      rolesElectionsImplementation,
      rolesProtocol,
      ipfsClient,
      linearVotingErc20WithRolesWhitelistingAddress,
      linearVotingErc721WithRolesWhitelistingAddress,
      setRolesTree,
      publicClient,
      t,
    ],
  );

  useEffect(() => {
    // Whitelisting contracts might be not loaded yet which might lead to wrong permissions loading
    if (!governanceContractsLoaded) {
      return;
    }

    if (!daoKey || !rolesTreeId || !contextChainId) {
      resetRoles();
      return;
    }
    const rolesTreeIdValue = rolesTreeId[daoKey];
    // @dev for some reason `rolesTreeId` can stile be null or undefined
    if (rolesTreeIdValue === null || rolesTreeIdValue === undefined) {
      resetRoles();
      return;
    }
    getHatsTree({
      rolesTreeId: rolesTreeIdValue,
      contextChainId,
    });
  }, [contextChainId, getHatsTree, rolesTreeId, governanceContractsLoaded, daoKey, resetRoles]);
};

export { useHatsTree };
