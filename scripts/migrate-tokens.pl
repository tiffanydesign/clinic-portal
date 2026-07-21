#!/usr/bin/env perl
# migrate-tokens.pl — apply the frozen design-token mapping to a .tsx/.ts file.
#
#   perl scripts/migrate-tokens.pl <file> [<file> ...]
#
# Encodes the same rules the four Batch-1/2 files were migrated by, so Batch-3
# is mechanically consistent. In-place edit. Idempotent (safe to re-run).
#
# RULES (see TOKEN_AUDIT.md + theme.css):
#   * Neutrals -> ink/surface/divider by darkness.
#   * Status palette -> semantic. TEXT uses -ink shade (4.5:1 on tints);
#     solid fills carrying white text use -ink so the white passes; plain
#     signal fills/dots keep the mid-tone --status-*.
#   * Tints: *-50 -> /10, *-100 -> /15, border *-200 -> /30.
#   * rounded containers -> rounded-card; controls/badges -> rounded-control.
#   * Off-grid spacing snapped by the caller's follow-up pass (kept out of here
#     because p-6 page gutters must survive — done per-file, not blanket).
#
# It deliberately does NOT touch:
#   * hardcoded hex (needs human/ token judgement, incl. brand exemptions),
#   * arbitrary text-[Npx] / p-[Npx] (mapped per-file with tier judgement).
use strict; use warnings;

sub migrate {
  local $_ = shift;

  # --- status TEXT -> -ink (do before generic text rules) -------------------
  for my $pair (['red','danger'],['rose','danger'],
                ['emerald','success'],['green','success'],['teal','success'],
                ['amber','warning'],['orange','warning'],['yellow','warning'],
                ['blue','info'],['sky','info'],['cyan','info'],
                ['purple','special'],['violet','special'],['fuchsia','special']) {
    my ($p,$s) = @$pair;
    s/\btext-$p-(?:500|600|700|800|900)\b/text-$s-ink/g;
    s/\bhover:text-$p-(?:500|600|700|800|900)\b/hover:text-$s-ink/g;
    s/\bgroup-hover:text-$p-(?:600|700|800)\b/group-hover:text-$s-ink/g;
    # tints
    s/\bbg-$p-50\b/bg-$s\/10/g;
    s/\bbg-$p-100\b/bg-$s\/15/g;
    s/\bhover:bg-$p-50\b/hover:bg-$s\/10/g;
    s/\bhover:bg-$p-100\b/hover:bg-$s\/15/g;
    s/\bborder-$p-(?:200|300)\b/border-$s\/30/g;
    s/\bborder-$p-(?:400|500|600)\b/border-$s/g;
    s/\bring-$p-(?:400|500|600)\b/ring-$s/g;
    # solid fills: if the same class list paints white text, use -ink so the
    # text clears 4.5:1; otherwise it's a dot/bar/icon -> keep the signal tone.
    if (/text-white/) {
      s/\bbg-$p-(?:500|600|700)\b/bg-$s-ink/g;
    } else {
      s/\bbg-$p-(?:500|600|700)\b/bg-$s/g;
    }
    s/\bhover:bg-$p-(?:600|700|800)\b/hover:opacity-90/g;
    s/\btext-$p-(?:300|400)\b/text-$s/g;   # faint status text (rare)
  }

  # --- neutrals: text ---------------------------------------------------------
  s/\btext-(?:gray|slate|zinc|neutral)-900\b/text-ink/g;
  s/\btext-(?:gray|slate|zinc|neutral)-800\b/text-ink/g;
  s/\btext-(?:gray|slate|zinc|neutral)-700\b/text-ink-soft/g;
  s/\btext-(?:gray|slate|zinc|neutral)-600\b/text-ink-soft/g;
  s/\btext-(?:gray|slate|zinc|neutral)-(?:300|400|500)\b/text-ink-muted/g;
  s/\bhover:text-(?:gray|slate)-(?:700|800|900)\b/hover:text-ink/g;
  s/\bgroup-hover:text-(?:gray|slate)-(?:700|800|900)\b/group-hover:text-ink/g;
  s/\bplaceholder-(?:gray|slate)-(?:400|500)\b/placeholder-ink-muted/g;

  # --- neutrals: borders ------------------------------------------------------
  s/\bborder-(?:gray|slate)-(?:100|200|300)\b/border-divider/g;
  s/\bborder-(?:gray|slate)-(?:400|500|600)\b/border-border-strong/g;
  s/\bdivide-(?:gray|slate)-(?:100|200|300)\b/divide-divider/g;
  s/\bring-(?:gray|slate)-(?:400|500|600)\b/ring-info/g;
  s/\bfocus:border-(?:gray|slate)-(?:400|500|600)\b/focus:border-info/g;
  s/\bfocus:ring-(?:gray|slate)-(?:400|500|600)\b/focus:ring-info/g;

  # --- neutrals: surfaces -----------------------------------------------------
  s/\bbg-white\b/bg-surface/g;
  s/\bbg-(?:gray|slate)-50\b/bg-surface-page/g;
  s/\bbg-(?:gray|slate)-100\b/bg-surface-hover/g;
  s/\bbg-(?:gray|slate)-(?:200|300)\b/bg-surface-sunken/g;
  s/\bbg-(?:slate|gray)-(?:600|700|800|900)\b/bg-surface-sunken/g;  # dark neutral chips (not CTAs)
  s/\bhover:bg-(?:gray|slate)-50\b/hover:bg-surface-page/g;
  s/\bhover:bg-(?:gray|slate)-100\b/hover:bg-surface-hover/g;
  s/\bhover:bg-(?:gray|slate)-(?:200|300)\b/hover:bg-surface-sunken/g;

  # --- radius -----------------------------------------------------------------
  s/\brounded-(?:lg|xl|2xl)\b/rounded-card/g;
  s/\brounded-md\b/rounded-control/g;
  s/\brounded-sm\b/rounded-control/g;
  s/(?<![-\w])rounded(?![-\w\/])/rounded-control/g;   # bare `rounded`

  return $_;
}

@ARGV or die "usage: migrate-tokens.pl <file> [<file> ...]\n";
for my $file (@ARGV) {
  open my $in, '<', $file or die "cannot read $file: $!";
  local $/; my $src = <$in>; close $in;
  my $out = migrate($src);
  next if $out eq $src;
  open my $fh, '>', $file or die "cannot write $file: $!";
  print $fh $out; close $fh;
  print "migrated: $file\n";
}
