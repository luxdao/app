import { Box } from '@chakra-ui/react';
import { Formik } from 'formik';

import { useDAOCreateSchema } from '../../hooks/schemas/DAOCreate/useDAOCreateSchema';
import {
  GovernorERC20DAO,
  GovernorERC721DAO,
  CreatorFormState,
  DAOTrigger,
  GovernanceType,
  SafeMultisigDAO,
  SubDAO,
} from '../../types';
import StepController from './StepController';
import { initialState } from './constants';
import { DAOCreateMode } from './formComponents/EstablishEssentials';
import { useParentSafeVotingWeight } from './hooks/useParentSafeVotingWeight';
import { usePrepareFormData } from './hooks/usePrepareFormData';

function DaoCreator({
  deployDAO,
  pending,
  isSubDAO,
  mode,
}: {
  pending?: boolean;
  deployDAO: DAOTrigger;
  isSubDAO?: boolean;
  mode: DAOCreateMode;
}) {
  const { totalParentVotingWeight } = useParentSafeVotingWeight();

  const { createDAOValidation } = useDAOCreateSchema({
    isSubDAO: !!isSubDAO,
    totalParentVotingWeight,
  });

  const { prepareMultisigFormData, prepareGovernorERC20FormData, prepareGovernorERC721FormData } =
    usePrepareFormData();

  return (
    <Box>
      <Formik<CreatorFormState>
        initialValues={initialState}
        validationSchema={createDAOValidation}
        onSubmit={async values => {
          const choosenGovernance = values.essentials.governance;
          const freezeGuard = isSubDAO ? values.freeze : undefined;

          let daoData: SafeMultisigDAO | GovernorERC20DAO | GovernorERC721DAO | SubDAO | undefined;
          let customNonce =
            mode === DAOCreateMode.EDIT || freezeGuard !== undefined
              ? values.multisig.customNonce
              : undefined;

          switch (choosenGovernance) {
            case GovernanceType.MULTISIG:
              daoData = await prepareMultisigFormData({
                ...values.essentials,
                ...values.multisig,
                freezeGuard,
              });
              break;

            case GovernanceType.GOVERNOR_ERC20:
              daoData = await prepareGovernorERC20FormData({
                ...values.essentials,
                ...values.governor,
                ...values.erc20Token,
                freezeGuard,
              });
              break;

            case GovernanceType.GOVERNOR_ERC721:
              daoData = await prepareGovernorERC721FormData({
                ...values.essentials,
                ...values.governor,
                ...values.erc721Token,
                freezeGuard,
              });
              break;
          }

          if (daoData) {
            deployDAO(daoData, customNonce);
          }
        }}
        enableReinitialize
        validateOnMount
      >
        {({ handleSubmit, ...rest }) => (
          <form onSubmit={handleSubmit}>
            <StepController
              transactionPending={pending}
              isSubDAO={isSubDAO}
              mode={mode}
              {...rest}
            />
          </form>
        )}
      </Formik>
    </Box>
  );
}

export default DaoCreator;
