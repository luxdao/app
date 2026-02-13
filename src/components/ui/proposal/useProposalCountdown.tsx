import { legacy } from '@luxdao/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getContract } from 'viem';
import { logError } from '../../../helpers/errorLogging';
import useSnapshotProposal from '../../../hooks/DAO/loaders/snapshot/useSnapshotProposal';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import { useSafeTransactions } from '../../../hooks/utils/useSafeTransactions';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useSafeAPI } from '../../../providers/App/hooks/useSafeAPI';
import { useGlobalStore } from '../../../store/store';
import {
  GovernorGovernance,
  GovernorProposal,
  FractalProposal,
  FractalProposalState,
  FreezeGuardType,
} from '../../../types';
import { getGovernorProposalState } from '../../../utils';
import { blocksToSeconds } from '../../../utils/contract';
import { getTxTimelockedTimestamp } from '../../../utils/guard';

export function useProposalCountdown(proposal: FractalProposal) {
  const { daoKey, safeAddress } = useCurrentDAOKey();
  const {
    governance,
    governanceContracts: { moduleGovernorAddress },
    guardContracts: { freezeGuardContractAddress, freezeGuardType },
  } = useDAOStore({ daoKey });
  const { updateProposalState, setProposals } = useGlobalStore();
  const safeApi = useSafeAPI();
  const { parseTransactions } = useSafeTransactions();
  const publicClient = useNetworkPublicClient();

  const [secondsLeft, setSecondsLeft] = useState<number>();
  const { snapshotProposal } = useSnapshotProposal(proposal);
  const governorGovernance = governance as GovernorGovernance;

  let updateStateInterval = useRef<ReturnType<typeof setInterval> | undefined>();
  let countdownInterval = useRef<ReturnType<typeof setInterval> | undefined>();
  useEffect(() => {
    // if it's not a state that requires a countdown, clear the interval and return

    if (
      !(
        proposal.state === FractalProposalState.ACTIVE ||
        proposal.state === FractalProposalState.TIMELOCKED ||
        proposal.state === FractalProposalState.EXECUTABLE
      )
    ) {
      clearInterval(updateStateInterval.current);
      return;
    }
    // if the timer has run out, update proposals on a ten second interval
    // until we need another one
    if (
      secondsLeft !== undefined &&
      secondsLeft < 0 &&
      !updateStateInterval.current &&
      safeAddress &&
      daoKey
    ) {
      updateStateInterval.current = setInterval(() => {
        // Wrap the updateProposalState call in an async IIFE
        (async () => {
          try {
            if (governance.isGovernor && moduleGovernorAddress !== undefined) {
              const governorContract = getContract({
                abi: legacy.abis.Governor,
                address: moduleGovernorAddress,
                client: publicClient,
              });
              const state = await getGovernorProposalState(
                governorContract,
                Number(proposal.proposalId),
              );
              updateProposalState(daoKey, proposal.proposalId, state);
            } else {
              const multisigTransactions = await safeApi.getMultisigTransactions(safeAddress);
              const proposals = await parseTransactions(multisigTransactions);
              setProposals(daoKey, proposals);
            }
          } catch (error) {
            logError('Error updating proposal state:', error);
          }
        })();
      }, 10000);
    } else if (secondsLeft && secondsLeft > 0) {
      // once we've found another countdown state, clear the
      // proposals update timer
      clearInterval(updateStateInterval.current);
      updateStateInterval.current = undefined;
    }

    return () => {
      if (!secondsLeft) {
        clearInterval(updateStateInterval.current);
      }
    };
  }, [
    secondsLeft,
    proposal,
    daoKey,
    safeAddress,
    governance.isGovernor,
    moduleGovernorAddress,
    publicClient,
    safeApi,
    parseTransactions,
    setProposals,
    updateProposalState,
  ]);

  const startCountdown = useCallback((initialTimeMs: number) => {
    countdownInterval.current = setInterval(() => {
      setSecondsLeft(Math.floor((initialTimeMs - Date.now()) / 1000));
    }, 1000);
  }, []);

  const getCountdown = useCallback(async () => {
    const freezeGuard =
      freezeGuardContractAddress !== undefined && freezeGuardType === FreezeGuardType.MULTISIG
        ? getContract({
            abi: legacy.abis.MultisigFreezeGuard,
            address: freezeGuardContractAddress,
            client: publicClient,
          })
        : undefined;

    const isSafeGuard = freezeGuardType === FreezeGuardType.MULTISIG;
    const isGovernorGuard = freezeGuardType === FreezeGuardType.GOVERNOR;

    const timeLockPeriod = governorGovernance.votingStrategy?.timeLockPeriod;
    const votingDeadlineMs = (proposal as GovernorProposal).deadlineMs;

    // If the proposal is active and has a deadline, start the countdown (for Governor proposals)
    if (proposal.state === FractalProposalState.ACTIVE && votingDeadlineMs) {
      startCountdown(votingDeadlineMs);
      return;
    } else if (
      // If the proposal is timelocked and has a deadline, start the countdown (for Governor proposals)
      proposal.state === FractalProposalState.TIMELOCKED &&
      votingDeadlineMs &&
      timeLockPeriod
    ) {
      startCountdown(votingDeadlineMs + Number(timeLockPeriod.value) * 1000);
      // If the proposal is timelocked start the countdown (for safe multisig proposals with guards)
      return;
    } else if (proposal.state === FractalProposalState.TIMELOCKED && freezeGuard && isSafeGuard) {
      const safeGuard = freezeGuard;

      const [timelockedTimestamp, timelockPeriod] = await Promise.all([
        getTxTimelockedTimestamp(proposal, safeGuard.address, publicClient),
        safeGuard.read.timelockPeriod(),
      ]);

      const guardTimeLockPeriod = await blocksToSeconds(timelockPeriod, publicClient);
      startCountdown(timelockedTimestamp * 1000 + guardTimeLockPeriod * 1000);

      // If the proposal is executable start the countdown (for safe multisig proposals with guards)
      return;
    } else if (proposal.state === FractalProposalState.EXECUTABLE && freezeGuard) {
      let guardTimelockPeriod: number = 0;
      if (isSafeGuard) {
        const safeGuard = freezeGuard;
        const timelockedTimestamp =
          (await getTxTimelockedTimestamp(proposal, safeGuard.address, publicClient)) * 1000;
        const safeGuardTimelockPeriod =
          (await blocksToSeconds(await safeGuard.read.timelockPeriod(), publicClient)) * 1000;
        const guardExecutionPeriod =
          (await blocksToSeconds(await safeGuard.read.executionPeriod(), publicClient)) * 1000;
        guardTimelockPeriod = timelockedTimestamp + safeGuardTimelockPeriod + guardExecutionPeriod;

        // If the proposal is executing start the countdown (for Governor proposals with guards)
        return;
      } else if (isGovernorGuard && timeLockPeriod && votingDeadlineMs) {
        guardTimelockPeriod = Number(timeLockPeriod.value) * 1000 + votingDeadlineMs;
      }
      startCountdown(guardTimelockPeriod);
      return;
    } else if (snapshotProposal !== null && proposal.state === FractalProposalState.PENDING) {
      startCountdown(snapshotProposal.startTime * 1000);
      return;
    } else if (snapshotProposal !== null) {
      startCountdown(snapshotProposal.endTime * 1000);
      return;
    }
  }, [
    governorGovernance.votingStrategy?.timeLockPeriod,
    freezeGuardContractAddress,
    freezeGuardType,
    proposal,
    publicClient,
    snapshotProposal,
    startCountdown,
  ]);

  useEffect(() => {
    // continually calculates the initial time (in ms) - the current time (in ms)
    // then converts it to seconds, all on a 1 second interval
    getCountdown();

    return () => {
      clearInterval(countdownInterval.current);
    };
  }, [getCountdown]);

  return secondsLeft;
}
