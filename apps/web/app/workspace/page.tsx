import { WorkspaceScreen } from "@orivilo/design-system/examples";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เวิร์กสเปซ, ORIVILO",
  description: "The reference screen: a team workspace with project creation (E2-8).",
};

/**
 * The reference screen (handoff §19) rendered inside the neutral shell. The component lives in the
 * design-system package so Storybook proves it under every profile and E2-11's preview can render
 * the same screen under two directions. Fixture data; the screen says so.
 */
export default function WorkspacePage() {
  return <WorkspaceScreen />;
}
