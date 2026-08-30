import { useSyncExternalStore } from 'react'
import { KEY } from './boot'

export type Theme = 'dark' | 'light'

/** Dark is the ground this interface is drawn on. */
const SHIPPED: Theme = 'dark'

const listeners = new Set<() => void>()

function stored(): Theme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return SHIPPED
  }
}

let current: Theme = stored()

/**
 * The token layer resolves its light values at `:root` and its dark ones under
 * `.dark`, so this class decides which set the page reads. It is half the
 * switch: the engine picks a theme row of its own, which `main.tsx` hands to
 * the provider in the same breath. Setting one without the other gives a dark
 * page with light hairlines.
 */
export function apply(theme: Theme, root = globalThis.document?.documentElement): void {
  root?.classList.toggle('dark', theme === 'dark')
  root?.classList.toggle('light', theme === 'light')
}

export function set(theme: Theme): void {
  current = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // A browser refusing storage is not a reason to refuse the theme.
  }
  apply(theme)
  for (const l of listeners) l()
}

function watch(l: () => void) {
  listeners.add(l)
  return () => void listeners.delete(l)
}

export const use = (): Theme => useSyncExternalStore(watch, () => current, () => SHIPPED)
