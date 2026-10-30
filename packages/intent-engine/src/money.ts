/**
 * US dollar amounts as integers (ADR 0015 decision 12, addition of 2026-10-29): millionths of a US
 * dollar, one rounding rule for every AI usage amount. Pure; no float arithmetic on the amount.
 */

// Optional groups are written `(?:X|)`, the form `pnpm scan:code` passes (ORV-114 scan-unsafe-1).
const TEXT = /^(\d+)(?:\.(\d+)|)(?:e([+-]?\d+)|)$/;

/**
 * Rounds `usd` to millionths of a US dollar, half to even, from the shortest decimal text of the
 * number (`String(usd)`, an exponent form such as `5e-7` written out), never by multiplying the
 * float. `null` for a negative, a non-finite number, or a result that is not a safe integer.
 */
export function toMicroUsd(usd: number): number | null {
  if (usd < 0) return null;
  // NaN and the infinities print as text this pattern does not match.
  const match = TEXT.exec(String(usd));
  if (!match) return null;
  const fraction = match[2] ?? "";
  const digits = BigInt(`${match[1]}${fraction}`);
  // value = digits * 10^-scale, so millionths = digits * 10^(6 - scale)
  const shift = 6 - (fraction.length - Number(match[3] ?? 0));
  let micro: bigint;
  if (shift >= 0) {
    micro = digits * 10n ** BigInt(shift);
  } else {
    const divisor = 10n ** BigInt(-shift);
    micro = digits / divisor;
    const twice = (digits % divisor) * 2n;
    if (twice > divisor || (twice === divisor && micro % 2n === 1n)) micro += 1n;
  }
  if (micro > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(micro);
}
