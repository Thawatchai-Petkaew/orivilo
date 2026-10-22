import { describe, expect, it } from "vitest";
import { profileById } from "./index";
import { componentsReading, donorFor, refineProfile } from "./refine";

const need = <T>(value: T | undefined): T => {
  if (value === undefined) throw new Error("expected a value");
  return value;
};

const colourGroups = ["surface", "text", "border", "action", "selection", "brand"];

describe("refineProfile (ORV-34 part 3)", () => {
  it("borrows a value from the profile that expresses it and stays valid", () => {
    const result = refineProfile("professional", { shape: "soft", motion: "standard" });
    expect(result?.applied).toEqual({ shape: "soft", motion: "standard" });
    const refined = need(result).profile;
    expect(refined.id).toBe("professional-refined");
    expect(refined.decisions["shape"]).toBe("soft");
    expect(refined.validate()).toEqual([]);
    const friendly = need(profileById("friendly"));
    for (const path of ["shape.control.radius", "shape.container.radius"]) {
      expect(refined.diff(path, "light")?.profile).toBe(friendly.diff(path, "light")?.profile);
    }
  });

  it("keeps every colour token of the hand-made profile", () => {
    const original = need(profileById("professional"));
    const refined = need(
      refineProfile("professional", {
        shape: "soft",
        typeVoice: "paired",
        motion: "standard",
      }),
    ).profile;
    const colours = original.overrides.filter((p) => colourGroups.includes(p.split(".")[0] ?? ""));
    expect(colours.length).toBeGreaterThan(0);
    for (const path of colours) {
      for (const mode of ["light", "dark"] as const) {
        expect(refined.diff(path, mode)).toEqual(original.diff(path, mode));
      }
    }
  });

  it("never invents a value no profile expresses", () => {
    expect(donorFor("shape", "rounded")).toBeUndefined();
    expect(refineProfile("friendly", { shape: "rounded" })).toBeUndefined();
    const mixed = refineProfile("friendly", { shape: "rounded", motion: "quiet" });
    expect(mixed?.applied).toEqual({ motion: "quiet" });
    expect(mixed?.skipped).toEqual({ shape: "rounded" });
  });

  it("returns nothing when no decision changes", () => {
    expect(refineProfile("professional", { shape: "crisp" })).toBeUndefined();
    expect(refineProfile("missing", { shape: "soft" })).toBeUndefined();
  });

  it("refines both ways and every combination validates", () => {
    for (const id of ["professional", "friendly"]) {
      for (const shape of ["crisp", "soft"])
        for (const typeVoice of ["single", "paired"])
          for (const motion of ["quiet", "standard"]) {
            const r = refineProfile(id, { shape, typeVoice, motion });
            if (r)
              expect(r.profile.validate(), `${id} ${shape} ${typeVoice} ${motion}`).toEqual([]);
          }
    }
  });
});

describe("componentsReading", () => {
  it("names the component groups that reference a semantic path", () => {
    const readers = componentsReading(["shape.control.radius"]);
    expect(readers).toContain("button");
    expect(readers).toContain("input");
    expect(componentsReading(["no.such.path"])).toEqual([]);
  });
});
