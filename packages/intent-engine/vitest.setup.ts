// ORV-160 orv160-network-block: no test reaches the network (ADR 0009 point 8). A test that needs a
// `fetch` stubs one with `vi.stubGlobal("fetch", ...)`; `vi.unstubAllGlobals()` returns to this block.
globalThis.fetch = () =>
  Promise.reject(new Error("Network is blocked in tests (ADR 0009 point 8)."));
