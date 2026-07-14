// Mock data and pure helpers for the whitelist-gated account activation flow.
// Registration is never open — an email must already exist in this whitelist
// (populated by an Admin via Staff Management's Import Staff feature) before
// it can be activated.

export type WhitelistStatus = "invited" | "active";

export type WhitelistEntry = {
  email: string;
  role: string;
  status: WhitelistStatus;
};

export const WHITELIST: WhitelistEntry[] = [
  { email: "berna@phenome.com", role: "Nurse", status: "invited" },
  { email: "yeni@phenome.com", role: "Receptionist", status: "invited" },
  { email: "ebru@phenome.com", role: "Clinician", status: "active" },
];

// Company-wide allowance: any address on this domain is treated as
// pre-authorised, on top of the specific WHITELIST entries above (which
// still take precedence, so a specific address can be marked "active" to
// demo the already-activated branch even on this domain).
export const ALLOWED_DOMAIN = "@phenomelongevity.com";

export const MOCK_VERIFICATION_CODE = "123456";

export type EmailCheckResult = "valid" | "not-authorised" | "already-active";

export function checkWhitelist(email: string): EmailCheckResult {
  const normalized = email.trim().toLowerCase();
  const entry = WHITELIST.find((w) => w.email.toLowerCase() === normalized);
  if (entry) return entry.status === "active" ? "already-active" : "valid";
  if (normalized.endsWith(ALLOWED_DOMAIN)) return "valid";
  return "not-authorised";
}

// "alice@clinic.com" -> "a***e@clinic.com". Illustrative masking, not
// reversible — only used to reassure the user which inbox to check.
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) return `${local[0]}${"*".repeat(Math.max(1, local.length - 1))}${domain}`;
  const stars = "*".repeat(Math.max(3, local.length - 2));
  return `${local[0]}${stars}${local[local.length - 1]}${domain}`;
}

export type PasswordRuleKey = "length" | "uppercase" | "number" | "special";

export const PASSWORD_RULES: { key: PasswordRuleKey; label: string; test: (pw: string) => boolean }[] = [
  { key: "length", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { key: "uppercase", label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { key: "number", label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { key: "special", label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function passwordRulesMet(pw: string): number {
  return PASSWORD_RULES.filter((r) => r.test(pw)).length;
}
