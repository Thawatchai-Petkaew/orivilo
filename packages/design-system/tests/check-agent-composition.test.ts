/**
 * Judge for the agent catalog exercise (ORV-37, docs/specs/ORV-37/spec.md section Judge).
 *
 * A builder agent composes one screen, `src/examples/members.tsx`, from the public entry. This file
 * is a guard rail for an agent that follows the rules; it is a text rule in a test file, not a
 * boundary against a session that sets out to defeat it. A pure function takes source text and a
 * context (the export list, the catalog, the coverage rows) and returns problems, each starting with
 * the id of the clause that fired.
 *
 * `controls` runs the function on inline samples over a synthetic export list and catalog with
 * invented names, so this file names no catalog name: one clean sample and one red sample per clause,
 * per closed-list member and per import form. `target` runs it on the composed files. `target` reads
 * its files inside `it()`, never in the describe body, so a `-t controls` run does not fail at
 * collection.
 *
 * Import forms the screen guard (orv37-i1) refuses: a single-line import, a multi-line import, a
 * side-effect import, a namespace import, a default import, a dynamic `import()`, an
 * `export ... from`, `require()`, an `import x = require()` and an `import("...")` type.
 *
 * Scans of string text (`var(--`, hex colour, `rgb(`) read string literals, template text and JSX
 * text, not comments. The `ts-ignore` family and `eslint-disable` are read in the whole text.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { load } from "js-yaml";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const root = path.join(import.meta.dirname, "..");

/** The composed screen files the judge runs on (orv37-t1). */
const AGENT_COMPOSED = ["src/examples/members.tsx"] as const;
const STORY_FILE = "src/examples/members.stories.tsx";

const PACKAGE = "@orivilo/design-system";
const ROOT_EXPORT = "./src/index.ts";
const MIN_CATALOG_ENTRIES = 40;
const MIN_USED_ENTRIES = 8;
const MIN_USED_WITHOUT_EXAMPLES = 2;
const SCREEN_MODULES = ["react", "../index"] as const;
const SCREEN_VALUE_EXPORTS = ["MEMBERS", "MembersScreen"] as const;
const STORY_MODULES = [
  "@storybook/react-vite",
  "storybook/test",
  "./members",
  "../components/matrix",
  "../testing/visual-asserts",
] as const;
const MATRIX_MODULE = "../components/matrix";
const MATRIX_NAMES = ["Under", "Narrow"] as const;
const STORY_TAGS = ["MembersScreen", "Under", "Narrow"] as const;
const ALLOWED_HYPHENATED = [
  "aria-label",
  "aria-labelledby",
  "aria-describedby",
  "aria-live",
  "aria-atomic",
  "aria-hidden",
  "aria-busy",
] as const;
const LOWERCASE_TAGS = [
  "div",
  "span",
  "p",
  "h1",
  "h2",
  "h3",
  "header",
  "section",
  "main",
  "form",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "time",
] as const;
const ALLOWED_ROLES = ["status", "alert"] as const;
const FORBIDDEN_IDENTIFIERS = [
  "createElement",
  "cloneElement",
  "dangerouslySetInnerHTML",
  "JSON",
  "Reflect",
  "Function",
  "eval",
  "globalThis",
] as const;
const PAINT_PREFIXES = [
  "bg-",
  "border",
  "rounded",
  "shadow",
  "drop-shadow",
  "ring",
  "inset-ring",
  "outline",
  "divide",
  "fill-",
  "stroke-",
  "opacity-",
  "decoration-",
  "backdrop-",
  "mask-",
  "text-feedback-",
  "text-action-",
  "text-brand-",
] as const;

// ---------------------------------------------------------------------------------------------
// Readers: the export list, the catalog, the coverage rows, the package entry
// ---------------------------------------------------------------------------------------------

interface ComponentExport {
  folder: string;
  type: boolean;
}

interface CatalogEntry {
  folder: string;
  tier: "base" | "application";
  status: string;
  import: string;
  examples: string[];
}

interface Context {
  /** Exported name (after any `as`) to the folder of its export specifier and whether it is a type. */
  exports: ReadonlyMap<string, ComponentExport>;
  /** Catalog file name without `.yaml` to the entry. */
  catalog: ReadonlyMap<string, CatalogEntry>;
  /** Component rows of coverage.md, normalised (lower case, no spaces, no `(pattern)`). */
  coverage: ReadonlySet<string>;
  /** `exports["."]` of the package. */
  rootExport: unknown;
}

function parse(source: string): ts.SourceFile {
  return ts.createSourceFile("input.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

/** Every `export {...} from "./<folder>/..."` of src/components/index.ts, keyed by the exported name. */
function readComponentExports(text: string): Map<string, ComponentExport> {
  const out = new Map<string, ComponentExport>();
  for (const statement of parse(text).statements) {
    if (!ts.isExportDeclaration(statement)) continue;
    const from = statement.moduleSpecifier;
    const clause = statement.exportClause;
    if (!from || !ts.isStringLiteral(from) || !clause || !ts.isNamedExports(clause)) continue;
    const folder = from.text.replace(/^\.\//, "").split("/")[0] ?? "";
    for (const element of clause.elements) {
      out.set(element.name.text, { folder, type: statement.isTypeOnly || element.isTypeOnly });
    }
  }
  return out;
}

function readCatalog(): Map<string, CatalogEntry> {
  const out = new Map<string, CatalogEntry>();
  for (const tier of ["base", "application"] as const) {
    const dir = path.join(root, "catalog", tier);
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".yaml"))) {
      const doc = load(readFileSync(path.join(dir, file), "utf8")) as {
        status?: unknown;
        import?: unknown;
        examples?: unknown;
      } | null;
      const folder = file.replace(/\.yaml$/, "");
      out.set(folder, {
        folder,
        tier,
        status: typeof doc?.status === "string" ? doc.status : "",
        import: typeof doc?.import === "string" ? doc.import : "",
        examples: Array.isArray(doc?.examples)
          ? doc.examples.filter((e): e is string => typeof e === "string")
          : [],
      });
    }
  }
  return out;
}

/** Lower case, without spaces and without `(pattern)`, so `Two words (pattern)` meets `TwoWords`. */
function normalise(name: string): string {
  return name.toLowerCase().replace("(pattern)", "").replace(/\s+/g, "");
}

/** The first cell of every component table of coverage.md, up to the Page examples section. */
function readCoverageRows(markdown: string): Set<string> {
  const out = new Set<string>();
  const head = markdown.split("## Page examples")[0] ?? "";
  for (const line of head.split("\n")) {
    const cell = /^\| ([A-Za-z][^|]*?) *\|/.exec(line)?.[1];
    if (cell && cell !== "Component") out.add(normalise(cell));
  }
  return out;
}

function loadContext(): Context {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
    exports?: Record<string, unknown>;
  };
  return {
    exports: readComponentExports(
      readFileSync(path.join(root, "src", "components", "index.ts"), "utf8"),
    ),
    catalog: readCatalog(),
    coverage: readCoverageRows(readFileSync(path.join(root, "catalog", "coverage.md"), "utf8")),
    rootExport: pkg.exports?.["."],
  };
}

// ---------------------------------------------------------------------------------------------
// The judge
// ---------------------------------------------------------------------------------------------

