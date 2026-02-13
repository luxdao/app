import { legacy, abis } from '@luxdao/contracts';
import {
  Address,
  Hex,
  PublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getAddress,
  getContract,
  getCreate2Address,
  keccak256,
  parseAbiParameters,
} from 'viem';
import GnosisSafeL2Abi from '../assets/abi/GnosisSafeL2';
import { ModuleProxyFactoryAbi } from '../assets/abi/ModuleProxyFactoryAbi';
import { linearERC20VotingSetupParams, linearERC721VotingSetupParams } from '../constants/params';
import { buildContractCall, buildSignatures, getRandomBytes } from '../helpers';
import {
  GovernorERC20DAO,
  GovernorERC721DAO,
  GovernorGovernanceDAO,
  CreateProposalTransaction,
  SafeTransaction,
  TokenLockType,
  VotingStrategyType,
} from '../types';
import { SENTINEL_MODULE } from '../utils/address';
import { BaseTxBuilder } from './BaseTxBuilder';
import { generateContractByteCodeLinear, generateSalt } from './helpers/utils';

export class GovernorTxBuilder extends BaseTxBuilder {
  private readonly safeContractAddress: Address;

  private encodedSetupTokenData: Hex | undefined;
  private encodedStrategySetupData: Hex | undefined;
  private encodedSetupGovernorData: Hex | undefined;
  private encodedSetupTokenClaimData: Hex | undefined;

  private predictedTokenAddress: Address | undefined;
  private predictedStrategyAddress: Address | undefined;
  private predictedGovernorAddress: Address | undefined;
  private predictedTokenClaimAddress: Address | undefined;

  public linearERC20VotingAddress: Address | undefined;
  public linearERC721VotingAddress: Address | undefined;
  public votesTokenAddress: Address | undefined;
  private votesErc20MasterCopy: Address;
  private votesErc20LockableMasterCopy?: Address;
  private moduleProxyFactory: Address;
  private multiSendCallOnly: Address;
  private claimErc20MasterCopy: Address;
  private linearVotingErc20MasterCopy: Address;
  private linearVotingErc721MasterCopy: Address;
  private moduleGovernorMasterCopy: Address;
  private tokenNonce: bigint;
  private strategyNonce: bigint;
  private governorNonce: bigint;
  private claimNonce: bigint;

  constructor(
    publicClient: PublicClient,
    daoData: GovernorERC20DAO | GovernorERC721DAO,
    safeContractAddress: Address,
    votesErc20MasterCopy: Address,
    moduleProxyFactory: Address,
    multiSendCallOnly: Address,
    claimErc20MasterCopy: Address,
    linearVotingErc20MasterCopy: Address,
    linearVotingErc721MasterCopy: Address,
    moduleGovernorMasterCopy: Address,
    votesErc20LockableMasterCopy?: Address,
    parentAddress?: Address,
    parentTokenAddress?: Address,
  ) {
    super(publicClient, true, daoData, parentAddress, parentTokenAddress);

    this.safeContractAddress = safeContractAddress;

    this.tokenNonce = getRandomBytes();
    this.claimNonce = getRandomBytes();
    this.strategyNonce = getRandomBytes();
    this.governorNonce = getRandomBytes();
    this.votesErc20MasterCopy = votesErc20MasterCopy;
    this.votesErc20LockableMasterCopy = votesErc20LockableMasterCopy;
    this.moduleProxyFactory = moduleProxyFactory;
    this.multiSendCallOnly = multiSendCallOnly;
    this.claimErc20MasterCopy = claimErc20MasterCopy;
    this.linearVotingErc20MasterCopy = linearVotingErc20MasterCopy;
    this.linearVotingErc721MasterCopy = linearVotingErc721MasterCopy;
    this.moduleGovernorMasterCopy = moduleGovernorMasterCopy;

    if (daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC20) {
      daoData = daoData as GovernorERC20DAO;
      if (!daoData.isTokenImported) {
        if (daoData.locked === TokenLockType.LOCKED && !votesErc20LockableMasterCopy) {
          throw new Error('Votes Erc20 Lockable Master Copy address not set');
        }
        this.setEncodedSetupTokenData();
        this.setPredictedTokenAddress();
      } else {
        if (daoData.isVotesToken) {
          this.predictedTokenAddress = daoData.tokenImportAddress as Address;
        }
      }
    }
  }

