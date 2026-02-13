import { Address, PublicClient, getContract } from 'viem';
import GnosisSafeL2Abi from '../assets/abi/GnosisSafeL2';
import GnosisSafeProxyFactoryAbi from '../assets/abi/GnosisSafeProxyFactory';
import { getRandomBytes } from '../helpers';
import {
  GovernorERC20DAO,
  GovernorERC721DAO,
  SafeMultisigDAO,
  SafeTransaction,
  SubDAO,
  VotingStrategyType,
} from '../types';
import { GovernorTxBuilder } from './GovernorTxBuilder';
import { BaseTxBuilder } from './BaseTxBuilder';
import { DaoTxBuilder } from './DaoTxBuilder';
import { FreezeGuardTxBuilder } from './FreezeGuardTxBuilder';
import { MultisigTxBuilder } from './MultisigTxBuilder';
import { safeData } from './helpers/safeData';

export class TxBuilderFactory extends BaseTxBuilder {
  private readonly saltNum: bigint;

  // Safe Data
  public predictedSafeAddress: Address | undefined;
  public createSafeTx: SafeTransaction | undefined;
  private safeContractAddress: Address | undefined;
  private compatibilityFallbackHandler: Address;
  private votesErc20MasterCopy: Address;
  private keyValuePairs: Address;
  private gnosisSafeProxyFactory: Address;
  private gnosisSafeProxy: Address;
  private moduleProxyFactory: Address;
  private freezeGuardGovernorMasterCopy: Address;
  private freezeGuardMultisigMasterCopy: Address;
  private freezeVotingErc20MasterCopy: Address;
  private freezeVotingErc721MasterCopy: Address;
  private freezeVotingMultisigMasterCopy: Address;
  private multiSendCallOnly: Address;
  private claimErc20MasterCopy: Address;
  private moduleFractalMasterCopy: Address;
  private linearVotingErc20MasterCopy: Address;
  private linearVotingErc721MasterCopy: Address;
  private moduleGovernorMasterCopy: Address;
  private votesErc20LockableMasterCopy?: Address;

  constructor(
    publicClient: PublicClient,
    isGovernor: boolean,
    daoData: SafeMultisigDAO | GovernorERC20DAO | GovernorERC721DAO | SubDAO,
    compatibilityFallbackHandler: Address,
    votesErc20MasterCopy: Address,
    keyValuePairs: Address,
    gnosisSafeProxyFactory: Address,
    gnosisSafeProxy: Address,
    moduleProxyFactory: Address,
    freezeGuardGovernorMasterCopy: Address,
    freezeGuardMultisigMasterCopy: Address,
    freezeVotingErc20MasterCopy: Address,
    freezeVotingErc721MasterCopy: Address,
    freezeVotingMultisigMasterCopy: Address,
    multiSendCallOnly: Address,
    claimErc20MasterCopy: Address,
    moduleFractalMasterCopy: Address,
    linearVotingErc20MasterCopy: Address,
    linearVotingErc721MasterCopy: Address,
    moduleGovernorMasterCopy: Address,
    votesErc20LockableMasterCopy?: Address,
    parentAddress?: Address,
    parentTokenAddress?: Address,
  ) {
    super(publicClient, isGovernor, daoData, parentAddress, parentTokenAddress);
    this.saltNum = getRandomBytes();

    this.compatibilityFallbackHandler = compatibilityFallbackHandler;
    this.votesErc20MasterCopy = votesErc20MasterCopy;
    this.votesErc20LockableMasterCopy = votesErc20LockableMasterCopy;
    this.keyValuePairs = keyValuePairs;
    this.gnosisSafeProxyFactory = gnosisSafeProxyFactory;
    this.gnosisSafeProxy = gnosisSafeProxy;
    this.moduleProxyFactory = moduleProxyFactory;
    this.freezeGuardGovernorMasterCopy = freezeGuardGovernorMasterCopy;
    this.freezeGuardMultisigMasterCopy = freezeGuardMultisigMasterCopy;
    this.freezeVotingErc20MasterCopy = freezeVotingErc20MasterCopy;
    this.freezeVotingErc721MasterCopy = freezeVotingErc721MasterCopy;
    this.freezeVotingMultisigMasterCopy = freezeVotingMultisigMasterCopy;
    this.multiSendCallOnly = multiSendCallOnly;
    this.claimErc20MasterCopy = claimErc20MasterCopy;
    this.moduleFractalMasterCopy = moduleFractalMasterCopy;
    this.linearVotingErc20MasterCopy = linearVotingErc20MasterCopy;
    this.linearVotingErc721MasterCopy = linearVotingErc721MasterCopy;
    this.moduleGovernorMasterCopy = moduleGovernorMasterCopy;
  }

