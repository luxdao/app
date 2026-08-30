import { describe, expect, it } from 'vitest'
import { STATES, SUPPORT, title, type Proposal } from './proposals'

const made = (description: string): Proposal => ({
  id: 1n, proposer: '0x0', description, voteStart: 0n, voteEnd: 0n,
  state: 'Pending', against: 0n, for: 0n, abstain: 0n, block: 0n,
})

describe('the OpenZeppelin proposal states', () => {
  /**
   * `MultiDAOGovernor` in the same tree declares seven of the same names with
   * Executed and Expired swapped. Reading one enum with the other's ordinals
   * reports an executed proposal as expired, so the order is pinned here.
   */
  it('is the OZ v5 order, which puts Executed last', () => {
    expect([...STATES]).toEqual([
      'Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed',
    ])
    expect(STATES[6]).toBe('Expired')
    expect(STATES[7]).toBe('Executed')
  })

  it('counts support the way GovernorCountingSimple does', () => {
    expect([...SUPPORT]).toEqual(['Against', 'For', 'Abstain'])
  })
})

describe('title', () => {
  it('takes the first non-empty line', () => {
    expect(title(made('Fund the audit\n\nDetail follows.'))).toBe('Fund the audit')
  })

  it('strips a markdown heading marker', () => {
    expect(title(made('## Fund the audit\nbody'))).toBe('Fund the audit')
  })

  it('skips leading blank lines rather than showing an empty title', () => {
    expect(title(made('\n\n  Raise the quorum'))).toBe('Raise the quorum')
  })

  /** A proposal with no description still has to be nameable in a list. */
  it('falls back to the id when there is no description', () => {
    expect(title(made(''))).toContain('Proposal 1')
    expect(title(made('   \n  '))).toContain('Proposal 1')
  })
})
