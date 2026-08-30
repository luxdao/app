import * as abi from '../gov/abi'
import type { Venue } from '../gov/chain'
import { presence, reader } from '../gov/client'
import { attempt, type Read } from '../gov/read'

/**
 * `Bounty.Status`, in order. `None` is 0 and never a real task, which is why
 * task ids are 1-based.
 *
 * This is the enum the deployed artifact carries. LP-0020 describes a longer
 * machine — Open, Funded, Claimed, Submitted, Disputed, Paid — over a separate
 * Escrow with an arbiter. That contract is not this one: `contracts/work/
 * Bounty.sol` escrows inside `postTask`, has no dispute path, and stops at
 * Released. Built from the artifact, because the artifact is what runs.
 */
export const STATUS = ['None', 'Open', 'Claimed', 'Submitted', 'Released', 'Cancelled'] as const
export type Status = (typeof STATUS)[number]

export interface Task {
  id: bigint
  poster: string
  worker: string
  token: string
  reward: bigint
  createdAt: bigint
  deadline: bigint
  status: Status
  detailsHash: string
  submissionHash: string
}

export const NATIVE = '0x0000000000000000000000000000000000000000'

export async function board(v: Venue): Promise<Read<Task[]>> {
  const here = await presence(v, 'bounty')
  if (here.at !== 'read') return here
  const address = here.value.address

  return attempt(async () => {
    const one = reader(v, address, abi.bounty)
    const count = await one<bigint>('taskCount')

    const ids = Array.from({ length: Number(count) }, (_, i) => BigInt(i + 1))
    return Promise.all(
      ids.map(async (id) => {
        const t = await one<{
          poster: string; worker: string; token: string; reward: bigint
          createdAt: bigint; deadline: bigint; status: number
          detailsHash: string; submissionHash: string
        }>('getTask', [id])
        return {
          id,
          poster: t.poster, worker: t.worker, token: t.token, reward: t.reward,
          createdAt: t.createdAt, deadline: t.deadline,
          status: STATUS[t.status] ?? 'None',
          detailsHash: t.detailsHash, submissionHash: t.submissionHash,
        }
      }),
    )
  })
}

/** A worker's standing, from the ledger the market is the only writer of. */
export interface Standing {
  address: string
  writer: string
  score: bigint
  completed: bigint
}

export async function standing(v: Venue, who: `0x${string}` | null): Promise<Read<Standing>> {
  const here = await presence(v, 'bounty')
  if (here.at !== 'read') return here
  return attempt(async () => {
    const ledger = await reader(v, here.value.address, abi.bounty)<`0x${string}`>('reputation')
    const one = reader(v, ledger, abi.reputation)
    const writer = await one<string>('writer')
    if (!who) return { address: ledger, writer, score: 0n, completed: 0n }
    const [score, completed] = await Promise.all([one<bigint>('score', [who]), one<bigint>('completed', [who])])
    return { address: ledger, writer, score, completed }
  })
}
