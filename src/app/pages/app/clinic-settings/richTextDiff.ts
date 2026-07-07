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
