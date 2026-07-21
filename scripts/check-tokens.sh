#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# check-tokens.sh — Design-token CI gate for Phenome Portal.
#
# Flags the four violation classes defined by the token freeze:
#   1. Hardcoded hex colors in component code   (#rrggbb)
#   2. Arbitrary font sizes                       (text-[Npx])
#   3. Arbitrary padding values                   (p|px|py|pt|pb|pl|pr-[Npx])
#   4. Padding >= 24px  (p*-6 and up) — allowed ONLY at the page-layout layer;
#      every hit inside a component is a convergence target.
#
# Scope: src/app/**/*.tsx  (excludes node_modules, src/imports, dist, *.css —
#        theme.css legitimately DEFINES the raw values, it is the source).
#
# Usage:
#   bash scripts/check-tokens.sh            # report + non-zero exit if any
#   bash scripts/check-tokens.sh --quiet    # counts only
#   bash scripts/check-tokens.sh --summary  # one line per class, no samples
# The violation counts printed today are the migration BASELINE.
# ---------------------------------------------------------------------------
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src/app"
# .ts included: shared style-constant maps live in *Data.ts / *View.ts
INCLUDE=(--include='*.tsx' --include='*.ts')
MODE="${1:-full}"
MODE="${MODE#--}"   # accept --quiet / --summary / --full (or bare)

# grep flavor
GREP="grep"
command -v grep >/dev/null 2>&1 || { echo "grep not found"; exit 2; }

# Third-party brand colors that are intentionally exempt (D-9: Google logo).
BRAND_ALLOWLIST='#4285f4|#34a853|#fbbc05|#ea4335|#4285F4|#34A853|#FBBC05|#EA4335'

section() { [ "$MODE" = "summary" ] || printf '\n\033[1m%s\033[0m\n' "$1"; }
samples() { # $1 = ripgrep-style matches (already filtered); print first N
  [ "$MODE" = "full" ] || return 0
  echo "$1" | head -n 12 | sed 's/^/    /'
  local n; n=$(echo "$1" | grep -c . )
  [ "$n" -gt 12 ] && echo "    … ($((n - 12)) more)"
}

total=0
count_of() { echo "$1" | grep -c . ; }   # count non-empty lines

# --- 1. Hardcoded hex --------------------------------------------------------
HEX=$($GREP -rnoE "${INCLUDE[@]}" '#[0-9a-fA-F]{3,8}\b' "$SRC" 2>/dev/null \
       | $GREP -vE "$BRAND_ALLOWLIST" )
HEX=$(echo "$HEX" | grep -c . ); [ -z "$HEX" ] && HEX=0
HEX_LINES=$($GREP -rnoE "${INCLUDE[@]}" '#[0-9a-fA-F]{3,8}\b' "$SRC" 2>/dev/null \
       | $GREP -vE "$BRAND_ALLOWLIST" )
section "1. Hardcoded hex colors  →  use a --status-* / --text-* / --divider token   [$HEX]"
samples "$HEX_LINES"

# --- 2. Arbitrary font sizes -------------------------------------------------
FONT_LINES=$($GREP -rnoE "${INCLUDE[@]}" 'text-\[[0-9.]+(px|rem|em)\]' "$SRC" 2>/dev/null)
FONT=$(count_of "$FONT_LINES")
section "2. Arbitrary font sizes  →  map to the 6-tier --text-* scale   [$FONT]"
samples "$FONT_LINES"

# --- 3. Arbitrary padding ----------------------------------------------------
PADARB_LINES=$($GREP -rnoE "${INCLUDE[@]}" '(^|[^a-zA-Z0-9_-])(p|px|py|pt|pb|pl|pr|ps|pe)-\[[0-9.]+(px|rem)\]' "$SRC" 2>/dev/null)
PADARB=$(count_of "$PADARB_LINES")
section "3. Arbitrary padding values  →  use --space-1..6   [$PADARB]"
samples "$PADARB_LINES"

# --- 4a. Padding > 24px (step >= 7) — HARD: exceeds the --space-6 cap ---------
# integer steps 7..99 (>24px). decimals (.5) are all < 24 and excluded.
PADOVER_LINES=$($GREP -rnoE "${INCLUDE[@]}" '(^|[^a-zA-Z0-9_-])(p|px|py|pt|pb|pl|pr|ps|pe)-(7|8|9|1[0-9]|2[0-9]|[3-9][0-9])([^0-9.]|$)' "$SRC" 2>/dev/null)
PADOVER=$(count_of "$PADOVER_LINES")
section "4a. Padding > 24px  →  HARD: exceeds --space-6 cap; component→--space-4(16), page→--space-6(24)   [$PADOVER]"
samples "$PADOVER_LINES"

# --- 4b. Padding == 24px (step 6) — REVIEW: page-layout layer only ------------
PAD24_LINES=$($GREP -rnoE "${INCLUDE[@]}" '(^|[^a-zA-Z0-9_-])(p|px|py|pt|pb|pl|pr|ps|pe)-6([^0-9.]|$)' "$SRC" 2>/dev/null)
PAD24=$(count_of "$PAD24_LINES")
section "4b. Padding == 24px (p-6)  →  REVIEW: allowed ONLY at page layout layer (--space-6); never inside a component   [$PAD24]"
samples "$PAD24_LINES"

total=$((HEX + FONT + PADARB + PADOVER + PAD24))

printf '\n\033[1m── Token violation baseline ─────────────────────────\033[0m\n'
printf '  %-34s %5d\n' "Hardcoded hex colors"           "$HEX"
printf '  %-34s %5d\n' "Arbitrary font sizes"           "$FONT"
printf '  %-34s %5d\n' "Arbitrary padding values"       "$PADARB"
printf '  %-34s %5d\n' "Padding > 24px (hard)"          "$PADOVER"
printf '  %-34s %5d\n' "Padding = 24px (page-review)"   "$PAD24"
printf '  %-34s %5d\n' "TOTAL"                          "$total"
echo   '─────────────────────────────────────────────────────'

if [ "$total" -gt 0 ]; then
  echo "FAIL: $total token violations (this is the migration baseline until pages are migrated)."
  exit 1
fi
echo "PASS: no token violations."
exit 0
