import { legacy } from '@luxdao/contracts';
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getCreate2Address,
  Hex,
  keccak256,
  parseAbiParameters,
  PublicClient,
} from 'viem';
import GnosisSafeL2Abi from '../assets/abi/GnosisSafeL2';
import { ModuleProxyFactoryAbi } from '../assets/abi/ModuleProxyFactoryAbi';
import { buildContractCall } from '../helpers';
import { SafeTransaction, SubDAO, VotingStrategyType } from '../types';
import { BaseTxBuilder } from './BaseTxBuilder';
import { generateContractByteCodeLinear, generateSalt } from './helpers/utils';

export class FreezeGuardTxBuilder extends BaseTxBuilder {
  // Salt used to generate transactions
  private readonly saltNum;

  // Safe Data
  private readonly safeContractAddress: Address;

  // Freeze Voting Data
  private freezeVotingType: 'multisig' | 'erc721' | 'erc20' | undefined;
  private freezeVotingCallData: Hex | undefined;
  private freezeVotingAddress: Address | undefined;

  // Freeze Guard Data
  private freezeGuardCallData: Hex | undefined;
  private freezeGuardAddress: Address | undefined;

  // Governor Data
  private governorAddress: Address | undefined;
  private strategyAddress: Address | undefined;

  private parentStrategyType: VotingStrategyType | undefined;
  private parentStrategyAddress: Address | undefined;

  private moduleProxyFactory: Address;
  private freezeGuardGovernorMasterCopy: Address;
  private freezeGuardMultisigMasterCopy: Address;
  private freezeVotingErc20MasterCopy: Address;
  private freezeVotingErc721MasterCopy: Address;
  private freezeVotingMultisigMasterCopy: Address;

  constructor(
    publicClient: PublicClient,
    daoData: SubDAO,
    safeContractAddress: Address,
    saltNum: bigint,
    parentAddress: Address,

    moduleProxyFactory: Address,
    freezeGuardGovernorMasterCopy: Address,
    freezeGuardMultisigMasterCopy: Address,
    freezeVotingErc20MasterCopy: Address,
    freezeVotingErc721MasterCopy: Address,
    freezeVotingMultisigMasterCopy: Address,

    isGovernor: boolean,
    parentTokenAddress?: Address,
    governorAddress?: Address,
    strategyAddress?: Address,
    parentStrategyType?: VotingStrategyType,
    parentStrategyAddress?: Address,
  ) {
    super(publicClient, isGovernor, daoData, parentAddress, parentTokenAddress);

    this.safeContractAddress = safeContractAddress;
    this.saltNum = saltNum;
    this.governorAddress = governorAddress;
    this.strategyAddress = strategyAddress;
    this.parentStrategyType = parentStrategyType;
    this.parentStrategyAddress = parentStrategyAddress;
    this.moduleProxyFactory = moduleProxyFactory;
    this.freezeGuardGovernorMasterCopy = freezeGuardGovernorMasterCopy;
    this.freezeGuardMultisigMasterCopy = freezeGuardMultisigMasterCopy;
    this.freezeVotingErc20MasterCopy = freezeVotingErc20MasterCopy;
    this.freezeVotingErc721MasterCopy = freezeVotingErc721MasterCopy;
    this.freezeVotingMultisigMasterCopy = freezeVotingMultisigMasterCopy;

    this.initFreezeVotesData();
  }

  initFreezeVotesData() {
    this.setFreezeVotingTypeAndCallData();
    this.setFreezeVotingAddress();
    this.setFreezeGuardData();
    this.setFreezeGuardAddress();
  }

  public buildDeployModuleTx(): SafeTransaction {
    if (!this.freezeVotingCallData) {
      throw new Error('Freeze voting calldata not set');
    }

    let freezeVotingMasterCopy: Address;
    switch (this.freezeVotingType) {
      case 'erc20':
        freezeVotingMasterCopy = this.freezeVotingErc20MasterCopy;
        break;
      case 'erc721':
        freezeVotingMasterCopy = this.freezeVotingErc721MasterCopy;
        break;
      case 'multisig':
        freezeVotingMasterCopy = this.freezeVotingMultisigMasterCopy;
        break;
      default:
        throw new Error('Unsupported freeze voting type');
    }

    return buildContractCall({
      target: this.moduleProxyFactory,
      encodedFunctionData: encodeFunctionData({
        functionName: 'deployModule',
        args: [freezeVotingMasterCopy, this.freezeVotingCallData, this.saltNum],
        abi: ModuleProxyFactoryAbi,
      }),
    });
  }

