import { formatUnits } from 'viem'
import * as abi from '../gov/abi'
import type { Venue } from '../gov/chain'
import { client, presence, reader } from '../gov/client'
import { attempt, type Read } from '../gov/read'

/** What the Governor says about itself. Every field is a chain read. */
export interface Machine {
  address: string
  name: string
  version: string
  token: string
  timelock: string
  /** "mode=timestamp" or "mode=blocknumber" — decides what the two durations mean. */
  clockMode: string
  /** uint48 — viem decodes it as a number, not a bigint. */
  clock: number
  counting: string
  votingDelay: bigint
  votingPeriod: bigint
  proposalThreshold: bigint
  quorumNumerator: bigint
  quorumDenominator: bigint
  /** The live quorum, in vote units, at the Governor's own clock. */
  quorum: bigint
  /** Symbol and decimals of the token the Governor actually tallies. */
  symbol: string
  decimals: number
  totalSupply: bigint
}

export async function machine(v: Venue): Promise<Read<Machine>> {
  const here = await presence(v, 'governor')
  if (here.at !== 'read') return here
  const address = here.value.address

  return attempt(async () => {
    const c = client(v)
    const one = reader(v, address, abi.governor)

    const [name, version, token, timelock, clockMode, clock, counting] = await Promise.all([
      one<string>('name'), one<string>('version'), one<string>('token'), one<string>('timelock'),
      one<string>('CLOCK_MODE'), one<number>('clock'), one<string>('COUNTING_MODE'),
    ])
    const [votingDelay, votingPeriod, proposalThreshold, quorumNumerator, quorumDenominator] = await Promise.all([
      one<bigint>('votingDelay'), one<bigint>('votingPeriod'), one<bigint>('proposalThreshold'),
      one<bigint>('quorumNumerator'), one<bigint>('quorumDenominator'),
    ])
    // Quorum is asked for a timepoint one tick behind the clock: the Governor
    // refuses a lookup at the current one, because a checkpoint at the head is
    // still open. `clock` is a uint48 and arrives as a number, so it is widened
    // here rather than compared against a bigint literal — mixing the two is a
    // TypeError at runtime and reads as the chain refusing the call.
    const now = BigInt(clock)
    const quorum = await one<bigint>('quorum', [now > 0n ? now - 1n : 0n])

    const t = token as `0x${string}`
    const [symbol, decimals, totalSupply] = await Promise.all([
      c.readContract({ address: t, abi: abi.votes, functionName: 'symbol' }) as Promise<string>,
      c.readContract({ address: t, abi: abi.votes, functionName: 'decimals' }) as Promise<number>,
      c.readContract({ address: t, abi: abi.votes, functionName: 'totalSupply' }) as Promise<bigint>,
    ])

    return {
      address, name, version, token, timelock, clockMode, clock, counting,
      votingDelay, votingPeriod, proposalThreshold, quorumNumerator, quorumDenominator, quorum,
      symbol, decimals, totalSupply,
    }
  })
}

/**
 * A duration the Governor reports, in the unit its own clock uses.
 *
 * The distinction is load-bearing and was got wrong once already on this chain:
 * 96369 produces a block on demand, so the same 86400 reads as one day under a
 * timestamp clock and as several months under a block clock. The Governor is
 * asked which it runs rather than assumed.
 */
export function duration(ticks: bigint, clockMode: string): string {
  if (!clockMode.includes('timestamp')) return `${ticks.toLocaleString()} blocks`
  const s = Number(ticks)
  if (s % 86400 === 0) return `${s / 86400} ${s / 86400 === 1 ? 'day' : 'days'}`
  if (s % 3600 === 0) return `${s / 3600} hours`
  if (s % 60 === 0) return `${s / 60} minutes`
  return `${s} seconds`
}

/** Vote units, at the tallied token's own decimals. */
export function units(v: bigint, decimals: number): string {
  const whole = Number(formatUnits(v, decimals))
  return whole.toLocaleString(undefined, { maximumFractionDigits: whole < 1 ? 6 : 2 })
}
