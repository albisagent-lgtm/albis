#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// CLI wrapper around runCompanyScan — Package 6.
//
// Auto-detects the run_window from current UTC hour:
//   05/06/11 → '07-00', 12/17 → '13-00', 18/23 → '19-00'
// Override via --window=<07-00|13-00|19-00>.
// Override the run_date via --date=YYYY-MM-DD (default: today UTC).
// ---------------------------------------------------------------------------
import path from "path";
import dotenv from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";
import { runCompanyScan } from "../src/lib/company-scan/scan-engine";
import type { ScanRunWindow } from "../src/lib/company-scan/types";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function pickWindow(argv: string[]): ScanRunWindow {
  const explicit = argv.find((a) => a.startsWith("--window="))?.split("=")[1];
  if (explicit === "07-00" || explicit === "13-00" || explicit === "19-00") {
    return explicit;
  }
  const hour = new Date().getUTCHours();
  if (hour === 5 || hour === 6 || hour === 11) return "07-00";
  if (hour === 12 || hour === 17) return "13-00";
  if (hour === 18 || hour === 23) return "19-00";
  throw new Error(
    `No window matches current UTC hour ${hour}. Pass --window=07-00|13-00|19-00.`,
  );
}

function pickDate(argv: string[]): string {
  const explicit = argv.find((a) => a.startsWith("--date="))?.split("=")[1];
  if (explicit && /^\d{4}-\d{2}-\d{2}$/.test(explicit)) return explicit;
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const supabase = createAdminClient();
  const window = pickWindow(process.argv.slice(2));
  const date = pickDate(process.argv.slice(2));
  console.log(`▶ Running company scan: ${date} window=${window}`);
  const summary = await runCompanyScan(supabase, date, window);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(`❌ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
