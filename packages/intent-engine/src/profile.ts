import { z } from "zod";

/**
 * Product Design Profile, schema v1.0.
 * Starting point from the handoff §13. Vocabulary fields stay plain strings until
 * the resolver story fixes the allowed values (handoff §12.1).
 */

const id = z.string().min(1);
const version = z.number().int().positive();

export const modeSchema = z.enum(["light", "dark"]);

export const profileStatusSchema = z.enum(["draft", "approved", "archived"]);

export const brandRefSchema = z.object({
  id,
  version,
  paletteId: id,
  typographyId: id,
  lockedFields: z.array(z.string()),
  allowedTreatments: z.array(z.string()),
});

export const productContextSchema = z.object({
  productType: id,
  surface: id,
  platform: id,
  inputMethods: z.array(z.string()).min(1),
  locales: z.array(z.string()).min(1),
});

export const sourceIntentSchema = z.object({
  desired: z.array(z.string()).min(1),
  avoided: z.array(z.string()),
  rationale: z.string(),
});

export const decisionsSchema = z.object({
  shape: z.string(),
  density: z.string(),
  surfaceTreatment: z.string(),
  imagery: z.string(),
  brandExpression: z.string(),
  motion: z.string(),
});

export const validationSchema = z.object({
  status: z.enum(["not-run", "passed", "failed"]),
  checks: z.array(z.object({ id, status: z.enum(["passed", "failed"]), detail: z.string() })),
});

export const approvalSchema = z.object({
  approvedBy: id,
  approvedAt: z.iso.datetime(),
});

export const designProfileSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    profileId: id,
    profileVersion: version,
    resolverVersion: id,
    catalogVersion: id,
    status: profileStatusSchema,
    brand: brandRefSchema,
    context: productContextSchema,
    sourceIntent: sourceIntentSchema,
    decisions: decisionsSchema,
    semanticTokenSetId: id,
    supportedModes: z.array(modeSchema).min(1),
    patternIds: z.array(id),
    graphicRecipeIds: z.array(id),
    contentRuleSetId: id,
    adjustments: z.array(z.unknown()),
    conflicts: z.array(z.unknown()),
    validation: validationSchema,
    approval: approvalSchema.nullable(),
  })
  .superRefine((profile, ctx) => {
    // An approved snapshot must record who approved it and the passing checks (handoff §13).
    if (profile.status === "approved") {
      if (profile.approval === null) {
        ctx.addIssue({
          code: "custom",
          path: ["approval"],
          message: "Approved profile needs approval.",
        });
      }
      if (profile.validation.status !== "passed") {
        ctx.addIssue({
          code: "custom",
          path: ["validation", "status"],
          message: "Approved profile needs passing validation.",
        });
      }
    }
    if (new Set(profile.supportedModes).size !== profile.supportedModes.length) {
      ctx.addIssue({ code: "custom", path: ["supportedModes"], message: "Modes must be unique." });
    }
  });

export type DesignProfile = z.infer<typeof designProfileSchema>;
