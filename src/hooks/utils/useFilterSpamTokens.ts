import { useCallback, useMemo } from 'react';
import { Address } from 'viem';
import { useDAOStore } from '../../providers/App/AppProvider';
import { GovernorGovernance, GovernanceType, TokenBalance } from '../../types';
import { useCurrentDAOKey } from '../DAO/useCurrentDAOKey';

interface TokenListFilterOptions {
  includeNativeToken?: boolean;
  includeZeroBalanceToken?: boolean;
}

/**
 * Filter out spam tokens. DAO's governance tokens will be included.
 */
export function useFilterSpamTokens(options: TokenListFilterOptions = {}) {
  const { includeNativeToken = false, includeZeroBalanceToken = false } = options;
  const { daoKey } = useCurrentDAOKey();
  const { governance } = useDAOStore({ daoKey });
  const voteTokens: Address[] = useMemo(() => {
    const tokens: Address[] = [];
    if (governance.type === GovernanceType.GOVERNOR_ERC20) {
      const votesToken = (governance as GovernorGovernance).votesToken;
      if (votesToken) {
        tokens.push(votesToken.address);
      }
    } else if (governance.type === GovernanceType.GOVERNOR_ERC721) {
      const erc721Tokens = (governance as GovernorGovernance).erc721Tokens;
      if (erc721Tokens) {
        erc721Tokens.map(t => t.address).forEach(address => tokens.push(address));
      }
    }

    return tokens;
    // We know vote token addresses are loaded once the type is determined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [governance.type]);

  const tokenListFilter = useCallback(
    (tokens: TokenBalance[]) => {
      return tokens.filter(asset => {
        const passNativeCheck = includeNativeToken || !asset.nativeToken;
        const passBalanceCheck = includeZeroBalanceToken || parseFloat(asset.balance) > 0;

        const passSpamDetection = !asset.possibleSpam;
        const passAsciiNameCheck = Array.from(asset.symbol).every(char => char.charCodeAt(0) < 128);
        const passSpamCheck =
          voteTokens.includes(asset.tokenAddress) || (passSpamDetection && passAsciiNameCheck);

        return passSpamCheck && passBalanceCheck && passNativeCheck;
      });
    },
    [includeNativeToken, voteTokens, includeZeroBalanceToken],
  );

  return tokenListFilter;
}
