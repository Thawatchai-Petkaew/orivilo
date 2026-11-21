import { expect, waitFor } from "storybook/test";
import { inVitest } from "./visual-asserts";

const frame = () => new Promise<void>((done) => requestAnimationFrame(() => done()));

/**
 * Runs `check` in a browser window of `width` by `height`, and restores the window after. The
 * resize holds the screenshot lock, so a play that takes a shot never meets a window another play
 * has moved. Outside the browser runner (the static Storybook) the window is the reader's own and
 * `check` runs as it is.
 */
export async function atWindow(width: number, height: number, check: () => Promise<void>) {
  if (!inVitest) return check();
  const { page } = await import("vitest/browser");
  const before = { width: window.innerWidth, height: window.innerHeight };
  const resized = async (w: number, h: number) => {
    await page.viewport(w, h);
    await waitFor(() => expect([window.innerWidth, window.innerHeight]).toEqual([w, h]));
    await frame();
    await frame();
  };
  await navigator.locks.request("orivilo-screenshot", async () => {
    await resized(width, height);
    try {
      await check();
    } finally {
      await resized(before.width, before.height);
    }
  });
}
