/**
 * ADR 0002, spec ORV-38 AC 7: only the app's server folder may open the database client; every
 * other module reaches workspace data through `withWorkspace`. Spread into a flat ESLint config.
 */
export const DB_CLIENT_ONLY_IN = ["server/**"];

export const restrictDbClient = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@orivilo/db/client",
            message:
              "Only server/ opens the database. Use withWorkspace from @orivilo/auth (ADR 0002).",
          },
        ],
      },
    ],
  },
};
