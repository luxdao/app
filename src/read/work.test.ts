import { describe, expect, it, vi } from 'vitest'
import * as abi from '../gov/abi'
import { read } from '../gov/read'
import { KIND, STATE, ZERO, decode, type Row } from './work'

const BOUNTY = '0x857c9fE5A644e048FEF7194Da10fFEb356a81fFD'
const LEDGER = '0xE6766AF6171F437D6d3952e73402b762718c1809'
const FUNDER = '0x1111111111111111111111111111111111111111'
const APPROVER = '0x2222222222222222222222222222222222222222'
const WORKER = '0x3333333333333333333333333333333333333333'

const venue = { id: 200200, key: 'zoo', at: { bounty: BOUNTY } } as never

const row = (over: Partial<Row> = {}): Row => ({
  state: 2, rewardKind: 0,
  rewardToken: ZERO, rewardTokenId: 0n, reward: 10n ** 18n,
  stakeToken: ZERO, stake: 10n ** 17n,
  funder: FUNDER, approver: APPROVER, arbiter: APPROVER, worker: ZERO,
  claimDeadline: 0n, claimWindow: 86_400n, claimNonce: 0n,
  reviewWindow: 86_400n, reviewDeadline: 0n,
  rewardCreditedAmount: 0n, settledAt: 0n,
  ...over,
})

/**
 * The market answers for itself and for its ledger, so one stub serves both
 * reads and records what was asked. `asked` is the point of the board test:
 * which ids the screen requested is the id base, and nothing else measures it.
 */
const stub = (rows: Row[], asked: bigint[] = []) => {
  vi.doMock('../gov/client', () => ({
    presence: async () => read({ address: BOUNTY, size: 9 }),
    reader: (_v: unknown, address: string) => async (fn: string, args: readonly unknown[] = []) => {
      if (address === BOUNTY) {
        if (fn === 'bountyCount') return BigInt(rows.length)
        if (fn === 'reputation') return LEDGER
        if (fn === 'bounties') {
          const id = args[0] as bigint
          asked.push(id)
          return rows[Number(id)]
        }
      }
      if (address === LEDGER) {
        if (fn === 'writer') return BOUNTY
        if (fn === 'reputationOf') return [3n, 1n, 42n]
      }
      throw new Error(`unstubbed ${fn} at ${address}`)
    },
  }))
  return asked
}

describe('the bounty state enum', () => {
  /**
   * This screen read a six-name enum — None, Open, Claimed, Submitted,
   * Released, Cancelled — belonging to `luxfi/standard`'s
   * `contracts/work/Bounty.sol`, a contract that was never deployed. Every
   * ordinal from 2 up was a different word than the chain meant by it.
   */
  it('is the nine-state order the deployed market carries', () => {
    expect([...STATE]).toEqual([
      'None', 'Open', 'Funded', 'Claimed', 'Submitted', 'Accepted', 'Paid', 'Disputed', 'Cancelled',
    ])
  })

  it('does not report a funded bounty as claimed', () => {
    expect(STATE[2]).toBe('Funded')
    expect(STATE[3]).toBe('Claimed')
  })

  /** Paid is 6, and 4 is a submission waiting on review rather than a payout. */
  it('puts the payout at 6, where the contract puts it', () => {
    expect(STATE[4]).toBe('Submitted')
    expect(STATE[6]).toBe('Paid')
    expect(STATE[7]).toBe('Disputed')
  })

  it('names the reward asset classes in escrow order', () => {
    expect([...KIND]).toEqual(['Native', 'ERC20', 'ERC721', 'ERC1155'])
  })
})

