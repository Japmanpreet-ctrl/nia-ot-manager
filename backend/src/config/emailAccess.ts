const DEFAULT_DOMAIN = 'nia.edu.in';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const getAllowedEmailDomain = (): string =>
  (process.env.ALLOWED_EMAIL_DOMAIN?.trim() || DEFAULT_DOMAIN).toLowerCase();

export const parseEmailAllowlist = (): Set<string> | null => {
  const raw = process.env.ALLOWED_EMAIL_ALLOWLIST?.trim();
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
