import "server-only";

/**
 * `read-allow-list-1` (ORV-268): who may read a website through `/read`. The list lives in the server
 * variable `READ_ALLOWED_EMAILS`, addresses separated by commas. It is read on each call, never at
 * module load, and never takes the `NEXT_PUBLIC_` prefix. The answer is true or false: no address,
 * no part of one and no list entry leaves this module.
 */

/** Trimmed and lowercased, nothing else: dots and `+` tags stay. */
const normal = (text: string): string => text.trim().toLowerCase();

/**
 * True only when the session's email equals one list entry exactly, after trim and lowercase. An unset
 * or empty list, an entry with no text, and a session with no email all deny. A domain or a wildcard
 * in the list matches no address, because only whole addresses are compared.
 */
export function mayRead(email: string | null | undefined): boolean {
  const given = normal(email ?? "");
  if (given === "") return false;
  const entries = (process.env["READ_ALLOWED_EMAILS"] ?? "")
    .split(",")
    .map(normal)
    .filter((entry) => entry !== "");
  return entries.includes(given);
}
