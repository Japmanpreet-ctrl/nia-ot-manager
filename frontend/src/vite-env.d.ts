/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Single domain (legacy). Prefer VITE_ALLOWED_EMAIL_DOMAINS when using multiple. */
  readonly VITE_ALLOWED_EMAIL_DOMAIN?: string;
  /** Comma-separated domains (overrides single-domain env when set). */
  readonly VITE_ALLOWED_EMAIL_DOMAINS?: string;
  /** Comma-separated full emails; if set, only these addresses may access */
  readonly VITE_ALLOWED_EMAIL_ALLOWLIST?: string;
  /** Full URL for email verification continue link — must match Firebase Authorized domains */
  readonly VITE_EMAIL_VERIFICATION_CONTINUE_URL?: string;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
