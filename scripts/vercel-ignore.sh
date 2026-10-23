#!/bin/sh
# Vercel "Ignored Build Step" (ORV-66). Exit 0 skips the build, exit 1 builds.
# Usage, from a project's root directory: sh ../../scripts/vercel-ignore.sh <paths that feed this build>
# It compares this commit with the last deployed one of the branch (Vercel's
# VERCEL_GIT_PREVIOUS_SHA), so a docs-only change, or a branch reset onto a main
# that holds the same tree, builds nothing. When the base cannot be found it builds.
# Previews follow the same rule, so a PR gets a preview to review whenever it changes
# what this project deploys. The owner reviews there, then on staging (main).
# Put "[skip preview]" in a commit message to skip one preview build on purpose.
if [ "${VERCEL_ENV:-}" = "preview" ]; then
  case "${VERCEL_GIT_COMMIT_MESSAGE:-}" in
    *"[skip preview]"*) echo "vercel-ignore: the commit asks to skip this preview"; exit 0 ;;
  esac
fi
base="${VERCEL_GIT_PREVIOUS_SHA:-}"
[ -n "$base" ] || { echo "vercel-ignore: no previous deployment, building"; exit 1; }
if ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  git fetch --quiet --depth=1 origin "$base" 2>/dev/null || { echo "vercel-ignore: $base not reachable, building"; exit 1; }
fi
if git diff --quiet "$base" HEAD -- "$@"; then
  echo "vercel-ignore: nothing under $* changed since $base, skipping"
  exit 0
fi
echo "vercel-ignore: changes under $* since $base, building"
exit 1
