// Conventional Commits plus the issue key AGENTS.md and builder step 6 ask for (ORV-108, slice B).
const ISSUE_KEY = /\bORV-\d+\b/;

export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "header-names-issue-key": ({ header }) => [
          ISSUE_KEY.test(header ?? ""),
          "the header must name an issue key ORV-<n>, in the scope or the subject",
        ],
      },
    },
  ],
  rules: {
    "header-names-issue-key": [2, "always"],
    // Subjects here start with a name or a product word (Vercel, CanvasChat), which the default case rule refuses.
    "subject-case": [0],
    // This repo's headers run long (up to 147 characters on this branch); the default of 100 would fail them.
    "header-max-length": [2, "always", 160],
  },
};
