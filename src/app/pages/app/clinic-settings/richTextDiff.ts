// Word-level LCS diff for comparing two consent-form text snapshots. Tags are
// stripped before diffing (Compare is a plain-text audit view, not a live
// render), so a rich-text edit like adding <strong> doesn't itself register
// as a change unless the visible words did too.

export type DiffToken = { text: string; type: "same" | "add" | "del" };

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&middot;/g, "·")
    .replace(/&amp;/g, "&")
    .trim();
}

export function diffWords(oldText: string, newText: string): DiffToken[] {
  const a = stripHtml(oldText).split(/(\s+)/).filter(Boolean);
  const b = stripHtml(newText).split(/(\s+)/).filter(Boolean);

  const m = a.length;
  const n = b.length;
  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      tokens.push({ text: a[i], type: "same" });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      tokens.push({ text: a[i], type: "del" });
      i++;
    } else {
      tokens.push({ text: b[j], type: "add" });
      j++;
    }
  }
  while (i < m) tokens.push({ text: a[i++], type: "del" });
  while (j < n) tokens.push({ text: b[j++], type: "add" });

  return tokens;
}

export function hasDiff(tokens: DiffToken[]): boolean {
  return tokens.some((t) => t.type !== "same");
}

// Auto-detected, human-readable bullet list of what changed between two
// content snapshots — this is what the system shows in the Save modal
// instead of asking the Admin to describe the change themselves.
export function summarizeContentChanges(
  from: { title: string; introductionHtml: string; sections: { id: string; title: string; bodyHtml: string }[]; signatureBlock: { idNumber: boolean; witnessSignature: boolean }; footerHtml: string },
  to: { title: string; introductionHtml: string; sections: { id: string; title: string; bodyHtml: string }[]; signatureBlock: { idNumber: boolean; witnessSignature: boolean }; footerHtml: string }
): string[] {
  const notes: string[] = [];

  if (hasDiff(diffWords(from.title, to.title))) notes.push("Updated form title");
  if (hasDiff(diffWords(from.introductionHtml, to.introductionHtml))) notes.push("Updated introduction text");

  const oldIds = new Set(from.sections.map((s) => s.id));
  const newIds = new Set(to.sections.map((s) => s.id));
  to.sections.filter((s) => !oldIds.has(s.id)).forEach((s) => notes.push(`Added section: ${s.title}`));
  from.sections.filter((s) => !newIds.has(s.id)).forEach((s) => notes.push(`Removed section: ${s.title}`));
  to.sections.filter((s) => oldIds.has(s.id)).forEach((s) => {
    const old = from.sections.find((o) => o.id === s.id)!;
    if (old.title !== s.title || hasDiff(diffWords(old.bodyHtml, s.bodyHtml))) notes.push(`Updated section: ${s.title}`);
  });

  if (from.signatureBlock.idNumber !== to.signatureBlock.idNumber) {
    notes.push(`${to.signatureBlock.idNumber ? "Enabled" : "Disabled"} ID Number field`);
  }
  if (from.signatureBlock.witnessSignature !== to.signatureBlock.witnessSignature) {
    notes.push(`${to.signatureBlock.witnessSignature ? "Enabled" : "Disabled"} Witness Signature field`);
  }
  if (hasDiff(diffWords(from.footerHtml, to.footerHtml))) notes.push("Updated footer");

  return notes;
}
