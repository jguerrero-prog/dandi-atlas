#!/bin/bash
# Copies Neurosift's design system (components, tokens, fonts, theme stores) from a pinned commit.
# Usage: scripts/sync-ui.sh [path to a neurosift clone with flatironinstitute as a remote, default ../neurosift]
set -euo pipefail

NEUROSIFT_SHA=a48a41d0b6707108b9422db547cfffdf2b634ec2
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NEUROSIFT_DIR="${1:-$ROOT/../neurosift}"
FILES=(src/ui src/css/tokens.css src/css/fonts.css src/theme.ts src/shared/plotTheme.ts src/shared/plotColors.ts public/neurosift-logo.png)

git -C "$NEUROSIFT_DIR" fetch --quiet --all
STAGE="$(mktemp -d)"
git -C "$NEUROSIFT_DIR" archive "$NEUROSIFT_SHA" "${FILES[@]}" | tar -x -C "$STAGE"

mkdir -p "$ROOT/src/ui" "$ROOT/src/css" "$ROOT/src/shared"
rsync -a --delete "$STAGE/src/ui/" "$ROOT/src/ui/"
cp "$STAGE/src/css/tokens.css" "$STAGE/src/css/fonts.css" "$ROOT/src/css/"
cp "$STAGE/src/theme.ts" "$ROOT/src/theme.ts"
cp "$STAGE/src/shared/plotTheme.ts" "$STAGE/src/shared/plotColors.ts" "$ROOT/src/shared/"
cp "$STAGE/public/neurosift-logo.png" "$ROOT/public/"

cat >"$ROOT/src/ui/SOURCE.md" <<MD
# Source

Copied by \`scripts/sync-ui.sh\` from [flatironinstitute/neurosift](https://github.com/flatironinstitute/neurosift/tree/$NEUROSIFT_SHA/src/ui)
at commit \`$NEUROSIFT_SHA\`, together with \`src/css/tokens.css\`, \`src/css/fonts.css\`, \`src/theme.ts\`,
\`src/shared/plotTheme.ts\`, \`src/shared/plotColors.ts\` and \`public/neurosift-logo.png\`.

Do not edit these files here. Change them in Neurosift, then update the commit in the script and run it again.
MD

echo "Synced ${FILES[*]} from neurosift@$NEUROSIFT_SHA"
