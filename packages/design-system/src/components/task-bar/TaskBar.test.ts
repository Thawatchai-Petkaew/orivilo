/**
 * TaskBar markup contract (ORV-100, AC 1, 2, 5, 8, 10): rendered on the server, no browser. The
 * interaction half (toggle, retry pending, live region, focus) is proven by the play tests.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import { fixtureJobs, fixtureTaskJobs, fixtureTaskJobsEn } from "../fixtures";
import { TaskBar, type TaskBarProps } from "./TaskBar";

function render(props: TaskBarProps, locale: "th" | "en" = "th"): string {
  return renderToStaticMarkup(
    createElement(LocaleProvider, { locale, children: createElement(TaskBar, props) }),
  );
}

describe("TaskBar", () => {
  it("summarises only non-zero counts in the order queued, running, failed, done", () => {
    const html = render({ jobs: [fixtureJobs.done, fixtureJobs.failed, fixtureJobs.running] });
    expect(html).toContain("กำลังทำ 1 งาน, ไม่สำเร็จ 1 งาน, เสร็จแล้ว 1 งาน");
    expect(html).not.toContain("รอคิว 0");
    expect(render({ jobs: fixtureTaskJobs })).toContain(
      "รอคิว 1 งาน, กำลังทำ 1 งาน, ไม่สำเร็จ 1 งาน, เสร็จแล้ว 1 งาน",
    );
  });

  it("says no jobs yet, collapsed by default, with the panel mounted but hidden", () => {
    const html = render({ jobs: [] });
    expect(html).toContain("ยังไม่มีงาน");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toMatch(/class="ds-taskbar__panel" hidden/);
  });

  it("shows no Go to node button off a board, even for a job with a node (AC 15)", () => {
    const html = render({ jobs: [fixtureJobs.done], defaultExpanded: true });
    expect(html).toContain(fixtureJobs.done.name);
    expect(html).not.toContain("ไปที่โหนด");
  });

  it("reads the English catalog", () => {
    const html = render({ jobs: fixtureTaskJobsEn, defaultExpanded: true }, "en");
    expect(html).toContain("1 queued, 1 running, 1 failed, 1 done");
    expect(html).toContain("Hide jobs");
  });

  it("shows the retry button only with onRetry, named after the job", () => {
    const failed = [fixtureJobs.failed];
    expect(render({ jobs: failed, defaultExpanded: true })).not.toContain("<button aria-label");
    const html = render({ jobs: failed, defaultExpanded: true, onRetry: () => {} });
    expect(html).toContain(`aria-label="ลองอีกครั้ง ${fixtureJobs.failed.name}"`);
    expect(html).toContain(fixtureJobs.failed.reason);
  });

  it("labels every job's basis and never says AI", () => {
    const html = render({ jobs: fixtureTaskJobs, defaultExpanded: true });
    expect(html).toContain("ตามกฎ");
    expect(html).toContain("ข้อมูลจำลอง");
    expect(html).not.toMatch(/\bAI\b/);
  });

  it("clamps a running value and leaves an unknown length without a value", () => {
    const html = render({
      jobs: [{ ...fixtureJobs.running, value: 140 }, fixtureJobs.runningUnknown],
      defaultExpanded: true,
    });
    expect(html).toContain('aria-valuenow="100"');
    expect(html.match(/aria-valuenow/g)).toHaveLength(1);
  });

  it("puts the full name in the title so a long name can truncate", () => {
    const html = render({ jobs: [fixtureJobs.longName], defaultExpanded: true });
    expect(html).toContain(`title="${fixtureJobs.longName.name}"`);
  });
});
