import { legacy } from '@luxdao/contracts';
import { HatsModulesClient } from '@hatsprotocol/modules-sdk';
import { Hat, Tree } from '@hatsprotocol/sdk-v1-subgraph';
import { Client } from 'urql';
import { Address, Hex, PublicClient, formatUnits, getAddress, getContract } from 'viem';
import ERC6551RegistryAbi from '../../assets/abi/ERC6551RegistryAbi';
import { HatsElectionsEligibilityAbi } from '../../assets/abi/HatsElectionsEligibilityAbi';
import { SablierV2LockupLinearAbi } from '../../assets/abi/SablierV2LockupLinear';
import { ERC6551_REGISTRY_SALT } from '../../constants/common';
import { StreamsQuery, StreamsQueryResponse, Stream } from '../../graphql/StreamsQueries';
import { convertStreamIdToBigInt } from '../../hooks/streams/useCreateSablierStream';
import { CacheKeys } from '../../hooks/utils/cache/cacheDefaults';
import { getValue } from '../../hooks/utils/cache/useLocalStorage';
import {
  DAOAdminHat,
  DAORoleItem,
  DAORoleItemTerms,
  DAOTopHat,
  DAOTree,
  RolesStoreData,
  SablierPayment,
} from '../../types/roles';

export class DAORolesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DAORolesError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DAORolesError);
    }
  }
}

const appearsExactlyNumberOfTimes = (
  str: string | undefined,
  char: string,
  count: number,
): boolean => {
  if (str === undefined) {
    return false;
  }

  let occurrences = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === char) {
      occurrences++;
    }
  }

  return occurrences === count;
};

const getRawTopHat = (hats: Hat[]) => {
  const potentialRawTopHats = hats.filter(h => appearsExactlyNumberOfTimes(h.prettyId, '.', 0));

  if (potentialRawTopHats.length === 0) {
    throw new DAORolesError('Top Hat is missing');
  }

  if (potentialRawTopHats.length > 1) {
    throw new DAORolesError('Too many Top Hats');
  }

  return potentialRawTopHats[0];
};

const getRawAdminHat = (hats: Hat[]) => {
  const potentialRawAdminHats = hats.filter(h => appearsExactlyNumberOfTimes(h.prettyId, '.', 1));

  if (potentialRawAdminHats.length === 0) {
    throw new DAORolesError('Admin Hat is missing');
  }

  if (potentialRawAdminHats.length > 1) {
    throw new DAORolesError('Too many Admin Hats');
  }

  return potentialRawAdminHats[0];
};

const getHatMetadata = (hat: Hat) => {
  const metadata = {
    name: '',
    description: '',
  };

  if (hat.details) {
    try {
      // At this stage hat.details should be not IPFS hash but stringified data from the IPFS
      const parsedDetails = JSON.parse(hat.details);
      metadata.name = parsedDetails.data.name;
      metadata.description = parsedDetails.data.description;
    } catch (e) {}
  }

  return metadata;
};

export const initialHatsStore: RolesStoreData = {
  rolesTreeId: undefined,
  rolesTree: undefined,
  streamsFetched: false,
  contextChainId: null,
};

export const predictHatId = ({ adminRoleId, hatsCount }: { adminRoleId: Hex; hatsCount: number }) => {
  // 1 byte = 8 bits = 2 string characters
  const adminLevelBinary = adminRoleId.slice(0, 14); // Top Admin ID 1 byte 0x + 4 bytes (tree ID) + next **16 bits** (admin level ID)

  // Each next level is next **16 bits**
  // Since we're operating only with direct child of top level admin - we don't care about nested levels
  // @dev At least for now?
  const newSiblingId = (hatsCount + 1).toString(16).padStart(4, '0');

  // Total length of Hat ID is **32 bytes** + 2 bytes for 0x
  return BigInt(`${adminLevelBinary}${newSiblingId}`.padEnd(66, '0'));
};

export const predictAccountAddress = async (params: {
  implementation: Address;
  chainId: bigint;
  tokenContract: Address;
  tokenId: bigint;
  registryAddress: Address;
  publicClient: PublicClient;
}) => {
  const { implementation, chainId, tokenContract, tokenId, registryAddress, publicClient } = params;

  const erc6551RegistryContract = getContract({
    abi: ERC6551RegistryAbi,
    address: registryAddress,
    client: publicClient,
  });
  const predictedAddress = await erc6551RegistryContract.read.account([
    implementation,
    ERC6551_REGISTRY_SALT,
    chainId,
    tokenContract,
    tokenId,
  ]);
  if (!(await publicClient.getBytecode({ address: predictedAddress }))) {
    return;
  }
  return predictedAddress;
};

