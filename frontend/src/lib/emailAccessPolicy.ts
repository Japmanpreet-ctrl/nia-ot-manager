/** Default institute domains when env is not set */
const DEFAULT_DOMAINS = ['nia.edu.in', 'nia.edu.ac.in'];
const DEFAULT_EXTERNAL_ADMIN_EMAILS = ['admin@nia-jaipur.local'];

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const splitCsv = (raw: string | undefined) =>
  raw
    ?.split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean) ?? [];

/** Comma-separated list. Overrides single-domain env when set. */
export const getAllowedEmailDomains = (): string[] => {
  const multi = import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS?.trim();
  if (multi) {
    const list = splitCsv(multi);
    if (list.length) return list;
  }
  const single = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN?.trim();
  if (single) return [single.toLowerCase()];
  return [...DEFAULT_DOMAINS];
};

/** @deprecated Prefer getAllowedEmailDomains — kept for older call sites */
export const getAllowedEmailDomain = (): string => getAllowedEmailDomains()[0] ?? DEFAULT_DOMAINS[0];

export const formatAllowedDomainsHint = (): string =>
  getAllowedEmailDomains()
    .map((d) => `@${d}`)
    .join(', ');

/** When set (comma-separated), only these full addresses may access (must still match a domain). */
export const parseEmailAllowlist = (): Set<string> | null => {
  const raw = import.meta.env.VITE_ALLOWED_EMAIL_ALLOWLIST?.trim();
  if (!raw) return null;
  const set = new Set(raw.split(',').map((e) => normalizeEmail(e)).filter(Boolean));
  return set.size > 0 ? set : null;
};

export const getExternalAdminEmails = (): Set<string> => {
  const raw = import.meta.env.VITE_EXTERNAL_ADMIN_EMAILS?.trim();
  const envAdmins = splitCsv(raw);
  return new Set([...DEFAULT_EXTERNAL_ADMIN_EMAILS, ...envAdmins].map((email) => normalizeEmail(email)));
};

export const isExternalAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return getExternalAdminEmails().has(normalizeEmail(email));
};

export const isEmailAllowedForAccess = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  if (isExternalAdminEmail(normalized)) return true;
  const domains = getAllowedEmailDomains();
  const matchesDomain = domains.some((domain) => normalized.endsWith(`@${domain}`));
  if (!matchesDomain) return false;
  const allowlist = parseEmailAllowlist();
  if (allowlist?.size) return allowlist.has(normalized);
  return true;
};

export const getEmailAccessDeniedMessage = (): string => {
  const hint = formatAllowedDomainsHint();
  const allowlist = parseEmailAllowlist();
  if (allowlist?.size) {
    return `Only approved institute addresses (${hint}) can use this app.`;
  }
  return `Only institute email addresses (${hint}) can sign in or create an account.`;
};
