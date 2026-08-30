import { createGui } from '@hanzo/gui'
import { getDefaultGuiConfig } from '@hanzogui/config-default'

/**
 * The engine's configuration, created once at module scope.
 *
 * `GuiProvider` alone is not enough: every styled component resolves its tokens
 * through a configuration that has to exist before the first one renders, and
 * without it the whole tree throws `Haven't called createGui yet` and the
 * document is blank. In the exchange this is done inside `@luxfi/ui`'s
 * `AppProvider`; that package is not here, because its prebuilt components
 * carry utility class strings and nothing in this build scans for them.
 *
 * `'web'` rather than the default, so the browser build never takes the native
 * animation driver.
 */
export const gui = createGui(getDefaultGuiConfig('web'))