export const getCurrentTermActiveStatus = async (
  currentTermEndDateTs: bigint,
  eligibility: Address,
  publicClient: PublicClient,
): Promise<boolean> => {
  const electionContract = getContract({
    abi: HatsElectionsEligibilityAbi,
    address: eligibility,
    client: publicClient,
  });

  const nextTermEndTs = await electionContract.read.nextTermEnd();
  return nextTermEndTs !== currentTermEndDateTs;
};

export const isElectionEligibilityModule = async (
  eligibility: Address | undefined,
  rolesElectionsImplementation: Address,
  publicClient: PublicClient,
) => {
  if (eligibility === undefined) return false;

  const hatsModuleClient = new HatsModulesClient({
    publicClient,
  });
  await hatsModuleClient.prepare();

  const possibleElectionModule = await hatsModuleClient.getModuleByInstance(eligibility);
  if (possibleElectionModule === undefined) return false;
  return possibleElectionModule.implementationAddress === rolesElectionsImplementation;
};

export const prepareCurrentTerm = async (
  term: { nominee: Address; termEndDate: Date; termNumber: number } | undefined,
  eligibility: Address,
  publicClient: PublicClient,
) => {
  if (term === undefined) return undefined;
  return {
    ...term,
    isActive: await getCurrentTermActiveStatus(
      BigInt(term.termEndDate.getTime()),
      eligibility,
      publicClient,
    ),
  };
};

const getRoleHatTerms = async (
  rawRole: Hat,
  rolesElectionsImplementation: Address,
  publicClient: PublicClient,
): Promise<{
  roleTerms: DAORoleItemTerms;
  isTermed: boolean;
}> => {
  if (
    rawRole.eligibility &&
    (await isElectionEligibilityModule(
      rawRole.eligibility,
      rolesElectionsImplementation,
      publicClient,
    ))
  ) {
    // @dev check if the eligibility is an election contract
    try {
      const electionContract = getContract({
        abi: HatsElectionsEligibilityAbi,
        address: rawRole.eligibility,
        client: publicClient,
      });
      const rawTerms = await electionContract.getEvents.ElectionCompleted({
        fromBlock: 0n,
      });
      const allTerms = rawTerms
        .map(term => {
          const nominee = term.args.winners?.[0];
          const termEnd = term.args.termEnd;
          if (!nominee) {
            throw new Error('No nominee in the election');
          }
          if (!termEnd) {
            throw new Error('No term end in the election');
          }
          return {
            nominee: getAddress(nominee),
            termEndDate: new Date(Number(termEnd.toString()) * 1000),
          };
        })
        .sort((a, b) => a.termEndDate.getTime() - b.termEndDate.getTime())
        .map((term, index) => ({ ...term, termNumber: index + 1 }));

      const activeTerms = allTerms.filter(
        term => term.termEndDate.getTime() > new Date().getTime(),
      );
      const roleTerms = {
        allTerms,
        currentTerm: await prepareCurrentTerm(activeTerms[0], rawRole.eligibility, publicClient),
        nextTerm: activeTerms[1],
        expiredTerms: allTerms
          .filter(term => term.termEndDate <= new Date())
          .sort((a, b) => {
            if (!a.termEndDate || !b.termEndDate) {
              return 0;
            }
            return b.termEndDate.getTime() - a.termEndDate.getTime();
          }),
      };
      return { roleTerms, isTermed: true };
    } catch {
      console.error('Failed to get election terms or not a valid election contract');
    }
  }
  return {
    roleTerms: { allTerms: [], currentTerm: undefined, nextTerm: undefined, expiredTerms: [] },
    isTermed: false,
  };
};