type Report = (id: string, node: ts.Node, message: string) => void;

function reporter(sf: ts.SourceFile): { report: Report; problems: string[] } {
  const problems: string[] = [];
  return {
    problems,
    report: (id, node, message) => {
      const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
      problems.push(`${id}: ${message} (line ${line})`);
    },
  };
}

function flatten(sf: ts.SourceFile): ts.Node[] {
  const out: ts.Node[] = [];
  const visit = (node: ts.Node): void => {
    out.push(node);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

function bindingNames(name: ts.BindingName): string[] {
  if (ts.isIdentifier(name)) return [name.text];
  return name.elements.flatMap((element) =>
    ts.isOmittedExpression(element) ? [] : bindingNames(element.name),
  );
}

function attributeName(attribute: ts.JsxAttribute): string {
  const name = attribute.name;
  return ts.isIdentifier(name) ? name.text : `${name.namespace.text}:${name.name.text}`;
}

/** The text of a plain string literal value, or undefined for anything built or computed. */
function literalValue(initializer: ts.JsxAttribute["initializer"]): string | undefined {
  if (!initializer) return undefined;
  if (ts.isStringLiteral(initializer)) return initializer.text;
  if (ts.isJsxExpression(initializer) && initializer.expression) {
    return ts.isStringLiteral(initializer.expression) ? initializer.expression.text : undefined;
  }
  return undefined;
}

function openingElements(nodes: ts.Node[]): ts.JsxOpeningLikeElement[] {
  return nodes.filter(
    (n): n is ts.JsxOpeningLikeElement =>
      ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n),
  );
}

interface IndexImport {
  local: string;
  imported: string;
  node: ts.Node;
}

/** Names imported from `../index`, value or type, with the name they have in the export list. */
function indexImports(nodes: ts.Node[]): IndexImport[] {
  const out: IndexImport[] = [];
  for (const node of nodes) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
    if (node.moduleSpecifier.text !== "../index") continue;
    const bindings = node.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      out.push({
        local: element.name.text,
        imported: (element.propertyName ?? element.name).text,
        node: element,
      });
    }
  }
  return out;
}

/**
 * Module rules shared by the screen (orv37-i1) and the story (orv37-s1): an import from a module
 * outside the list, and every way past an import list: dynamic `import()`, `require()`,
 * `import x = require()`, an `import("...")` type, and `export ... from`. `namedOnly` also refuses
 * side-effect, namespace and default imports from an allowed module.
 */
function checkModules(
  nodes: ts.Node[],
  report: Report,
  id: string,
  allowed: readonly string[],
  namedOnly: boolean,
): void {
  for (const node of nodes) {
    if (ts.isImportDeclaration(node)) {
      const spec = ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : "";
      if (!allowed.includes(spec)) {
        report(id, node, `import from "${spec}" is outside the allowed modules`);
      } else if (namedOnly) {
        const clause = node.importClause;
        if (!clause) report(id, node, `side-effect import of "${spec}"`);
        else if (clause.name) report(id, node, `default import from "${spec}"`);
        else if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
          report(id, node, `namespace import from "${spec}"`);
        }
      }
    } else if (ts.isImportEqualsDeclaration(node)) {
      report(id, node, "import-equals declaration");
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      report(id, node, "export ... from");
    } else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        report(id, node, "dynamic import()");
      } else if (ts.isIdentifier(node.expression) && node.expression.text === "require") {
        report(id, node, "require()");
      }
    } else if (ts.isImportTypeNode(node)) {
      report(id, node, 'import("...") type');
    }
  }
}

/** Text of string literals, template parts and JSX text: where a colour or a variable would be typed. */
function stringTexts(nodes: ts.Node[]): { node: ts.Node; text: string }[] {
  const out: { node: ts.Node; text: string }[] = [];
  for (const node of nodes) {
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node) ||
      ts.isJsxText(node)
    ) {
      out.push({ node, text: node.text });
    }
  }
  return out;
}

/** Why a class token is refused (orv37-d3), or undefined. Variant prefixes and a leading `!` are stripped. */
function classTokenProblem(token: string): string | undefined {
  if (token.includes("[")) return `class "${token}" is arbitrary (contains "[")`;
  const bare = (token.split(":").at(-1) ?? "").replace(/^!/, "");
  if (bare.startsWith("ds-")) return `class "${token}" is a recipe class (ds-)`;
  const family = PAINT_PREFIXES.find((prefix) => bare.startsWith(prefix));
  return family ? `class "${token}" is in the paint family "${family}"` : undefined;
}

/** orv37-t1: the catalog parse cannot pass by reading nothing. */
function floorProblems(ctx: Pick<Context, "catalog">): string[] {
  return ctx.catalog.size < MIN_CATALOG_ENTRIES
    ? [
        `orv37-t1: the catalog parse returned ${ctx.catalog.size} entries, fewer than ${MIN_CATALOG_ENTRIES}`,
      ]
    : [];
}

