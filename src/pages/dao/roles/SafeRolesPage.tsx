import * as amplitude from '@amplitude/analytics-browser';
import { Box, Show } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate } from 'react-router-dom';
import { Address, Hex } from 'viem';
import PencilWithLineIcon from '../../../assets/theme/custom/icons/PencilWithLineIcon';
import { RoleCard } from '../../../components/Roles/RoleCard';
import { RoleCardLoading } from '../../../components/Roles/RolePageCard';
import { RolesTable } from '../../../components/Roles/RolesTable';
import NoDataCard from '../../../components/ui/containers/NoDataCard';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { DAO_ROUTES } from '../../../constants/routes';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { analyticsEvents } from '../../../insights/analyticsEvents';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useRolesStore } from '../../../store/roles/useRolesStore';

export function SafeRolesPage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.RolesPageOpened);
  }, []);

  const { rolesTree } = useRolesStore();
  const { addressPrefix } = useNetworkConfigStore();
  const { t } = useTranslation(['roles']);
  const { safeAddress } = useCurrentDAOKey();
  const navigate = useNavigate();

  const { canUserCreateProposal } = useCanUserCreateProposal();

  if (!safeAddress) return null;

  const handleNavigateToRole = (roleId: Hex) =>
    navigate(DAO_ROUTES.rolesDetails.relative(addressPrefix, safeAddress, roleId));

  const rolesTreeLoading = rolesTree === undefined;
  const showNoRolesCard = !rolesTreeLoading && (rolesTree === null || rolesTree.roleItems.length === 0);
  const showRolesTable = !rolesTreeLoading && rolesTree !== null && rolesTree.roleItems.length > 0;

  return (
    <Box>
      <PageHeader
        title={t('roles')}
        breadcrumbs={[
          {
            terminus: t('roles'),
            path: '',
          },
        ]}
        buttonProps={
          canUserCreateProposal
            ? {
                variant: 'secondary',
                size: 'sm',
                leftIcon: (
                  <Box mr="-0.25rem">
                    <PencilWithLineIcon
                      w="1rem"
                      h="1rem"
                    />
                  </Box>
                ),
                gap: 0,
                children: t('editRoles'),
                onClick: () => navigate(DAO_ROUTES.rolesEdit.relative(addressPrefix, safeAddress)),
              }
            : undefined
        }
      />
      {rolesTreeLoading && <RoleCardLoading />}
      {showNoRolesCard && (
        <NoDataCard
          translationNameSpace="roles"
          emptyText="noRoles"
          emptyTextNotProposer="noRolesNotProposer"
        />
      )}

      {showRolesTable && (
        <>
          <Show above="md">
            <RolesTable
              handleRoleClick={handleNavigateToRole as (roleId: Address) => void}
              rolesTree={rolesTree}
            />
          </Show>

          <Show below="md">
            {rolesTree.roleItems.map(roleHat => {
              return (
                <RoleCard
                  key={roleHat.id}
                  name={roleHat.name}
                  wearerAddress={
                    roleHat.roleTerms.currentTerm?.isActive
                      ? roleHat.roleTerms.currentTerm?.nominee
                      : roleHat.wearerAddress
                  }
                  handleRoleClick={() => handleNavigateToRole(roleHat.id)}
                  paymentsCount={roleHat.payments.filter(p => p.isStreaming()).length || undefined}
                  isCurrentTermActive={roleHat.roleTerms.currentTerm?.isActive}
                />
              );
            })}
          </Show>
        </>
      )}
      <Outlet />
    </Box>
  );
}
