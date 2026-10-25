// Web security headers (ORV-108 slice D, ADR 0015). The static set goes on
// every route through next.config.ts; the CSP carries a per-request nonce and
// is built by proxy.ts. The CSP is Report-Only until the owner moves it to enforce.

export const staticSecurityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
] as const;

export const CSP_HEADER = "Content-Security-Policy-Report-Only";

export function createNonce(): string {
  // 16 bytes is 128 random bits; a UUID v4 holds only 122.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

export function buildCsp(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    // Google sign-in posts a form that redirects to accounts.google.com; form-action also checks redirect targets.
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'self'",
  ].join("; ");
}
