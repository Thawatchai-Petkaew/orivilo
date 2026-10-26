---
id: K-0025
topic: architecture
claim: Penpot's MCP integration connects an outside AI client to the open-source design tool through an MCP server and a Penpot plugin over WebSocket, and lets the model write and run arbitrary code in the plugin environment to read and change the design, with remote mode turning off local file access; the standalone repo is archived and its code moved into the main Penpot repo.
source: "https://github.com/penpot/penpot-mcp (README)"
retrieved: 2026-10-26
confidence: 0.75
applies_to: [ORV-109]
license: own-words
---

## Evidence

MPL-2.0, not on the README list, so this file is in our words with short quotes. Confidence 0.75, not 0.8: one source, and the page read showed two different archive dates (2026-02-03 in text, 7 October 2026 in a banner), so its current status is unsettled.

> The LLM is free to write and execute arbitrary code snippets within the Penpot Plugin environment to accomplish its tasks.

### The system

- **Model-driven:** the actions on the design. The model (in any MCP client) decides what to read and change, and writes the code that does it.
- **Deterministic:** the transport. The MCP server tracks each request by task id and handles timeouts; the plugin runs the task through the Penpot Plugin API and returns a structured response.
- **Knowledge or retrieval:** the live design file, read through tools. No design-system knowledge layer is described.
- **Structured output:** the plugin's structured responses; the model's code is free-form.
- **Evals and guardrails:** remote mode (`PENPOT_MCP_REMOTE_MODE=true`) disables local file system access; the README warns against binding to `0.0.0.0` on untrusted networks; the browser asks the person to allow local network access.
- **Provenance:** not described.
- **Human review:** the person sees the design change in Penpot; no approval step before code runs is described.
- **Cost and rate control:** left to the AI client.
- **Stack:** TypeScript monorepo (`common/`, `mcp-server/`, `penpot-plugin/`), Python helper scripts, WebSocket, a REPL port 4403 for debugging.
- **License:** MPL-2.0.

### What the sources do not show

- The list of tool names, and whether any action is limited to an allow-list.
- How the integration works inside the main Penpot repo now.
- Figma's own AI features (Figma Make, its MCP server) are closed; no architecture page for them was read for this entry.

## Why it matters for ORIVILO

This is the "agent drives the editor" pattern, with the widest model power of any project surveyed: arbitrary code in the design tool, guarded mainly by where the server listens. It is the opposite end from ADR 0009 point 9 (model output is never executed) and from a closed rule grammar; it is a reference for a future Figma or Penpot sync, not for the engine.
