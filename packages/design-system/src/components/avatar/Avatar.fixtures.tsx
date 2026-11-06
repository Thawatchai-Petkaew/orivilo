// Type fixtures for `avatar-none-1` (ORV-224): each element has one defect, and its directive fails
// `pnpm typecheck` as unused (TS2578) if Avatar ever takes the prop. Never imported.
import { Avatar } from "./Avatar";

export const status = (
  // @ts-expect-error avatar-none-1: no status prop, because the repo holds no presence data
  <Avatar status="online" />
);

export const verified = (
  // @ts-expect-error avatar-none-1: no verified prop, because a tick needs backing data
  <Avatar verified />
);

export const count = (
  // @ts-expect-error avatar-none-1: no count prop, because no story needs one
  <Avatar count={3} />
);

export const badge = (
  // @ts-expect-error avatar-none-1: no badge prop and no slot for one
  <Avatar badge="new" />
);