/** The clauses orv37-i1, i2, i3, p1, d1, d2 and d3 on the screen file. */
function judgeScreen(source: string, ctx: Context): string[] {
  const sf = parse(source);
  const nodes = flatten(sf);
  const { report, problems } = reporter(sf);
  const texts = stringTexts(nodes);
  const imports = indexImports(nodes);
  const tags = openingElements(nodes);

  // orv37-i1: modules and forms.
  if (ctx.rootExport !== ROOT_EXPORT) {
    report("orv37-i1", sf, `package.json exports["."] is not ${ROOT_EXPORT}`);
  }
  checkModules(nodes, report, "orv37-i1", SCREEN_MODULES, true);

  // orv37-i2: every name from ../index is a stable catalog component.
  for (const { imported, node } of imports) {
    const found = ctx.exports.get(imported);
    if (!found) {
      report("orv37-i2", node, `"${imported}" is not an export of src/components/index.ts`);
      continue;
    }
    const entry = ctx.catalog.get(found.folder);
    if (!entry) {
      report("orv37-i2", node, `"${imported}": folder "${found.folder}" has no catalog entry`);
    } else if (entry.status !== "stable") {
      report("orv37-i2", node, `"${imported}": folder "${found.folder}" is ${entry.status}`);
    } else if (entry.import !== PACKAGE) {
      report(
        "orv37-i2",
        node,
        `"${imported}": entry "${found.folder}" imports from ${entry.import}`,
      );
    } else if (!found.type && !/^[A-Z][a-z]/.test(imported)) {
      report("orv37-i2", node, `"${imported}" is a value that is not a component name`);
    }
  }

  // orv37-i3: size hint, entries used as JSX tags.
  const importedOf = new Map(imports.map((i) => [i.local, i.imported]));
  const used = new Map<string, CatalogEntry>();
  for (const tag of tags) {
    if (!ts.isIdentifier(tag.tagName)) continue;
    const imported = importedOf.get(tag.tagName.text);
    const folder = imported === undefined ? undefined : ctx.exports.get(imported)?.folder;
    const entry = folder === undefined ? undefined : ctx.catalog.get(folder);
    if (entry?.status === "stable") used.set(entry.folder, entry);
  }
  const entries = [...used.values()];
  if (entries.length < MIN_USED_ENTRIES) {
    report(
      "orv37-i3",
      sf,
      `${entries.length} distinct stable entries used as JSX tags, at least ${MIN_USED_ENTRIES} needed`,
    );
  }
  if (!entries.some((e) => e.tier === "base") || !entries.some((e) => e.tier === "application")) {
    report(
      "orv37-i3",
      sf,
      "the used entries must come from both the base and the application tier",
    );
  }
  if (entries.filter((e) => e.examples.length === 0).length < MIN_USED_WITHOUT_EXAMPLES) {
    report(
      "orv37-i3",
      sf,
      `fewer than ${MIN_USED_WITHOUT_EXAMPLES} used entries have examples: []`,
    );
  }

  // orv37-p1: forms that hand back an untyped value.
  for (const node of nodes) {
    if (ts.isJsxSpreadAttribute(node) || (ts.isJsxExpression(node) && node.dotDotDotToken)) {
      report("orv37-p1", node, "JSX spread");
    } else if (ts.isJsxAttribute(node)) {
      const name = attributeName(node);
      if (name.includes(":")) report("orv37-p1", node, `namespaced attribute "${name}"`);
      else if (name.includes("-") && !(ALLOWED_HYPHENATED as readonly string[]).includes(name)) {
        report("orv37-p1", node, `hyphenated attribute "${name}"`);
      }
    } else if (node.kind === ts.SyntaxKind.AnyKeyword) {
      report("orv37-p1", node, "any");
    } else if (ts.isAsExpression(node)) {
      const isConst =
        ts.isTypeReferenceNode(node.type) &&
        ts.isIdentifier(node.type.typeName) &&
        node.type.typeName.text === "const";
      if (!isConst) report("orv37-p1", node, "type assertion other than as const");
    } else if (
      ts.isIdentifier(node) &&
      (FORBIDDEN_IDENTIFIERS as readonly string[]).includes(node.text)
    ) {
      report("orv37-p1", node, `use of ${node.text}`);
    }
  }
  const directive = /ts-(ignore|expect-error|nocheck)|eslint-disable/.exec(source)?.[0];
  if (directive) report("orv37-p1", sf, `directive ${directive}`);

  // orv37-d1: no local declaration duplicates an export or a coverage row.
  const localFunctions = new Set<string>();
  const declared: { name: string; node: ts.Node }[] = [];
  for (const node of nodes) {
    if (
      (ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node)) &&
      node.name
    ) {
      declared.push({ name: node.name.text, node });
      if (ts.isFunctionDeclaration(node)) localFunctions.add(node.name.text);
    } else if (ts.isVariableDeclaration(node) || ts.isParameter(node)) {
      for (const name of bindingNames(node.name)) declared.push({ name, node });
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer &&
        (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
      ) {
        localFunctions.add(node.name.text);
      }
    }
  }
  for (const { name, node } of declared) {
    if (ctx.exports.has(name)) {
      report("orv37-d1", node, `local declaration "${name}" has the name of a component export`);
    } else if (/^[A-Z]/.test(name) && ctx.coverage.has(normalise(name))) {
      report("orv37-d1", node, `local declaration "${name}" matches a row of catalog/coverage.md`);
    }
  }

  // orv37-d2: elements and tags.
  for (const tag of tags) {
    const name = tag.tagName;
    if (!ts.isIdentifier(name)) {
      report("orv37-d2", tag, "member, namespaced or this tag");
      continue;
    }
    const lowercase = /^[a-z]/.test(name.text);
    if (!lowercase) {
      if (!importedOf.has(name.text) && !localFunctions.has(name.text)) {
        report(
          "orv37-d2",
          tag,
          `tag <${name.text}> is neither imported from ../index nor a function component`,
        );
      }
      continue;
    }
    if (!(LOWERCASE_TAGS as readonly string[]).includes(name.text)) {
      report("orv37-d2", tag, `element <${name.text}> is outside the allowed list`);
    }
    for (const attribute of tag.attributes.properties) {
      if (!ts.isJsxAttribute(attribute)) continue;
      const attr = attributeName(attribute);
      const lower = attr.toLowerCase();
      if (lower.startsWith("on") && !(attr === "onSubmit" && name.text === "form")) {
        report("orv37-d2", attribute, `handler "${attr}" on <${name.text}>`);
      } else if (lower === "tabindex" || lower === "contenteditable") {
        report("orv37-d2", attribute, `"${attr}" on <${name.text}>`);
      } else if (attr === "role") {
        const role = literalValue(attribute.initializer);
        if (!(ALLOWED_ROLES as readonly string[]).includes(role ?? "")) {
          report("orv37-d2", attribute, `role on <${name.text}> is not status or alert`);
        }
      }
    }
  }

  // orv37-d3: no paint, no recipe class, no inline value.
  for (const tag of tags) {
    const lowercase = ts.isIdentifier(tag.tagName) && /^[a-z]/.test(tag.tagName.text);
    for (const attribute of tag.attributes.properties) {
      if (!ts.isJsxAttribute(attribute)) continue;
      const attr = attributeName(attribute);
      if (attr === "style") report("orv37-d3", attribute, "style attribute");
      if (attr !== "className") continue;
      if (!lowercase) {
        report("orv37-d3", attribute, "className on a component");
        continue;
      }
      const value = literalValue(attribute.initializer);
      if (value === undefined) {
        report("orv37-d3", attribute, "className is not a plain string literal");
        continue;
      }
      for (const token of value.split(/\s+/).filter(Boolean)) {
        const problem = classTokenProblem(token);
        if (problem) report("orv37-d3", attribute, problem);
      }
    }
  }
  for (const { node, text } of texts) {
    if (text.includes("var(--")) report("orv37-d3", node, "var(-- in text");
    if (/#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})\b/i.test(text)) {
      report("orv37-d3", node, "hex colour in text");
    }
    if (/rgba?\(/i.test(text)) report("orv37-d3", node, "rgb( in text");
  }

  return problems;
}

/** The value exports of a file, `default` for a default export and `*` for `export * from`. */
function valueExports(sf: ts.SourceFile): string[] {
  const out: string[] = [];
  for (const statement of sf.statements) {
    const modifiers = ts.canHaveModifiers(statement) ? (ts.getModifiers(statement) ?? []) : [];
    const exported = modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    const isDefault = modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
    if (ts.isVariableStatement(statement) && exported) {
      for (const d of statement.declarationList.declarations) out.push(...bindingNames(d.name));
    } else if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      exported
    ) {
      out.push(isDefault ? "default" : (statement.name?.text ?? "default"));
    } else if (ts.isExportAssignment(statement)) {
      out.push("default");
    } else if (ts.isExportDeclaration(statement) && !statement.isTypeOnly) {
      const clause = statement.exportClause;
      if (clause && ts.isNamedExports(clause)) {
        for (const el of clause.elements) if (!el.isTypeOnly) out.push(el.name.text);
      } else {
        out.push("*");
      }
    }
  }
  return out;
}

