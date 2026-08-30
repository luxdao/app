import * as abi from '../gov/abi'
import type { Venue } from '../gov/chain'
import { client, presence, reader } from '../gov/client'
import { attempt, type Read } from '../gov/read'

/**
 * Roles — our own registry, the successor to hats. A role is a `uint256` and
 * roles form an admin tree: to administer a role is to wear its parent.
 *
 * A role's name is not stored on chain. It appears once, in the `RoleCreated`
 * log, and nowhere else — so a registry with no logs read has ids and no
 * names, and this says so rather than inventing them. Wearers are not
 * enumerable either; membership is reconstructed from mint and burn logs.
 */
export interface Role {
  id: bigint
  admin: bigint
  maxSupply: number
  supply: bigint
  /** From the RoleCreated log. Absent when the log was not reached. */
  details: string | null
  mine: boolean
}

export async function registry(v: Venue, who: `0x${string}` | null): Promise<Read<Role[]>> {
  const here = await presence(v, 'roles')
  if (here.at !== 'read') return here
  const address = here.value.address
  const c = client(v)

  return attempt(async () => {
    const count = (await c.readContract({ address, abi: abi.roles, functionName: 'roleCount' })) as bigint
    const ids = Array.from({ length: Number(count) }, (_, i) => BigInt(i + 1))
    return Promise.all(
      ids.map(async (id) => {
        const one = reader(v, address, abi.roles)
        const [admin, maxSupply, supply] = await Promise.all([
          one<bigint>('adminRole', [id]), one<number>('maxSupply', [id]), one<bigint>('supply', [id]),
        ])
        const mine = who ? await one<boolean>('isWearer', [who, id]) : false
        return { id, admin, maxSupply, supply, details: null, mine }
      }),
    )
  })
}