  public buildFreezeVotingSetupTx(): SafeTransaction {
    const subDaoData = this.daoData as SubDAO;

    const parentStrategyAddress =
      this.parentStrategyType === VotingStrategyType.LINEAR_ERC721
        ? this.parentStrategyAddress
        : (this.parentTokenAddress ?? this.parentAddress);
    if (!this.parentAddress || !parentStrategyAddress || !this.freezeVotingAddress) {
      throw new Error(
        'Error building contract call for setting up freeze voting - required addresses were not provided.',
      );
    }

    const encodedSetupFunctionArgs = encodeAbiParameters(
      parseAbiParameters('address, uint256, uint32, uint32, address'),
      [
        this.parentAddress, // Owner -- Parent DAO
        subDaoData.freezeVotesThreshold, // FreezeVotesThreshold
        Number(subDaoData.freezeProposalPeriod), // FreezeProposalPeriod
        Number(subDaoData.freezePeriod), // FreezePeriod
        parentStrategyAddress, // Parent Votes Token or Parent Safe Address
      ],
    );

    if (this.freezeVotingType === 'erc20') {
      return buildContractCall({
        target: this.freezeVotingAddress,
        encodedFunctionData: encodeFunctionData({
          functionName: 'setUp',
          args: [encodedSetupFunctionArgs],
          abi: legacy.abis.ERC20FreezeVoting,
        }),
      });
    } else if (this.freezeVotingType === 'erc721') {
      return buildContractCall({
        target: this.freezeVotingAddress,
        encodedFunctionData: encodeFunctionData({
          functionName: 'setUp',
          args: [encodedSetupFunctionArgs],
          abi: legacy.abis.ERC721FreezeVoting,
        }),
      });
    } else if (this.freezeVotingType === 'multisig') {
      return buildContractCall({
        target: this.freezeVotingAddress,
        encodedFunctionData: encodeFunctionData({
          functionName: 'setUp',
          args: [encodedSetupFunctionArgs],
          abi: legacy.abis.MultisigFreezeVoting,
        }),
      });
    } else {
      throw new Error('Unsupported freeze voting type');
    }
  }

  public buildSetGuardTx(address: Address): SafeTransaction {
    if (!this.freezeGuardAddress) {
      throw new Error('Freeze guard address not set');
    }

    return buildContractCall({
      target: address,
      encodedFunctionData: encodeFunctionData({
        functionName: 'setGuard',
        args: [this.freezeGuardAddress],
        abi: legacy.abis.Governor,
      }),
    });
  }

  public buildSetGuardTxSafe(safeAddress: Address): SafeTransaction {
    if (!this.freezeGuardAddress) {
      throw new Error('Freeze guard address not set');
    }

    return buildContractCall({
      target: safeAddress,
      encodedFunctionData: encodeFunctionData({
        functionName: 'setGuard',
        args: [this.freezeGuardAddress],
        abi: GnosisSafeL2Abi,
      }),
    });
  }

  public buildDeployFreezeGuardTx() {
    if (!this.freezeGuardCallData) {
      throw new Error('Freeze guard call data not set');
    }

    return buildContractCall({
      target: this.moduleProxyFactory,
      encodedFunctionData: encodeFunctionData({
        functionName: 'deployModule',
        args: [this.getGuardMasterCopyAddress(), this.freezeGuardCallData, this.saltNum],
        abi: ModuleProxyFactoryAbi,
      }),
    });
  }

  /**
   * Methods to generate freeze voting and guard addresses
   * As well as calldata needed to create deploy Txs
   */

  private setFreezeVotingTypeAndCallData() {
    if (this.parentStrategyType) {
      if (
        this.parentStrategyType === VotingStrategyType.LINEAR_ERC20 ||
        this.parentStrategyType === VotingStrategyType.LINEAR_ERC20_ROLES_WHITELISTING
      ) {
        this.freezeVotingType = 'erc20';
        this.freezeVotingCallData = encodeFunctionData({
          abi: legacy.abis.ERC20FreezeVoting,
          functionName: 'owner',
        });
      } else if (
        this.parentStrategyType === VotingStrategyType.LINEAR_ERC721 ||
        this.parentStrategyType === VotingStrategyType.LINEAR_ERC721_ROLES_WHITELISTING
      ) {
        this.freezeVotingType = 'erc721';
        this.freezeVotingCallData = encodeFunctionData({
          abi: legacy.abis.ERC721FreezeVoting,
          functionName: 'owner',
        });
      }
    } else {
      this.freezeVotingType = 'multisig';
      this.freezeVotingCallData = encodeFunctionData({
        abi: legacy.abis.MultisigFreezeVoting,
        functionName: 'owner',
      });
    }
  }