/** orv37-s1, screen half: the value exports, and `MembersScreen` takes no parameter. */
function judgeScreenShape(source: string): string[] {
  const sf = parse(source);
  const { report, problems } = reporter(sf);
  const names = valueExports(sf).sort();
  const expected = [...SCREEN_VALUE_EXPORTS].sort();
  if (names.join(",") !== expected.join(",")) {
    report(
      "orv37-s1",
      sf,
      `value exports are [${names.join(", ")}], expected exactly [${expected.join(", ")}]`,
    );
  }
  let parameters: number | undefined;
  for (const node of flatten(sf)) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === "MembersScreen") {
      parameters = node.parameters.length;
    } else if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "MembersScreen" &&
      node.initializer &&
      (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
    ) {
      parameters = node.initializer.parameters.length;
    }
  }
  if (parameters === undefined) {
    report("orv37-s1", sf, "MembersScreen is not a function declared in the file");
  } else if (parameters > 0) {
    report("orv37-s1", sf, "MembersScreen declares a parameter");
  }
  return problems;
}

/** orv37-s1, story half: imports, JSX tags, decorators and `ds-` text. */
function judgeStory(source: string): string[] {
  const sf = parse(source);
  const nodes = flatten(sf);
  const { report, problems } = reporter(sf);
  checkModules(nodes, report, "orv37-s1", STORY_MODULES, false);
  for (const node of nodes) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (node.moduleSpecifier.text !== MATRIX_MODULE) continue;
      const bindings = node.importClause?.namedBindings;
      if (node.importClause?.name || !bindings || !ts.isNamedImports(bindings)) {
        report("orv37-s1", node, `${MATRIX_MODULE} takes named imports only`);
        continue;
      }
      for (const element of bindings.elements) {
        const imported = (element.propertyName ?? element.name).text;
        if (!(MATRIX_NAMES as readonly string[]).includes(imported)) {
          report("orv37-s1", element, `"${imported}" from ${MATRIX_MODULE} is not Under or Narrow`);
        }
      }
    } else if ((ts.isIdentifier(node) || ts.isStringLiteral(node)) && node.text === "decorators") {
      report("orv37-s1", node, "decorators");
    }
  }
  for (const tag of openingElements(nodes)) {
    const name = ts.isIdentifier(tag.tagName) ? tag.tagName.text : "";
    if (!(STORY_TAGS as readonly string[]).includes(name)) {
      report("orv37-s1", tag, `JSX tag <${name || "member"}> is outside the story tags`);
    }
  }
  if (/\bds-/.test(source)) report("orv37-s1", sf, "ds- text");
  return problems;
}

// ---------------------------------------------------------------------------------------------
// controls: synthetic export list and catalog, invented names, one red sample per clause
// ---------------------------------------------------------------------------------------------

const cap = (folder: string): string => folder.charAt(0).toUpperCase() + folder.slice(1);

const BASE_FOLDERS = [
  "alpha",
  "bravo",
  "charlie",
  "delta",
  "quebec",
  "romeo",
  "uniform",
  "victor",
  "oscar",
];
const APP_FOLDERS = ["echo", "foxtrot", "golf", "hotel", "sierra", "tango", "whiskey", "xray"];
/** Stable folders whose entry lists no example. */
const WITHOUT_EXAMPLES = ["alpha", "quebec", "echo", "whiskey"];

const SYNTHETIC_INDEX = `
export {
  Alpha,
  AlphaItem,
  type AlphaProps,
  type ALPHA_MODE,
  useAlpha,
  ALPHA_LIMIT,
  alphaHelper,
} from "./alpha/Alpha";
export type { BravoProps } from "./bravo/Bravo";
export { innerOscar as Oscar } from "./oscar/Oscar";
export { India, type IndiaProps, indiaHelper } from "./india/India";
export { Juliet } from "./juliet/Juliet";
export { Kilo } from "./kilo";
export { Lima } from "./lima/Lima";
export { November } from "./november/November";
${[...BASE_FOLDERS, ...APP_FOLDERS]
  .filter((f) => f !== "alpha" && f !== "oscar")
  .map((f) => `export { ${cap(f)} } from "./${f}/${cap(f)}";`)
  .join("\n")}
`;

const SYNTHETIC_COVERAGE = `
# Coverage

## Base

| Component  | Status | Story |
| ---------- | ------ | ----- |
| Zinc panel | none   |       |
| Ghost row  | none   |       |

## Application

| Component              | Status | Story |
| ---------------------- | ------ | ----- |
| Yarn bar (pattern)     | none   |       |

## Page examples

| Example   | Tier | Status | Story |
| --------- | ---- | ------ | ----- |
| Late page | base | stable | x     |
`;

function entry(
  folder: string,
  tier: CatalogEntry["tier"],
  overrides: Partial<CatalogEntry> = {},
): [string, CatalogEntry] {
  return [
    folder,
    {
      folder,
      tier,
      status: "stable",
      import: PACKAGE,
      examples: WITHOUT_EXAMPLES.includes(folder) ? [] : ["src/examples/sample.tsx"],
      ...overrides,
    },
  ];
}

const SYNTHETIC_CATALOG = new Map<string, CatalogEntry>([
  ...BASE_FOLDERS.map((f) => entry(f, "base")),
  ...APP_FOLDERS.map((f) => entry(f, "application")),
  entry("india", "base", { status: "draft" }),
  entry("lima", "application", { status: "draft" }),
  entry("november", "base", { status: "planned" }),
  entry("kilo", "base", { import: "other-package" }),
]);

const CTX: Context = {
  exports: readComponentExports(SYNTHETIC_INDEX),
  catalog: SYNTHETIC_CATALOG,
  coverage: readCoverageRows(SYNTHETIC_COVERAGE),
  rootExport: "./src/index.ts",
};

/** Eight entries from both tiers, two of them with examples: []. */
const USED = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel"];

interface SampleParts {
  names?: readonly string[];
  imports?: string;
  before?: string;
  body?: string;
  after?: string;
}

/** The clean screen, with a line added where a sample needs it. */
function screen(parts: SampleParts = {}): string {
  const names = parts.names ?? USED;
  return `import { useState } from "react";
import { ${names.join(", ")}, type AlphaProps } from "../index";
import type { BravoProps } from "../index";
${parts.imports ?? ""}

${parts.before ?? ""}
export const MEMBERS = [{ id: 1 }];

export function MembersScreen() {
  const [count] = useState(0);
  return (
    <main className="flex flex-col gap-4">
      <h1>{count}</h1>
      ${names.map((n) => `<${n} />`).join("\n      ")}
      ${parts.body ?? ""}
    </main>
  );
}
${parts.after ?? ""}
`;
}

function judged(source: string, ctx: Context = CTX): string[] {
  return judgeScreen(source, ctx);
}

/** The red sample fires its own clause, names `detail`, and fires nothing else. */
function expectRed(problems: string[], id: string, detail: string): void {
  expect(problems.length, "a red sample reports a problem").toBeGreaterThan(0);
  expect(
    problems.filter((p) => !p.startsWith(`${id}:`)),
    "only the clause under test fires",
  ).toEqual([]);
  expect(
    problems.some((p) => p.includes(detail)),
    `a problem naming "${detail}", got ${JSON.stringify(problems)}`,
  ).toBe(true);
}

