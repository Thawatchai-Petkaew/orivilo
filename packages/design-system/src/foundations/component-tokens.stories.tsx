import type { Meta, StoryObj } from "@storybook/react-vite";
import { Cell, Page, Section, Swatch, Table, chainText, varOf } from "./shared";
import { type Mode, tokens } from "../tokens/index";

const component = tokens.layer("component");
const groups = [...new Set(component.map((t) => t.path.split(".")[0] ?? ""))];

/** Spec sheets painted from component tokens only. Not components: E2-4 builds the real ones. */
function SpecSheet() {
  const btn = (name: string, label: string) => ({
    background: `var(--cmp-button-${name}-bg, transparent)`,
    color: `var(--cmp-button-${name}-fg)`,
    borderRadius: "var(--cmp-button-radius)",
    height: "var(--cmp-button-height-md)",
    paddingInline: "var(--cmp-button-padding-x)",
    fontSize: "var(--cmp-button-type-font-size)",
    fontWeight: "var(--cmp-button-type-font-weight)",
    border: name === "secondary" ? "1px solid var(--cmp-button-secondary-border)" : "0",
    label,
  });
  const buttons = [
    btn("primary", "บันทึกโปรไฟล์"),
    btn("secondary", "ยกเลิก"),
    btn("intent", "ถาม Intent Engine"),
    btn("destructive", "ลบแบรนด์"),
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-wrap items-center gap-3">
        {buttons.map(({ label, ...style }) => (
          <button key={label} type="button" style={style}>
            {label}
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="spec-input" className="block text-label-md">
          ชื่อแบรนด์
        </label>
        <input
          id="spec-input"
          placeholder="เช่น ออริวิโล"
          style={{
            marginTop: "var(--ds-space-stack-sm)",
            width: "100%",
            background: "var(--cmp-input-bg)",
            color: "var(--cmp-input-fg)",
            border: "1px solid var(--cmp-input-border)",
            borderRadius: "var(--cmp-input-radius)",
            height: "var(--cmp-input-height)",
            paddingInline: "var(--cmp-input-padding-x)",
            fontSize: "var(--cmp-input-type-font-size)",
          }}
        />
      </div>
      <div
        style={{
          background: "var(--cmp-tile-bg)",
          border: "1px solid var(--cmp-card-border)",
          borderRadius: "var(--cmp-tile-radius)",
          padding: "var(--cmp-tile-padding)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-40px",
            top: "-40px",
            width: "160px",
            height: "160px",
            borderRadius: "999px",
            background: "var(--cmp-tile-glow)",
            opacity: "var(--cmp-tile-glow-opacity)",
            filter: "blur(24px)",
          }}
        />
        <div
          style={{ color: "var(--cmp-tile-label)", fontSize: "var(--ds-type-label-md-font-size)" }}
        >
          องค์ประกอบที่สืบย้อนได้
        </div>
        <div
          style={{
            fontSize: "var(--cmp-tile-numeral-font-size)",
            fontWeight: "var(--cmp-tile-numeral-font-weight)",
            lineHeight: "var(--cmp-tile-numeral-line-height)",
            letterSpacing: "var(--cmp-tile-numeral-letter-spacing)",
            marginTop: "var(--ds-space-stack-sm)",
          }}
        >
          128
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <nav aria-label="ตัวอย่างเมนู" className="flex gap-1">
          {["ค้นพบ", "แบรนด์", "ระบบดีไซน์"].map((item, i) => (
            <a
              key={item}
              href="#nav"
              aria-current={i === 2 ? "page" : undefined}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--ds-space-inline-md)",
                height: "var(--cmp-nav-item-height)",
                paddingInline: "var(--ds-space-inset-md)",
                borderRadius: "var(--cmp-nav-item-radius)",
                color: i === 2 ? "var(--cmp-nav-item-fg-active)" : "var(--cmp-nav-item-fg)",
                background: i === 2 ? "var(--cmp-nav-item-bg-active)" : "transparent",
                textDecoration: "none",
                fontSize: "var(--ds-type-label-md-font-size)",
                fontWeight: "var(--ds-type-label-md-font-weight)",
              }}
            >
              {i === 2 ? (
                <span
                  aria-hidden="true"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: "var(--cmp-nav-item-bead)",
                  }}
                />
              ) : null}
              {item}
            </a>
          ))}
        </nav>
        <div className="flex flex-wrap gap-2">
          {[
            ["neutral", "ฉบับร่าง"],
            ["success", "อนุมัติแล้ว"],
            ["warning", "รอตรวจ"],
            ["danger", "ขัดแย้ง"],
            ["info", "กฎตามเงื่อนไข"],
          ].map(([v, label]) => (
            <span
              key={v}
              style={{
                background: `var(--cmp-badge-${v}-bg)`,
                color: `var(--cmp-badge-${v}-fg)`,
                borderRadius: "var(--cmp-badge-radius)",
                paddingInline: "var(--ds-space-inset-sm)",
                paddingBlock: "var(--ds-space-0-5, 2px)",
                fontSize: "var(--cmp-badge-type-font-size)",
                fontWeight: "var(--cmp-badge-type-font-weight)",
              }}
            >
              {label}
            </span>
          ))}
        </div>
        <div
          role="status"
          style={{
            background: "var(--cmp-toast-bg)",
            color: "var(--cmp-toast-fg)",
            borderRadius: "var(--cmp-toast-radius)",
            padding: "var(--cmp-toast-padding)",
            fontSize: "var(--ds-type-body-sm-font-size)",
          }}
        >
          บันทึกโปรไฟล์แล้ว
        </div>
      </div>
    </div>
  );
}

function ComponentTokensPage({ mode }: { mode: Mode }) {
  return (
    <Page
      title={`Component tokens, ${mode} mode`}
      lead="One name per slot of a component, each referencing a semantic token (DESIGN.md §5). The chain reads component to semantic to primitive to value. The spec sheet below is painted from these names alone; it is not a component. E2-4 builds the real ones on top of this contract."
    >
      <Section title="Spec sheet (tokens only, not components)">
        <SpecSheet />
      </Section>
      {groups.map((g) => (
        <Section key={g} title={g}>
          <Table head={["Token", `Chain, ${mode}`, "Chain, other mode"]}>
            {component
              .filter((t) => t.path.startsWith(`${g}.`))
              .map((t) => (
                <tr key={t.path}>
                  <Cell>
                    <span className="inline-flex items-center gap-2">
                      {t.type === "color" ? (
                        <Swatch cssVar={varOf(t)} label={`${t.path} in ${mode} mode`} />
                      ) : null}
                      <span className="font-mono">{t.path}</span>
                    </span>
                  </Cell>
                  <Cell mono>{chainText(t, mode)}</Cell>
                  <Cell mono>{chainText(t, mode === "light" ? "dark" : "light")}</Cell>
                </tr>
              ))}
          </Table>
        </Section>
      ))}
    </Page>
  );
}

const meta = {
  title: "Foundations/Component tokens",
  component: ComponentTokensPage,
  tags: ["autodocs"],
  args: { mode: "light" },
  render: (_args, { globals }) => <ComponentTokensPage mode={globals["mode"] as Mode} />,
} satisfies Meta<typeof ComponentTokensPage>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Contract: Story = {};
