import { legacy } from '@luxdao/contracts';
import { useCallback } from 'react';
import { Address, getContract, zeroAddress } from 'viem';
import { SENTINEL_ADDRESS } from '../../constants/common';
import { useDAOStore } from '../../providers/App/AppProvider';
import { useSafeAPI } from '../../providers/App/hooks/useSafeAPI';
import { DAOModule } from '../../types';
import { getGovernorModuleFromModules } from '../../utils';
import { useDAOModules } from '../DAO/loaders/useDAOModules';
import { useCurrentDAOKey } from '../DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../useNetworkPublicClient';
import { useAddressContractType } from './useAddressContractType';

const useVotingStrategiesAddresses = () => {
  const publicClient = useNetworkPublicClient();
  const safeAPI = useSafeAPI();
  const { getAddressContractType } = useAddressContractType();
  const lookupModules = useDAOModules();
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { modules },
  } = useDAOStore({ daoKey });

  const getVotingStrategies = useCallback(
    async (safeAddress?: Address) => {
      let governorModule: DAOModule | undefined;

      if (safeAddress) {
        if (!safeAPI) {
          throw new Error('Safe API not ready');
        }
        const safeInfo = await safeAPI.getSafeInfo(safeAddress);
        const safeModules = await lookupModules(safeInfo.modules);
        governorModule = getGovernorModuleFromModules(safeModules);
      } else {
        if (!modules) {
          throw new Error('DAO modules not ready');
        }
        governorModule = getGovernorModuleFromModules(modules);
      }

      if (!governorModule) {
        return;
      }

      const governorContract = getContract({
        abi: legacy.abis.Governor,
        address: governorModule.moduleAddress,
        client: publicClient,
      });

      const [strategies, nextStrategy] = await governorContract.read.getStrategies([
        SENTINEL_ADDRESS,
        3n,
      ]);
      const result = Promise.all(
        [...strategies, nextStrategy]
          .filter(
            strategyAddress =>
              strategyAddress !== SENTINEL_ADDRESS && strategyAddress !== zeroAddress,
          )
          .map(async strategyAddress => ({
            ...(await getAddressContractType(strategyAddress)),
            strategyAddress,
          })),
      );
      return result;
    },
    [lookupModules, getAddressContractType, modules, publicClient, safeAPI],
  );

  return { getVotingStrategies };
};

export default useVotingStrategiesAddresses;
