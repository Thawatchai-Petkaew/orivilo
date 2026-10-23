import { isApplePlatform } from "../commands/index";

/**
 * The modifier a story presses for `Mod` (ORV-74): Meta on Apple platforms, Control elsewhere,
 * read the same way the registry reads it. A story that pressed Control passed on the ubuntu CI
 * runner and failed on a Mac, where the board listens for Meta.
 */
export const MOD = isApplePlatform() ? "Meta" : "Control";
