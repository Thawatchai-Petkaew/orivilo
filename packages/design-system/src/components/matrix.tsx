import type { CSSProperties, ReactNode } from "react";
import {
  DesignProfileBoundary,
  type Mode,
  PROFILES,
  type ProfileId,
} from "../boundary/DesignProfileBoundary";
import { profileById } from "../profiles/index";

const MODES: readonly Mode[] = ["light", "dark"];

/** A Matrix cell fills no viewport height: a board or panel inside it keeps its height (`fillHeight`). */
const CELL_FILL: CSSProperties & Record<"--story-fill", string> = { "--story-fill": "0px" };

function label(id: ProfileId): string {
  const p = profileById(id);
  return p ? `${p.name.en} (${p.name.th})` : "Neutral (base)";
}

/**
 * The same fixture under every registered profile in both modes, six cells at once. Every
 * "Recipes and modes" story renders through it, so the Storybook test project covers all six
 * boundaries under the a11y addon, not only the toolbar's current pair (DESIGN.md §11).
 * `data-matrix-cell` carries profile and mode for play functions.
 */
export function Matrix({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-2">
      {MODES.map((mode) =>
        PROFILES.map((id) => (
          <DesignProfileBoundary key={`${id}-${mode}`} mode={mode} profile={id}>
            <section
              aria-label={`${label(id)}, ${mode}`}
              data-matrix-cell=""
              data-matrix-profile={id}
              data-matrix-mode={mode}
              style={CELL_FILL}
              className="flex min-w-0 flex-col gap-3 rounded-container border border-border-card bg-surface-canvas p-4 font-body text-text-primary"
            >
              <p className="text-label-sm text-text-secondary">
                {label(id)}, {mode}
              </p>
              {children}
            </section>
          </DesignProfileBoundary>
        )),
      )}
    </div>
  );
}

/** A 360 px column so a story shows what a phone shows (DESIGN.md §11). */
export function Narrow({ children }: { children: ReactNode }) {
  return <div className="w-[360px] max-w-full">{children}</div>;
}

/**
 * The CSS height of a board or panel story: `px` (the height it had) or the frame the surface
 * lets it fill (`--story-fill`, set by the preview decorator and zeroed in a Matrix cell),
 * whichever is taller. Spec ORV-189, `fill-height-1`.
 */
export function fillHeight(px: number): string {
  return `max(${px}px, var(--story-fill, 0px))`;
}

/**
 * One page under one profile and mode. Page examples use this instead of the Matrix because six
 * copies of a page in one document duplicate its landmarks (nav, regions), which the a11y addon
 * rightly reports; a component has no landmark, so the Matrix stays the tool for components.
 */
export function Under({
  profile,
  mode,
  children,
}: {
  profile: ProfileId;
  mode: Mode;
  children: ReactNode;
}) {
  return (
    <DesignProfileBoundary mode={mode} profile={profile}>
      <div
        data-matrix-cell=""
        data-matrix-profile={profile}
        data-matrix-mode={mode}
        className="min-h-dvh bg-surface-canvas font-body text-text-primary"
      >
        {children}
      </div>
    </DesignProfileBoundary>
  );
}
