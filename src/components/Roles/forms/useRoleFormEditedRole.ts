import { useFormikContext } from 'formik';
import { useMemo } from 'react';
import {
  DAOTree,
  EditBadgeStatus,
  EditedRole,
  EditedRoleFieldNames,
  RoleFormValues,
} from '../../../types/roles';

const addRemoveField = (
  fieldNames: EditedRoleFieldNames[],
  fieldName: EditedRoleFieldNames,
  hasChanges: boolean,
): EditedRoleFieldNames[] => {
  if (fieldNames.includes(fieldName) && !hasChanges) {
    return fieldNames.filter(field => field !== fieldName);
  } else if (!fieldNames.includes(fieldName) && !hasChanges) {
    return fieldNames;
  }
  return [...fieldNames, fieldName];
};

export function useRoleFormEditedRole({ rolesTree }: { rolesTree: DAOTree | undefined | null }) {
  const { values } = useFormikContext<RoleFormValues>();
  const existingRole = useMemo(
    () =>
      rolesTree?.roleItems.find(role => !!values.roleEditing && role.id === values.roleEditing.id),
    [values.roleEditing, rolesTree],
  );
  const isRoleNameUpdated = !!existingRole && values.roleEditing?.name !== existingRole.name;

  const isRoleDescriptionUpdated =
    !!existingRole && values.roleEditing?.description !== existingRole.description;

  const isMemberUpdated =
    !!existingRole && values.roleEditing?.resolvedWearer !== existingRole.wearerAddress;

  const isPaymentsUpdated = useMemo(() => {
    if (!values.roleEditing || !values.roleEditing.payments) {
      return false;
    }
    return values.roleEditing.payments.some(payment => {
      const hasBeenSetToCancel = payment.isCancelling;
      const isNewPayment = !payment.streamId;
      return hasBeenSetToCancel || isNewPayment;
    });
  }, [values.roleEditing]);

  const isRoleTypeUpdated = useMemo(() => {
    const isTermToggled = !!values.roleEditing?.isTermed;
    const isExistingRoleNotTerm = !!existingRole && !existingRole.isTermed;
    return isExistingRoleNotTerm && isTermToggled;
  }, [existingRole, values.roleEditing]);

  const isRoleTermUpdated = useMemo(() => {
    return (
      !!existingRole &&
      !isRoleTypeUpdated &&
      values.roleEditing?.roleTerms?.length !== existingRole.roleTerms.allTerms.length
    );
  }, [existingRole, isRoleTypeUpdated, values.roleEditing]);

  const isCanCreateProposalsUpdated =
    !!existingRole &&
    values.roleEditing?.canCreateProposals !== existingRole.canCreateProposals;

  const editedRoleData = useMemo<EditedRole>(() => {
    if (!existingRole) {
      return {
        fieldNames: [],
        status: EditBadgeStatus.New,
      };
    }
    let fieldNames: EditedRoleFieldNames[] = [];
    fieldNames = addRemoveField(fieldNames, 'roleName', isRoleNameUpdated);
    fieldNames = addRemoveField(fieldNames, 'roleDescription', isRoleDescriptionUpdated);
    fieldNames = addRemoveField(fieldNames, 'member', isMemberUpdated);
    fieldNames = addRemoveField(fieldNames, 'payments', isPaymentsUpdated);
    fieldNames = addRemoveField(fieldNames, 'roleType', isRoleTypeUpdated);
    fieldNames = addRemoveField(fieldNames, 'newTerm', isRoleTermUpdated);
    fieldNames = addRemoveField(fieldNames, 'canCreateProposals', isCanCreateProposalsUpdated);

    return {
      fieldNames,
      status: EditBadgeStatus.Updated,
    };
  }, [
    existingRole,
    isRoleNameUpdated,
    isRoleDescriptionUpdated,
    isMemberUpdated,
    isPaymentsUpdated,
    isRoleTypeUpdated,
    isRoleTermUpdated,
    isCanCreateProposalsUpdated,
  ]);

  const isRoleUpdated = useMemo(() => {
    return (
      !!isRoleNameUpdated ||
      !!isRoleDescriptionUpdated ||
      !!isMemberUpdated ||
      !!isPaymentsUpdated ||
      !!isRoleTypeUpdated ||
      !!isRoleTermUpdated ||
      !!isCanCreateProposalsUpdated
    );
  }, [
    isRoleNameUpdated,
    isRoleDescriptionUpdated,
    isMemberUpdated,
    isPaymentsUpdated,
    isRoleTypeUpdated,
    isRoleTermUpdated,
    isCanCreateProposalsUpdated,
  ]);

  return {
    existingRole,
    editedRoleData,
    isRoleUpdated,
  };
}