const getPaymentStreams = async (
  paymentRecipient: Address,
  publicClient: PublicClient,
  client: Client,
): Promise<SablierPayment[]> => {
  const streamQueryResult = await client.query<StreamsQueryResponse>(StreamsQuery, {
    recipientAddress: paymentRecipient,
  });

  if (!streamQueryResult.error) {
    if (!streamQueryResult.data?.streams.length) {
      return [];
    }
    const secondsTimestampToDate = (ts: string) => new Date(Number(ts) * 1000);
    const lockupLinearStreams = streamQueryResult.data.streams.filter(
      (stream: Stream) => stream.category === 'LockupLinear',
    );
    const formattedLinearStreams = lockupLinearStreams.map(lockupLinearStream => {
      const parsedAmount = formatUnits(
        BigInt(lockupLinearStream.depositAmount),
        lockupLinearStream.asset.decimals,
      );

      const startDate = secondsTimestampToDate(lockupLinearStream.startTime);
      const endDate = secondsTimestampToDate(lockupLinearStream.endTime);
      const cliffDate = lockupLinearStream.cliff
        ? secondsTimestampToDate(lockupLinearStream.cliffTime)
        : undefined;

      const logo =
        getValue({
          cacheName: CacheKeys.TOKEN_INFO,
          tokenAddress: getAddress(lockupLinearStream.asset.address),
        })?.logoUri || '';

      return {
        streamId: lockupLinearStream.id,
        contractAddress: lockupLinearStream.contract.address,
        recipient: getAddress(lockupLinearStream.recipient),
        asset: {
          address: getAddress(lockupLinearStream.asset.address),
          name: lockupLinearStream.asset.name,
          symbol: lockupLinearStream.asset.symbol,
          decimals: lockupLinearStream.asset.decimals,
          logo,
        },
        amount: {
          bigintValue: BigInt(lockupLinearStream.depositAmount),
          value: parsedAmount,
        },
        isCancelled: lockupLinearStream.canceled,
        startDate,
        endDate,
        cliffDate,
        isStreaming: () => {
          const start = !lockupLinearStream.cliff
            ? startDate.getTime()
            : cliffDate !== undefined
              ? cliffDate.getTime()
              : undefined;
          const end = endDate ? endDate.getTime() : undefined;
          const cancelled = lockupLinearStream.canceled;
          const now = new Date().getTime();

          return !cancelled && !!start && !!end && start <= now && end > now;
        },
        cancelable: lockupLinearStream.cancelable,
        canUserCancel: () =>
          lockupLinearStream.cancelable &&
          !lockupLinearStream.canceled &&
          !!endDate &&
          endDate.getTime() > Date.now(),
      };
    });

    const streamsWithCurrentWithdrawableAmounts: SablierPayment[] = await Promise.all(
      formattedLinearStreams.map(async stream => {
        const streamContract = getContract({
          abi: SablierV2LockupLinearAbi,
          address: stream.contractAddress,
          client: publicClient,
        });
        const bigintStreamId = convertStreamIdToBigInt(stream.streamId);

        const newWithdrawableAmount = await streamContract.read.withdrawableAmountOf([
          bigintStreamId,
        ]);
        return {
          ...stream,
          withdrawableAmount: newWithdrawableAmount,
        };
      }),
    );
    return streamsWithCurrentWithdrawableAmounts;
  }
  return [];
};

