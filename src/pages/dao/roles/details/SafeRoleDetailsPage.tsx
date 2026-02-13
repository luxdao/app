import { useSearchParams } from 'react-router-dom';
import RolesDetails from '../../../../components/Roles/RoleDetails';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useRolesStore } from '../../../../store/roles/useRolesStore';

export function SafeRoleDetailsPage() {
  const { safeAddress } = useCurrentDAOKey();

  const { rolesTree } = useRolesStore();
  const [searchParams] = useSearchParams();
  const roleId = searchParams.get('roleId');
  const roleHat = rolesTree?.roleItems.find(hat => hat.id === roleId);

  // @todo add logic for loading
  // @todo add redirect for hat not found
  if (!roleHat || !safeAddress) return null;

  return <RolesDetails roleHat={{ ...roleHat, wearer: roleHat.wearerAddress }} />;
}