  public setSafeContract(safeAddress: Address) {
    this.safeContractAddress = safeAddress;
  }

  public async setupSafeData() {
    const safeProxyFactoryContract = getContract({
      abi: GnosisSafeProxyFactoryAbi,
      address: this.gnosisSafeProxyFactory,
      client: this.publicClient,
    });
    const safeSingletonContract = getContract({
      abi: GnosisSafeL2Abi,
      address: this.gnosisSafeProxy,
      client: this.publicClient,
    });
    const { predictedSafeAddress, createSafeTx } = await safeData(
      this.multiSendCallOnly,
      safeProxyFactoryContract,
      safeSingletonContract,
      this.daoData as SafeMultisigDAO,
      this.saltNum,
      this.compatibilityFallbackHandler,
      this.isGovernor,
    );

    this.predictedSafeAddress = predictedSafeAddress;
    this.createSafeTx = createSafeTx;

    this.setSafeContract(predictedSafeAddress);
  }

  public createDaoTxBuilder({
    attachFractalModule,
    parentStrategyType,
    parentStrategyAddress,
  }: {
    attachFractalModule?: boolean;
    parentStrategyType?: VotingStrategyType;
    parentStrategyAddress?: Address;
  }) {
    return new DaoTxBuilder(
      this.publicClient,
      this.isGovernor,
      this.daoData,
      this.saltNum,
      this.createSafeTx!,
      this.safeContractAddress!,
      this,
      this.keyValuePairs,
      this.moduleProxyFactory,
      this.multiSendCallOnly,
      this.moduleFractalMasterCopy,
      attachFractalModule,
      this.parentAddress,
      this.parentTokenAddress,
      parentStrategyType,
      parentStrategyAddress,
    );
  }

  public createFreezeGuardTxBuilder(
    governorAddress?: Address,
    strategyAddress?: Address,
    parentStrategyType?: VotingStrategyType,
    parentStrategyAddress?: Address, // User only with ERC-721 parent
  ) {
    return new FreezeGuardTxBuilder(
      this.publicClient,
      this.daoData as SubDAO,
      this.safeContractAddress!,
      this.saltNum,
      this.parentAddress!,
      this.moduleProxyFactory,
      this.freezeGuardGovernorMasterCopy,
      this.freezeGuardMultisigMasterCopy,
      this.freezeVotingErc20MasterCopy,
      this.freezeVotingErc721MasterCopy,
      this.freezeVotingMultisigMasterCopy,
      this.isGovernor,
      this.parentTokenAddress,
      governorAddress,
      strategyAddress,
      parentStrategyType,
      parentStrategyAddress,
    );
  }

  public createMultiSigTxBuilder() {
    return new MultisigTxBuilder(
      this.multiSendCallOnly,
      this.daoData as SafeMultisigDAO,
      this.safeContractAddress!,
    );
  }

  public async createGovernorTxBuilder() {
    const governorTxBuilder = new GovernorTxBuilder(
      this.publicClient,
      this.daoData as GovernorERC20DAO,
      this.safeContractAddress!,
      this.votesErc20MasterCopy,
      this.moduleProxyFactory,
      this.multiSendCallOnly,
      this.claimErc20MasterCopy,
      this.linearVotingErc20MasterCopy,
      this.linearVotingErc721MasterCopy,
      this.moduleGovernorMasterCopy,
      this.votesErc20LockableMasterCopy,
      this.parentAddress,
      this.parentTokenAddress,
    );

    await governorTxBuilder.init();
    return governorTxBuilder;
  }
}
