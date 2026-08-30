import * as abi from '../gov/abi'
import type { Venue } from '../gov/chain'
import { client, presence, reader } from '../gov/client'
import { attempt, type Read } from '../gov/read'

/**
 * The treasury, which on this deployment is the Timelock and the Safe rather
 * than a Vault. Both are read for what they hold in the chain's own coin; a
 * token inventory needs an indexer and there is none behind this build, so no
 * screen offers one.
 */
export interface Holding {
  what: string
  address: string
  balance: bigint
}

export interface Treasury {
  minDelay: bigint
  /** Who may schedule, execute and cancel. An open executor is address zero. */
  governorProposes: boolean
  openExecutor: boolean
  adminRenounced: boolean
  holdings: Holding[]
}

const ZERO = '0x0000000000000000000000000000000000000000' as const

export async function treasury(v: Venue): Promise<Read<Treasury>> {
  const here = await presence(v, 'timelock')
  if (here.at !== 'read') return here
  const address = here.value.address
  const c = client(v)

  return attempt(async () => {
    const one = reader(v, address, abi.timelock)

    const [minDelay, proposer, executor, admin] = await Promise.all([
      one<bigint>('getMinDelay'), one<`0x${string}`>('PROPOSER_ROLE'),
      one<`0x${string}`>('EXECUTOR_ROLE'), one<`0x${string}`>('DEFAULT_ADMIN_ROLE'),
    ])

    const governor = v.at.governor
    const [governorProposes, openExecutor, anyAdmin] = await Promise.all([
      governor ? one<boolean>('hasRole', [proposer, governor]) : Promise.resolve(false),
      one<boolean>('hasRole', [executor, ZERO]),
      one<boolean>('hasRole', [admin, address]),
    ])

    const holdings: Holding[] = []
    for (const [what, at] of [['Timelock', address], ['DAO Safe', v.at.safe]] as const) {
      if (!at) continue
      const balance = await c.getBalance({ address: at as `0x${string}` })
      holdings.push({ what, address: at, balance })
    }

    return { minDelay, governorProposes, openExecutor, adminRenounced: !anyAdmin, holdings }
  })
}