export const sanitize = async (
  rolesTree: undefined | null | Tree,
  rolesAccountImplementation: Address,
  rolesElectionsImplementation: Address,
  erc6551Registry: Address,
  hats: Address,
  chainId: bigint,
  publicClient: PublicClient,
  sablierSubgraphClient: Client,
  whitelistingVotingStrategy?: Address,
): Promise<undefined | null | DAOTree> => {
  if (rolesTree === undefined || rolesTree === null) {
    return rolesTree;
  }

  if (rolesTree.hats === undefined || rolesTree.hats.length === 0) {
    throw new DAORolesError("Hats Tree doesn't have any Hats");
  }

  const rawTopHat = getRawTopHat(rolesTree.hats);
  const topRoleMetadata = getHatMetadata(rawTopHat);

  const topRoleSmartAddress = await predictAccountAddress({
    implementation: rolesAccountImplementation,
    registryAddress: erc6551Registry,
    tokenContract: hats,
    chainId,
    tokenId: BigInt(rawTopHat.id),
    publicClient,
  });

  if (!topRoleSmartAddress) {
    throw new DAORolesError('Top Hat smart address is not valid');
  }

  const whitelistingVotingContract = whitelistingVotingStrategy
    ? getContract({
        abi: legacy.abis.LinearERC20VotingWithHatsProposalCreation,
        address: whitelistingVotingStrategy,
        client: publicClient,
      })
    : undefined;
  let whitelistedRoleIds: bigint[] = [];
  if (whitelistingVotingContract) {
    whitelistedRoleIds = [...(await whitelistingVotingContract.read.getWhitelistedHatIds())];
  }

  const topRole: DAOTopHat = {
    id: rawTopHat.id,
    prettyId: rawTopHat.prettyId ?? '',
    name: topRoleMetadata.name,
    description: topRoleMetadata.description,
    smartAddress: topRoleSmartAddress,
  };

  const rawAdminHat = getRawAdminHat(rolesTree.hats);

  const adminRoleMetadata = getHatMetadata(rawAdminHat);
  const adminRoleSmartAddress = await predictAccountAddress({
    implementation: rolesAccountImplementation,
    registryAddress: erc6551Registry,
    tokenContract: hats,
    chainId,
    tokenId: BigInt(rawAdminHat.id),
    publicClient,
  });
  if (!adminRoleSmartAddress) {
    throw new DAORolesError('Admin Hat smart address is not valid');
  }

  const adminRole: DAOAdminHat = {
    id: rawAdminHat.id,
    prettyId: rawAdminHat.prettyId ?? '',
    name: adminRoleMetadata.name,
    description: adminRoleMetadata.description,
    smartAddress: adminRoleSmartAddress,
    wearer: rawAdminHat.wearers?.length ? rawAdminHat.wearers[0].id : undefined,
  };

  let roleItems: DAORoleItem[] = [];

  for (const rawRole of rolesTree.hats) {
    if (
      !appearsExactlyNumberOfTimes(rawRole.prettyId, '.', 2) ||
      rawRole.status !== true ||
      !rawRole.wearers ||
      rawRole.wearers.length !== 1
    ) {
      // Ignore hats that do not
      // - exist as a child of the Admin Hat
      // - are not active
      // - have exactly one wearer
      continue;
    }

    const tokenId = BigInt(rawRole.id);
    const hatMetadata = getHatMetadata(rawRole);
    const { roleTerms, isTermed } = await getRoleHatTerms(
      rawRole,
      rolesElectionsImplementation,
      publicClient,
    );
    let roleSmartAccountAddress: Address | undefined;
    if (!isTermed) {
      roleSmartAccountAddress = await predictAccountAddress({
        implementation: rolesAccountImplementation,
        registryAddress: erc6551Registry,
        tokenContract: hats,
        chainId,
        tokenId: BigInt(rawRole.id),
        publicClient,
      });
    }

    let canCreateProposals = false;
    if (whitelistingVotingContract) {
      canCreateProposals = whitelistedRoleIds.includes(tokenId);
    }

    const payments: SablierPayment[] = [];

    if (isTermed) {
      const uniqueRecipients = [...new Set(roleTerms.allTerms.map(term => term.nominee))];
      for (const recipient of uniqueRecipients) {
        payments.push(...(await getPaymentStreams(recipient, publicClient, sablierSubgraphClient)));
      }
    } else {
      if (!roleSmartAccountAddress) {
        throw new Error('Smart account address not found');
      }
      payments.push(
        ...(await getPaymentStreams(
          roleSmartAccountAddress,
          publicClient,
          sablierSubgraphClient,
        )),
      );
    }

    roleItems.push({
      id: rawRole.id,
      prettyId: rawRole.prettyId ?? '',
      // UI fix for a spelling error on a DAO DAO role
      name: hatMetadata.name.replace('Tokenomisc', 'Tokenomics'),
      description: hatMetadata.description,
      wearerAddress: getAddress(rawRole.wearers[0].id),
      smartAddress: roleSmartAccountAddress,
      eligibility: rawRole.eligibility,
      roleTerms,
      isTermed,
      canCreateProposals,
      payments,
    });
  }

  const daoTree: DAOTree = {
    topRole,
    adminRole,
    roleItems,
  };

  return daoTree;
};

export const paymentSorterByActiveStatus = (
  a: { isCancelled?: boolean; endDate?: Date },
  b: { isCancelled?: boolean; endDate?: Date },
) => {
  const isActive = (payment: { isCancelled?: boolean; endDate?: Date }) => {
    const now = new Date();
    // A payment is active if it's not cancelled and its end date is in the future (or it doesn't have an end date yet)
    return !payment.isCancelled && (payment.endDate === undefined || payment.endDate > now);
  };

  const aIsActive = isActive(a);
  const bIsActive = isActive(b);

  if (aIsActive && !bIsActive) {
    return -1; // 'a' is active and should come first
  }
  if (!aIsActive && bIsActive) {
    return 1; // 'b' is active and should come first
  }

  // If both are active or both inactive, maintain the current order
  return 0;
};

export const paymentSorterByStartDate = (a: { startDate?: Date }, b: { startDate?: Date }) => {
  if (!a?.startDate) return 1; // No start date, move this payment last
  if (!b?.startDate) return -1; // No start date, move b last

  return a.startDate.getTime() - b.startDate.getTime(); // Sort by earliest start date
};

export const paymentSorterByWithdrawAmount = (
  a: { withdrawableAmount?: bigint },
  b: { withdrawableAmount?: bigint },
) => {
  if (!a?.withdrawableAmount) return 1; // No withdrawable amount, move this payment last
  if (!b?.withdrawableAmount) return -1;

  return Number(a.withdrawableAmount - b.withdrawableAmount); // Sort by amount
};
