# ORIGO

From business intent to living digital products. A Brand-to-Product Platform: Discover → Brand → Design System → Product → Build → Review, with the Intent Engine as the shared core.

- Product brief: [docs/context/origo-brief.md](docs/context/origo-brief.md)
- First milestone (Intent Studio): [docs/context/intent-studio-handoff.md](docs/context/intent-studio-handoff.md)
- How humans and AI agents work here: [AGENTS.md](AGENTS.md)
- Decisions: [docs/adr/](docs/adr/)

## Develop

Requires Node 22 and pnpm 10 (`corepack enable`).

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```