  public get governorAddress(): Address {
    if (!this.predictedGovernorAddress) {
      throw new Error('Governor address not set');
    }

    return this.predictedGovernorAddress;
  }

  public async init() {
    await this.setPredictedStrategyAddress();
    this.setPredictedGovernorAddress();
    this.setContracts();

    if (
      (this.daoData as GovernorERC20DAO | GovernorERC721DAO).votingStrategyType ===
      VotingStrategyType.LINEAR_ERC20
    ) {
      const governorDAOData = this.daoData as GovernorERC20DAO;
      if (
        this.parentTokenAddress &&
        governorDAOData.parentAllocationAmount &&
        governorDAOData.parentAllocationAmount !== 0n
      ) {
        this.setEncodedSetupTokenClaimData();
        this.setPredictedTokenClaimAddress();
      }
    }
  }

  public buildRemoveOwners(owners: Address[]): SafeTransaction[] {
    const removeOwnerTxs = owners.map(owner =>
      buildContractCall({
        target: this.safeContractAddress,
        encodedFunctionData: encodeFunctionData({
          functionName: 'removeOwner',
          args: [this.multiSendCallOnly, owner, 1n],
          abi: GnosisSafeL2Abi,
        }),
      }),
    );
    return removeOwnerTxs;
  }

  public buildVotingContractSetupTx(): SafeTransaction {
    const daoData = this.daoData as GovernorGovernanceDAO;

    if (daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC20) {
      if (!this.predictedGovernorAddress) {
        throw new Error('Predicted Governor address not set');
      }
      if (!this.linearERC20VotingAddress) {
        throw new Error('Linear ERC20 voting address not set');
      }

      return buildContractCall({
        target: this.linearERC20VotingAddress,
        encodedFunctionData: encodeFunctionData({
          functionName: 'setGovernor',
          args: [this.predictedGovernorAddress],
          abi: legacy.abis.LinearERC20Voting,
        }),
      });
    } else if (daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC721) {
      if (!this.linearERC721VotingAddress) {
        throw new Error('Linear ERC721 voting address not set');
      }
      if (!this.predictedGovernorAddress) {
        throw new Error('Predicted Governor address not set');
      }

      return buildContractCall({
        target: this.linearERC721VotingAddress,
        encodedFunctionData: encodeFunctionData({
          functionName: 'setGovernor',
          args: [this.predictedGovernorAddress],
          abi: legacy.abis.LinearERC721Voting,
        }),
      });
    } else {
      throw new Error('voting strategy type unknown');
    }
  }

  public buildEnableGovernorModuleTx(): SafeTransaction {
    if (!this.predictedGovernorAddress) {
      throw new Error('Governor address not set');
    }

    return buildContractCall({
      target: this.safeContractAddress,
      encodedFunctionData: encodeFunctionData({
        functionName: 'enableModule',
        args: [this.predictedGovernorAddress],
        abi: GnosisSafeL2Abi,
      }),
    });
  }

  public buildAddGovernorContractAsOwnerTx(): SafeTransaction {
    if (!this.predictedGovernorAddress) {
      throw new Error('Governor address not set');
    }

    return buildContractCall({
      target: this.safeContractAddress,
      encodedFunctionData: encodeFunctionData({
        functionName: 'addOwnerWithThreshold',
        args: [this.predictedGovernorAddress, 1n],
        abi: GnosisSafeL2Abi,
      }),
    });
  }

  public buildRemoveMultiSendOwnerTx(): SafeTransaction {
    if (!this.predictedGovernorAddress) {
      throw new Error('Governor address not set');
    }
    if (!this.multiSendCallOnly) {
      throw new Error('multiSendCallOnly address not set');
    }

    return buildContractCall({
      target: this.safeContractAddress,
      encodedFunctionData: encodeFunctionData({
        functionName: 'removeOwner',
        args: [this.predictedGovernorAddress, this.multiSendCallOnly, 1n],
        abi: GnosisSafeL2Abi,
      }),
    });
  }

