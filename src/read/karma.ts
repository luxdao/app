import * as abi from '../gov/abi'
import type { Venue } from '../gov/chain'
import { client, presence, reader } from '../gov/client'
import { attempt, type Read } from '../gov/read'

/**
 * Karma — soulbound, and deliberately not an ERC20.
 *
 * It presents an ERC20-shaped read surface but inherits none of it, emits no
 * Transfer, and its transfer/approve entry points revert unconditionally. So
 * there is no holder list to read and nothing here offers one: a balance is
 * known only for an address somebody asks about.
 */
export interface Karma {
  address: string
  name: string
  symbol: string
  decimals: number
  totalSupply: bigint
  cap: bigint
  /** Zero unless an address is connected — there is no way to enumerate holders. */
  mine: bigint
  verified: boolean
  activeThisMonth: boolean
  decayRate: bigint
}

export async function karma(v: Venue, who: `0x${string}` | null): Promise<Read<Karma>> {
  const here = await presence(v, 'karma')
  if (here.at !== 'read') return here
  const address = here.value.address

  return attempt(async () => {
    const one = reader(v, address, abi.karma)
    const [name, symbol, decimals, totalSupply, cap] = await Promise.all([
      one<string>('name'), one<string>('symbol'), one<number>('decimals'),
      one<bigint>('totalSupply'), one<bigint>('MAX_KARMA'),
    ])
    if (!who) {
      return { address, name, symbol, decimals, totalSupply, cap, mine: 0n, verified: false, activeThisMonth: false, decayRate: 0n }
    }
    const s = await one<readonly [bigint, boolean, boolean, boolean, bigint, boolean]>('getActivityStatus', [who])
    return {
      address, name, symbol, decimals, totalSupply, cap,
      mine: s[0], verified: s[1], activeThisMonth: s[2], decayRate: s[4],
    }
  })
}