describe("controls", () => {
  describe("readers", () => {
    it("reads the exported name after `as`, the folder of the specifier and the type flag", () => {
      const map = CTX.exports;
      expect(map.get("Oscar")).toEqual({ folder: "oscar", type: false });
      expect(map.has("innerOscar")).toBe(false);
      expect(map.get("AlphaProps")).toEqual({ folder: "alpha", type: true });
      expect(map.get("BravoProps")).toEqual({ folder: "bravo", type: true });
      expect(map.get("Alpha")).toEqual({ folder: "alpha", type: false });
      expect(map.get("useAlpha")).toEqual({ folder: "alpha", type: false });
      expect(map.get("Kilo")).toEqual({ folder: "kilo", type: false });
    });

    it("reads the component rows up to Page examples, without the header, normalised", () => {
      expect([...CTX.coverage].sort()).toEqual(["ghostrow", "yarnbar", "zincpanel"]);
    });
  });

  it("the clean screen has no problem", () => {
    expect(judged(screen())).toEqual([]);
    expect(judgeScreenShape(screen())).toEqual([]);
  });

  describe("orv37-t1 floor", () => {
    it("is red under 40 catalog entries and clean at 40", () => {
      const sized = (n: number): ReadonlyMap<string, CatalogEntry> =>
        new Map(Array.from({ length: n }, (_, i) => entry(`folder${i}`, "base")));
      expect(floorProblems({ catalog: sized(39) })).toEqual([
        expect.stringContaining("orv37-t1: the catalog parse returned 39 entries"),
      ]);
      expect(floorProblems({ catalog: sized(0) })).toHaveLength(1);
      expect(floorProblems({ catalog: sized(40) })).toEqual([]);
    });
  });

  describe("orv37-i1 modules and import forms", () => {
    const forms: [string, string, string][] = [
      [
        "a single-line import from another module",
        'import { thing } from "../elsewhere";',
        "elsewhere",
      ],
      [
        "a multi-line import from another module",
        'import {\n  thing,\n  other,\n} from "../elsewhere";',
        "elsewhere",
      ],
      [
        "a single-line import of ../components/index",
        'import { Alpha } from "../components/index";',
        "components/index",
      ],
      [
        "a single-line import of ../components/fixtures",
        'import { fixtures } from "../components/fixtures";',
        "components/fixtures",
      ],
      ["a side-effect import of another module", 'import "../styles.css";', "styles.css"],
      ["a side-effect import of an allowed module", 'import "react";', "side-effect"],
      ["a namespace import from ../index", 'import * as DS from "../index";', "namespace"],
      ["a namespace import from react", 'import * as R from "react";', "namespace"],
      ["a default import from react", 'import R from "react";', "default import"],
      ["a dynamic import()", 'const lazy = import("react");', "dynamic import()"],
      ["an export ... from", 'export { thing } from "../index";', "export ... from"],
      ["an export * from", 'export * from "react";', "export ... from"],
      ["an export type ... from", 'export type { Thing } from "../index";', "export ... from"],
      ["a require() call", 'const r = require("react");', "require()"],
      ["an import-equals declaration", 'import r = require("react");', "import-equals"],
      ["an import() type", 'type T = typeof import("react");', "import("],
    ];

    it.each(forms)("refuses %s", (_form, line, detail) => {
      expectRed(judged(screen({ imports: line })), "orv37-i1", detail);
    });

    it("allows named imports from react and ../index, value or type, on one line or several", () => {
      expect(
        judged(
          screen({
            imports:
              'import {\n  useRef,\n  type ReactNode,\n} from "react";\nimport { type BravoProps } from "../index";',
          }),
        ),
      ).toEqual([]);
    });

    it('is red when package.json exports["."] is not ./src/index.ts', () => {
      expectRed(
        judged(screen(), { ...CTX, rootExport: "./src/components/index.ts" }),
        "orv37-i1",
        "exports",
      );
      expectRed(judged(screen(), { ...CTX, rootExport: undefined }), "orv37-i1", "exports");
    });
  });

  describe("orv37-i2 names from ../index", () => {
    const names: [string, string, string][] = [
      ["an invented name", "Nonesuch", "not an export"],
      ["a name from a draft folder", "India", "is draft"],
      ["a second draft folder", "Lima", "is draft"],
      ["a function from a draft folder", "indiaHelper", "is draft"],
      ["a type from a draft folder", "IndiaProps", "is draft"],
      ["a name from a planned folder", "November", "is planned"],
      ["an export with no entry", "Juliet", "no catalog entry"],
      ["a hook from a stable folder", "useAlpha", "not a component name"],
      ["a constant from a stable folder", "ALPHA_LIMIT", "not a component name"],
      ["a helper from a stable folder", "alphaHelper", "not a component name"],
      ["a public name outside the component list", "PROFILE_SET", "not an export"],
      ["the original name of an aliased export", "innerOscar", "not an export"],
    ];

    it.each(names)("refuses %s", (_what, name, detail) => {
      expectRed(
        judged(screen({ imports: `import { ${name} } from "../index";` })),
        "orv37-i2",
        detail,
      );
    });

    it("refuses a stable entry whose import field is another package", () => {
      expectRed(
        judged(screen({ imports: 'import { Kilo } from "../index";' })),
        "orv37-i2",
        "imports from other-package",
      );
    });

    it("refuses the original name when an alias is imported, and judges an alias by the exported name", () => {
      expectRed(
        judged(screen({ imports: 'import { useAlpha as Handy } from "../index";' })),
        "orv37-i2",
        "useAlpha",
      );
      expect(
        judged(screen({ imports: 'import { Oscar as Papa } from "../index";', body: "<Papa />" })),
      ).toEqual([]);
    });

    it("allows a type export whose name is not a component name, and a capitalised component", () => {
      expect(
        judged(
          screen({
            imports:
              'import { type AlphaProps as Props, AlphaItem } from "../index";\nimport { BravoProps, type ALPHA_MODE } from "../index";',
          }),
        ),
      ).toEqual([]);
    });
  });

  describe("orv37-i3 entries used", () => {
    it("is red for seven distinct entries and clean for eight", () => {
      expectRed(judged(screen({ names: USED.slice(0, 7) })), "orv37-i3", "7 distinct");
      expect(judged(screen({ names: USED }))).toEqual([]);
    });

    it("counts entries, not tags: two tags of one folder are one entry", () => {
      const names = ["Alpha", "AlphaItem", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf"];
      expectRed(judged(screen({ names })), "orv37-i3", "7 distinct");
    });

    it("is red for a base-only sample and for an application-only sample", () => {
      const base = ["Alpha", "Bravo", "Charlie", "Delta", "Quebec", "Romeo", "Uniform", "Victor"];
      const application = [
        "Echo",
        "Foxtrot",
        "Golf",
        "Hotel",
        "Sierra",
        "Tango",
        "Whiskey",
        "Xray",
      ];
      expectRed(judged(screen({ names: base })), "orv37-i3", "both the base and the application");
      expectRed(
        judged(screen({ names: application })),
        "orv37-i3",
        "both the base and the application",
      );
    });

    it("is red when every used entry lists examples, and when only one lists none", () => {
      const all = ["Bravo", "Charlie", "Delta", "Romeo", "Foxtrot", "Golf", "Hotel", "Sierra"];
      const one = ["Alpha", "Bravo", "Charlie", "Delta", "Foxtrot", "Golf", "Hotel", "Sierra"];
      expectRed(judged(screen({ names: all })), "orv37-i3", "examples: []");
      expectRed(judged(screen({ names: one })), "orv37-i3", "examples: []");
    });

    it("does not count a draft entry, a name that is not a tag, or a local component", () => {
      const withDraft = [...USED.slice(0, 7), "India"];
      expect(judged(screen({ names: withDraft })).filter((p) => p.startsWith("orv37-i3"))).toEqual([
        expect.stringContaining("7 distinct"),
      ]);
      expectRed(
        judged(
          screen({
            names: USED.slice(0, 7),
            after: "function Row() {\n  return <div />;\n}",
            body: "<Row />",
          }),
        ),
        "orv37-i3",
        "7 distinct",
      );
    });
  });

  describe("orv37-p1 untyped routes", () => {
    it("refuses a JSX spread attribute and a JSX spread child", () => {
      expectRed(judged(screen({ body: "<Alpha {...rest} />" })), "orv37-p1", "JSX spread");
      expectRed(judged(screen({ body: "<p>{...items}</p>" })), "orv37-p1", "JSX spread");
    });

    it.each(["data-x", "aria-sparkle", "aria-expanded", "aria-label-x", "x-ray", "aria-hiddenx"])(
      "refuses the hyphenated attribute %s",
      (name) => {
        expectRed(judged(screen({ body: `<Alpha ${name}="y" />` })), "orv37-p1", name);
      },
    );

    it.each([
      "aria-label",
      "aria-labelledby",
      "aria-describedby",
      "aria-live",
      "aria-atomic",
      "aria-hidden",
      "aria-busy",
    ])("allows the hyphenated attribute %s", (name) => {
      expect(judged(screen({ body: `<Alpha ${name}="y" />` }))).toEqual([]);
    });

    it("refuses a namespaced attribute", () => {
      expectRed(judged(screen({ body: '<Alpha xlink:href="y" />' })), "orv37-p1", "namespaced");
    });

    it.each([
      ["a typed constant", "const value: any = 1;"],
      ["a type argument", "const list: Array<any> = [];"],
      ["a parameter", "function show(input: any) {\n  return input;\n}"],
    ])("refuses any in %s", (_where, line) => {
      expectRed(judged(screen({ after: line })), "orv37-p1", "any");
    });

    it.each([
      ["a string cast to a variant type", 'const variant = "primary" as AlphaVariant;'],
      ["a double cast", "const value = thing as unknown as Row;"],
      ["a cast in a prop", "const el = <Alpha value={thing as Row} />;"],
    ])("refuses a type assertion: %s", (_what, line) => {
      expectRed(judged(screen({ after: line })), "orv37-p1", "type assertion");
    });

    it("allows as const", () => {
      expect(judged(screen({ after: 'const keys = ["a", "b"] as const;' }))).toEqual([]);
    });

    it.each([
      ["a ts-ignore comment", "// @ts-ignore", "ts-ignore"],
      ["a ts-expect-error comment", "// @ts-expect-error", "ts-expect-error"],
      ["a ts-nocheck comment", "// @ts-nocheck", "ts-nocheck"],
      ["an eslint-disable block comment", "/* eslint-disable */", "eslint-disable"],
      ["an eslint-disable-next-line comment", "// eslint-disable-next-line", "eslint-disable"],
    ])("refuses %s", (_what, line, detail) => {
      expectRed(judged(screen({ before: line })), "orv37-p1", detail);
    });

    it.each([
      ["createElement", 'const el = React.createElement("div");'],
      ["cloneElement", "const el = cloneElement(child, {});"],
      ["dangerouslySetInnerHTML", "const el = <Alpha dangerouslySetInnerHTML={html} />;"],
      ["JSON", "const data = JSON.parse(raw);"],
      ["JSON in a prop", "const el = <Alpha value={JSON.parse(raw)} />;"],
      ["Reflect", 'const value = Reflect.get(target, "key");'],
      ["Function", "const make = new Function();"],
      ["eval", 'const value = eval("1");'],
      ["globalThis", "const win = globalThis;"],
    ])("refuses %s", (what, line) => {
      expectRed(judged(screen({ after: line })), "orv37-p1", `use of ${what.split(" ")[0]}`);
    });
  });

  describe("orv37-d1 duplicates", () => {
    it.each([
      ["a component value", "const Tango = () => <div />;"],
      ["a function", "function Sierra() {\n  return <div />;\n}"],
      ["a class", "class Xray {}"],
      ["an enum", "enum Uniform {\n  One,\n}"],
      ["an interface", "interface Victor {\n  id: number;\n}"],
      ["a type alias", "type Tango = string;"],
      ["a hook", "const useAlpha = () => 1;"],
      ["a helper", "const alphaHelper = 1;"],
      ["a type", "type AlphaProps = string;"],
      ["a parameter", "function show(Tango: string) {\n  return Tango;\n}"],
      ["a destructured binding", "const { Tango } = source;"],
      ["a renamed binding", "const { other: Tango } = source;"],
      ["an array binding", "const [Tango] = source;"],
    ])("refuses a local declaration of %s named as an export", (_what, line) => {
      expectRed(judged(screen({ after: line })), "orv37-d1", "component export");
    });

    it("refuses a lowercase local named as an export (no capital rule for the export half)", () => {
      expectRed(
        judged(screen({ after: "const indiaHelper = 1;" })),
        "orv37-d1",
        "component export",
      );
    });

    it.each([
      ["spaces and case", "function ZincPanel() {\n  return <div />;\n}"],
      ["a (pattern) suffix", "const YarnBar = () => <div />;"],
      ["a none row", "class GhostRow {}"],
      ["case only", "const Zincpanel = 1;"],
      ["a type alias", "type GhostRow = string;"],
    ])("refuses a capitalised local matching a coverage row: %s", (_what, line) => {
      expectRed(judged(screen({ after: line })), "orv37-d1", "row of catalog/coverage.md");
    });

    it("allows a lowercase local that matches a coverage row, and an unrelated capitalised one", () => {
      expect(
        judged(
          screen({
            after: "const zincPanel = 1;\nfunction Row() {\n  return <li />;\n}",
            body: "<Row />",
          }),
        ),
      ).toEqual([]);
    });

    it("allows an imported name, which is not a local declaration", () => {
      expect(judged(screen())).toEqual([]);
    });
  });

  describe("orv37-d2 elements and tags", () => {
    const refusedTags = [
      "button",
      "input",
      "a",
      "img",
      "label",
      "table",
      "nav",
      "h4",
      "select",
      "svg",
      "textarea",
      "aside",
      "footer",
      "article",
      "dialog",
      "tr",
    ];

    it.each(refusedTags)("refuses the lowercase element <%s>", (tag) => {
      expectRed(judged(screen({ body: `<${tag} />` })), "orv37-d2", `<${tag}>`);
    });

    it.each([
      "div",
      "span",
      "p",
      "h1",
      "h2",
      "h3",
      "header",
      "section",
      "main",
      "form",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "time",
    ])("allows the lowercase element <%s>", (tag) => {
      expect(judged(screen({ body: `<${tag} />` }))).toEqual([]);
    });

    it("refuses a custom element and a namespaced tag", () => {
      expectRed(judged(screen({ body: "<my-element />" })), "orv37-d2", "<my-element>");
      expectRed(judged(screen({ body: "<svg:rect />" })), "orv37-d2", "member, namespaced");
    });

    it.each([
      ["an undeclared name", "<Mystery />", ""],
      ["a name bound to a string", "<Box />", 'const Box = "button" as const;'],
      ["a name bound to an imported component", "<Alias />", "const Alias = Alpha;"],
      ["a name bound to a class", "<Wrapper />", "class Wrapper {}"],
      ["a member tag", "<DS.Thing />", "const DS = { Thing: Alpha };"],
    ])("refuses a capitalised tag that is %s", (_what, body, after) => {
      expectRed(judged(screen({ body, after })), "orv37-d2", "");
    });

    it("allows a function component declared in the file, as a declaration, an arrow or an expression", () => {
      const after = [
        "function Row() {\n  return <li />;\n}",
        "const Cell = () => <span />;",
        "const Item = function () {\n  return <li />;\n};",
      ].join("\n");
      expect(judged(screen({ body: "<Row /><Cell /><Item />", after }))).toEqual([]);
    });

    it.each([
      ["onClick", "div"],
      ["onMouseEnter", "span"],
      ["onKeyDown", "li"],
      ["onSubmit", "div"],
      ["onClick", "form"],
      ["onsubmit", "form"],
    ])("refuses the handler %s on <%s>", (handler, tag) => {
      expectRed(judged(screen({ body: `<${tag} ${handler}={act} />` })), "orv37-d2", handler);
    });

    it("allows onSubmit on form and any handler on a component", () => {
      expect(
        judged(
          screen({
            body: '<form onSubmit={act} /><Alpha onClick={act} tabIndex={0} role="button" />',
          }),
        ),
      ).toEqual([]);
    });

    it.each([
      ["tabIndex", "tabIndex={0}"],
      ["contentEditable", "contentEditable"],
    ])("refuses %s on a lowercase element", (name, attribute) => {
      expectRed(judged(screen({ body: `<div ${attribute} />` })), "orv37-d2", name);
    });

    it.each([
      ['role="button"', false],
      ["role={role}", false],
      ['role="statuss"', false],
      ['role="status"', true],
      ['role="alert"', true],
      ['role={"alert"}', true],
    ])("judges %s on a lowercase element", (attribute, clean) => {
      const problems = judged(screen({ body: `<div ${attribute} />` }));
      if (clean) expect(problems).toEqual([]);
      else expectRed(problems, "orv37-d2", "role");
    });
  });

  describe("orv37-d3 paint and inline values", () => {
    it.each([
      "bg-x",
      "border-b",
      "rounded-md",
      "shadow-sm",
      "drop-shadow-md",
      "ring-2",
      "inset-ring-1",
      "outline-none",
      "divide-y",
      "fill-x",
      "stroke-x",
      "opacity-50",
      "decoration-x",
      "backdrop-blur",
      "mask-x",
      "text-feedback-danger",
      "text-action-primary",
      "text-brand-main",
    ])("refuses the paint class %s", (token) => {
      expectRed(judged(screen({ body: `<div className="flex ${token}" />` })), "orv37-d3", token);
    });

    it.each([
      ["a ds- class", "ds-button"],
      ["an arbitrary value", "w-[3px]"],
      ["an arbitrary variant", "[&>*]:flex"],
      ["a paint class under one variant", "hover:bg-x"],
      ["a paint class under two variants", "md:dark:ring-2"],
      ["an important paint class", "!border-2"],
      ["a trailing important paint class", "rounded!"],
      ["a ds- class under a variant", "md:ds-menu"],
    ])("refuses %s", (_what, token) => {
      expectRed(judged(screen({ body: `<div className="${token}" />` })), "orv37-d3", token);
    });

    it("allows layout and semantic type utilities, with variants", () => {
      const classes =
        "flex flex-col grid gap-4 p-4 items-center justify-between w-full min-w-0 truncate text-sm text-center font-medium sm:flex-row hover:underline md:gap-6 !flex";
      expect(judged(screen({ body: `<div className="${classes}" />` }))).toEqual([]);
    });

    it.each([
      ["a variable", "const cls = 'flex';", "<div className={cls} />"],
      ["a concatenation", "", '<div className={"flex " + gap} />'],
      ["a join", "", '<div className={["flex", gap].join(" ")} />'],
      ["a template with a substitution", "", "<div className={`flex ${gap}`} />"],
      ["a template without one", "", "<div className={`flex`} />"],
      ["a conditional", "", '<div className={on ? "flex" : "grid"} />'],
      ["a bare attribute", "", "<div className />"],
    ])("refuses a className that is %s", (_what, after, body) => {
      expectRed(judged(screen({ body, after })), "orv37-d3", "plain string literal");
    });

    it("allows a className in braces around a plain string literal", () => {
      expect(judged(screen({ body: '<div className={"flex gap-2"} />' }))).toEqual([]);
    });

    it("refuses className on a component", () => {
      expectRed(judged(screen({ body: '<Alpha className="flex" />' })), "orv37-d3", "component");
    });

    it("refuses a style attribute on an element and on a component", () => {
      expectRed(judged(screen({ body: "<div style={{ gap: 1 }} />" })), "orv37-d3", "style");
      expectRed(judged(screen({ body: "<Alpha style={{ gap: 1 }} />" })), "orv37-d3", "style");
    });

    it.each([
      ["var(--", '<p>{"var(--ds-x)"}</p>', "var(--"],
      ["var(-- in a template", "<p>{`var(--ds-x) ${count}`}</p>", "var(--"],
      ["a hex colour in a template without substitution", "<p>{`#fff`}</p>", "hex"],
      ["a hex colour in a template head", "<p>{`#fff ${count}`}</p>", "hex"],
      ["a hex colour in a template middle", "<p>{`${count} #fff ${count}`}</p>", "hex"],
      ["a hex colour in a template tail", "<p>{`${count} #fff`}</p>", "hex"],
      ["var(-- in JSX text", "<p>var(--ds-x)</p>", "var(--"],
      ["a three digit hex colour", '<p>{"#fff"}</p>', "hex"],
      ["a six digit hex colour", '<p>{"#ffaa00"}</p>', "hex"],
      ["a four digit hex colour", '<p>{"#ffaa"}</p>', "hex"],
      ["an eight digit hex colour", '<p>{"#ffaa00cc"}</p>', "hex"],
      ["an upper case hex colour", '<p>{"#FFAA00"}</p>', "hex"],
      ["rgb(", '<p>{"rgb(0, 0, 0)"}</p>', "rgb("],
      ["rgba(", '<p>{"rgba(0, 0, 0, 0.5)"}</p>', "rgb("],
    ])("refuses %s", (_what, body, detail) => {
      expectRed(judged(screen({ body })), "orv37-d3", detail);
    });

    it("allows text that only looks like a hex colour", () => {
      expect(
        judged(
          screen({
            body: '<p>{"Issue #12 and #12345"}</p>',
            after: "// colour #fff and var(-- in a comment",
          }),
        ),
      ).toEqual([]);
    });
  });

  describe("orv37-s1 screen exports", () => {
    const shape = (lines: string): string[] => judgeScreenShape(lines);

    it("allows the two value exports, a function or an arrow, and type exports beside them", () => {
      const arrow = "export const MEMBERS = [];\nexport const MembersScreen = () => <main />;";
      expect(shape(arrow)).toEqual([]);
      expect(
        shape(
          `${arrow}\nexport type Row = { id: number };\nexport interface Other {\n  id: number;\n}`,
        ),
      ).toEqual([]);
      expect(
        shape(
          "export const MEMBERS = [];\nexport function MembersScreen() {\n  return <main />;\n}",
        ),
      ).toEqual([]);
    });

    const base =
      "export const MEMBERS = [];\nexport function MembersScreen() {\n  return <main />;\n}\n";

    it.each([
      ["an extra const", "export const OTHER = 1;"],
      ["an extra function", "export function Helper() {\n  return 1;\n}"],
      ["an extra class", "export class Thing {}"],
      ["an extra enum", "export enum Mode {\n  One,\n}"],
      ["a default export", "export default MEMBERS;"],
      ["a default function", "export default function () {\n  return 1;\n}"],
      ["a list export", "const hidden = 1;\nexport { hidden };"],
      ["a renamed list export", "export { MEMBERS as ROWS };"],
      ["an export star", 'export * from "./other";'],
    ])("is red for %s", (_what, extra) => {
      expectRed(shape(base + extra), "orv37-s1", "value exports");
    });

    it("is red for a default export that carries the name MembersScreen", () => {
      expectRed(
        shape(
          "export const MEMBERS = [];\nexport default function MembersScreen() {\n  return <main />;\n}",
        ),
        "orv37-s1",
        "value exports",
      );
    });

    it("is red when a required export is missing", () => {
      expectRed(
        shape("export function MembersScreen() {\n  return <main />;\n}"),
        "orv37-s1",
        "value exports",
      );
      expectRed(shape("export const MEMBERS = [];"), "orv37-s1", "value exports");
    });

    it.each([
      ["a named parameter", "export function MembersScreen(props: Props) {\n  return <main />;\n}"],
      [
        "a destructured parameter",
        "export function MembersScreen({ id }: Props) {\n  return <main />;\n}",
      ],
      [
        "an optional parameter",
        "export function MembersScreen(id?: number) {\n  return <main />;\n}",
      ],
      ["an arrow parameter", "export const MembersScreen = (props: Props) => <main />;"],
    ])("is red for %s", (_what, screenCode) => {
      expectRed(
        shape(`export const MEMBERS = [];\n${screenCode}`),
        "orv37-s1",
        "declares a parameter",
      );
    });

    it("is red when MembersScreen is not a function declared in the file", () => {
      expectRed(
        shape("export const MEMBERS = [];\nexport const MembersScreen = memo(Inner);"),
        "orv37-s1",
        "not a function declared",
      );
    });
  });

  describe("orv37-s1 story file", () => {
    const STORY = `import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Narrow, Under } from "../components/matrix";
import { expectNoGlyphClip } from "../testing/visual-asserts";
import { MEMBERS, MembersScreen } from "./members";
/*STORY*/
const meta = { title: "Examples/Application: Members (agent)", component: MembersScreen } satisfies Meta<typeof MembersScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { render: () => <><MembersScreen /></> };
export const At360: Story = { render: () => <Narrow><MembersScreen /></Narrow> };
export const FriendlyDark: Story = { render: () => <Under profile="friendly" mode="dark"><MembersScreen /></Under> };
`;
    const story = (extra: string): string => STORY.replace("/*STORY*/", extra);

    it("allows the five modules, the three tags, a fragment and named matrix imports", () => {
      expect(judgeStory(STORY)).toEqual([]);
    });

    it("allows any import form from a storybook module (only the module list binds there)", () => {
      expect(judgeStory(story('import * as T from "storybook/test";'))).toEqual([]);
    });

    it.each([
      ["another module", 'import { render } from "@testing-library/react";'],
      ["a near miss of a storybook module", 'import { fn } from "@storybook/react";'],
      ["../components/index", 'import { Alpha } from "../components/index";'],
      ["../components/fixtures", 'import { fixtures } from "../components/fixtures";'],
      ["../index", 'import { Alpha } from "../index";'],
      ["the screen with an extension", 'import { MEMBERS as ROWS } from "./members.tsx";'],
      ["a multi-line list", 'import {\n  thing,\n  other,\n} from "../elsewhere";'],
      ["a side-effect import", 'import "../styles.css";'],
    ])("is red for an import from %s", (_what, line) => {
      expectRed(judgeStory(story(line)), "orv37-s1", "outside the allowed modules");
    });

    it.each([
      ["a dynamic import()", 'const lazy = import("./members");', "dynamic import()"],
      ["require()", 'const r = require("./members");', "require()"],
      [
        "an export ... from",
        'export { MembersScreen as Again } from "./members";',
        "export ... from",
      ],
      ["an import-equals", 'import r = require("./members");', "import-equals"],
    ])("is red for %s", (_what, line, detail) => {
      expectRed(judgeStory(story(line)), "orv37-s1", detail);
    });

    it.each([
      ["a name beyond Under and Narrow", 'import { Grid2 } from "../components/matrix";', "Grid2"],
      ["a namespace import", 'import * as M from "../components/matrix";', "named imports only"],
      ["a default import", 'import M from "../components/matrix";', "named imports only"],
      [
        "a default import beside named ones",
        'import M, { Under } from "../components/matrix";',
        "named imports only",
      ],
    ])("is red for matrix: %s", (_what, line, detail) => {
      expectRed(judgeStory(story(line)), "orv37-s1", detail);
    });

    it.each([
      ["a lowercase element", "const a = <div />;", "<div>"],
      ["a component", "const a = <Other />;", "<Other>"],
      ["a member tag", "const a = <M.Thing />;", "<member>"],
    ])("is red for a JSX tag outside the three: %s", (_what, line, detail) => {
      expectRed(judgeStory(story(line)), "orv37-s1", detail);
    });

    it.each([
      ["a decorators property", "const m = { decorators: [] };"],
      ["a decorators assignment", "Default.decorators = [];"],
      ["a quoted decorators key", 'const m = { "decorators": [] };'],
    ])("is red for %s", (_what, line) => {
      expectRed(judgeStory(story(line)), "orv37-s1", "decorators");
    });

    it("is red for ds- text and not for a word that only ends in ds", () => {
      expectRed(judgeStory(story('const q = ".ds-button";')), "orv37-s1", "ds- text");
      expectRed(judgeStory(story("// the ds-menu class")), "orv37-s1", "ds- text");
      expect(judgeStory(story('const q = "words-kids-only";'))).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------------------------
// target: the composed files, read inside it()
// ---------------------------------------------------------------------------------------------

function readTargetSource(relative: string, what: string): string {
  const absolute = path.join(root, relative);
  expect(existsSync(absolute), `missing ${what} file: ${relative}`).toBe(true);
  return readFileSync(absolute, "utf8");
}

describe("target", () => {
  it("parses at least 40 catalog entries, so the judge cannot pass by reading nothing (orv37-t1)", () => {
    expect(floorProblems({ catalog: readCatalog() })).toEqual([]);
  });

  it.each(AGENT_COMPOSED)("%s passes the screen clauses of the judge", (file) => {
    const source = readTargetSource(file, "screen");
    expect([...floorProblems(loadContext()), ...judgeScreen(source, loadContext())]).toEqual([]);
    expect(judgeScreenShape(source)).toEqual([]);
  });

  it("the story file passes the story clause of orv37-s1", () => {
    expect(judgeStory(readTargetSource(STORY_FILE, "story"))).toEqual([]);
  });
});
