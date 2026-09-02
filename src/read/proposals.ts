import { parseAbiItem } from 'viem'
import * as abi from '../gov/abi'
import type { Venue } from '../gov/chain'
import { client, presence, reader, scan } from '../gov/client'
import { attempt, type Read } from '../gov/read'

/**
 * OpenZeppelin v5 `IGovernor.ProposalState`, in order.
 *
 * `MultiDAOGovernor` in the same tree swaps the last two members. These are two
 * enums that happen to share seven names, so they do not share a type here.
 */
export const STATES = [
  'Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed',
] as const
export type State = (typeof STATES)[number]

/** `GovernorCountingSimple.VoteType`. */
export const SUPPORT = ['Against', 'For', 'Abstain'] as const

export interface Proposal {
  id: bigint
  proposer: string
  description: string
  voteStart: bigint
  voteEnd: bigint
  state: State
  against: bigint
  for: bigint
  abstain: bigint
  block: bigint
}

/**
 * The block each venue's Governor was created in.
 *
 * A proposal scan starts here rather than at `earliest`, because a contract
 * cannot log before it exists and the whole-chain form is what a gateway kills.
 * Measured from the creation receipt, not guessed: the Lux Governor's own
 * creation transaction lands in 1,095,842.
 *
 * Keyed by venue, not by chain id. A chain id names a network, not a
 * deployment, and several deployments answer to one: a node on this machine, a
 * fork, and a governor redeployed after the chain was re-genesised all report
 * 96369 and were created in entirely different blocks. Keyed by id, a local
 * chain 164 blocks long is scanned from 1,095,842 — a window that begins past
 * the head, returns nothing, and renders as "no proposal has ever been
 * created". That sentence is the one thing this screen must never say wrongly,
 * and the failure is invisible on the chain the number was measured from,
 * because there the true answer is also none.
 *
 * A venue with no entry starts at 0. That is only affordable on a short chain,
 * which is exactly the case that has no entry.
 */
const SINCE: Record<string, bigint> = { lux: 1_095_842n }

const created = parseAbiItem(
  'event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)',
)

export async function proposals(v: Venue): Promise<Read<Proposal[]>> {
  const here = await presence(v, 'governor')
  if (here.at !== 'read') return here
  const address = here.value.address
  const c = client(v)

  const to = await attempt(() => c.getBlockNumber())
  if (to.at !== 'read') return to

  const logs = await scan(
    v,
    (from, until) => c.getLogs({ address, event: created, fromBlock: from, toBlock: until }),
    SINCE[v.key] ?? 0n,
    to.value,
  )
  if (logs.at !== 'read') return logs

  // The log carries what was proposed; the contract carries where it got to.
  // Both are needed and only the second can change after the fact.
  return attempt(() =>
    Promise.all(
      logs.value.map(async (l) => {
        const a = l.args
        const id = a.proposalId as bigint
        const [state, votes] = await Promise.all([
          c.readContract({ address, abi: abi.governor, functionName: 'state', args: [id] }) as Promise<number>,
          c.readContract({ address, abi: abi.governor, functionName: 'proposalVotes', args: [id] }) as Promise<
            readonly [bigint, bigint, bigint]
          >,
        ])
        return {
          id,
          proposer: String(a.proposer),
          description: String(a.description ?? ''),
          voteStart: a.voteStart as bigint,
          voteEnd: a.voteEnd as bigint,
          state: STATES[state] ?? 'Pending',
          against: votes[0],
          for: votes[1],
          abstain: votes[2],
          block: l.blockNumber ?? 0n,
        }
      }),
    ),
  )
}

/** The first line of a proposal's description, which is its title by convention. */
export const title = (p: Proposal): string => {
  const line = p.description.split('\n').find((l) => l.trim().length > 0)?.replace(/^#+\s*/, '').trim()
  return line && line.length > 0 ? line : `Proposal ${p.id.toString().slice(0, 12)}…`
}
