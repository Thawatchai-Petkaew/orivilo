// Writes the Logo's seven generated files: the favicon SVG, the two app icon PNGs, the Storybook
// brand image and tab icon, and the two scene lockups of the prototype canvas (ORV-118 slice B,
// `logo-asset-1`; ORV-308). Run: pnpm --filter @orivilo/design-system logo-assets
// `assets.test.ts` fails when a committed file differs from what this writes.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { REPO_ROOT, logoAssetFiles } from "../src/components/logo/assets.ts";

for (const file of await logoAssetFiles()) {
  const target = path.join(REPO_ROOT, file.path);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, file.bytes);
  console.log(`wrote ${file.path} (${file.bytes.length} bytes)`);
}