  public buildCreateTokenTx(): SafeTransaction {
    const governorErc20DaoData = this.daoData as GovernorERC20DAO;

    if (
      !this.encodedSetupTokenData ||
      !this.votesErc20MasterCopy ||
      !this.votesErc20LockableMasterCopy
    ) {
      throw new Error('Encoded setup token data or votes erc20 master copy not set');
    }

    const votesErc20MasterCopy =
      governorErc20DaoData.locked === TokenLockType.LOCKED
        ? this.votesErc20LockableMasterCopy
        : this.votesErc20MasterCopy;

    return buildContractCall({
      target: this.moduleProxyFactory,
      encodedFunctionData: encodeFunctionData({
        functionName: 'deployModule',
        args: [votesErc20MasterCopy, this.encodedSetupTokenData, this.tokenNonce],
        abi: ModuleProxyFactoryAbi,
      }),
    });
  }

  public getCreateTokenTx(): CreateProposalTransaction {
    const governorErc20DaoData = this.daoData as GovernorERC20DAO;

    if (
      !this.encodedSetupTokenData ||
      !this.votesErc20MasterCopy ||
      !this.votesErc20LockableMasterCopy
    ) {
      throw new Error('Encoded setup token data or votes erc20 master copy not set');
    }

    const votesErc20MasterCopy =
      governorErc20DaoData.locked === TokenLockType.LOCKED
        ? this.votesErc20LockableMasterCopy
        : this.votesErc20MasterCopy;

    return {
      targetAddress: this.moduleProxyFactory,
      ethValue: {
        bigintValue: 0n,
        value: '0',
      },
      functionName: 'deployModule',
      parameters: [
        {
          signature: 'address',
          value: votesErc20MasterCopy,
        },
        {
          signature: 'bytes',
          value: this.encodedSetupTokenData,
        },
        {
          signature: 'uint256',
          value: this.tokenNonce.toString(),
        },
      ],
    };
  }

  public getUpdateERC20AddressTx(keyValuePairs: Address): CreateProposalTransaction {
    if (!this.predictedTokenAddress) {
      throw new Error('predictedTokenAddress not set');
    }

    return {
      targetAddress: keyValuePairs,
      ethValue: {
        bigintValue: 0n,
        value: '0',
      },
      functionName: 'updateValues',
      parameters: [
        {
          signature: 'string[]',
          valueArray: ['erc20Address'],
        },
        {
          signature: 'string[]',
          valueArray: [this.predictedTokenAddress],
        },
      ],
    };
  }

  public buildDeployStrategyTx(): SafeTransaction {
    const daoData = this.daoData as GovernorGovernanceDAO;

    const votingStrategyMasterCopy =
      daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC20
        ? this.linearVotingErc20MasterCopy
        : this.linearVotingErc721MasterCopy;

    if (!this.encodedStrategySetupData) {
      throw new Error('Encoded strategy setup data not set');
    }

    return buildContractCall({
      target: this.moduleProxyFactory,
      encodedFunctionData: encodeFunctionData({
        functionName: 'deployModule',
        args: [votingStrategyMasterCopy, this.encodedStrategySetupData, this.strategyNonce],
        abi: ModuleProxyFactoryAbi,
      }),
    });
  }

  public buildDeployGovernorTx(): SafeTransaction {
    if (!this.encodedSetupGovernorData) {
      throw new Error('Encoded setup governor data not set');
    }

    return buildContractCall({
      target: this.moduleProxyFactory,
      encodedFunctionData: encodeFunctionData({
        functionName: 'deployModule',
        args: [this.moduleGovernorMasterCopy, this.encodedSetupGovernorData, this.governorNonce],
        abi: ModuleProxyFactoryAbi,
      }),
    });
  }

  public buildDeployTokenClaim() {
    if (!this.encodedSetupTokenClaimData) {
      throw new Error('Encoded setup token claim data not set');
    }

    return buildContractCall({
      target: this.moduleProxyFactory,
      encodedFunctionData: encodeFunctionData({
        functionName: 'deployModule',
        args: [this.claimErc20MasterCopy, this.encodedSetupTokenClaimData, this.claimNonce],
        abi: ModuleProxyFactoryAbi,
      }),
    });
  }

