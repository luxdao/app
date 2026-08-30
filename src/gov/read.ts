/**
 * What a screen knows about something it asked the chain for.
 *
 * Four outcomes, not two. A rows array plus a loading flag makes the mistake
 * reachable — `[]` is the same value whether the contract is absent, the call
 * failed, or the contract answered and there is genuinely nothing. Those are
 * different sentences and a governance screen that renders them the same has
 * told the reader something nobody measured.
 *
 *  reading    — the call is in flight
 *  unrecorded — no file names an address for this contract on this chain; a
 *               statement about our own records, not about the chain
 *  absent     — an address is on record and eth_getCode returned no code at it
 *  failed     — the call was refused, timed out, or reverted; we do not know
 *  read       — the chain answered, and `value` is the answer, empty or not
 *
 * The first two are separated because they are different sentences and the
 * screens have to say the right one: "we never recorded where this is" is not
 * "this is not deployed".
 */
export type Read<T> =
  | { at: 'reading' }
  | { at: 'unrecorded' }
  | { at: 'absent'; address: string }
  | { at: 'failed'; why: string }
  | { at: 'read'; value: T }

export const reading = <T,>(): Read<T> => ({ at: 'reading' })
export const unrecorded = <T,>(): Read<T> => ({ at: 'unrecorded' })
export const absent = <T,>(address: string): Read<T> => ({ at: 'absent', address })
export const failed = <T,>(why: unknown): Read<T> => ({ at: 'failed', why: why instanceof Error ? why.message : String(why) })
export const read = <T,>(value: T): Read<T> => ({ at: 'read', value })

/** The one place a thrown call becomes a `failed` rather than a blank screen. */
export async function attempt<T>(run: () => Promise<T>): Promise<Read<T>> {
  try {
    return read(await run())
  } catch (e) {
    return failed(e)
  }
}
