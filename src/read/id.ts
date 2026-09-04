import type { Address } from 'viem'
import * as abi from '../gov/abi'
import type { Venue } from '../gov/chain'
import { presence, reader } from '../gov/client'
import { attempt, type Read } from '../gov/read'

/**
 * What a chain records about an identity.
 *
 * The account is IAM's — `src/chrome/id.ts` reads the token and says who is
 * signed in. This file asks a different authority a different question: whether
 * the `did:lux:…` that token carries is registered on the chain being read, and
 * what the registry says about it. Neither answer implies the other, and the
 * interesting cases are the ones where they differ:
 *
 *   a DID in the token, none on the chain — IAM minted an identifier that has
 *   never been registered, which is what every account looks like until somebody
 *   pays for the transaction
 *
 *   a DID on the chain, none in the token — an identity that exists without this
 *   IAM knowing about it, which is the ordinary case for anyone who registered
 *   one directly
 *
 * NO CHAIN THIS INTERFACE READS HAS A REGISTRY ON RECORD. `gov/chain.ts` carries
 * the slot only for the loopback node, because that is the only deployment
 * record that names an address — the four L2 devnet records say "(failed)" and
 * no mainnet record names one at all. So on lux.vote, zoo.vote and hanzo.vote
 * every read below returns `unrecorded` without a request, and the screen says
 * no address is recorded rather than reporting an identity as unregistered.
 * That is the difference between a fact about the chain and a fact about our
 * own files.
 */

/** A DID document, as the registry stores it. */
export interface Doc {
  readonly did: string
  readonly controller: Address
  readonly additionalControllers: readonly Address[]
  readonly alsoKnownAs: readonly string[]
  readonly created: bigint
  readonly updated: bigint
  readonly active: boolean
}

/** One key the document authorises, with its type read as a word. */
export interface Method {
  readonly id: `0x${string}`
  readonly kind: string
  readonly controller: Address
  readonly publicKeyMultibase: `0x${string}`
  readonly blockchainAccountId: `0x${string}`
}

export interface Registration {
  readonly document: Doc
  readonly methods: readonly Method[]
}

/**
 * `VerificationMethodType`, in the order `IDID.sol` declares it.
 *
 * The order is the encoding — a uint8 arrives and the name is this list's index
 * — so this must not be sorted, appended to for convenience, or shared with any
 * other contract's enum. `MultiDAOGovernor` and `Governor` already declare the
 * same seven state names in two different orders in this codebase, and one
 * shared list is how that becomes a wrong word on a screen.
 */
export const KINDS = [
  'Ed25519VerificationKey2020',
  'Ed25519VerificationKey2018',
  'X25519KeyAgreementKey2020',
  'X25519KeyAgreementKey2019',
  'EcdsaSecp256k1VerificationKey2019',
  'EcdsaSecp256k1RecoveryMethod2020',
  'JsonWebKey2020',
  'Bls12381G2Key2020',
  'MlDsa44VerificationKey2024',
  'MlDsa65VerificationKey2024',
  'SlhDsa128VerificationKey2024',
  'Custom',
] as const

/**
 * The name of a method type, or a note that this build does not have one.
 *
 * An index past the list is a registry compiled from a longer enum than the one
 * read here. Naming it `Custom` — the last entry — would be a wrong word rather
 * than a missing one, and post-quantum method types were appended to this enum
 * once already.
 */
export const kind = (n: number): string => KINDS[n] ?? `Unrecognised type ${n}`

/** The raw tuples viem decodes, before they are given names. */
type RawDoc = {
  did: string
  controller: Address
  additionalControllers: readonly Address[]
  alsoKnownAs: readonly string[]
  created: bigint
  updated: bigint
  active: boolean
}
type RawMethod = {
  id: `0x${string}`
  methodType: number
  controller: Address
  publicKeyMultibase: `0x${string}`
  blockchainAccountId: `0x${string}`
}

/**
 * What the registry holds for one DID.
 *
 * `read(null)` is the registry answering that it holds no active registration
 * under that name — never registered, or registered and deactivated, which are
 * the two cases `didExists` collapses and the only two it can. That is a fact
 * about the chain, and it is deliberately not the same value as `unrecorded` (no
 * registry address on file), `absent` (an address with no code) or `failed` (the
 * chain would not answer).
 *
 * `didExists` is asked first because `resolve` reverts for anything it does not
 * hold, and a revert arrives at the call site as the chain refusing — which
 * would report a perfectly healthy registry as unreadable every time somebody
 * without a registration signed in.
 */
export async function resolve(v: Venue, did: string): Promise<Read<Registration | null>> {
  const here = await presence(v, 'didRegistry')
  if (here.at !== 'read') return here

  return attempt(async () => {
    const one = reader(v, here.value.address, abi.did)
    if (!(await one<boolean>('didExists', [did]))) return null
    const [document, methods] = await Promise.all([
      one<RawDoc>('resolve', [did]),
      one<readonly RawMethod[]>('getVerificationMethods', [did]),
    ])
    return {
      document,
      methods: methods.map((m) => ({
        id: m.id,
        kind: kind(m.methodType),
        controller: m.controller,
        publicKeyMultibase: m.publicKeyMultibase,
        blockchainAccountId: m.blockchainAccountId,
      })),
    }
  })
}

/**
 * The DIDs an address controls.
 *
 * A list, because the registry keeps one per controller and a person may hold
 * several. Returning "the" DID for an address would mean picking one, and
 * nothing on the chain says which of them is meant.
 */
export async function dids(v: Venue, at: Address): Promise<Read<readonly string[]>> {
  const here = await presence(v, 'didRegistry')
  if (here.at !== 'read') return here
  return attempt(() => reader(v, here.value.address, abi.did)<readonly string[]>('getDIDsForController', [at]))
}
