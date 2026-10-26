import type { Lineup } from "./color-audit";

/**
 * STAND-IN lineup for the ORIVILO worked example (ORV-20 spec, decision 3). These hexes stand for
 * the brand CI method's audit conclusion (§5.1: violet 250 to 265, black, cream with clay). They
 * are not sampled from any real brand's assets, and the names are deliberately not brand names.
 */
export const STAND_IN_LINEUP: Lineup = [
  { name: "stand-in-a", hex: "#5B3FD9" },
  { name: "stand-in-b", hex: "#6E4AE8" },
  { name: "stand-in-c", hex: "#7B5CF0" },
  { name: "stand-in-d", hex: "#111111" },
  { name: "stand-in-e", hex: "#0A0A0A" },
  { name: "stand-in-f", hex: "#D2691E" },
  { name: "stand-in-g", hex: "#C8743F" },
];
