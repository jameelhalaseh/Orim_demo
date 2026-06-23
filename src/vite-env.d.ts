/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Set these in a local .env (gitignored) or in Vercel project env vars to
  // switch the data layer from the in-memory demo store to Supabase.
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
