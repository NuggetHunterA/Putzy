/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Version 0.n aus vite.config.ts.
declare const __VERSION__: string

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
}
