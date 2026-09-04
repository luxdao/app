import * as abi from '../gov/abi'
import type { Venue } from '../gov/chain'
import { presence, reader } from '../gov/client'
import { attempt, type Read } from '../gov/read'

/**
 * `IBounty.State`, in order.
 *
 * Nine states, not six. An earlier reading of this market took its enum from
 * `luxfi/standard`'s `contracts/work/Bounty.sol` — None, Open, Claimed,
 * Submitted, Released, Cancelled — a contract that was never deployed. What
 * runs holds value in a separate Escrow and can be argued with, so it tells
 * proposed apart from funded and carries a dispute.
 *
 * Accepted is reserved and never observed: `accept` pays in the same call, so
 * a bounty crosses from Submitted to Paid without resting at 5. It is named
 * here because every ordinal after it depends on it being counted.
 */
export const STATE = [
  'None', 'Open', 'Funded', 'Claimed', 'Submitted', 'Accepted', 'Paid', 'Disputed', 'Cancelled',
] as const
export type State = (typeof STATE)[number]

/**
 * `IEscrow.AssetKind`, in order — what a reward is made of.
 *
 * Native and ERC20 are amounts; ERC721 and ERC1155 name a token id, and for
 * those the reward number is a quantity rather than a value. The kind is
 * recorded rather than inferred, so a reward is never guessed at from whether
 * its token address happens to be zero.
 */
export const KIND = ['Native', 'ERC20', 'ERC721', 'ERC1155'] as const
export type Kind = (typeof KIND)[number]

/** The zero address: no token, meaning native, or no one in a role yet. */
export const ZERO = '0x0000000000000000000000000000000000000000'

/** One bounty, as `bounties(id)` records it. */
export interface Bounty {
  id: bigint
  state: State
  rewardKind: Kind
  rewardToken: string
  rewardTokenId: bigint
  reward: bigint
  stakeToken: string
  stake: bigint
  funder: string
  approver: string
  arbiter: string
  worker: string
  claimDeadline: bigint
  claimWindow: bigint
  claimNonce: bigint
  reviewWindow: bigint
  reviewDeadline: bigint
  rewardCreditedAmount: bigint
  settledAt: bigint
}

/** The tuple as viem returns it, before the two enums are given their names. */
export type Row = Omit<Bounty, 'id' | 'state' | 'rewardKind'> & { state: number; rewardKind: number }

/**
 * Names the ordinals.
 *
 * Out of range falls to None and Native rather than to `undefined`: an ordinal
 * this build cannot name is one the contract has and this file does not, and a
 * blank in that cell would read as an empty bounty rather than a stale reader.
 */
export const decode = (id: bigint, r: Row): Bounty => ({
  ...r,
  id,
  state: STATE[r.state] ?? 'None',
  rewardKind: KIND[r.rewardKind] ?? 'Native',
})

export async function board(v: Venue): Promise<Read<Bounty[]>> {
  const here = await presence(v, 'bounty')
  if (here.at !== 'read') return here
  const address = here.value.address

  return attempt(async () => {
    const one = reader(v, address, abi.bounty)
    const count = await one<bigint>('bountyCount')

    // 0 to count - 1. `bountyCount` is the next id to be issued rather than the
    // last one issued, and no None row stands in front of the board.
    const ids = Array.from({ length: Number(count) }, (_, i) => BigInt(i))
    return Promise.all(ids.map(async (id) => decode(id, await one<Row>('bounties', [id]))))
  })
}

/** A worker's standing, from the ledger this market is the only writer of. */
export interface Standing {
  address: string
  writer: string
  completed: bigint
  disputesLost: bigint
  earned: bigint
}

export async function standing(v: Venue, who: `0x${string}` | null): Promise<Read<Standing>> {
  const here = await presence(v, 'bounty')
  if (here.at !== 'read') return here
  return attempt(async () => {
    // Where the ledger lives comes from the market itself rather than from a
    // second address on record, so the two cannot be recorded out of step.
    const ledger = await reader(v, here.value.address, abi.bounty)<`0x${string}`>('reputation')
    const one = reader(v, ledger, abi.reputation)
    const writer = await one<string>('writer')
    if (!who) return { address: ledger, writer, completed: 0n, disputesLost: 0n, earned: 0n }
    // One call, because the ledger answers the whole record in one.
    const [completed, disputesLost, earned] = await one<[bigint, bigint, bigint]>('reputationOf', [who])
    return { address: ledger, writer, completed, disputesLost, earned }
  })
}
