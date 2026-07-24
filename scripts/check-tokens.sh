#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# check-tokens.sh — Design-token CI gate for Phenome Portal.
#
# v3 scale (2026-07-24): the token set is now the full 10-step spacing scale
# --space-0..9 = 0/4/8/12/16/20/24/32/40/48px, which maps onto this exact
# Tailwind padding-step subset: p-0,1,2,3,4,5,6,8,10,12 (Tailwind's p-7/9/11
# = 28/36/44px are NOT part of the scale and stay hard violations).
#
# Flags the five violation classes defined by the token set:
#   1. Hardcoded hex colors in component code   (#rrggbb)
#   2. Arbitrary font sizes                       (text-[Npx])
#   3. Arbitrary padding values                   (p|px|py|pt|pb|pl|pr-[Npx])
#   3b. Off-scale padding steps (p-7,9,11,13+) — not in the space-0..9 scale.
#   4. Padding >= 24px  (p-6/8/10/12) — allowed ONLY at the page-layout layer
#      (page gutters, section/dialog padding); every hit inside a plain
#      component is a convergence target. p-4/p-5 (16/20px) are the two
#      component-level tiers (default / large card) and are never flagged.
#   5. Gradients on a business (data/operational) page — RESTRICTED to the
#      auth/brand/marketing surface only (see --gradient-* in theme.css).
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
# Excludes pages/demo/design-system/**: that page intentionally documents each
# token's real hex value as informational TEXT (e.g. "hex: '#0A1E57'" shown
# next to a swatch that's actually painted via the token class) — it never
# uses a literal hex to STYLE anything, which is what this rule guards against.
HEX_LINES=$($GREP -rnoE "${INCLUDE[@]}" '#[0-9a-fA-F]{3,8}\b' "$SRC" 2>/dev/null \
       | $GREP -vE "$BRAND_ALLOWLIST" \
       | $GREP -v "/pages/demo/design-system/")
HEX=$(count_of "$HEX_LINES")
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
section "3. Arbitrary padding values  →  use --space-0..9   [$PADARB]"
samples "$PADARB_LINES"

# --- 3b. Off-scale padding steps — HARD: not in the space-0..9 scale ---------
# Tailwind steps 7,9,11 (28/36/44px) and 13+ have no matching --space-N token.
PADSTEP_LINES=$($GREP -rnoE "${INCLUDE[@]}" '(^|[^a-zA-Z0-9_-])(p|px|py|pt|pb|pl|pr|ps|pe)-(7|9|11|1[3-9]|[2-9][0-9])([^0-9.]|$)' "$SRC" 2>/dev/null)
PADSTEP=$(count_of "$PADSTEP_LINES")
section "3b. Off-scale padding step (p-7/9/11/13+)  →  HARD: not in the --space-0..9 scale   [$PADSTEP]"
samples "$PADSTEP_LINES"

# --- 4a. Padding >= 32px (step >= 8) — HARD: exceeds the --space-9 cap -------
PADOVER_LINES=$($GREP -rnoE "${INCLUDE[@]}" '(^|[^a-zA-Z0-9_-])(p|px|py|pt|pb|pl|pr|ps|pe)-1[3-9]([^0-9.]|$)' "$SRC" 2>/dev/null)
PADOVER=$(count_of "$PADOVER_LINES")
section "4a. Padding > 48px  →  HARD: exceeds --space-9 cap (largest token)   [$PADOVER]"
samples "$PADOVER_LINES"

# --- 4b. Padding == 24/32/40/48px (step 6/8/10/12) — REVIEW: page-layout only -
PAD24_LINES=$($GREP -rnoE "${INCLUDE[@]}" '(^|[^a-zA-Z0-9_-])(p|px|py|pt|pb|pl|pr|ps|pe)-(6|8|10|12)([^0-9.]|$)' "$SRC" 2>/dev/null)
PAD24=$(count_of "$PAD24_LINES")
section "4b. Padding == 24/32/40/48px (p-6/8/10/12)  →  REVIEW: allowed ONLY at page layout layer (--space-6/7/8/9); never inside a plain component   [$PAD24]"
samples "$PAD24_LINES"

# --- 5. Gradients on a business (data/operational) page ----------------------
# Scope: src/app/pages/** only (excludes shared components, which may
# legitimately host the token definition or a --frosted-* auth surface
# piece). Excludes pages/auth/** (login/enrollment/reset-password — the
# one approved gradient surface) and pages/demo/design-system/** (the
# showcase intentionally RENDERS the gradient tokens for documentation,
# inside its own clearly-labeled "restricted" section). A line already
# using a frosted- prefixed class is the established v2 exception and is
# also excluded.
GRAD_SCOPE="$SRC/pages"
GRAD_LINES=$($GREP -rnoE --include='*.tsx' --include='*.ts' \
       'bg-gradient-to-[trbl]+[a-z-]*|from-[a-z]+-[0-9]+[^"'"'"']*to-[a-z]+-[0-9]+' \
       "$GRAD_SCOPE" 2>/dev/null \
       | $GREP -v "/pages/auth/" \
       | $GREP -v "/pages/demo/design-system/" \
       | $GREP -v "frosted-")
GRAD=$(count_of "$GRAD_LINES")
section "5. Gradients on a business page  →  RESTRICTED to auth/brand/marketing only; use flat Phenome Blue / semantic colour   [$GRAD]"
samples "$GRAD_LINES"

total=$((HEX + FONT + PADARB + PADSTEP + PADOVER + PAD24 + GRAD))

printf '\n\033[1m── Token violation baseline ─────────────────────────\033[0m\n'
printf '  %-34s %5d\n' "Hardcoded hex colors"           "$HEX"
printf '  %-34s %5d\n' "Arbitrary font sizes"           "$FONT"
printf '  %-34s %5d\n' "Arbitrary padding values"       "$PADARB"
printf '  %-34s %5d\n' "Off-scale padding step (hard)"  "$PADSTEP"
printf '  %-34s %5d\n' "Padding > 48px (hard)"          "$PADOVER"
printf '  %-34s %5d\n' "Padding = 24/32/40/48 (review)" "$PAD24"
printf '  %-34s %5d\n' "Gradients on business pages"    "$GRAD"
printf '  %-34s %5d\n' "TOTAL"                          "$total"
echo   '─────────────────────────────────────────────────────'

if [ "$total" -gt 0 ]; then
  echo "FAIL: $total token violations (this is the migration baseline until pages are migrated)."
  exit 1
fi
echo "PASS: no token violations."
exit 0
