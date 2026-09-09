import { YStack } from '@hanzogui/stacks'
import { Heading, Paragraph, SizableText } from '@hanzogui/text'
import { Component, Fragment, Suspense, lazy, type ReactNode } from 'react'
import { Route, Routes } from 'react-router'
import { Nav, type Place } from './chrome/nav'
import { Help } from './chrome/help'
import * as chain from './chrome/here'
import { COLUMN, INSET, line, plain, quiet } from './parts/paint'
import { Link } from './parts/link'

/**
 * Every screen is lazy.
 *
 * Imported at the top of this file instead, each route joins the shell's own
 * module graph — and one route that will not parse takes down the nav, the
 * footer and every screen that was fine, as a blank document rather than an
 * error.
 */
const Overview = lazy(() => import('./routes/Overview'))
const Proposals = lazy(() => import('./routes/Proposals'))
const Proposal = lazy(() => import('./routes/Proposal'))
const Propose = lazy(() => import('./routes/Propose'))
const Delegate = lazy(() => import('./routes/Delegate'))
const Stake = lazy(() => import('./routes/Stake'))
const Treasury = lazy(() => import('./routes/Treasury'))
const Work = lazy(() => import('./routes/Work'))
const Roles = lazy(() => import('./routes/Roles'))
const Karma = lazy(() => import('./routes/Karma'))
const Gauges = lazy(() => import('./routes/Gauges'))
const Deployment = lazy(() => import('./routes/Deployment'))
const Settings = lazy(() => import('./routes/Settings'))
const Missing = lazy(() => import('./routes/Missing'))

/**
 * A screen that threw still owes the reader a heading.
 *
 * The level-one heading is what says which screen this is, and a boundary that
 * renders only an apology leaves the page unnamed — so this renders an h1 at
 * the level the screen's own title would have been.
 */
class Boundary extends Component<{ where: string; children: ReactNode }, { why: string | null }> {
  state = { why: null as string | null }
  static getDerivedStateFromError(e: unknown) {
    return { why: e instanceof Error ? e.message : String(e) }
  }
  render() {
    if (!this.state.why) return this.props.children
    return (
      <YStack gap="$4">
        <Heading render="h1" size="$8" margin={0} color={plain}>
          This screen did not load
        </Heading>
        <Paragraph size="$3" margin={0} color={quiet} maxWidth={620}>
          The rest of the interface is unaffected, and nothing here is a statement about governance —
          no chain state was read.
        </Paragraph>
        <SizableText
          render="pre"
          display="block"
          margin={0}
          size="$2"
          color={quiet}
          fontFamily="$mono"
          whiteSpace="pre-wrap"
          wordWrap="break-word"
        >
          {this.state.why}
        </SizableText>
      </YStack>
    )
  }
}

/**
 * A screen, wrapped in the two things every screen needs: a boundary that still
 * draws a heading when the screen throws, and a fallback while it arrives.
 *
 * Exported because a fork's screens need the same two, and a fork that wrote
 * its own would have routes that fail differently from the ones it imported.
 */
export const screen = (where: string, element: ReactNode) => (
  <Boundary where={where}>
    <Suspense
      fallback={
        <YStack padding="$4">
          <SizableText size="$3" color={quiet}>
            Loading…
          </SizableText>
        </YStack>
      }
    >
      {element}
    </Suspense>
  </Boundary>
)

/**
 * The interface.
 *
 * `more` and `places` are the whole of what a fork adds: its routes, and the
 * header entries that reach them. Everything else — the shell, the chain key,
 * the footer, the boundary — is the same code on every site, which is what
 * keeps a fork from drifting into a different app.
 */
export default function App({ more, places }: { more?: ReactNode; places?: readonly Place[] } = {}) {
  const here = chain.use()
  return (
    <YStack minHeight="100vh" backgroundColor="var(--color-bg-body)">
      <Nav more={places} />
      <Help />
      {/* Keyed on the chain, so changing it discards every in-flight read
          rather than letting one land against the wrong chain's screen. */}
      <Fragment key={here.key}>
        <YStack
          render="main"
          display="block"
          width="100%"
          maxWidth={COLUMN}
          marginHorizontal="auto"
          paddingHorizontal={INSET}
          paddingTop={32}
          paddingBottom={64}
          minWidth={0}
        >
          <Routes>
            {/* A fork's routes are ranked ahead of the base's, so a fork can
                replace a screen as well as add one — two routes with the same
                path rank equally and the first is taken. `/stake` on pars.vote
                is the stack's escrow screen reading Pars's escrow, and there is
                one screen at that path rather than two. */}
            {more}
            <Route path="/" element={screen('overview', <Overview />)} />
            <Route path="/proposals" element={screen('proposals', <Proposals />)} />
            <Route path="/proposals/new" element={screen('propose', <Propose />)} />
            <Route path="/proposals/:id" element={screen('proposal', <Proposal />)} />
            <Route path="/delegate" element={screen('delegate', <Delegate />)} />
            <Route path="/stake" element={screen('stake', <Stake />)} />
            <Route path="/treasury" element={screen('treasury', <Treasury />)} />
            <Route path="/work" element={screen('work', <Work />)} />
            <Route path="/roles" element={screen('roles', <Roles />)} />
            <Route path="/karma" element={screen('karma', <Karma />)} />
            <Route path="/gauges" element={screen('gauges', <Gauges />)} />
            <Route path="/deployment" element={screen('deployment', <Deployment />)} />
            <Route path="/settings" element={screen('settings', <Settings />)} />
            <Route path="*" element={screen('missing', <Missing />)} />
          </Routes>
        </YStack>
      </Fragment>

      <YStack
        render="footer"
        gap="$2"
        width="100%"
        maxWidth={COLUMN}
        marginHorizontal="auto"
        paddingHorizontal={INSET}
        paddingTop={24}
        paddingBottom={48}
        borderTopWidth={1}
        borderTopColor={line}
        minWidth={0}
      >
        <Paragraph size="$2" margin={0} color={quiet} maxWidth={620}>
          You sign every transaction in your own wallet.</Paragraph>
        <Paragraph size="$2" margin={0} color={quiet}>
          <Link href="/deployment">Smart contracts</Link> · <Link href="/gauges">Gauges</Link> ·{' '}
          <Link href="/settings">Settings</Link>
        </Paragraph>
      </YStack>
    </YStack>
  )
}
