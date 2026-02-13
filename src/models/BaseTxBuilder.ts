import { Address, PublicClient } from 'viem';
import { SafeMultisigDAO, SubDAO, GovernorERC20DAO, GovernorERC721DAO } from '../types';

export class BaseTxBuilder {
  protected readonly publicClient: PublicClient;
  protected readonly isGovernor: boolean;
  protected readonly daoData: SafeMultisigDAO | GovernorERC20DAO | GovernorERC721DAO | SubDAO;
  protected readonly parentAddress?: Address;
  protected readonly parentTokenAddress?: Address;

  constructor(
    publicClient: PublicClient,
    isGovernor: boolean,
    daoData: SafeMultisigDAO | GovernorERC20DAO | GovernorERC721DAO | SubDAO,
    parentAddress?: Address,
    parentTokenAddress?: Address,
  ) {
    this.publicClient = publicClient;
    this.daoData = daoData;
    this.isGovernor = isGovernor;
    this.parentAddress = parentAddress;
    this.parentTokenAddress = parentTokenAddress;
  }
}
