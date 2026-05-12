const DEFAULT_DOMAINS = ['nia.edu.in', 'nia.edu.ac.in'];

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const splitCsv = (raw: string | undefined) =>
  raw
    ?.split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean) ?? [];

export const getAllowedEmailDomains = (): string[] => {
  const multi = process.env.ALLOWED_EMAIL_DOMAINS?.trim();
  if (multi) {
    const list = splitCsv(multi);
    if (list.length) return list;
  }
  const single = process.env.ALLOWED_EMAIL_DOMAIN?.trim();
  if (single) return [single.toLowerCase()];
  return [...DEFAULT_DOMAINS];
};

export const getAllowedEmailDomain = (): string => getAllowedEmailDomains()[0] ?? DEFAULT_DOMAINS[0];

export const formatAllowedDomainsHint = (): string =>
  getAllowedEmailDomains()
    .map((d) => `@${d}`)
    .join(', ');

export const parseEmailAllowlist = (): Set<string> | null => {
  const raw = process.env.ALLOWED_EMAIL_ALLOWLIST?.trim();
  if (!raw) return null;
  const set = new Set(raw.split(',').map((e) => normalizeEmail(e)).filter(Boolean));
  return set.size > 0 ? set : null;
};

export const isEmailAllowedForAccess = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  const domains = getAllowedEmailDomains();
  const matchesDomain = domains.some((domain) => normalized.endsWith(`@${domain}`));
  if (!matchesDomain) return false;
  const allowlist = parseEmailAllowlist();
  if (allowlist?.size) return allowlist.has(normalized);
  return true;
};
