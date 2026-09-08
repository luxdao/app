import { createPublicClient, http, type Address, type PublicClient } from 'viem'
import type { Slot, Venue } from './chain'
import { absent, attempt, failed, read, unrecorded, type Read } from './read'

const clients = new Map<string, PublicClient>()

export function client(v: Venue): PublicClient {
  const had = clients.get(v.key)
  if (had) return had
  const made = createPublicClient({
    transport: http(v.rpc, { timeout: 15_000, retryCount: 1 }),
  }) as PublicClient
  clients.set(v.key, made)
  return made
}

/**
 * Does a contract exist at the address recorded for this slot?
 *
 * This is the question every screen asks first, and the reason it must be
 * asked: an address with no code answers a call with empty data rather than an
 * error, so "this chain has no Governor" and "this Governor has no proposals"
 * arrive at the call site as the same silence. Only the second is a fact about
 * governance.
 */
export async function presence(v: Venue, slot: Slot): Promise<Read<{ address: Address; size: number }>> {
  const address = v.at[slot]
  if (!address) return unrecorded()
  try {
    const code = await client(v).getCode({ address })
    const size = code ? (code.length - 2) / 2 : 0
    return size === 0 ? absent(address) : read({ address, size })
  } catch (e) {
    return failed(e)
  }
}

/**
 * Reads a range of logs in windows.
 *
 * A bare `fromBlock: 'earliest'` is the simplest call to write and the one a
 * public gateway will not serve: it runs until it is killed, and what comes
 * back is a timeout. A timeout at the call site cannot be told apart from a
 * contract that has emitted nothing — so the screen reports an empty register
 * and is wrong. Windowed, the same scan returns in a handful of requests and a
 * refusal stays a refusal.
 */
export const WINDOW = 10_000n

export async function* windows(from: bigint, to: bigint, size = WINDOW) {
  for (let lo = from; lo <= to; lo += size) {
    const hi = lo + size - 1n
    yield { from: lo, to: hi > to ? to : hi }
  }
}

/** Every log of one event over a range, gathered window by window. */
export async function scan<T>(
  v: Venue,
  gather: (from: bigint, to: bigint) => Promise<T[]>,
  from: bigint,
  to: bigint,
): Promise<Read<T[]>> {
  return attempt(async () => {
    const out: T[] = []
    for await (const w of windows(from, to)) out.push(...(await gather(w.from, w.to)))
    return out
  })
}

export const head = (v: Venue) => attempt(() => client(v).getBlockNumber())

/**
 * A reader bound to one contract.
 *
 * viem types `readContract` against the literal ABI, so a caller that picks the
 * function name at runtime cannot satisfy it — the argument tuple is only known
 * once the name is. The cast lives here, in one function, rather than at forty
 * call sites: an ABI is a runtime artifact and the return type is an assertion
 * wherever it is written, so it is written once and named for what it is.
 */
export function reader(v: Venue, address: Address, abi: readonly unknown[]) {
  const c = client(v)
  return <T,>(functionName: string, args: readonly unknown[] = []): Promise<T> =>
    c.readContract({ address, abi, functionName, args } as never) as Promise<T>
}
