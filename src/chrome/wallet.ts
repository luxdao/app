import { createWalletClient, custom, type Address, type WalletClient } from 'viem'
import { useSyncExternalStore } from 'react'
import type { Venue } from '../gov/chain'

/**
 * The wallet, in two halves, because the login library deliberately has only
 * one of them.
 *
 * `@luxwallet/connect` signs a CAIP-122 login message and nothing else. Its
 * `EvmConnector` holds the EIP-1193 provider in a hard-private field with no
 * getter, and the package has no `wallet_switchEthereumChain`, no
 * `sendTransaction`, and no read path — verified by grep over its source. That
 * is a reasonable boundary for an auth library, but a governance interface has
 * to cast a vote, so the provider is discovered here as well and viem is built
 * over it. `@luxwallet/connect` is still what proves who the address belongs
 * to; this half is what lets them act.
 *
 * Discovery is EIP-6963 with a `window.ethereum` fallback — the same order the
 * connect library uses, so both halves land on the same wallet.
 */

export interface Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
}

export interface Injected {
  id: string
  name: string
  provider: Provider
}

interface Announce {
  detail: { info: { uuid: string; name: string; rdns: string }; provider: Provider }
}

/** Wallets that announced themselves, deduplicated by rdns. */
export function announced(waitMs = 300): Promise<Injected[]> {
  if (typeof window === 'undefined') return Promise.resolve([])
  return new Promise((done) => {
    const seen = new Map<string, Injected>()
    const onAnnounce = (e: Event) => {
      const { detail } = e as unknown as Announce
      if (!detail?.info || !detail.provider) return
      seen.set(detail.info.rdns, {
        id: detail.info.rdns,
        name: detail.info.name,
        provider: detail.provider,
      })
    }
    window.addEventListener('eip6963:announceProvider', onAnnounce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))
    setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', onAnnounce)
      if (seen.size === 0) {
        const fallback = (window as unknown as { ethereum?: Provider }).ethereum
        if (fallback) seen.set('injected', { id: 'injected', name: 'Browser wallet', provider: fallback })
      }
      done([...seen.values()])
    }, waitMs)
  })
}

export interface Session {
  address: Address
  walletId: string
  /** The chain the wallet is actually on, which is not always the one being read. */
  chainId: number | null
  /** Set once the CAIP-122 login message has been signed. */
  proven: boolean
}

let session: Session | null = null
let provider: Provider | null = null
const listeners = new Set<() => void>()

const tell = () => {
  for (const l of listeners) l()
}
const watch = (l: () => void) => {
  listeners.add(l)
  return () => void listeners.delete(l)
}

export const use = (): Session | null => useSyncExternalStore(watch, () => session, () => null)

export function held(): Provider | null {
  return provider
}

export async function connect(w: Injected): Promise<Session> {
  const accounts = (await w.provider.request({ method: 'eth_requestAccounts' })) as string[]
  const address = accounts[0]
  if (!address) throw new Error('The wallet returned no account.')
  const chainIdHex = (await w.provider.request({ method: 'eth_chainId' })) as string
  provider = w.provider
  session = { address: address as Address, walletId: w.id, chainId: Number.parseInt(chainIdHex, 16), proven: false }

  w.provider.on?.('accountsChanged', (...a: unknown[]) => {
    const next = (a[0] as string[])?.[0]
    session = next && session ? { ...session, address: next as Address, proven: false } : null
    if (!next) provider = null
    tell()
  })
  w.provider.on?.('chainChanged', (...a: unknown[]) => {
    const id = Number.parseInt(String(a[0]), 16)
    if (session) session = { ...session, chainId: Number.isFinite(id) ? id : null }
    tell()
  })

  tell()
  return session
}

export function disconnect(): void {
  session = null
  provider = null
  tell()
}

export function proved(): void {
  if (session) session = { ...session, proven: true }
  tell()
}

/** A viem wallet client over the connected provider, for the calls that write. */
export function writer(): WalletClient | null {
  if (!provider || !session) return null
  return createWalletClient({ account: session.address, transport: custom(provider) })
}

/**
 * Ask the wallet to move to the chain being read.
 *
 * `wallet_switchEthereumChain` fails with 4902 when the wallet has never heard
 * of the chain, and the only cure is to describe it — which is why the venue
 * carries an RPC and a symbol rather than only an id.
 */
export async function switchTo(v: Venue): Promise<void> {
  if (!provider) throw new Error('No wallet is connected.')
  const chainId = `0x${v.id.toString(16)}`
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] })
  } catch (e) {
    const code = (e as { code?: number }).code
    if (code !== 4902) throw e
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId,
          chainName: v.name,
          nativeCurrency: { name: v.symbol, symbol: v.symbol, decimals: 18 },
          rpcUrls: [v.rpc],
          blockExplorerUrls: v.explorer ? [v.explorer] : [],
        },
      ],
    })
  }
}
