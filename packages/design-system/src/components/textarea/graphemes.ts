/**
 * Counts what a reader sees as characters: extended grapheme clusters through `Intl.Segmenter`
 * (ORV-72). Thai "water" (U+0E19 U+0E49 U+0E33) is one cluster but three UTF-16 units, so
 * `String.length` and the native `maxlength` overcount Thai. Without `Intl.Segmenter` it falls
 * back to code points.
 */
const segmenters = new Map<string, Intl.Segmenter>();

export function countGraphemes(text: string, localeTag = "th-TH"): number {
  if (text === "") return 0;
  if (typeof Intl === "undefined" || typeof Intl.Segmenter !== "function") {
    return Array.from(text).length;
  }
  let segmenter = segmenters.get(localeTag);
  if (!segmenter) {
    segmenter = new Intl.Segmenter(localeTag, { granularity: "grapheme" });
    segmenters.set(localeTag, segmenter);
  }
  return Array.from(segmenter.segment(text)).length;
}
