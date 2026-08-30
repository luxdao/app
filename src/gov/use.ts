import { useEffect, useState } from 'react'
import { reading, type Read } from './read'

/**
 * Runs a read and reports which of the four it came back as.
 *
 * The result of a superseded read is dropped rather than stored: a chain change
 * or a new address starts another, and without the guard the slower of the two
 * lands last and the screen shows an answer to a question nobody asked.
 */
export function useRead<T>(run: () => Promise<Read<T>>, deps: readonly unknown[]): Read<T> {
  const [state, setState] = useState<Read<T>>(reading<T>())
  useEffect(() => {
    let live = true
    setState(reading<T>())
    run().then(
      (r) => live && setState(r),
      (e) => live && setState({ at: 'failed', why: e instanceof Error ? e.message : String(e) }),
    )
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}

/** The same, for a read that has no four-state wrapper of its own. */
export function useAsync<T>(run: () => Promise<T>, deps: readonly unknown[]): Read<T> {
  return useRead(async () => {
    try {
      return { at: 'read' as const, value: await run() }
    } catch (e) {
      return { at: 'failed' as const, why: e instanceof Error ? e.message : String(e) }
    }
  }, deps)
}