  private setFreezeVotingAddress() {
    let freezeVotingByteCodeLinear: Hex;
    if (this.parentStrategyType) {
      if (
        this.parentStrategyType === VotingStrategyType.LINEAR_ERC20 ||
        this.parentStrategyType === VotingStrategyType.LINEAR_ERC20_ROLES_WHITELISTING
      ) {
        freezeVotingByteCodeLinear = generateContractByteCodeLinear(
          this.freezeVotingErc20MasterCopy,
        );
      } else if (
        this.parentStrategyType === VotingStrategyType.LINEAR_ERC721 ||
        this.parentStrategyType === VotingStrategyType.LINEAR_ERC721_ROLES_WHITELISTING
      ) {
        freezeVotingByteCodeLinear = generateContractByteCodeLinear(
          this.freezeVotingErc721MasterCopy,
        );
      } else {
        throw new Error('Unknown voting parentStrategyType');
      }
    } else {
      freezeVotingByteCodeLinear = generateContractByteCodeLinear(
        this.freezeVotingMultisigMasterCopy,
      );
    }

    this.freezeVotingAddress = getCreate2Address({
      from: this.moduleProxyFactory,
      salt: generateSalt(this.freezeVotingCallData!, this.saltNum),
      bytecodeHash: keccak256(encodePacked(['bytes'], [freezeVotingByteCodeLinear])),
    });
  }

  private setFreezeGuardAddress() {
    const freezeGuardByteCodeLinear = generateContractByteCodeLinear(
      this.getGuardMasterCopyAddress(),
    );
    const freezeGuardSalt = generateSalt(this.freezeGuardCallData!, this.saltNum);

    this.freezeGuardAddress = getCreate2Address({
      from: this.moduleProxyFactory,
      salt: freezeGuardSalt,
      bytecodeHash: keccak256(encodePacked(['bytes'], [freezeGuardByteCodeLinear])),
    });
  }

  private setFreezeGuardData() {
    if (this.governorAddress) {
      this.setFreezeGuardCallDataGovernor();
    } else {
      this.setFreezeGuardCallDataMultisig();
    }
  }

  private setFreezeGuardCallDataMultisig() {
    const subDaoData = this.daoData as SubDAO;

    if (!this.parentAddress || !this.freezeVotingAddress) {
      throw new Error(
        'Error encoding freeze guard call data - parent address or freeze voting address not provided',
      );
    }

    const freezeGuardCallData = encodeFunctionData({
      abi: legacy.abis.MultisigFreezeGuard,
      functionName: 'setUp',
      args: [
        encodeAbiParameters(parseAbiParameters('uint32, uint32, address, address, address'), [
          Number(subDaoData.timelockPeriod), // Timelock Period
          Number(subDaoData.executionPeriod), // Execution Period
          this.parentAddress, // Owner -- Parent DAO
          this.freezeVotingAddress, // Freeze Voting
          this.safeContractAddress, // Safe
        ]),
      ],
    });

    this.freezeGuardCallData = freezeGuardCallData;
  }

  private setFreezeGuardCallDataGovernor() {
    if (
      !this.parentAddress ||
      !this.freezeVotingAddress ||
      !this.strategyAddress ||
      !this.governorAddress
    ) {
      throw new Error(
        'Error encoding freeze guard call data - required addresses were not provided',
      );
    }

    const freezeGuardCallData = encodeFunctionData({
      abi: legacy.abis.GovernorFreezeGuard,
      functionName: 'setUp',
      args: [
        encodeAbiParameters(parseAbiParameters('address, address'), [
          this.parentAddress, // Owner -- Parent DAO
          this.freezeVotingAddress, // Freeze Voting
        ]),
      ],
    });

    this.freezeGuardCallData = freezeGuardCallData;
  }

  private getGuardMasterCopyAddress() {
    return this.isGovernor ? this.freezeGuardGovernorMasterCopy : this.freezeGuardMultisigMasterCopy;
  }
}
