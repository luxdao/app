import { Address, encodeFunctionData } from 'viem';
import { SablierV2LockupLinearAbi } from '../../assets/abi/SablierV2LockupLinear';
import { convertStreamIdToBigInt } from '../../hooks/streams/useCreateSablierStream';
import { CreateProposalActionData, ProposalActionType } from '../../types';

interface WithdrawStreamData {
  daoAddress: Address;
  roleSmartAccountAddress: Address;
  paymentContractAddress: Address;
  streamId: string;
  nonceInput?: number; // this is only releveant when the caller action results in a proposal
}

/**
 * Prepare the data for a withdraw stream action.
 */
export const prepareWithdrawToDAOActionData = ({
  daoAddress,
  streamId,
  roleSmartAccountAddress,
  paymentContractAddress,
}: WithdrawStreamData): CreateProposalActionData => {
  const rolesAccountCalldata = encodeFunctionData({
    abi: SablierV2LockupLinearAbi,
    functionName: 'withdrawMax',
    args: [convertStreamIdToBigInt(streamId), daoAddress],
  });

  const action: CreateProposalActionData = {
    actionType: ProposalActionType.WITHDRAW_STREAM,
    transactions: [
      {
        targetAddress: roleSmartAccountAddress,
        ethValue: {
          bigintValue: 0n,
          value: '0',
        },
        functionName: 'execute',
        parameters: [
          { signature: 'address', value: paymentContractAddress },
          { signature: 'uint256', value: '0' },
          { signature: 'bytes', value: rolesAccountCalldata },
          { signature: 'uint8', value: '0' },
        ],
      },
    ],
  };

  return action;
};
