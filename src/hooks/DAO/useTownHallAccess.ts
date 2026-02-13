import { useAccount } from 'wagmi';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';

export type MembershipType = 'signer' | 'tokenHolder' | 'hatsRole' | null;

interface TownHallAccess {
  hasAccess: boolean;
  isLoading: boolean;
  membershipType: MembershipType;
}

export function useTownHallAccess(): TownHallAccess {
  const { address } = useAccount();
  const { safe } = useDaoInfoStore();

  const isSigner = safe?.owners?.some(
    owner => owner.toLowerCase() === address?.toLowerCase(),
  ) ?? false;

  // TODO: Add governance token balance check
  // TODO: Add Hats role check

  return {
    hasAccess: isSigner,
    isLoading: false,
    membershipType: isSigner ? 'signer' : null,
  };
}
