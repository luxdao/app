import { describe, expect, it } from 'vitest'
import { absent, attempt, failed, read, unrecorded } from './read'

/**
 * The four outcomes are the whole point of this module, so what is tested is
 * that they stay four — a refusal must never arrive at a screen wearing the
 * shape of an empty answer.
 */
describe('the four readings', () => {
  it('keeps an empty answer distinct from an absent contract', () => {
    const nothing = read<string[]>([])
    const gone = absent<string[]>('0xabc')
    expect(nothing.at).toBe('read')
    expect(gone.at).toBe('absent')
    expect(nothing).not.toEqual(gone)
  })

  /**
   * "We never recorded where this is" is a statement about our own records;
   * "the chain has no code there" is a statement about the chain. Collapsing
   * them lets a missing entry in a manifest be reported as a missing contract.
   */
  it('keeps a missing record distinct from a missing contract', () => {
    const noRecord = unrecorded<number>()
    const noCode = absent<number>('0xabc')
    expect(noRecord.at).toBe('unrecorded')
    expect(noCode.at).toBe('absent')
    expect(noRecord).not.toEqual(noCode)
  })

  it('carries the address that had no code, so a screen can name it', () => {
    const gone = absent<number>('0x976520c30903F0744814D149574f9C0D9BaA1431')
    expect(gone.at === 'absent' && gone.address).toContain('0x9765')
  })

  it('turns a thrown call into a failure rather than letting it escape', async () => {
    const r = await attempt(async () => {
      throw new Error('execution reverted')
    })
    expect(r.at).toBe('failed')
    expect(r.at === 'failed' && r.why).toBe('execution reverted')
  })

  it('reports a non-Error rejection without losing it', () => {
    const r = failed<number>({ code: -32000 })
    expect(r.at).toBe('failed')
    expect(r.at === 'failed' && r.why).toContain('object')
  })

  it('passes a successful value through', async () => {
    const r = await attempt(async () => 42)
    expect(r).toEqual({ at: 'read', value: 42 })
  })
})
