/// <reference types="vite/client" />

/**
 * What this build is told, and nothing more.
 *
 * `VITE_VOTE_HOME` names the venue the app opens on — one bundle, every brand,
 * built once per DAO. `VITE_HANZO_TELEMETRY` is off in every build we ship.
 */
interface ImportMetaEnv {
  readonly VITE_VOTE_HOME?: string
  readonly VITE_HANZO_TELEMETRY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
