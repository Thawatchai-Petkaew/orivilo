---
id: K-0104
topic: design
claim: Google's Material typography in Flutter classes Thai as a tall script that needs extra line height for larger glyphs, though the Material 3 specification has no tall text themes, and W3C's Thai Script Resources say a Thai composite vowel can take up to four glyphs plus a tone mark around the consonant on up to three sides, while its line-height section asks questions and gives no values.
source: "https://api.flutter.dev/flutter/material/ScriptCategory.html; https://api.flutter.dev/flutter/material/Typography/tall2021-constant.html; https://api.flutter.dev/flutter/material/Typography/tall2018-constant.html; https://www.w3.org/TR/thai-lreq/; https://fonts.google.com/specimen/Sarabun/about (read through https://r.jina.ai/)"
retrieved: 2026-10-31
confidence: 0.8
applies_to: [ORV-192]
license: link-only
---

## Evidence

Confidence 0.8: Google (Flutter's Material library docs) and W3C each read and quoted; they state different things (a script class, a glyph structure), so they are not two sources agreeing on one figure.

### Material's script categories (Flutter API docs)

> tall: "Language scripts that require extra line height to accommodate larger glyphs, including South and Southeast Asian"
> "and Middle-Eastern languages, like Arabic, Hindi, Telugu, Thai, and Vietnamese."
> tall2018: "Defines text geometry for tall scripts, such as Farsi, Hindi, and Thai."
> "The font sizes, weights, and letter spacings in this version match the 2018 Material Design specification."
> tall2021: "The Material Design 3 specification does not include 'tall' text themes, so this is just here to be consistent with the API."

### W3C Thai Script Resources (Group Note Draft, 20 March 2026)

> "Only the vowel sign components that appear above or below the consonant are combining marks."
> "Composite vowels can involve up to 4 glyphs (plus a tone mark), and glyphs can surround the base consonant(s) on up to 3 sides."

Section 8.4, "Baselines, line height, etc.", asks: "Are there issues related to line height or inter-line spacing, etc.?" It gives no answer or values; its tests are marked "(tbc)".

### Sarabun (Google Fonts about page)

> "Sarabun is an open source multi-script webfont that supports both Latin and Thai."
> "It is the "TH Sarabun New" font, made available under the Open Font License."

The page says nothing about vertical metrics or line spacing.

### What the sources do not show

- A line-height number for Thai. Neither Material nor W3C gives one.
- Sarabun's ascender and descender values; the font's metrics were not read.

## Why it matters for ORIVILO

ORIVILO sets Thai in Sarabun in every profile. These sources support giving Thai more line height than an English-like script, but none gives the amount; a figure must come from K-0103, K-0105, a rendered test of Sarabun, or the owner.