  public buildApproveClaimAllocation() {
    if (!this.votesTokenAddress) {
      return;
    }
    if (!this.predictedTokenClaimAddress) {
      throw new Error('Predicted token claim address not set');
    }

    const governorGovernanceDaoData = this.daoData as GovernorERC20DAO;
    return buildContractCall({
      target: this.votesTokenAddress,
      encodedFunctionData: encodeFunctionData({
        functionName: 'approve',
        args: [this.predictedTokenClaimAddress, governorGovernanceDaoData.parentAllocationAmount],
        abi: legacy.abis.VotesERC20,
      }),
    });
  }

  public signatures(): Hex {
    return buildSignatures(this.multiSendCallOnly);
  }

  private calculateTokenAllocations(
    governorGovernanceDaoData: GovernorERC20DAO,
  ): [Address[], bigint[]] {
    const tokenAllocationsOwners = governorGovernanceDaoData.tokenAllocations.map(tokenAllocation =>
      getAddress(tokenAllocation.address),
    );

    const tokenAllocationsValues = governorGovernanceDaoData.tokenAllocations.map(
      tokenAllocation => tokenAllocation.amount,
    );
    const tokenAllocationSum = tokenAllocationsValues.reduce((accumulator, tokenAllocation) => {
      return tokenAllocation + accumulator;
    }, 0n);

    // Send any un-allocated tokens to the Safe Treasury
    if (governorGovernanceDaoData.tokenSupply > tokenAllocationSum) {
      // TODO -- verify this doesn't need to be the predicted safe address (that they are the same)
      tokenAllocationsOwners.push(this.safeContractAddress);
      tokenAllocationsValues.push(governorGovernanceDaoData.tokenSupply - tokenAllocationSum);
    }

    return [tokenAllocationsOwners, tokenAllocationsValues];
  }

  private setEncodedSetupTokenData() {
    const governorGovernanceDaoData = this.daoData as GovernorERC20DAO;
    const [tokenAllocationsOwners, tokenAllocationsValues] =
      this.calculateTokenAllocations(governorGovernanceDaoData);

    if (governorGovernanceDaoData.locked === TokenLockType.LOCKED) {
      const allocations: { to: Address; amount: bigint }[] = tokenAllocationsOwners.map((o, i) => ({
        to: o,
        amount: tokenAllocationsValues[i],
      }));

      this.encodedSetupTokenData = encodeFunctionData({
        abi: abis.deployables.VotesERC20V1,
        functionName: 'initialize',
        args: [
          // metadata_
          {
            name: governorGovernanceDaoData.tokenName,
            symbol: governorGovernanceDaoData.tokenSymbol,
          },
          allocations,
          // owner_
          this.safeContractAddress,
          // locked_
          true,
          // maxTotalSupply_
          governorGovernanceDaoData.maxTotalSupply,
        ],
      });
    } else {
      const encodedInitTokenData = encodeAbiParameters(
        parseAbiParameters('string, string, address[], uint256[]'),
        [
          governorGovernanceDaoData.tokenName,
          governorGovernanceDaoData.tokenSymbol,
          tokenAllocationsOwners,
          tokenAllocationsValues,
        ],
      );

      this.encodedSetupTokenData = encodeFunctionData({
        abi: legacy.abis.VotesERC20,
        functionName: 'setUp',
        args: [encodedInitTokenData],
      });
    }
  }

  private setPredictedTokenAddress() {
    const governorGovernanceDaoData = this.daoData as GovernorERC20DAO;
    if (
      governorGovernanceDaoData.locked === TokenLockType.LOCKED &&
      !this.votesErc20LockableMasterCopy
    ) {
      throw new Error('Votes Erc20 Lockable Master Copy address not set');
    }
    const tokenByteCodeLinear = generateContractByteCodeLinear(
      governorGovernanceDaoData.locked === TokenLockType.LOCKED
        ? this.votesErc20LockableMasterCopy!
        : this.votesErc20MasterCopy,
    );
    const tokenSalt = generateSalt(this.encodedSetupTokenData!, this.tokenNonce);

    this.predictedTokenAddress = getCreate2Address({
      from: this.moduleProxyFactory,
      salt: tokenSalt,
      bytecodeHash: keccak256(encodePacked(['bytes'], [tokenByteCodeLinear])),
    });
  }

