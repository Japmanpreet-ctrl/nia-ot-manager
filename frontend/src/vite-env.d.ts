/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALLOWED_EMAIL_DOMAIN?: string;
  /** Comma-separated full emails; if set, only these @domain addresses may access */
  readonly VITE_ALLOWED_EMAIL_ALLOWLIST?: string;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
