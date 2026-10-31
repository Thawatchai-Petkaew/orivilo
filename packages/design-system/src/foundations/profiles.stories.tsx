import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import {
  type BoundaryMode,
  DesignProfileBoundary,
  type Mode,
  PROFILES,
  type ProfileId,
} from "../boundary/DesignProfileBoundary";
import { DECISIONS, LOCKED_GROUPS, Profile, profileById } from "../profiles/index";
import component from "../tokens/source/component.json" with { type: "json" };
import primitives from "../tokens/source/primitives.json" with { type: "json" };
import semantic from "../tokens/source/semantic.json" with { type: "json" };
import { TokenSet, tokens } from "../tokens/index";
import { contrastRatio } from "./contrast";
import { Cell, Page, Section, Swatch, Table, chainText, varOf } from "./shared";
import { SpecSheet } from "./spec-sheet";

const INK = "#16151D";
const WHITE = "#FFFFFF";

/** Decisions the model checks against the tokens (Profile.validate); the rest are declared intent. */
const CHECKED = ["shape", "surfaceTreatment"];

function label2(p: Profile): string {
  return `${p.name.en} (${p.name.th})`;
}

function label(id: ProfileId): string {
  const p = profileById(id);
  return p ? `${p.name.en} (${p.name.th})` : "Neutral (base)";
}

/**
 * A profile that exists only at runtime: not registered, not in generated.css. The boundary renders
 * its CSS inline, which is how resolved customer profiles (E2-9) will reach the preview.
 */
const runtimeProbe = new Profile(
  { primitives, semantic, component },
  {
    $id: "runtime-probe",
    $name: { th: "ตัวอย่างรันไทม์", en: "Runtime probe" },
    $description:
      "Built in the story from the base files; proves a Profile object renders without a build.",
    $decisions: { shape: "rounded", surfaceTreatment: "flat" },
    semantic: {
      surface: { selected: { $value: { light: "{color.blue.50}", dark: "{color.blue.950}" } } },
      text: {
        link: { $value: { light: "{color.blue.700}", dark: "{color.blue.300}" } },
        "link-hover": { $value: { light: "{color.blue.900}", dark: "{color.blue.200}" } },
        brand: { $value: { light: "{color.blue.700}", dark: "{color.blue.300}" } },
        "on-action": { $value: { light: "{color.white}", dark: "{color.gray.900}" } },
      },
      selection: {
        bg: { $value: { light: "{color.blue.50}", dark: "{color.blue.950}" } },
        fg: { $value: { light: "{color.blue.700}", dark: "{color.blue.300}" } },
      },
      brand: {
        signature: { $value: { light: "{color.blue.600}", dark: "{color.blue.400}" } },
        "dot-small": { $value: { light: "{color.blue.700}", dark: "{color.blue.400}" } },
        ink: { $value: { light: "{color.white}", dark: "{color.gray.900}" } },
      },
      action: {
        primary: { $value: { light: "{color.blue.700}", dark: "{color.blue.300}" } },
        "primary-hover": { $value: { light: "{color.blue.800}", dark: "{color.blue.200}" } },
        "primary-press": { $value: { light: "{color.blue.900}", dark: "{color.blue.400}" } },
      },
    },
  },
);

function setOf(id: string): TokenSet {
  if (id === runtimeProbe.id) return runtimeProbe.tokens;
  return profileById(id)?.tokens ?? tokens;
}

