import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const { default: WorkspacePage } = await import("./page");

// ORV-161 row 1: the layout renders no landmark for the page body, so the page owns its one main.
describe("/workspace", () => {
  it("renders the reference screen inside one main", () => {
    const html = renderToStaticMarkup(<WorkspacePage />);
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
    const main = /<main[^>]*>([\s\S]*)<\/main>/.exec(html)?.[1] ?? "";
    expect(main).toContain("ทีมออกแบบ Brand Canvas");
    expect(html.startsWith("<main")).toBe(true);
  });
});
