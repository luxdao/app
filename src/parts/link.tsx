import { SizableText } from '@hanzogui/text'
import type { FontSizeTokens } from '@hanzogui/web'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import type { MouseEvent } from 'react'
import { link, plain } from './paint'

/**
 * The one rule for which clicks belong to the router.
 *
 * The anchor always keeps its `href`, so a middle click, a cmd-click and a
 * "copy link" all behave the way the reader expects. Only a plain left click
 * with no modifier is taken.
 */
export function useWalk(done?: () => void) {
  const go = useNavigate()
  return (to: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    go(to)
    done?.()
  }
}

/** Internal or external, decided by the string rather than by a second prop. */
export function Link({
  href,
  children,
  size = '$3' as FontSizeTokens,
}: {
  href: string
  children: ReactNode
  size?: FontSizeTokens
}) {
  const walk = useWalk()
  const out = /^https?:/.test(href)
  return (
    <SizableText
      render={
        out ? (
          <a href={href} target="_blank" rel="noreferrer noopener" />
        ) : (
          <a href={href} onClick={walk(href)} />
        )
      }
      display="inline-flex"
      alignItems="center"
      minHeight={24}
      size={size}
      color={link}
      textDecorationLine="underline"
      hoverStyle={{ color: plain }}
      wordWrap="break-word"
    >
      {children}
    </SizableText>
  )
}
