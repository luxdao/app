import type { IAMConfig } from '@hanzo/iam/browser'
import { claimsOf, resolveIdentity, useIam } from '@hanzo/iam/react'
import { useMemo } from 'react'
import type { Address } from 'viem'
import { type Brand, brand } from './brand'
import * as wallet from './wallet'

/**
 * Who is reading, and whether the wallet in the room is theirs.
 *
 * This app builds no authentication and never will. There is no password here,
 * no one-time code, no session of our own and no second gate in front of IAM's:
 * the tenant's IAM is the authority, this file is a reader of what it says, and
 * every credential is collected at the issuer's own origin. What arrives back is
 * a token, and the only thing done with it is decoding claims.
 *
 * IDENTITY IS NOT A SIGNATURE, and keeping them apart is the whole point of the
 * file. IAM says which account this is. `chrome/wallet.ts` holds a key that can
 * move value on a chain. They are separate facts about separate authorities, and
 * either can be true without the other:
 *
 *   signed in, no wallet    — reading under a name, cannot cast a vote
 *   wallet, not signed in    — the interface as it has always worked, a
 *                              read-only viewer that can still sign
 *   both, same address       — the wallet is one IAM records for the account
 *   both, different address  — a wallet IAM has never seen, said so and not
 *                              silently blessed
 *
 * The last row is why `linked` exists. Drawing a connected address beside a
 * signed-in name implies the account owns it, and nothing in either fact says
 * so.
 */

/**
 * Where the issuer sends the browser back.
 *
 * One path across the estate — lux.cloud, zoo.cloud and platform.hanzo.ai all
 * drive `redirect_uri=https://<host>/auth/callback` — and it is what each org's
 * IAM provisioning derives for an app of type `spa`. Unversioned: it is a
 * browser callback, not an API.
 */
export const RETURN = '/auth/callback'

/**
 * This app's OAuth client at the tenant's IAM.
 *
 * `<org>-<app>`, HIP-0111, and the org is the tenant: `lux-vote`, `zoo-vote`,
 * `hanzo-vote`. Derived rather than listed, because a fourth tenant added by a
 * fork gets its client id from the same rule that gave the first three theirs —
 * a table would need a fourth row nobody would remember to write.
 */
export const client = (b: Brand = brand()): string => `${b.key}-vote`

/**
 * What the SDK is configured with. Nothing here is an environment variable: the
 * host names the tenant, the tenant names its issuer, and the issuer plus the
 * client id are the whole configuration. A build flag that could point one
 * tenant's login at another tenant's issuer is a way to get that wrong, so
 * there isn't one.
 */
export function config(b: Brand = brand(), origin = globalThis.location?.origin ?? ''): IAMConfig {
  return {
    serverUrl: b.issuer,
    clientId: client(b),
    // The document's own address, read rather than configured. The issuer
    // redirects only to one the client is registered for, and that registration
    // is derived per host by each org's IAM provisioning — so a build that
    // could name a different one would only ever name a wrong one.
    redirectUri: `${origin}${RETURN}`,
    scope: 'openid profile email',
  }
}

/** The part of a sign-in that a person should be told before they start. */
export const host = (issuer: string): string => new URL(issuer).host

/**
 * Where the reader was when they started signing in.
 *
 * The trip replaces the history entry it started from — that is what keeps the
 * Back button from walking somebody back into a login — so the page they were
 * reading is not recoverable from history and is remembered here instead. It is
 * a note about navigation and holds nothing about the account; the token never
 * touches it.
 */
const WAS = 'vote.was'

const keep = (path: string) => {
  try {
    localStorage.setItem(WAS, path)
  } catch {
    // A browser that refuses storage still gets to sign in; it lands on "/".
  }
}

/**
 * The remembered page, read once and forgotten — if it is a page of THIS site.
 *
 * Storage is not the page's to vouch for, so the value is resolved against the
 * document's own origin and kept only if it stays there. A leading `/` is not
 * enough: `//host`, `/\host` and `/<tab>/host` all begin with one and all name
 * another origin once the URL parser has read them, and `history.replaceState`
 * refuses a cross-origin URL by throwing — which would leave the reader on the
 * callback's "completing sign-in" forever.
 */
export function was(origin: string = globalThis.location?.origin ?? ''): string {
  try {
    const path = localStorage.getItem(WAS)
    localStorage.removeItem(WAS)
    if (!path?.startsWith('/')) return '/'
    const at = new URL(path, origin)
    return at.origin === origin ? `${at.pathname}${at.search}${at.hash}` : '/'
  } catch {
    return '/'
  }
}

/** The half of the SDK this file uses to start a sign-in. */
export interface Signin {
  getSigninUrl: (params?: Record<string, unknown>) => Promise<string>
}