/** The mode a boundary resolves to in this browser. */
function resolvedMode(mode: BoundaryMode): Mode {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** The same spec sheet under one boundary. `data-profile-sample` is read by the play function. */
function Sample({ id, mode }: { id: ProfileId; mode: Mode }) {
  const p = profileById(id);
  return (
    <DesignProfileBoundary mode={mode} profile={id}>
      <div
        data-profile-sample={id}
        className="rounded-container border border-border-card bg-surface-canvas p-4 font-body text-text-primary"
      >
        <h3 className="text-heading-sm">{label(id)}</h3>
        <p className="mt-1 text-body-sm text-text-secondary">
          {p
            ? Object.entries(p.decisions)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")
            : "DESIGN.md §3 as is"}
        </p>
        <div className="mt-4">
          <SpecSheet scope={`profile-${id}`} />
        </div>
      </div>
    </DesignProfileBoundary>
  );
}

function OwnPrimitives({ profile }: { profile: Profile }) {
  const families = [...new Set(profile.ownPrimitives.map((p) => p.split(".")[1] ?? ""))];
  return (
    <>
      {families.map((family) => (
        <div key={family} className="mt-4">
          <h3 className="text-label-md">{family}</h3>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
            {profile.ownPrimitives
              .filter((p) => p.split(".")[1] === family)
              .map((path) => {
                const t = profile.tokens.get("primitive", path);
                if (!t) return null;
                const hex = String(t.raw);
                const best = Math.max(contrastRatio(INK, hex) ?? 0, contrastRatio(WHITE, hex) ?? 0);
                return (
                  <div key={path} className="text-label-sm">
                    <div
                      role="img"
                      aria-label={`${path} ${hex}`}
                      className="h-10 rounded-check border border-border-subtle"
                      style={{ background: hex }}
                    />
                    <div className="mt-1 flex justify-between">
                      <span>{path.split(".")[2]}</span>
                      <span className="text-text-secondary">{best.toFixed(1)}</span>
                    </div>
                    <div className="font-mono text-text-secondary">{hex}</div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </>
  );
}

function Overrides({ profile, mode }: { profile: Profile; mode: Mode }) {
  return (
    <Table head={["Token", "Neutral", profile.name.en, "Contrast under the profile"]}>
      {profile.studioRemaps.map(([from, to]) => {
        const base = profile.baseToken(from);
        return base ? (
          <tr key={from}>
            <Cell>
              <span className="inline-flex items-center gap-2">
                <Swatch
                  cssVar={varOf(base)}
                  label={`${from} under ${profile.id} in ${mode} mode`}
                />
                <span className="font-mono">{from}</span>
              </span>
            </Cell>
            <Cell mono>{chainText(base, mode)}</Cell>
            <Cell>Studio-only: renders as {to} inside this boundary</Cell>
            <Cell>{""}</Cell>
          </tr>
        ) : null;
      })}
      {profile.overrides.map((path) => {
        const base = profile.baseToken(path);
        const t = profile.tokens.get("semantic", path);
        if (!base || !t) return null;
        let contrast = "";
        if (t.contrast) {
          const against = profile.tokens.get("semantic", t.contrast.against);
          const ratio = against
            ? contrastRatio(
                String(profile.tokens.resolve(t, mode).value),
                String(profile.tokens.resolve(against, mode).value),
              )
            : null;
          contrast =
            ratio === null
              ? "not measured"
              : `${ratio.toFixed(1)} on ${t.contrast.against}${t.contrast.floor ? (ratio >= t.contrast.floor ? `, passes ${t.contrast.floor}` : `, fails ${t.contrast.floor}`) : ""}`;
        }
        return (
          <tr key={path}>
            <Cell>
              <span className="inline-flex items-center gap-2">
                {t.type === "color" ? (
                  <Swatch cssVar={varOf(t)} label={`${path} under ${profile.id} in ${mode} mode`} />
                ) : null}
                <span className="font-mono">{path}</span>
              </span>
            </Cell>
            <Cell mono>{chainText(base, mode)}</Cell>
            <Cell mono>{chainText(t, mode, profile.tokens)}</Cell>
            <Cell>{contrast}</Cell>
          </tr>
        );
      })}
    </Table>
  );
}

function ProfilesPage({ mode, profile }: { mode: Mode; profile: ProfileId }) {
  const p = profileById(profile);
  return (
    <Page
      title={`Profiles, ${mode} mode`}
      lead="A profile is a semantic overlay (DESIGN.md §5): it changes the value behind existing names inside its DesignProfileBoundary and may bring primitive ramps of its own. It never adds a name, never changes a base primitive, and never touches feedback or focus. It must override every identity token (the shell's violet and lime), and it never carries the Studio's intent action, which renders as the profile's primary action inside the boundary. The two profiles here are hand-made interpretations (handoff §19), not customer brands. Every declared contrast pair is tested under each profile in both modes by profiles.test.ts."
    >
      <Section title="The same spec sheet under each profile">
        <div className="grid gap-4 lg:grid-cols-3">
          {PROFILES.map((id) => (
            <Sample key={id} id={id} mode={mode} />
          ))}
        </div>
      </Section>
      <Section title="Nested boundaries">
        <p className="max-w-prose text-body-sm text-text-secondary">
          A boundary inside another resets every semantic value to its own profile, including back
          to neutral. This fixture nests friendly, then neutral, then professional; the play
          function reads the computed custom properties of each level.
        </p>
        <div className="mt-3">
          <DesignProfileBoundary mode={mode} profile="friendly">
            <div
              data-profile-sample="friendly"
              className="rounded-container bg-surface-canvas p-4 text-text-primary"
            >
              <span className="text-label-md">friendly</span>
              <div className="mt-2">
                <DesignProfileBoundary mode={mode} profile="neutral">
                  <div
                    data-profile-sample="neutral"
                    className="rounded-container bg-surface-canvas p-4 text-text-primary"
                  >
                    <span className="text-label-md">neutral inside friendly</span>
                    <div className="mt-2">
                      <DesignProfileBoundary mode={mode} profile="professional">
                        <div
                          data-profile-sample="professional"
                          className="rounded-container bg-surface-canvas p-4 text-text-primary"
                        >
                          <span className="text-label-md">professional inside neutral</span>
                        </div>
                      </DesignProfileBoundary>
                    </div>
                  </div>
                </DesignProfileBoundary>
              </div>
            </div>
          </DesignProfileBoundary>
        </div>
      </Section>
      <Section title="A profile object at runtime">
        <p className="max-w-prose text-body-sm text-text-secondary">
          This boundary receives a Profile object built in the story, not a registered id, so its
          CSS is rendered inline by the boundary. Resolved customer profiles reach the preview this
          way. The play function checks its computed values too.
        </p>
        <div className="mt-3 max-w-xl">
          <DesignProfileBoundary mode={mode} profile={runtimeProbe}>
            <div
              data-profile-sample={runtimeProbe.id}
              className="rounded-container bg-surface-canvas p-4 text-text-primary"
            >
              <span className="text-label-md">{label2(runtimeProbe)}</span>
              <div className="mt-4">
                <SpecSheet scope="profile-runtime-probe" />
              </div>
            </div>
          </DesignProfileBoundary>
        </div>
      </Section>
      {p ? (
        <>
          <Section title={`Decisions, ${p.name.en}`}>
            <p className="max-w-prose text-body-sm text-text-secondary">{p.description}</p>
            <div className="mt-3">
              <Table head={["Decision", "Value", "Known values", "Checked against tokens"]}>
                {Object.entries(p.decisions).map(([key, value]) => (
                  <tr key={key}>
                    <Cell mono>{key}</Cell>
                    <Cell>{value}</Cell>
                    <Cell>{(DECISIONS[key] ?? []).join(", ")}</Cell>
                    <Cell>
                      {CHECKED.includes(key) ? "yes, by Profile.validate" : "declared only"}
                    </Cell>
                  </tr>
                ))}
              </Table>
            </div>
          </Section>
          <Section title={`Own primitives (${p.ownPrimitives.length})`}>
            <OwnPrimitives profile={p} />
          </Section>
          <Section
            title={`Overrides (${p.overrides.length} of ${tokens.layer("semantic").length} semantic tokens)`}
          >
            <p className="max-w-prose text-body-sm text-text-secondary">
              Locked groups, never overridden: {LOCKED_GROUPS.join(", ")}. Chains read semantic to
              primitive to value for the current mode.
            </p>
            <div className="mt-3">
              <Overrides profile={p} mode={mode} />
            </div>
          </Section>
        </>
      ) : (
        <Section title="Neutral">
          <p className="max-w-prose text-body-sm text-text-secondary">
            Neutral is the base set from DESIGN.md §3 and has no override file. Pick Professional or
            Friendly in the toolbar to read its decisions, own primitives, and overrides.
          </p>
        </Section>
      )}
    </Page>
  );
}

/** Semantic paths whose computed value is checked on every sample, one per kind of override. */
const CHECKED_PATHS = [
  "surface.canvas",
  "action.primary",
  "text.on-action",
  "shape.control.radius",
  "size.control.md",
  "feedback.danger.fg",
];

const meta = {
  title: "Foundations/Profiles",
  component: ProfilesPage,
  tags: ["autodocs"],
  args: { mode: "light", profile: "neutral" },
  render: (_args, { globals }) => (
    <ProfilesPage mode={globals["mode"] as Mode} profile={globals["profile"] as ProfileId} />
  ),
  play: async ({ canvasElement }) => {
    const samples = canvasElement.querySelectorAll<HTMLElement>("[data-profile-sample]");
    expect(samples.length).toBeGreaterThanOrEqual(PROFILES.length + 4);
    for (const el of samples) {
      const boundary = el.closest<HTMLElement>("[data-design-profile]");
      if (!boundary) throw new Error("sample outside a boundary");
      const id = boundary.dataset["designProfile"] ?? "";
      const mode = resolvedMode(boundary.dataset["mode"] as BoundaryMode);
      const set = setOf(id);
      const computed = getComputedStyle(el);
      const read = (path: string) => {
        const token = set.get("semantic", path);
        if (!token) throw new Error(`${path} missing`);
        return computed.getPropertyValue(TokenSet.cssVar(token)).trim().toLowerCase();
      };
      for (const path of CHECKED_PATHS) {
        const token = set.get("semantic", path);
        if (!token) throw new Error(`${path} missing`);
        const expected = String(set.resolve(token, mode).value).toLowerCase();
        expect(read(path), `${path} under ${id} in ${mode}`).toBe(expected);
      }
      // The Studio's intent action never shows inside a profile boundary: it renders as the primary action.
      if (id !== "neutral") {
        expect(read("action.intent"), `action.intent under ${id}`).toBe(read("action.primary"));
        expect(read("text.on-intent"), `text.on-intent under ${id}`).toBe(read("text.on-action"));
      } else {
        expect(read("action.intent")).not.toBe(read("action.primary"));
      }
    }
  },
} satisfies Meta<typeof ProfilesPage>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Contract: Story = {};
