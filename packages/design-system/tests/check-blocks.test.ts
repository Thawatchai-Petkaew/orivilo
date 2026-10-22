/**
 * The block registry (catalog/blocks/mvp.yaml) is the single source for the shelf, the node fill
 * states and the missing-inputs prompt (spec ORV-44 part 2). This check keeps it whole: the 16 MVP
 * blocks by kind, unique ids, declared modules and port kinds, every `feeds` and `from` id real and
 * the two agreeing, no cycle, a question in both locales for every input, and the generated module
 * in step with the file.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { emitBlocksModule, parseBlockRegistry, type RegistryBlock } from "../src/blocks/emit";
import { PORT_KINDS } from "../src/tokens/canvas";

const root = path.join(import.meta.dirname, "..");
const yaml = readFileSync(path.join(root, "catalog", "blocks", "mvp.yaml"), "utf8");
const registry = parseBlockRegistry(yaml);
const byId = new Map(registry.blocks.map((b) => [b.id, b]));
const KINDS = ["source", "synthesis", "decision", "output"];
const ANSWERS = ["text", "long-text", "url", "colours", "images", "choice"];
const FORBIDDEN = /[·—]/;

describe("block registry", () => {
  it("holds the 16 MVP blocks: 8 sources, 2 synthesis, 4 decisions, 2 outputs", () => {
    expect(registry.blocks).toHaveLength(16);
    const count = (kind: string) => registry.blocks.filter((b) => b.kind === kind).length;
    expect(KINDS.map(count)).toEqual([8, 2, 4, 2]);
  });

  it("has unique ids, known kinds, declared modules and port kinds", () => {
    expect(new Set(byId.keys()).size).toBe(registry.blocks.length);
    const wrong = registry.blocks
      .filter(
        (b) =>
          !KINDS.includes(b.kind) ||
          !(b.module in registry.modules) ||
          !(PORT_KINDS as readonly string[]).includes(b.output),
      )
      .map((b) => b.id);
    expect(wrong).toEqual([]);
  });

  it("names every feeds and from id that exists, and the two agree", () => {
    const problems: string[] = [];
    for (const b of registry.blocks) {
      for (const f of b.feeds) {
        const target = byId.get(f);
        if (!target) problems.push(`${b.id} feeds unknown ${f}`);
        else if (!target.inputs.some((i) => i.from?.includes(b.id))) {
          problems.push(`${b.id} feeds ${f}, but no input of ${f} takes it`);
        }
      }
      for (const i of b.inputs) {
        for (const from of i.from ?? []) {
          const source = byId.get(from);
          if (!source) problems.push(`${b.id}.${i.id} from unknown ${from}`);
          else if (!source.feeds.includes(b.id)) {
            problems.push(`${b.id}.${i.id} takes ${from}, which does not list ${b.id} in feeds`);
          }
        }
        const kinds = new Set((i.from ?? []).map((f) => byId.get(f)?.output));
        if (kinds.size > 1) problems.push(`${b.id}.${i.id} takes more than one port kind`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("has no cycle", () => {
    const state = new Map<string, "open" | "done">();
    const visit = (b: RegistryBlock, trail: string[]): string | undefined => {
      if (state.get(b.id) === "done") return undefined;
      if (state.get(b.id) === "open") return [...trail, b.id].join(" > ");
      state.set(b.id, "open");
      for (const f of b.feeds) {
        const next = byId.get(f);
        const cycle = next ? visit(next, [...trail, b.id]) : undefined;
        if (cycle) return cycle;
      }
      state.set(b.id, "done");
      return undefined;
    };
    const cycles = registry.blocks.map((b) => visit(b, [])).filter(Boolean);
    expect(cycles).toEqual([]);
  });

  it("asks something required of every block, with a known answer type", () => {
    const problems: string[] = [];
    for (const b of registry.blocks) {
      if (!b.inputs.some((i) => i.required)) problems.push(`${b.id} has no required input`);
      const ids = b.inputs.map((i) => i.id);
      if (new Set(ids).size !== ids.length) problems.push(`${b.id} repeats an input id`);
      for (const i of b.inputs) {
        if (!ANSWERS.includes(i.answer)) problems.push(`${b.id}.${i.id} answer ${i.answer}`);
        const options = i.options ?? [];
        if (i.answer === "choice" && options.length < 2) {
          problems.push(`${b.id}.${i.id} is a choice with fewer than two options`);
        }
        if (i.answer !== "choice" && options.length > 0) {
          problems.push(`${b.id}.${i.id} has options but is not a choice`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("words every name, label, question and option in Thai and English, without a middot or an em dash", () => {
    const problems: string[] = [];
    const check = (where: string, w: { th?: string; en?: string } | undefined) => {
      for (const locale of ["th", "en"] as const) {
        const v = w?.[locale];
        if (typeof v !== "string" || v.trim() === "") problems.push(`${where} has no ${locale}`);
        else if (FORBIDDEN.test(v)) problems.push(`${where}.${locale} has a middot or an em dash`);
      }
      if (w?.en && /[฀-๿]/.test(w.en)) problems.push(`${where}.en has Thai`);
    };
    for (const [id, words] of Object.entries(registry.modules)) check(`module ${id}`, words);
    for (const b of registry.blocks) {
      check(`${b.id}.name`, b.name);
      for (const i of b.inputs) {
        check(`${b.id}.${i.id}.label`, i.label);
        check(`${b.id}.${i.id}.question`, i.question);
        for (const o of i.options ?? []) check(`${b.id}.${i.id}.${o.id}`, o);
      }
    }
    expect(problems).toEqual([]);
  });

  it("matches the generated module", () => {
    const committed = readFileSync(path.join(root, "src", "blocks", "generated.ts"), "utf8");
    expect(committed).toBe(emitBlocksModule(registry));
  });
});
