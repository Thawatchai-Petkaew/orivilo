// ORV-177: lets plain node import packages/intent-engine/src, whose relative imports have no
// extension ("./profile"). Registered by openrouter-interpret-record.mjs; adds no dependency.
// A specifier that node resolves by itself is left alone; only a relative one that fails gets
// ".ts" or "/index.ts" tried.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (!specifier.startsWith(".") || error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
    for (const suffix of [".ts", "/index.ts"]) {
      try {
        return await nextResolve(`${specifier}${suffix}`, context);
      } catch {
        // try the next suffix
      }
    }
    throw error;
  }
}
