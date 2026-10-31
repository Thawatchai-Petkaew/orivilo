// Writes the Logo's four generated files: the favicon SVG, the two app icon PNGs and the Storybook
// brand image (ORV-118 slice B, `logo-asset-1`). Run: pnpm --filter @orivilo/design-system logo-assets
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