/**
 * Begin the sign-in, at the tenant's own issuer.
 *
 * The URL is built through the SDK so the PKCE verifier and the state are minted
 * and stashed — this is not a second implementation of the flow, and could not
 * be: without the SDK's stash the code that comes back has no verifier to be
 * exchanged with.
 *
 * The host is then pinned to the tenant's issuer. The SDK reads the authorize
 * endpoint out of OIDC discovery, and a brand IAM may advertise a SHARED host
 * there — zoolabs.id's discovery points authorize at hanzo.id — so a Zoo reader
 * would be asked to "Sign in to Hanzo" under a Zoo mark. The code is still
 * exchanged at the discovered token endpoint, which is already the brand's own.
 * The pin is a no-op wherever discovery already names the tenant, which is
 * lux.id and hanzo.id today.
 */
export async function start(sdk: Signin, at = brand()): Promise<void> {
  const url = new URL(await sdk.getSigninUrl())
  const iam = new URL(at.issuer)
  url.protocol = iam.protocol
  url.host = iam.host
  keep(window.location.pathname + window.location.search)
  window.location.href = url.toString()
}

/** An address IAM records for an account, and where it saw it. */
export interface Wallet {
  /** The chain named in the claim, or null when it named none. */
  readonly chain: string | null
  readonly address: Address
}

export interface Identity {
  /** IAM has not finished saying whether anybody is signed in. */
  readonly reading: boolean
  /** The IAM subject, or null when nobody is signed in. */
  readonly subject: string | null
  /** What to call them on screen. A name or an email, never an id. */
  readonly name: string | null
  /**
   * The addresses IAM records for this account.
   *
   * `null` and `[]` are different sentences and both have to be sayable. `null`
   * is IAM saying nothing — the claim is absent, which is what every account
   * minted before the claim existed looks like. `[]` is IAM saying this account
   * has no wallet. Neither is a wallet, and neither may be drawn as one.
   */
  readonly wallets: readonly Wallet[] | null
  /** The `did:lux:…` bound to this account, when the token carries one. */
  readonly did: string | null
  /** The address the browser wallet is connected as, signed in or not. */
  readonly connected: Address | null
  /** Whether the connected address is one IAM records for this account. */
  readonly linked: boolean
}

/**
 * A claim, from wherever the issuer put it.
 *
 * Two places rather than one is OIDC's shape and not a choice made here: the
 * userinfo document and the access token carry the same names, and which one
 * holds a given claim is the issuer's decision. Whichever answers is read, and
 * nothing is invented when both are silent.
 */
const claim = (name: string, user: unknown, claims: Record<string, unknown>): unknown =>
  (user as Record<string, unknown> | null | undefined)?.[name] ?? claims[name]

const ADDRESS = /^0x[0-9a-fA-F]{40}$/

/**
 * The `wallets` claim, read for what it is rather than for what it should be.
 *
 * A row whose address is not an address is dropped rather than shown: a
 * half-read address is a number the reader would be asked to trust, and the
 * claim is written by a service that is still being built. Anything that is not
 * a list at all — absent, a string, an object — is `null`, which is "IAM said
 * nothing", not "IAM said none".
 */
export function wallets(value: unknown): readonly Wallet[] | null {
  if (!Array.isArray(value)) return null
  const out: Wallet[] = []
  for (const row of value) {
    const at = (row as { address?: unknown } | null)?.address
    if (typeof at !== 'string' || !ADDRESS.test(at)) continue
    const chain = (row as { chain?: unknown }).chain
    out.push({ chain: typeof chain === 'string' && chain !== '' ? chain : null, address: at as Address })
  }
  return out
}

/**
 * The `did` claim, if it is one.
 *
 * `did:<method>:<identifier>` per W3C DID Core. A string that is not shaped like
 * a DID is not shown as one — it would be handed to the registry verbatim and
 * come back as a refusal that reads like the chain's fault.
 */
const DID = /^did:[a-z0-9]+:\S+$/

export function did(value: unknown): string | null {
  return typeof value === 'string' && DID.test(value) ? value : null
}

/** Addresses compare without case: a checksummed address is the same key. */
export const same = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase()

/** Whether an address is one of the recorded set. Unknown set, unknown answer. */
export const linked = (of: readonly Wallet[] | null, at: string | null): boolean =>
  at !== null && (of?.some((w) => same(w.address, at)) ?? false)

/**
 * Who is reading. IAM for the account, the wallet module for the key, and the
 * one derived fact — whether they are the same person's.
 */
export function useIdentity(): Identity {
  const { user, accessToken, isAuthenticated, isLoading } = useIam()
  const session = wallet.use()
  const connected = session?.address ?? null

  const account = useMemo(() => {
    if (!isAuthenticated) return { subject: null, name: null, wallets: null, did: null }
    const claims = claimsOf(accessToken)
    const sub = claim('sub', user, claims)
    return {
      subject: typeof sub === 'string' && sub !== '' ? sub : null,
      name: resolveIdentity(user as Record<string, unknown> | null, claims)?.name ?? null,
      wallets: wallets(claim('wallets', user, claims)),
      did: did(claim('did', user, claims)),
    }
  }, [isAuthenticated, accessToken, user])

  return {
    reading: isLoading,
    ...account,
    connected,
    linked: linked(account.wallets, connected),
  }
}
