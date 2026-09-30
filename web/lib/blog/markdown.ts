import GithubSlugger from "github-slugger";

export type Heading = { id: string; text: string; level: 2 | 3 };

/** Plain text of a Markdown heading, matching what rehype-slug sees after rendering. */
function headingText(markdown: string) {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
}

/** Lines of the document outside fenced code blocks. */
function proseLines(markdown: string) {
  const lines: string[] = [];
  let fence: string | null = null;
  for (const line of markdown.split("\n")) {
    const match = line.match(/^\s*(```|~~~)/);
    if (match) {
      fence = fence === null ? match[1] : fence === match[1] ? null : fence;
      continue;
    }
    if (fence === null) lines.push(line);
  }
  return lines;
}

// Level 2 and 3 headings for the table of contents. Ids come from the same slugger (and
// in the same order) as rehype-slug, so the links match the rendered headings.
export function extractHeadings(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  for (const line of proseLines(markdown)) {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const text = headingText(match[2]);
    // Every heading uses up a slug, even the ones not shown in the contents.
    const id = slugger.slug(text);
    const level = match[1].length;
    if (level === 2 || level === 3) headings.push({ id, text, level });
  }
  return headings;
}

const WORDS_PER_MINUTE = 200;

export function estimateReadingMinutes(markdown: string) {
  const words = proseLines(markdown).join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** How many images in the Markdown have empty alt text, e.g. ![](photo.jpg). */
export function countImagesMissingAlt(markdown: string) {
  return proseLines(markdown).join("\n").match(/!\[\s*\]\(/g)?.length ?? 0;
}
