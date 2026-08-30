import * as abi from '../gov/abi'
import type { Venue } from '../gov/chain'
import { client, presence, reader } from '../gov/client'
import { attempt, type Read } from '../gov/read'

/** Gauges direct fees by vLUX weight. Ids are 0-based here, unlike roles and tasks. */
export interface Gauge {
  id: bigint
  recipient: string
  name: string
  kind: bigint
  active: boolean
  weight: bigint
}

export interface Gauges {
  address: string
  totalWeight: bigint
  rows: Gauge[]
}

export async function gauges(v: Venue): Promise<Read<Gauges>> {
  const here = await presence(v, 'gauges')
  if (here.at !== 'read') return here
  const address = here.value.address

  return attempt(async () => {
    const one = reader(v, address, abi.gauges)
    const [count, totalWeight] = await Promise.all([one<bigint>('gaugeCount'), one<bigint>('totalWeight')])
    const rows = await Promise.all(
      Array.from({ length: Number(count) }, (_, i) => BigInt(i)).map(async (id) => {
        const g = await one<readonly [string, string, bigint, boolean, bigint]>('getGauge', [id])
        return { id, recipient: g[0], name: g[1], kind: g[2], active: g[3], weight: g[4] }
      }),
    )
    return { address, totalWeight, rows }
  })
}
