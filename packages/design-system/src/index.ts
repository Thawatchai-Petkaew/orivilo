// `PROFILES` is re-exported from the profiles module, not the boundary: the boundary is a client
// module, and a value exported from one reaches a server component as a reference, not an array.
export {
  DesignProfileBoundary,
  PortalScope,
  useDesignProfile,
  type BoundaryMode,
  type DesignProfileBoundaryProps,
  type DesignProfileContextValue,
  type Mode,
  type ProfileId,
} from "./boundary/DesignProfileBoundary";
export {
  DECISIONS,
  LOCKED_GROUPS,
  PROFILE_IDS,
  PROFILE_IDS as PROFILES,
  STUDIO_REMAP,
  Profile,
  profileById,
  profiles,
  type BaseSources,
  type ProfileSource,
} from "./profiles/index";
export * from "./components/index";
export {
  COMMANDS,
  COMMAND_SCOPES,
  type Command,
  type CommandId,
  type CommandScope,
  commandById,
  commandForKey,
  commandsInScope,
  shortcutsOf,
} from "./commands/index";
export {
  CANVAS_WORDS,
  EDGE_MEANINGS,
  NODE_KINDS,
  NODE_STATUSES,
  PORT_KINDS,
  type EdgeMeaning,
  type NodeKind,
  type NodeStatus,
  type PortDirection,
  type PortKind,
  type PortShape,
  portShape,
} from "./tokens/canvas";
