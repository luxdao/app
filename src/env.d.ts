/// <reference types="vite/client" />

/**
 * What this build is told, and nothing more.
 *
 * `VITE_VOTE_HOME` names the tenant to be when the host names none — a preview
 * URL, a bare address, localhost. On lux.vote, zoo.vote and hanzo.vote the host
 * settles it and this is unread. `VITE_HANZO_TELEMETRY` is off in every build
 * we ship.
 */
interface ImportMetaEnv {
  readonly VITE_VOTE_HOME?: string
  readonly VITE_HANZO_TELEMETRY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
