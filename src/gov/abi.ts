/**
 * The calls this interface makes, and no others.
 *
 * Written from `luxfi/standard` `out/**` — the Foundry artifacts — rather than
 * from `contracts/abi/governance.ts`, which is a stale barrel generated against
 * an older Azorius-style set and describes functions these contracts do not
 * have. Only the members actually called are here; an ABI is a list of things
 * we promise to be able to decode, so a fuller one is a larger promise.
 */

export const governor = [
  { type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'version', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'token', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'timelock', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'clock', inputs: [], outputs: [{ type: 'uint48' }], stateMutability: 'view' },
  { type: 'function', name: 'CLOCK_MODE', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'COUNTING_MODE', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'pure' },
  { type: 'function', name: 'votingDelay', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'votingPeriod', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'proposalThreshold', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'quorumNumerator', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'quorumDenominator', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'quorum', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'state', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint8' }], stateMutability: 'view' },
  { type: 'function', name: 'proposalProposer', inputs: [{ type: 'uint256' }], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'proposalSnapshot', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'proposalDeadline', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'proposalEta', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'proposalNeedsQueuing', inputs: [{ type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  {
    type: 'function', name: 'proposalVotes', inputs: [{ type: 'uint256' }],
    outputs: [{ name: 'against', type: 'uint256' }, { name: 'for', type: 'uint256' }, { name: 'abstain', type: 'uint256' }],
    stateMutability: 'view',
  },
  { type: 'function', name: 'hasVoted', inputs: [{ type: 'uint256' }, { type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'getVotes', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  {
    type: 'function', name: 'propose',
    inputs: [{ type: 'address[]' }, { type: 'uint256[]' }, { type: 'bytes[]' }, { type: 'string' }],
    outputs: [{ type: 'uint256' }], stateMutability: 'nonpayable',
  },
  { type: 'function', name: 'castVote', inputs: [{ type: 'uint256' }, { type: 'uint8' }], outputs: [{ type: 'uint256' }], stateMutability: 'nonpayable' },
  {
    type: 'function', name: 'castVoteWithReason',
    inputs: [{ type: 'uint256' }, { type: 'uint8' }, { type: 'string' }],
    outputs: [{ type: 'uint256' }], stateMutability: 'nonpayable',
  },
  { type: 'function', name: 'queue', inputs: [{ type: 'address[]' }, { type: 'uint256[]' }, { type: 'bytes[]' }, { type: 'bytes32' }], outputs: [{ type: 'uint256' }], stateMutability: 'nonpayable' },
  { type: 'function', name: 'execute', inputs: [{ type: 'address[]' }, { type: 'uint256[]' }, { type: 'bytes[]' }, { type: 'bytes32' }], outputs: [{ type: 'uint256' }], stateMutability: 'payable' },
  {
    type: 'event', name: 'ProposalCreated',
    inputs: [
      { name: 'proposalId', type: 'uint256', indexed: false },
      { name: 'proposer', type: 'address', indexed: false },
      { name: 'targets', type: 'address[]', indexed: false },
      { name: 'values', type: 'uint256[]', indexed: false },
      { name: 'signatures', type: 'string[]', indexed: false },
      { name: 'calldatas', type: 'bytes[]', indexed: false },
      { name: 'voteStart', type: 'uint256', indexed: false },
      { name: 'voteEnd', type: 'uint256', indexed: false },
      { name: 'description', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event', name: 'VoteCast',
    inputs: [
      { name: 'voter', type: 'address', indexed: true },
      { name: 'proposalId', type: 'uint256', indexed: false },
      { name: 'support', type: 'uint8', indexed: false },
      { name: 'weight', type: 'uint256', indexed: false },
      { name: 'reason', type: 'string', indexed: false },
    ],
  },
] as const

/** ERC20Votes — the delegation surface, shared by VotesToken, GovLUX and Stake. */
export const votes = [
  { type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'decimals', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' },
  { type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'balanceOf', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'delegates', inputs: [{ type: 'address' }], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'getVotes', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getPastTotalSupply', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'clock', inputs: [], outputs: [{ type: 'uint48' }], stateMutability: 'view' },
  { type: 'function', name: 'delegate', inputs: [{ type: 'address' }], outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'event', name: 'DelegateChanged',
    inputs: [
      { name: 'delegator', type: 'address', indexed: true },
      { name: 'fromDelegate', type: 'address', indexed: true },
      { name: 'toDelegate', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event', name: 'DelegateVotesChanged',
    inputs: [
      { name: 'delegate', type: 'address', indexed: true },
      { name: 'previousVotes', type: 'uint256', indexed: false },
      { name: 'newVotes', type: 'uint256', indexed: false },
    ],
  },
] as const

/**
 * A plain ERC20, for a token this interface holds no other opinion about.
 *
 * The token an escrow locks is one of these and need not be a votes token: the
 * weight is minted by the escrow, so the asset underneath only has to be
 * transferable. `allowance` and `approve` are here because a lock is two
 * transactions and the first one is easy to leave out of a screen.
 */
export const erc20 = [
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'decimals', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' },
  { type: 'function', name: 'balanceOf', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'allowance', inputs: [{ type: 'address' }, { type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'approve', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
] as const

/** OZ TimelockController — the treasury's gate. */
export const timelock = [
  { type: 'function', name: 'getMinDelay', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'hasRole', inputs: [{ type: 'bytes32' }, { type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'PROPOSER_ROLE', inputs: [], outputs: [{ type: 'bytes32' }], stateMutability: 'view' },
  { type: 'function', name: 'EXECUTOR_ROLE', inputs: [], outputs: [{ type: 'bytes32' }], stateMutability: 'view' },
  { type: 'function', name: 'CANCELLER_ROLE', inputs: [], outputs: [{ type: 'bytes32' }], stateMutability: 'view' },
  { type: 'function', name: 'DEFAULT_ADMIN_ROLE', inputs: [], outputs: [{ type: 'bytes32' }], stateMutability: 'view' },
] as const

/**
 * Karma — soulbound, and deliberately not an ERC20. It presents an ERC20-shaped
 * read surface but emits no Transfer, so a balance history is read from
 * KarmaMinted / KarmaSlashed / KarmaDecayed and from nothing else.
 */
export const karma = [
  { type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'decimals', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' },
  { type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'karmaOf', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'isVerified', inputs: [{ type: 'address' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  { type: 'function', name: 'MAX_KARMA', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  {
    type: 'function', name: 'getActivityStatus', inputs: [{ type: 'address' }],
    outputs: [
      { name: 'karma', type: 'uint256' }, { name: 'verified', type: 'bool' },
      { name: 'activeThisMonth', type: 'bool' }, { name: 'activeLastMonth', type: 'bool' },
      { name: 'currentDecayRate', type: 'uint256' }, { name: 'hasKarmaFloor', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event', name: 'KarmaMinted',
    inputs: [{ name: 'to', type: 'address', indexed: true }, { name: 'amount', type: 'uint256', indexed: false }, { name: 'reason', type: 'bytes32', indexed: false }],
  },
] as const

/**
 * Bounty — the deployed work market, read from
 * `luxfi/dao` `contracts/out-foundry/Bounty.sol/Bounty.json`.
 *
 * An earlier version of this file described `luxfi/standard`'s
 * `contracts/work/Bounty.sol` — `taskCount`, `getTask`, a nine-field task and a
 * status enum stopping at Released. That contract was never deployed. What runs
 * on Zoo and Pars is the UUPS set recorded in `deployments/lux-dao/*.json`:
 * Bounty over a separate Escrow, with an arbiter and a dispute path.
 *
 * Ids are 0-based — `bountyCount` is the next id, so the board is 0 to
 * count - 1. Nothing is escrowed at proposal; `fund` does that, which is why
 * Open and Funded are separate states.
 *
 * The reward asset and the stake asset are recorded separately, and they are
 * not the same kind of thing: a reward may be an NFT while the stake stays
 * fungible, so neither can be read off a single `token` field.
 */
export const bounty = [
  { type: 'function', name: 'bountyCount', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'reputation', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
  {
    type: 'function', name: 'bounties', inputs: [{ type: 'uint256' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'state', type: 'uint8' }, { name: 'rewardKind', type: 'uint8' },
        { name: 'rewardToken', type: 'address' }, { name: 'rewardTokenId', type: 'uint256' },
        { name: 'reward', type: 'uint256' },
        { name: 'stakeToken', type: 'address' }, { name: 'stake', type: 'uint256' },
        { name: 'funder', type: 'address' }, { name: 'approver', type: 'address' },
        { name: 'arbiter', type: 'address' }, { name: 'worker', type: 'address' },
        { name: 'claimDeadline', type: 'uint64' }, { name: 'claimWindow', type: 'uint64' },
        { name: 'claimNonce', type: 'uint64' }, { name: 'reviewWindow', type: 'uint64' },
        { name: 'reviewDeadline', type: 'uint64' },
        { name: 'rewardCreditedAmount', type: 'uint256' }, { name: 'settledAt', type: 'uint64' },
      ],
    }],
    stateMutability: 'view',
  },
] as const

/**
 * Reputation — the per-market worker ledger, one writer fixed at initialize.
 *
 * `reputationOf` answers the whole record in one call, so `completedOf` and
 * `earnedOf` would be the same two numbers read again and are not declared.
 * The counts are uint64: a count of finished work, not a token balance.
 */
export const reputation = [
  { type: 'function', name: 'writer', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
  {
    type: 'function', name: 'reputationOf', inputs: [{ type: 'address' }],
    outputs: [
      { name: 'completed', type: 'uint64' }, { name: 'disputesLost', type: 'uint64' },
      { name: 'totalEarned', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const

/** Roles — the successor to hats. Ids are 1-based and ROOT is 1. */
export const roles = [
  { type: 'function', name: 'ROOT', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'roleCount', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'adminRole', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'maxSupply', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint32' }], stateMutability: 'view' },
  { type: 'function', name: 'supply', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'isWearer', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  {
    type: 'event', name: 'RoleCreated',
    inputs: [
      { name: 'roleId', type: 'uint256', indexed: true }, { name: 'adminRole', type: 'uint256', indexed: true },
      { name: 'details', type: 'string', indexed: false }, { name: 'maxSupply', type: 'uint32', indexed: false },
    ],
  },
] as const

/**
 * VeVotes — the vote escrow in `luxfi/standard`, and an ERC-5805 votes token.
 *
 * One lock per account, `(uint128 amount, uint48 end)`, and `lock(amount,
 * duration)` is the whole of creating, enlarging and extending it: duration is
 * measured from now, the new end is `max(current, now + duration)` floored to a
 * week, and it never shortens. `lock(amount, 0)` adds at the current end and
 * `lock(0, duration)` extends without adding.
 *
 * Power is `amount / MAX_LOCK * (end - now)` — a straight line to zero at the
 * end. `balanceOf` is the account's own power whether or not it is delegated;
 * `getVotes` is what a Governor tallies, and it is zero until the holder
 * delegates, to themselves or to anyone. `getPastTotalSupply` counts every
 * lock regardless, so an undelegated lock raises the quorum it cannot vote
 * toward.
 *
 * There is no `transfer` and no `approve`: dispatch reverts. Escrow weight is
 * not an asset that moves, so the only ERC20 members here are the ones that
 * describe it.
 */
export const ve = [
  { type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'decimals', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' },
  /** The ERC20 that locking escrows. */
  { type: 'function', name: 'underlying', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'totalLocked', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'balanceOf', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'WEEK', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'MIN_LOCK', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'MAX_LOCK', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  {
    type: 'function', name: 'locks', inputs: [{ type: 'address' }],
    outputs: [{ name: 'amount', type: 'uint128' }, { name: 'end', type: 'uint48' }], stateMutability: 'view',
  },
  { type: 'function', name: 'clock', inputs: [], outputs: [{ type: 'uint48' }], stateMutability: 'view' },
  { type: 'function', name: 'CLOCK_MODE', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'pure' },
  { type: 'function', name: 'getVotes', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getPastVotes', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getPastTotalSupply', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'delegates', inputs: [{ type: 'address' }], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'delegate', inputs: [{ type: 'address' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'lock', inputs: [{ type: 'uint256' }, { type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'withdraw', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'event', name: 'Locked',
    inputs: [
      { name: 'account', type: 'address', indexed: true },
      { name: 'added', type: 'uint256', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'end', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'Withdrawn',
    inputs: [
      { name: 'account', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const

/** GaugeController — vLUX-weighted fee direction. Gauge ids are 0-based. */
export const gauges = [
  { type: 'function', name: 'gaugeCount', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'totalWeight', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  {
    type: 'function', name: 'getGauge', inputs: [{ type: 'uint256' }],
    outputs: [
      { name: 'recipient', type: 'address' }, { name: 'name', type: 'string' },
      { name: 'gaugeType', type: 'uint256' }, { name: 'active', type: 'bool' }, { name: 'weight', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const

/** DLUX — rebasing governance token. Not IVotes; no checkpoints. */
export const dlux = [
  { type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'totalStaked', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'epoch', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'rebaseRate', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'balanceOf', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
] as const

/**
 * DIDRegistry — W3C DID documents, on chain.
 *
 * From `luxfi/standard` `contracts/identity/DIDRegistry.sol` and its
 * `interfaces/IDID.sol`. Only the four reads this interface makes: a DID is
 * created and updated by its own controller, from their own wallet, and this app
 * has no business holding a write path to somebody's identity.
 *
 * `resolve` REVERTS for a DID that was never registered — `DIDNotFound` — and
 * again for one that was deactivated. A revert at the call site is
 * indistinguishable from the chain refusing, so `didExists` is asked first and
 * the two answers are kept apart. See `src/read/id.ts`.
 *
 * `controllerOf` is deliberately absent: the document `resolve` returns already
 * carries the controller, so declaring it would be the same address asked for
 * twice.
 */
export const did = [
  { type: 'function', name: 'didExists', inputs: [{ type: 'string' }], outputs: [{ type: 'bool' }], stateMutability: 'view' },
  {
    type: 'function', name: 'resolve', inputs: [{ type: 'string' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'did', type: 'string' },
        { name: 'controller', type: 'address' },
        { name: 'additionalControllers', type: 'address[]' },
        { name: 'alsoKnownAs', type: 'string[]' },
        { name: 'created', type: 'uint256' },
        { name: 'updated', type: 'uint256' },
        { name: 'active', type: 'bool' },
      ],
    }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'getVerificationMethods', inputs: [{ type: 'string' }],
    outputs: [{
      type: 'tuple[]',
      components: [
        { name: 'id', type: 'bytes32' },
        { name: 'methodType', type: 'uint8' },
        { name: 'controller', type: 'address' },
        { name: 'publicKeyMultibase', type: 'bytes' },
        { name: 'blockchainAccountId', type: 'bytes32' },
      ],
    }],
    stateMutability: 'view',
  },
  { type: 'function', name: 'getDIDsForController', inputs: [{ type: 'address' }], outputs: [{ type: 'string[]' }], stateMutability: 'view' },
] as const
