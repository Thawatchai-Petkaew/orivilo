/**
 * The initials of a person's name (spec ORV-224, `avatar-initials-1`). Rule-based and pure; an
 * empty string means no initials. No read source gives a rule for Thai (K-0202): this is the
 * spec's default, and the owner accepted it as built (ORV-224 comment 10529). Thai ranges are
 * written as escapes because `check-i18n` fails on a Thai character outside the catalog.
 */
const LETTER = /\p{L}/u;
const THAI_SCRIPT = /\p{Script=Thai}/u;
/** U+0E01 to U+0E2E: the Thai consonants, with no vowel and no mark. */
const THAI_CONSONANT = new RegExp("[\\u0E01-\\u0E2E]", "u");

const segmenter = new Intl.Segmenter("th", { granularity: "grapheme" });

/** The first grapheme cluster of `word` that holds a letter. */
function firstLetterCluster(word: string): string {
  for (const { segment } of segmenter.segment(word)) {
    if (LETTER.test(segment)) return segment;
  }
  return "";
}

export function initialsOf(name: string): string {
  // Splitting an untrimmed name leaves an empty word at either end, which the letter filter drops.
  const words = name.split(/\s+/).filter((word) => LETTER.test(word));
  const first = words[0];
  if (first === undefined) return "";

  const head = firstLetterCluster(first);
  if (THAI_SCRIPT.test(head)) return first.match(THAI_CONSONANT)?.[0] ?? "";

  const last = words.length > 1 ? words[words.length - 1] : undefined;
  const tail = last === undefined ? "" : firstLetterCluster(last);
  return (head + (THAI_SCRIPT.test(tail) ? "" : tail)).toUpperCase();
}
