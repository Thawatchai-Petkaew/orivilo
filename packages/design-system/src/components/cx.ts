/** Joins class names, dropping falsy entries. Components use it for layout classes only. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
