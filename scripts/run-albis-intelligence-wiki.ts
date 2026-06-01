import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const wikiRoot = path.join(appRoot, "albis-intelligence");
const workspaceRoot = path.dirname(appRoot);
const reportsDir = path.join(appRoot, "reports", "albis-intelligence");

const requiredFiles = [
  "README.md",
  "WIKI_RULES.md",
  "index.md",
  "log.md",
  "raw/README.md",
  "wiki/topics/community-media.md",
  "wiki/topics/community-weather.md",
  "wiki/topics/global-scans.md",
  "wiki/product/albis-public-feed.md",
  "wiki/indexes/pgi-gai.md",
  "wiki/community-signals/README.md",
  "wiki/seo/README.md",
];

const requiredDirs = [
  "raw/scans",
  "raw/comments",
  "raw/sources",
  "raw/community",
  "wiki/topics",
  "wiki/regions",
  "wiki/outlets",
  "wiki/frames",
  "wiki/indexes",
  "wiki/product",
  "wiki/seo",
  "wiki/community-signals",
];

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true });
}

function listMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...listMarkdownFiles(full));
    else if (entry.endsWith(".md")) out.push(full);
  }
  return out;
}

function findLatestFile(dir: string, predicate: (name: string) => boolean): string | null {
  if (!existsSync(dir)) return null;
  const candidates = readdirSync(dir)
    .filter(predicate)
    .map((name) => path.join(dir, name))
    .filter((file) => statSync(file).isFile())
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return candidates[0] ?? null;
}

function appendLog(entry: string) {
  const logPath = path.join(wikiRoot, "log.md");
  const existing = existsSync(logPath) ? readFileSync(logPath, "utf8") : "# Albis Intelligence Log\n";
  writeFileSync(logPath, `${existing.trimEnd()}\n\n${entry.trim()}\n`);
}

function status() {
  ensureDir(reportsDir);
  const missingDirs = requiredDirs.filter((dir) => !existsSync(path.join(wikiRoot, dir)));
  const missingFiles = requiredFiles.filter((file) => !existsSync(path.join(wikiRoot, file)));
  const mdFiles = listMarkdownFiles(wikiRoot);
  const rawFiles = existsSync(path.join(wikiRoot, "raw"))
    ? readdirSync(path.join(wikiRoot, "raw"), { recursive: true }).filter((item) => typeof item === "string" && !item.endsWith(".gitkeep"))
    : [];

  const report = `# Albis Intelligence Wiki Status\n\nGenerated: ${new Date().toISOString()}\n\n## Summary\n\n- Wiki root: \`${wikiRoot}\`\n- Markdown pages: ${mdFiles.length}\n- Raw/source entries: ${rawFiles.length}\n- Missing required directories: ${missingDirs.length}\n- Missing required files: ${missingFiles.length}\n\n## Missing directories\n\n${missingDirs.length ? missingDirs.map((d) => `- ${d}`).join("\n") : "None"}\n\n## Missing files\n\n${missingFiles.length ? missingFiles.map((f) => `- ${f}`).join("\n") : "None"}\n\n## Markdown pages\n\n${mdFiles.map((file) => `- ${path.relative(wikiRoot, file)}`).sort().join("\n")}\n`;

  const reportPath = path.join(reportsDir, "wiki-status.md");
  writeFileSync(reportPath, report);
  console.log(report);
  console.log(`\nStatus report written to ${path.relative(appRoot, reportPath)}`);

  if (missingDirs.length || missingFiles.length) process.exitCode = 1;
}

function ingestLatest() {
  ensureDir(path.join(wikiRoot, "raw", "scans"));
  ensureDir(path.join(wikiRoot, "raw", "community"));
  ensureDir(reportsDir);

  const scanDir = path.join(workspaceRoot, "memory", "scans");
  const latestScan = findLatestFile(scanDir, (name) => /\d{4}-\d{2}-\d{2}.*\.md$/.test(name));
  const latestWeather = findLatestFile(path.join(appRoot, "data", "community-weather"), (name) => name.endsWith(".json") && name !== "city-cache.json");

  const copied: string[] = [];

  if (latestScan) {
    const dest = path.join(wikiRoot, "raw", "scans", path.basename(latestScan));
    copyFileSync(latestScan, dest);
    copied.push(path.relative(wikiRoot, dest));
  }

  if (latestWeather) {
    const dest = path.join(wikiRoot, "raw", "community", `community-weather-${path.basename(latestWeather)}`);
    copyFileSync(latestWeather, dest);
    copied.push(path.relative(wikiRoot, dest));
  }

  const sourceRegisterPath = path.join(wikiRoot, "raw", "source-register.md");
  const existingRegister = existsSync(sourceRegisterPath) ? readFileSync(sourceRegisterPath, "utf8") : "# Source Register\n";
  const entry = `## [${new Date().toISOString().slice(0, 10)}] ingest-latest\n\n${copied.length ? copied.map((item) => `- ${item}`).join("\n") : "- No eligible latest scan/weather files found."}\n`;
  writeFileSync(sourceRegisterPath, `${existingRegister.trimEnd()}\n\n${entry}`);

  appendLog(`## [${new Date().toISOString().slice(0, 10)}] ingest | latest safe source packets\n\n${copied.length ? copied.map((item) => `- Copied \`${item}\`.`).join("\n") : "- No eligible latest scan/weather files found."}\n- Next step: update relevant synthesis pages if these sources contain notable learnings.`);

  const reportPath = path.join(reportsDir, "latest-ingest.md");
  writeFileSync(reportPath, `# Latest Albis Intelligence Ingest\n\nGenerated: ${new Date().toISOString()}\n\n${copied.length ? copied.map((item) => `- ${item}`).join("\n") : "No eligible files found."}\n`);
  console.log(copied.length ? `Copied ${copied.length} source packet(s):\n${copied.map((item) => `- ${item}`).join("\n")}` : "No eligible latest source packets found.");
  console.log(`Report written to ${path.relative(appRoot, reportPath)}`);
}


