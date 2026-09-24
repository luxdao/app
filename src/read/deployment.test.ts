import { describe, expect, it } from 'vitest'
import { TENANTS } from '../tenants'
import { rows } from './deployment'

const VENUES = TENANTS.flatMap((b) => (b.local ? [b.venue, b.local] : [b.venue]))

describe('deployment rows', () => {
  it('names no other estate\'s token on a chain that records none', () => {
    for (const v of VENUES.filter((x) => !('dlux' in x.at) && !('votingLux' in x.at))) {
      expect(rows(v)).not.toContain('dlux')
      expect(rows(v)).not.toContain('votingLux')
    }
  })

  it('keeps a row for every slot a chain records', () => {
    for (const v of VENUES) {
      for (const slot of Object.keys(v.at)) {
        if (slot === 'didRegistry') continue
        expect(rows(v)).toContain(slot)
      }
    }
  })

  it('keeps the governance rows on every chain, recorded or not', () => {
    for (const v of VENUES) expect(rows(v)).toEqual(expect.arrayContaining(['governor', 'timelock', 'votes', 'safe']))
  })
})