  private setEncodedSetupTokenClaimData() {
    const governorGovernanceDaoData = this.daoData as GovernorERC20DAO;
    if (!this.parentTokenAddress || !this.predictedTokenAddress) {
      throw new Error('Parent token address or predicted token address were not provided');
    }
    const encodedInitTokenData = encodeAbiParameters(
      parseAbiParameters('uint32, address, address, address, uint256'),
      [
        0, // `deadlineBlock`, 0 means never expires, currently no UI for setting this in the app.
        this.safeContractAddress,
        this.parentTokenAddress,
        this.predictedTokenAddress,
        governorGovernanceDaoData.parentAllocationAmount,
      ],
    );
    const encodedSetupTokenClaimData = encodeFunctionData({
      abi: legacy.abis.ERC20Claim,
      functionName: 'setUp',
      args: [encodedInitTokenData],
    });

    this.encodedSetupTokenClaimData = encodedSetupTokenClaimData;
  }

  private setPredictedTokenClaimAddress() {
    const tokenByteCodeLinear = generateContractByteCodeLinear(this.claimErc20MasterCopy);

    const tokenSalt = generateSalt(this.encodedSetupTokenClaimData!, this.claimNonce);

    this.predictedTokenClaimAddress = getCreate2Address({
      from: this.moduleProxyFactory,
      salt: tokenSalt,
      bytecodeHash: keccak256(encodePacked(['bytes'], [tokenByteCodeLinear])),
    });
  }

  private setupLinearERC20VotingStrategy(
    safeContractAddress: Address,
    predictedTokenAddress: Address,
    votingPeriod: number,
    quorumPercentage: bigint,
    quorumDenominator: bigint,
  ): {
    encodedStrategySetupData: Hex;
    strategyByteCodeLinear: Hex;
  } {
    const encodedStrategyInitParams = encodeAbiParameters(
      parseAbiParameters(linearERC20VotingSetupParams),
      [
        safeContractAddress, // owner
        predictedTokenAddress, // governance token
        SENTINEL_MODULE, // Governor module
        Number(votingPeriod),
        1n, // proposer weight, how much is needed to create a proposal.
        (quorumPercentage * quorumDenominator) / 100n, // quorom numerator, denominator is 1,000,000, so quorum percentage is quorumNumerator * 100 / quorumDenominator
        500000n, // basis numerator, denominator is 1,000,000, so basis percentage is 50% (simple majority)
      ],
    );

    const encodedStrategySetupData = encodeFunctionData({
      abi: legacy.abis.LinearERC20Voting,
      functionName: 'setUp',
      args: [encodedStrategyInitParams],
    });

    const strategyByteCodeLinear = generateContractByteCodeLinear(this.linearVotingErc20MasterCopy);
    return {
      encodedStrategySetupData,
      strategyByteCodeLinear,
    };
  }

  private setupLinearERC721VotingStrategy(
    safeContractAddress: Address,
    daoData: GovernorERC721DAO,
    votingPeriod: number,
  ): {
    encodedStrategySetupData: Hex;
    strategyByteCodeLinear: Hex;
  } {
    const encodedStrategyInitParams = encodeAbiParameters(
      parseAbiParameters(linearERC721VotingSetupParams),
      [
        safeContractAddress, // owner
        daoData.nfts.map(nft => nft.tokenAddress!), // governance tokens addresses
        daoData.nfts.map(nft => nft.tokenWeight), // governance tokens weights
        SENTINEL_MODULE, // Governor module
        votingPeriod,
        daoData.quorumThreshold, // quorom threshold. Since smart contract can't know total of NFTs minted - we need to provide it manually
        1n, // proposer weight, how much is needed to create a proposal.
        500000n, // basis numerator, denominator is 1,000,000, so basis percentage is 50% (simple majority)
      ],
    );

    const encodedStrategySetupData = encodeFunctionData({
      abi: legacy.abis.LinearERC721Voting,
      functionName: 'setUp',
      args: [encodedStrategyInitParams],
    });

    const strategyByteCodeLinear = generateContractByteCodeLinear(
      this.linearVotingErc721MasterCopy,
    );
    return {
      encodedStrategySetupData,
      strategyByteCodeLinear,
    };
  }

