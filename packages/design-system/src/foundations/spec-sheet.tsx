/**
 * Spec sheet painted from component tokens only. Not a component: E2-4 builds the real ones. Used
 * by the Component tokens page and, once per profile, by the Profiles page; `scope` keeps ids and
 * landmark names unique when several sheets share a page.
 */
export function SpecSheet({ scope }: { scope: string }) {
  const btn = (name: string, label: string) => ({
    background: `var(--cmp-button-${name}-bg, transparent)`,
    color: `var(--cmp-button-${name}-fg)`,
    borderRadius: "var(--cmp-button-radius)",
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap" as const,
    height: "var(--cmp-button-height-md)",
    paddingInline: "var(--cmp-button-padding-x-md)",
    fontFamily: "var(--cmp-button-type-md-font-family)",
    fontSize: "var(--cmp-button-type-md-font-size)",
    fontWeight: "var(--cmp-button-type-md-font-weight)",
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
    <div className="@container">
      <div className="grid gap-4 @xl:grid-cols-2">
        <div className="flex flex-wrap items-center gap-3">
          {buttons.map(({ label, ...style }) => (
            <button key={label} type="button" style={style}>
              {label}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor={`${scope}-input`} className="block text-label-md">
            ชื่อแบรนด์
          </label>
          <input
            id={`${scope}-input`}
            placeholder="เช่น ออริวิโล"
            style={{
              marginTop: "var(--ds-space-stack-sm)",
              width: "100%",
              background: "var(--cmp-input-bg)",
              color: "var(--cmp-input-fg)",
              border: "1px solid var(--cmp-input-border)",
              borderRadius: "var(--cmp-input-radius)",
              height: "var(--cmp-input-height-md)",
              paddingInline: "var(--cmp-input-padding-x)",
              fontFamily: "var(--cmp-input-type-md-font-family)",
              fontSize: "var(--cmp-input-type-md-font-size)",
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
            style={{
              color: "var(--cmp-tile-label)",
              fontSize: "var(--ds-type-label-md-font-size)",
            }}
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
          <nav aria-label={`ตัวอย่างเมนู ${scope}`} className="flex flex-wrap gap-1">
            {["ค้นพบ", "แบรนด์", "ระบบดีไซน์"].map((item, i) => (
              <a
                key={item}
                href={`#${scope}-nav`}
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
                  whiteSpace: "nowrap",
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
                  display: "inline-flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  height: "var(--cmp-badge-height-md)",
                  paddingInline: "var(--cmp-badge-padding-x-md)",
                  fontFamily: "var(--cmp-badge-type-md-font-family)",
                  fontSize: "var(--cmp-badge-type-md-font-size)",
                  fontWeight: "var(--cmp-badge-type-md-font-weight)",
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
    </div>
  );
}
