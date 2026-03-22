/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Set to "false" to disable posture / doomcam during sessions. */
  readonly VITE_DOOMCAM_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
