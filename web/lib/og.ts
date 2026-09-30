import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The logo mark as a data URL for Open Graph images, which render outside the browser
// and can't fetch /brand/logo-mark.png by relative URL.
export async function logoMarkDataUrl() {
  const data = await readFile(join(process.cwd(), "public/brand/logo-mark.png"));
  return `data:image/png;base64,${data.toString("base64")}`;
}
