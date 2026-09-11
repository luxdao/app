import { describe, expect, it } from 'vitest'
import { VENUES, venue } from '../gov/chain'
import { KINDS, dids, kind, resolve } from './id'

const shipped = VENUES.filter((v) => !v.key.startsWith('local-'))

describe('where a DID registry is recorded', () => {
  /**
   * No chain this interface reads names one: the four L2 devnet records say
   * "(failed)", no mainnet record names one, and the local governance deploy
   * does not include one.
   */
  it('is recorded nowhere', () => {
    expect(VENUES.filter((v) => v.at.didRegistry).map((v) => v.key)).toEqual([])
    expect(venue('local-lux')?.at.didRegistry).toBeUndefined()
  })

  /**
   * The whole point of the slot being empty rather than filled with a plausible
   * address: with no address on file the interface says so and asks nothing.
   * A guessed address would be read, would answer, and the answer would be about
   * somebody else's contract — the same address is AMMV2Router in the 96368
   * testnet record, because it is a deployment nonce and not a registry.
   */
  it('says nothing was recorded rather than asking a chain it has no address for', async () => {
    for (const v of shipped) {
      expect((await resolve(v, 'did:lux:z')).at).toBe('unrecorded')
      expect((await dids(v, '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714')).at).toBe('unrecorded')
    }
  })
})

describe('verification method types', () => {
  /**
   * The order is the encoding: a uint8 arrives and the name is this list's
   * index. Pinned so a sort, an insertion or a copy from another contract's enum
   * fails here rather than showing the wrong words beside somebody's keys.
   */
  it('reads the enum in the order IDID.sol declares it', () => {
    expect(KINDS[0]).toBe('Ed25519VerificationKey2020')
    expect(kind(4)).toBe('EcdsaSecp256k1VerificationKey2019')
    expect(kind(8)).toBe('MlDsa44VerificationKey2024')
    expect(kind(11)).toBe('Custom')
    expect(KINDS).toHaveLength(12)
  })

  /**
   * A registry compiled from a longer enum than this build knows. Naming it
   * `Custom` — the last entry, and the answer a plain lookup would give — would
   * be a wrong word rather than a missing one, and post-quantum types were
   * appended to this enum once already.
   */
  it('refuses to name a type it does not have', () => {
    expect(kind(12)).toBe('Unrecognised type 12')
    expect(kind(255)).toBe('Unrecognised type 255')
  })
})