describe('the bounties tuple', () => {
  /**
   * Pinned against `dao/contracts/out-foundry/Bounty.sol/Bounty.json`. Order is
   * the entire content of a tuple decode: read one field out of step and the
   * reward token is reported as the funder, and every address after it moves
   * up one — a board that looks populated and names the wrong people.
   *
   * The artifact lives in another repository, so it is pinned here rather than
   * read: a test that reaches across repositories measures a checkout.
   */
  it('is the struct order the artifact declares', () => {
    type Component = { name: string; type: string }
    type Fragment = { name: string; outputs?: readonly { components?: readonly Component[] }[] }
    const fn = (abi.bounty as readonly Fragment[]).find((m) => m.name === 'bounties')

    expect(fn?.outputs?.[0]?.components?.map((c) => `${c.name} ${c.type}`)).toEqual([
      'state uint8', 'rewardKind uint8',
      'rewardToken address', 'rewardTokenId uint256', 'reward uint256',
      'stakeToken address', 'stake uint256',
      'funder address', 'approver address', 'arbiter address', 'worker address',
      'claimDeadline uint64', 'claimWindow uint64', 'claimNonce uint64',
      'reviewWindow uint64', 'reviewDeadline uint64',
      'rewardCreditedAmount uint256', 'settledAt uint64',
    ])
  })

  /** A count is not a balance. Read as uint256 the record decodes short. */
  it('reads the ledger counts at the width the ledger keeps them', () => {
    type Fragment = { name: string; outputs?: readonly { name?: string; type: string }[] }
    const fn = (abi.reputation as readonly Fragment[]).find((m) => m.name === 'reputationOf')

    expect(fn?.outputs?.map((o) => `${o.name} ${o.type}`)).toEqual([
      'completed uint64', 'disputesLost uint64', 'totalEarned uint256',
    ])
  })
})

describe('decode', () => {
  it('names both enums', () => {
    const b = decode(4n, row({ state: 6, rewardKind: 2, rewardTokenId: 7n, reward: 1n }))
    expect(b.id).toBe(4n)
    expect(b.state).toBe('Paid')
    expect(b.rewardKind).toBe('ERC721')
    expect(b.rewardTokenId).toBe(7n)
  })

  it('carries the record through unchanged', () => {
    const b = decode(0n, row({ worker: WORKER, stake: 5n }))
    expect(b.funder).toBe(FUNDER)
    expect(b.approver).toBe(APPROVER)
    expect(b.worker).toBe(WORKER)
    expect(b.stake).toBe(5n)
  })

  /**
   * An ordinal this build cannot name is one the contract has and this file
   * does not. Left undefined it renders as a blank cell, which reads as an
   * empty bounty rather than as a reader that has fallen behind.
   */
  it('falls back rather than leaving a state unnamed', () => {
    expect(decode(0n, row({ state: 99 })).state).toBe('None')
    expect(decode(0n, row({ rewardKind: 9 })).rewardKind).toBe('Native')
  })
})

describe('board', () => {
  /**
   * The off-by-one this screen carried: ids were requested from 1 to count,
   * which skips the first bounty and asks for one that does not exist.
   */
  it('numbers the board from zero', async () => {
    vi.resetModules()
    const asked = stub([row(), row({ state: 3 }), row({ state: 6 })])
    const { board } = await import('./work')
    const b = await board(venue)

    expect(b.at).toBe('read')
    if (b.at !== 'read') return
    expect(asked).toEqual([0n, 1n, 2n])
    expect(b.value.map((x) => x.id)).toEqual([0n, 1n, 2n])
    expect(b.value.map((x) => x.state)).toEqual(['Funded', 'Claimed', 'Paid'])
  })

  it('asks for nothing when the market has issued nothing', async () => {
    vi.resetModules()
    const asked = stub([])
    const { board } = await import('./work')
    const b = await board(venue)

    expect(b.at).toBe('read')
    if (b.at !== 'read') return
    expect(b.value).toEqual([])
    expect(asked).toEqual([])
  })
})

describe('standing', () => {
  it('finds the ledger through the market and reads the record in one call', async () => {
    vi.resetModules()
    stub([])
    const { standing } = await import('./work')
    const s = await standing(venue, WORKER)

    expect(s.at).toBe('read')
    if (s.at !== 'read') return
    expect(s.value).toEqual({
      address: LEDGER, writer: BOUNTY, completed: 3n, disputesLost: 1n, earned: 42n,
    })
  })

  /** A ledger entry belongs to an address; with no wallet there is none to ask about. */
  it('names the ledger without a wallet, and claims no record', async () => {
    vi.resetModules()
    stub([])
    const { standing } = await import('./work')
    const s = await standing(venue, null)

    expect(s.at).toBe('read')
    if (s.at !== 'read') return
    expect(s.value).toEqual({
      address: LEDGER, writer: BOUNTY, completed: 0n, disputesLost: 0n, earned: 0n,
    })
  })
})
