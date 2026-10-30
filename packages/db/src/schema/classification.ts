// The classification of every column of the schema (ADR 0015 decision 9, ORV-158).
// Each entry line ends with its basis (`orv158-basis` in docs/specs/ORV-158/spec.md).
import type { PgTable } from "drizzle-orm/pg-core";
import type * as barrel from "./index.ts";

/** The closed tag list, in decision 9's order. */
export const TAGS = ["public", "internal", "personal", "secret"] as const;
export type Tag = (typeof TAGS)[number];

type Barrel = typeof barrel;
/** The barrel's exports that are tables; relations objects and `TENANT_TABLES` drop out. */
type TableName = { [K in keyof Barrel]: Barrel[K] extends PgTable ? K : never }[keyof Barrel];
/** A table's column property names, the keys `getTableColumns` returns. */
type ColumnName<T extends TableName> = keyof Barrel[T]["_"]["columns"];

/** One required key per table, one required key per column, each a `Tag`. */
export type Classification = {
  readonly [T in TableName]: { readonly [C in ColumnName<T>]: Tag };
};

export const CLASSIFICATION = {
  user: {
    id: "personal", // user-ref
    name: "personal", // person
    email: "personal", // person
    emailVerified: "internal", // record
    image: "personal", // person
    createdAt: "internal", // record
    updatedAt: "internal", // record
  },
  session: {
    id: "internal", // row-key
    expiresAt: "internal", // record
    token: "secret", // credential
    createdAt: "internal", // record
    updatedAt: "internal", // record
    ipAddress: "personal", // person
    userAgent: "personal", // person
    userId: "personal", // user-ref
    activeOrganizationId: "internal", // workspace-key
  },
  account: {
    id: "internal", // row-key
    accountId: "personal", // person
    providerId: "internal", // record
    userId: "personal", // user-ref
    accessToken: "secret", // credential
    refreshToken: "secret", // credential
    idToken: "secret", // credential
    accessTokenExpiresAt: "internal", // record
    refreshTokenExpiresAt: "internal", // record
    scope: "internal", // record
    password: "secret", // credential
    createdAt: "internal", // record
    updatedAt: "internal", // record
  },
  verification: {
    id: "internal", // row-key
    identifier: "personal", // person
    value: "secret", // credential
    expiresAt: "internal", // record
    createdAt: "internal", // record
    updatedAt: "internal", // record
  },
  organization: {
    id: "internal", // workspace-key
    name: "personal", // person
    slug: "internal", // record
    logo: "internal", // record
    createdAt: "internal", // record
    metadata: "internal", // record
  },
  member: {
    id: "internal", // row-key
    organizationId: "internal", // workspace-key
    userId: "personal", // user-ref
    role: "internal", // record
    createdAt: "internal", // record
  },
  invitation: {
    id: "internal", // row-key
    organizationId: "internal", // workspace-key
    email: "personal", // person
    role: "internal", // record
    status: "internal", // record
    expiresAt: "internal", // record
    createdAt: "internal", // record
    inviterId: "personal", // user-ref
  },
  project: {
    id: "internal", // row-key
    workspaceId: "internal", // workspace-key
    name: "internal", // label
    createdBy: "personal", // user-ref
    createdAt: "internal", // record
  },
  direction: {
    id: "internal", // row-key
    workspaceId: "internal", // workspace-key
    name: "internal", // label
    createdBy: "personal", // user-ref
    createdAt: "internal", // record
    updatedAt: "internal", // record
  },
  directionVersion: {
    id: "internal", // row-key
    directionId: "internal", // row-key
    workspaceId: "internal", // workspace-key
    status: "internal", // record
    number: "internal", // record
    snapshot: "personal", // free-text
    fingerprint: "internal", // record
    createdBy: "personal", // user-ref
    createdAt: "internal", // record
    approvedBy: "personal", // user-ref
    approvedAt: "internal", // record
  },
  rateLimitCounter: {
    key: "personal", // hashed-subject
    windowStart: "internal", // record
    windowEnd: "internal", // record
    count: "internal", // record
  },
  aiUsage: {
    id: "internal", // row-key
    workspaceId: "internal", // workspace-key
    userId: "personal", // user-ref
    job: "internal", // record
    model: "internal", // record
    costMicroUsd: "internal", // amount
    currency: "internal", // amount
    createdAt: "internal", // record
  },
} as const satisfies Classification;
