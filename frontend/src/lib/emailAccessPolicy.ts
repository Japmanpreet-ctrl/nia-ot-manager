/** Default institute domain when env is not set */
const DEFAULT_DOMAIN = 'nia.edu.in';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const getAllowedEmailDomain = (): string =>
  (import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN?.trim() || DEFAULT_DOMAIN).toLowerCase();

/** When set (comma-separated), only these full addresses may access (must still match domain). */
export const parseEmailAllowlist = (): Set<string> | null => {
  const raw = import.meta.env.VITE_ALLOWED_EMAIL_ALLOWLIST?.trim();
  if (!raw) return null;
  const set = new Set(raw.split(',').map((e) => normalizeEmail(e)).filter(Boolean));
  return set.size > 0 ? set : null;
};

export const isEmailAllowedForAccess = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  const domain = getAllowedEmailDomain();
  if (!normalized.endsWith(`@${domain}`)) return false;
  const allowlist = parseEmailAllowlist();
  if (allowlist?.size) return allowlist.has(normalized);
  return true;
};

export const getEmailAccessDeniedMessage = (): string => {
  const domain = getAllowedEmailDomain();
  const allowlist = parseEmailAllowlist();
  if (allowlist?.size) {
    return `Only approved @${domain} addresses can use this app.`;
  }
  return `Only institute email addresses (@${domain}) can sign in or create an account.`;
};