  private async setupVotingStrategy(): Promise<
    | {
        encodedStrategySetupData: Hex;
        strategyByteCodeLinear: Hex;
      }
    | undefined
  > {
    const governorGovernanceDaoData = this.daoData as GovernorGovernanceDAO;
    if (governorGovernanceDaoData.votingStrategyType === VotingStrategyType.LINEAR_ERC20) {
      if (!this.predictedTokenAddress) {
        throw new Error(
          'Error predicting strategy address - predicted token address was not provided',
        );
      }

      const linearERC20VotingMasterCopyContract = getContract({
        abi: legacy.abis.LinearERC20VotingV1,
        address: this.linearVotingErc20MasterCopy,
        client: this.publicClient,
      });

      const quorumDenominator = await linearERC20VotingMasterCopyContract.read.QUORUM_DENOMINATOR();
      return this.setupLinearERC20VotingStrategy(
        this.safeContractAddress,
        this.predictedTokenAddress,
        Number(governorGovernanceDaoData.votingPeriod),
        governorGovernanceDaoData.quorumPercentage,
        quorumDenominator,
      );
    } else if (governorGovernanceDaoData.votingStrategyType === VotingStrategyType.LINEAR_ERC721) {
      const daoData = governorGovernanceDaoData as GovernorERC721DAO;

      return this.setupLinearERC721VotingStrategy(
        this.safeContractAddress,
        daoData,
        Number(daoData.votingPeriod),
      );
    } else {
      return undefined;
    }
  }

  private async setPredictedStrategyAddress() {
    const strategySetup = await this.setupVotingStrategy();
    if (!strategySetup) {
      return;
    }
    const { encodedStrategySetupData, strategyByteCodeLinear } = strategySetup;

    const strategySalt = keccak256(
      encodePacked(
        ['bytes32', 'uint256'],
        [keccak256(encodePacked(['bytes'], [encodedStrategySetupData])), this.strategyNonce],
      ),
    );

    this.encodedStrategySetupData = encodedStrategySetupData;

    this.predictedStrategyAddress = getCreate2Address({
      from: this.moduleProxyFactory,
      salt: strategySalt,
      bytecodeHash: keccak256(encodePacked(['bytes'], [strategyByteCodeLinear])),
    });
  }

  private setPredictedGovernorAddress() {
    const governorGovernanceDaoData = this.daoData as GovernorGovernanceDAO;
    const safeContractAddress = this.safeContractAddress;
    const encodedInitGovernorData = encodeAbiParameters(
      parseAbiParameters(['address, address, address, address[], uint32, uint32']),
      [
        safeContractAddress,
        safeContractAddress,
        safeContractAddress,
        [this.predictedStrategyAddress!],
        Number(governorGovernanceDaoData.timelock), // timelock period in blocks
        Number(governorGovernanceDaoData.executionPeriod), // execution period in blocks
      ],
    );

    const encodedSetupGovernorData = encodeFunctionData({
      abi: legacy.abis.Governor,
      functionName: 'setUp',
      args: [encodedInitGovernorData],
    });

    const governorByteCodeLinear = generateContractByteCodeLinear(this.moduleGovernorMasterCopy);
    const governorSalt = generateSalt(encodedSetupGovernorData, this.governorNonce);

    this.encodedSetupGovernorData = encodedSetupGovernorData;
    this.predictedGovernorAddress = getCreate2Address({
      from: this.moduleProxyFactory,
      salt: governorSalt,
      bytecodeHash: keccak256(encodePacked(['bytes'], [governorByteCodeLinear])),
    });
  }

  private setContracts() {
    if (!this.predictedStrategyAddress) {
      return;
    }

    const daoData = this.daoData as GovernorGovernanceDAO;
    if (
      !!this.predictedTokenAddress &&
      daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC20
    ) {
      this.votesTokenAddress = this.predictedTokenAddress;
      this.linearERC20VotingAddress = this.predictedStrategyAddress;
    } else if (daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC721) {
      this.linearERC721VotingAddress = this.predictedStrategyAddress;
    }
  }
}
