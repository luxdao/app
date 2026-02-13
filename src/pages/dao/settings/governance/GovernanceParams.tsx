import { Box, Flex, InputGroup, InputRightElement } from '@chakra-ui/react';
import { legacy } from '@luxdao/contracts';
import { useFormikContext } from 'formik';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getContract } from 'viem';
import { BigIntInput } from '../../../../components/ui/forms/BigIntInput';
import DurationUnitStepperInput from '../../../../components/ui/forms/DurationUnitStepperInput';
import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import { SafeSettingsEdits } from '../../../../components/ui/modals/SafeSettingsModal';
import Divider from '../../../../components/ui/utils/Divider';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../../../hooks/useNetworkPublicClient';
import { useTimeHelpers } from '../../../../hooks/utils/useTimeHelpers';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { GovernorGovernance, FreezeGuardType } from '../../../../types';
import { blocksToSeconds } from '../../../../utils/contract';

export function GovernanceParams() {
  const { t } = useTranslation(['dashboard', 'daoCreate', 'common']);
  const { daoKey } = useCurrentDAOKey();
  const {
    governance,
    guardContracts: { freezeGuardType, freezeGuardContractAddress },
    node: { safe },
  } = useDAOStore({ daoKey });

  const { values, setFieldValue } = useFormikContext<SafeSettingsEdits>();
  const publicClient = useNetworkPublicClient();
  const { getTimeDuration } = useTimeHelpers();

  const votingStrategy = governance.isGovernor
    ? (governance as GovernorGovernance).votingStrategy
    : null;

  const existingQuorumPercentage = votingStrategy?.quorumPercentage?.value;
  const existingQuorumThreshold = votingStrategy?.quorumThreshold?.value;
  const existingVotingPeriod = votingStrategy?.votingPeriod?.value;

  const [existingTimelockPeriod, setExistingTimelockPeriod] = useState<bigint>();
  const [existingExecutionPeriod, setExistingExecutionPeriod] = useState<bigint>();

  useEffect(() => {
    const setTimelockAndExecutionInfo = async () => {
      if (freezeGuardType == FreezeGuardType.MULTISIG) {
        if (freezeGuardContractAddress && publicClient) {
          const freezeGuardContract = getContract({
            abi: legacy.abis.MultisigFreezeGuard,
            address: freezeGuardContractAddress,
            client: publicClient,
          });
          const [contractTimelockPeriod, contractExecutionPeriod] = await Promise.all([
            freezeGuardContract.read.timelockPeriod(),
            freezeGuardContract.read.executionPeriod(),
          ]);
          const [timelockSeconds, executionPeriodSeconds] = await Promise.all([
            blocksToSeconds(contractTimelockPeriod, publicClient),
            blocksToSeconds(contractExecutionPeriod, publicClient),
          ]);

          if (timelockSeconds !== undefined) {
            setExistingTimelockPeriod(BigInt(timelockSeconds));
          }

          if (executionPeriodSeconds !== undefined) {
            setExistingExecutionPeriod(BigInt(executionPeriodSeconds));
          }
        }
      }

      const timelockPeriodSeconds = votingStrategy?.timeLockPeriod?.value;

      if (timelockPeriodSeconds !== undefined) {
        setExistingTimelockPeriod(timelockPeriodSeconds);
      }

      const executionPeriodSeconds = votingStrategy?.executionPeriod?.value;
      if (executionPeriodSeconds !== undefined) {
        setExistingExecutionPeriod(executionPeriodSeconds);
      }
    };

    setTimelockAndExecutionInfo();
  }, [
    freezeGuardType,
    freezeGuardContractAddress,
    getTimeDuration,
    publicClient,
    votingStrategy?.timeLockPeriod?.value,
    votingStrategy?.executionPeriod?.value,
  ]);

  const handleInputChange = useCallback(
    (
      field: string,
      inputValue: bigint | undefined,
      existingValue: bigint | undefined,
      otherInputValues: (bigint | undefined)[],
    ) => {
      const newValue = inputValue !== existingValue ? inputValue : undefined;

      setFieldValue(field, newValue);

      // if this chnage results in NONE of the existing values being changed, clear `governor` field
      if (newValue === undefined && otherInputValues.every(value => value === undefined)) {
        setFieldValue('governor', undefined);
      }
    },
    [setFieldValue],
  );

  if (!safe?.address || !governance.type) {
    return (
      <Flex
        h="8.5rem"
        width="100%"
        alignItems="center"
        justifyContent="center"
      >
        <BarLoader />
      </Flex>
    );
  }

  const inputGridContainerProps = {
    width: '100%',
    px: 6,
    mt: 2,
    templateColumns: { base: '1fr', md: '2fr 1fr' },
  };

  return (
    <Box data-testid="dashboard-daoGovernance">
      {existingQuorumPercentage !== undefined && (
        <>
          <Flex alignItems="center">
            <LabelComponent
              isRequired={false}
              label={t('titleQuorum')}
              helper={t('helperQuorumERC20', { ns: 'daoCreate' })}
              gridContainerProps={inputGridContainerProps}
            >
              <InputGroup>
                <BigIntInput
                  value={
                    values.governor?.quorumPercentage !== undefined
                      ? values.governor?.quorumPercentage
                      : existingQuorumPercentage
                  }
                  color={
                    values.governor?.quorumPercentage === undefined
                      ? 'color-neutral-300'
                      : 'color-white'
                  }
                  decimalPlaces={0}
                  onChange={e =>
                    handleInputChange(
                      'governor.quorumPercentage',
                      e.bigintValue,
                      existingQuorumPercentage,
                      [
                        values.governor?.quorumThreshold,
                        values.governor?.votingPeriod,
                        values.governor?.timelockPeriod,
                        values.governor?.executionPeriod,
                      ],
                    )
                  }
                  minWidth="100%"
                />
                <InputRightElement color="color-neutral-700">%</InputRightElement>
              </InputGroup>
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}

      {existingQuorumThreshold !== undefined && (
        <>
          <Flex
            alignItems="center"
            justifyContent="space-between"
            mb="0.25rem"
            gap="0.5rem"
          >
            <LabelComponent
              isRequired={false}
              label={t('titleQuorum')}
              helper={t('helperQuorumERC721', { ns: 'daoCreate' })}
              gridContainerProps={inputGridContainerProps}
            >
              <BigIntInput
                value={
                  values.governor?.quorumThreshold !== undefined
                    ? values.governor?.quorumThreshold
                    : existingQuorumThreshold
                }
                minWidth="100%"
                decimalPlaces={0}
                color={
                  values.governor?.quorumThreshold === undefined
                    ? 'color-neutral-300'
                    : 'color-white'
                }
                onChange={e =>
                  handleInputChange(
                    'governor.quorumThreshold',
                    e.bigintValue,
                    existingQuorumThreshold,
                    [
                      values.governor?.quorumPercentage,
                      values.governor?.votingPeriod,
                      values.governor?.timelockPeriod,
                      values.governor?.executionPeriod,
                    ],
                  )
                }
              />
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}
      {existingVotingPeriod !== undefined && (
        <>
          <Flex
            alignItems="center"
            justifyContent="space-between"
            mb="0.25rem"
            gap="0.5rem"
          >
            <LabelComponent
              isRequired={false}
              label={t('titleVotingPeriod')}
              helper={t('helperVotingPeriod', { ns: 'daoCreate' })}
              gridContainerProps={inputGridContainerProps}
            >
              <DurationUnitStepperInput
                secondsValue={Number(
                  values.governor?.votingPeriod !== undefined
                    ? values.governor?.votingPeriod
                    : existingVotingPeriod,
                )}
                color={
                  values.governor?.votingPeriod === undefined ? 'color-neutral-300' : 'color-white'
                }
                hideSteppers={true}
                onSecondsValueChange={valInSeconds => {
                  handleInputChange(
                    'governor.votingPeriod',
                    valInSeconds !== undefined ? BigInt(valInSeconds) : undefined,
                    existingVotingPeriod,
                    [
                      values.governor?.quorumPercentage,
                      values.governor?.quorumThreshold,
                      values.governor?.timelockPeriod,
                      values.governor?.executionPeriod,
                    ],
                  );
                }}
              />
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}
      {existingTimelockPeriod !== undefined && (
        <>
          <Flex
            alignItems="center"
            justifyContent="space-between"
            mb="0.25rem"
            gap="0.5rem"
          >
            <LabelComponent
              isRequired={false}
              label={t('titleTimelockPeriod')}
              helper={t('helperTimelockPeriod', { ns: 'daoCreate' })}
              gridContainerProps={inputGridContainerProps}
            >
              <DurationUnitStepperInput
                secondsValue={Number(
                  values.governor?.timelockPeriod !== undefined
                    ? values.governor?.timelockPeriod
                    : existingTimelockPeriod,
                )}
                color={
                  values.governor?.timelockPeriod === undefined ? 'color-neutral-300' : 'color-white'
                }
                hideSteppers={true}
                onSecondsValueChange={valInSeconds => {
                  handleInputChange(
                    'governor.timelockPeriod',
                    valInSeconds !== undefined ? BigInt(valInSeconds) : undefined,
                    existingTimelockPeriod,
                    [
                      values.governor?.quorumPercentage,
                      values.governor?.quorumThreshold,
                      values.governor?.votingPeriod,
                      values.governor?.executionPeriod,
                    ],
                  );
                }}
              />
            </LabelComponent>
          </Flex>
          <Divider />
        </>
      )}
      {existingExecutionPeriod !== undefined && (
        <>
          <Flex
            alignItems="center"
            justifyContent="space-between"
            mb="0.25rem"
            gap="0.5rem"
          >
            <LabelComponent
              isRequired={false}
              label={t('titleExecutionPeriod')}
              helper={t('helperExecutionPeriod', { ns: 'daoCreate' })}
              gridContainerProps={inputGridContainerProps}
            >
              <DurationUnitStepperInput
                secondsValue={Number(
                  values.governor?.executionPeriod !== undefined
                    ? values.governor?.executionPeriod
                    : existingExecutionPeriod,
                )}
                color={
                  values.governor?.executionPeriod === undefined
                    ? 'color-neutral-300'
                    : 'color-white'
                }
                hideSteppers={true}
                onSecondsValueChange={valInSeconds =>
                  handleInputChange(
                    'governor.executionPeriod',
                    valInSeconds !== undefined ? BigInt(valInSeconds) : undefined,
                    existingExecutionPeriod,
                    [
                      values.governor?.quorumPercentage,
                      values.governor?.quorumThreshold,
                      values.governor?.timelockPeriod,
                      values.governor?.votingPeriod,
                    ],
                  )
                }
              />
            </LabelComponent>
          </Flex>
        </>
      )}
    </Box>
  );
}
