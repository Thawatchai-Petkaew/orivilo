# Preview deployments

Two Vercel projects deploy from this one repository (ORV-12, E0-3). Each pull request gets a preview of both, and `main` updates both production links.

| Project                 | Root directory           | What it serves                      | Settings come from                   |
| ----------------------- | ------------------------ | ----------------------------------- | ------------------------------------ |
| `orivilo`               | `apps/web`               | The ORIVILO app                     | Next.js framework detection          |
| `orivilo-design-system` | `packages/design-system` | Storybook: the catalog, every state | `packages/design-system/vercel.json` |

## Set up the Storybook project (once, by the owner)

1. In Vercel, Add New Project and pick the `orivilo` repository.
2. Set Root Directory to `packages/design-system` and Application Preset to Other. `vercel.json` sets install, build and output.
3. Name it `orivilo-design-system` and deploy.
4. Optional: under Settings, Deployment Protection, keep Vercel Authentication on so only the team can open previews.

## Reviewing a gate

The Vercel bot posts one comment per pull request with both preview links. A gate packet quotes the Storybook link for UI work, so the owner reviews the real component, not a screenshot. A preview shows what that branch built, never what `main` has.
