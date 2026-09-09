import type { CSSProperties, ReactNode } from 'react'
import { line, plain, quiet } from './paint'

/**
 * A table, as a table.
 *
 * The kit has no table component, and the reason it has none is that a table is
 * not a box: rows and cells have to be `<tr>` and `<td>` for a screen reader to
 * say "row 4, status", and the engine's boxes are flex containers whose
 * `display` cannot spell `table-cell`. So this is raw markup with a style
 * object — the one place in this interface where a style is not a prop, and it
 * carries no class either.
 */

export interface Column<R> {
  /** The header cell, and the accessible name of the column. */
  head: string
  cell: (row: R) => ReactNode
  /** Numbers read better right-aligned; everything else does not. */
  align?: 'left' | 'right'
  width?: string
}

/**
 * The track a table scrolls inside.
 *
 * `overflowX: auto` alone does not hold it. This sits in a flex column, and a
 * flex item's `min-width` is `auto` — it refuses to shrink below its content —
 * so the track grew to the table's intrinsic width and took the screen with it:
 * six columns measured 531 inside a 390 glass. `minWidth: 0` is what lets a
 * track be narrower than what it holds, which is the whole idea of a track.
 */
const wrap: CSSProperties = { width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'auto' }
const table: CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 0 }
const th: CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  borderBottom: `1px solid ${line}`,
  color: quiet,
  fontSize: 'var(--text-sm, 0.875rem)',
  fontWeight: 500,
  whiteSpace: 'nowrap',
}
const td: CSSProperties = {
  padding: '10px 12px',
  borderBottom: `1px solid ${line}`,
  color: plain,
  fontSize: 'var(--text-sm, 0.875rem)',
  verticalAlign: 'top',
}

export function Table<R>({
  columns,
  rows,
  caption,
  keyOf,
}: {
  columns: Column<R>[]
  rows: R[]
  /** Names the table for a screen reader. Visually present — a table nobody can name is a table nobody can skip. */
  caption: string
  keyOf: (row: R, i: number) => string
}) {
  return (
    <div style={wrap}>
      <table style={table}>
        <caption style={{ ...th, borderBottom: 'none', paddingLeft: 0, captionSide: 'top' }}>
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.head} scope="col" style={{ ...th, textAlign: c.align ?? 'left', width: c.width }}>
                {c.head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={keyOf(r, i)}>
              {columns.map((c) => (
                <td key={c.head} style={{ ...td, textAlign: c.align ?? 'left' }}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