function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstHeading(markdown: string): string {
  const line = markdown.split("\n").find((item) => item.startsWith("# "));
  return line ? line.replace(/^#\s+/, "").trim() : "Untitled";
}

function firstParagraph(markdown: string): string {
  const lines = markdown.split("\n").map((line) => line.trim());
  for (const line of lines) {
    if (!line || line.startsWith("#") || line.startsWith("-") || line.startsWith("`") || line.includes(": ")) continue;
    return line;
  }
  return "No summary yet.";
}

function view() {
  ensureDir(reportsDir);
  const pages = listMarkdownFiles(path.join(wikiRoot, "wiki"))
    .map((file) => {
      const body = readFileSync(file, "utf8");
      return {
        file,
        rel: path.relative(wikiRoot, file),
        title: firstHeading(body),
        summary: firstParagraph(body),
        mtime: statSync(file).mtime,
      };
    })
    .sort((a, b) => a.rel.localeCompare(b.rel));

  const logPath = path.join(wikiRoot, "log.md");
  const log = existsSync(logPath) ? readFileSync(logPath, "utf8") : "";
  const recentLog = log.split("\n").filter((line) => line.startsWith("## ")).slice(-8).reverse();

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Albis Intelligence — Local Viewer</title>
  <style>
    :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #f7f5f1; color: #171717; }
    main { max-width: 980px; margin: 0 auto; padding: 48px 24px; }
    .eyebrow { color: #b45309; font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
    h1 { font-size: clamp(34px, 5vw, 56px); line-height: .95; margin: 12px 0 16px; letter-spacing: -.04em; }
    p { color: #57534e; line-height: 1.6; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-top: 28px; }
    .card { background: rgba(255,255,255,.78); border: 1px solid rgba(120,113,108,.22); border-radius: 18px; padding: 18px; box-shadow: 0 10px 30px rgba(0,0,0,.04); }
    .card h2 { margin: 0 0 8px; font-size: 18px; }
    .path { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #78716c; word-break: break-all; }
    ul { padding-left: 18px; color: #57534e; }
    .meta { display:flex; gap: 12px; flex-wrap:wrap; margin-top:20px; color:#78716c; font-size:13px; }
    @media (prefers-color-scheme: dark) { body { background:#0c0a09; color:#fafaf9; } p, ul { color:#a8a29e; } .card { background:rgba(28,25,23,.72); border-color:rgba(168,162,158,.18); } .path,.meta { color:#a8a29e; } }
  </style>
</head>
<body>
<main>
  <div class="eyebrow">Private local viewer</div>
  <h1>Albis Intelligence</h1>
  <p>This is a local-only viewer generated from <code>albis-intelligence/</code>. It is not the public website and should not be deployed as raw internal content.</p>
  <div class="meta">
    <span>Generated: ${escapeHtml(new Date().toISOString())}</span>
    <span>Wiki pages: ${pages.length}</span>
    <span>Root: ${escapeHtml(wikiRoot)}</span>
  </div>

  <section class="card" style="margin-top:28px">
    <h2>Recent log entries</h2>
    <ul>${recentLog.length ? recentLog.map((line) => `<li>${escapeHtml(line.replace(/^## /, ""))}</li>`).join("") : "<li>No log entries yet.</li>"}</ul>
  </section>

  <div class="grid">
    ${pages.map((page) => `<article class="card"><div class="path">${escapeHtml(page.rel)}</div><h2>${escapeHtml(page.title)}</h2><p>${escapeHtml(page.summary)}</p><div class="path">Updated ${escapeHtml(page.mtime.toISOString())}</div></article>`).join("\n    ")}
  </div>
</main>
</body>
</html>`;

  const out = path.join(reportsDir, "index.html");
  writeFileSync(out, html);
  console.log(`Local viewer written to ${out}`);
}

function main() {
  const arg = process.argv[2] ?? "status";
  for (const dir of requiredDirs) ensureDir(path.join(wikiRoot, dir));

  if (arg === "status") return status();
  if (arg === "ingest-latest") return ingestLatest();
  if (arg === "view") return view();

  console.error(`Unknown command: ${arg}`);
  console.error("Usage: tsx scripts/run-albis-intelligence-wiki.ts [status|ingest-latest|view]");
  process.exit(1);
}

main();
