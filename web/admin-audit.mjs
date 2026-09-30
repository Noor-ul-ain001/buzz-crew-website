import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
const [email, password] = readFileSync("C:/Users/E/AppData/Local/Temp/claude/C--Users-E-Desktop-crew-buzz-buzz-crew-website/a06dc514-74d2-41f1-b1bf-b0a3d0b18bb1/scratchpad/test-admin.txt", "utf8").trim().split("\n");
const BASE = process.env.BASE || "https://buzz-crew-web.vercel.app";
const OUT = "C:/Users/E/AppData/Local/Temp/claude/C--Users-E-Desktop-crew-buzz-buzz-crew-website/a06dc514-74d2-41f1-b1bf-b0a3d0b18bb1/scratchpad/shots";
const PAGES = ["/admin", "/admin/leads", "/admin/content", "/admin/content/posts", "/admin/content/posts/new", "/admin/content/faqs", "/admin/content/faqs/new",
  "/admin/content/case-studies", "/admin/content/case-studies/new", "/admin/content/testimonials", "/admin/content/testimonials/new",
  "/admin/content/team", "/admin/content/team/new", "/admin/content/logos", "/admin/subscribers", "/admin/users"];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 213, height: 472 } });
const p = await ctx.newPage();
for (const path of ["/admin/login", "/admin/signup", "/admin/forgot-password"]) await audit(path);
await p.goto(BASE + "/admin/login", { waitUntil: "networkidle", timeout: 120000 });
await p.getByLabel(/^Email/).fill(email);
await p.getByLabel(/^Password/).fill(password);
await p.getByRole("button", { name: "Sign in" }).click();
await p.waitForURL(/\/admin$/, { timeout: 60000 });
for (const path of PAGES) await audit(path);
async function audit(path) {
  await p.goto(BASE + path, { waitUntil: "networkidle", timeout: 120000 });
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const offenders = [];
    for (const el of document.querySelectorAll("body *")) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.right <= width + 1) continue;
      let clipped = false;
      for (let q = el.parentElement; q && q !== document.body; q = q.parentElement) {
        const s = getComputedStyle(q);
        if (s.overflowX !== "visible" && q.getBoundingClientRect().right <= width + 1) { clipped = true; break; }
      }
      if (clipped) continue;
      offenders.push(`${el.tagName.toLowerCase()} r=${Math.round(rect.right)} "${(el.textContent || "").trim().slice(0, 25)}" .${(typeof el.className === "string" ? el.className : "").slice(0, 70)}`);
    }
    return { sw: document.documentElement.scrollWidth, offenders: offenders.slice(0, 6) };
  });
  console.log(`\n${path} scrollWidth=${r.sw}`);
  r.offenders.forEach((o) => console.log("   " + o));
  await p.screenshot({ path: `${OUT}/adm${path.replace(/\W+/g, "_")}.png` });
}
await b.close();
