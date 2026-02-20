#!/usr/bin/env npx tsx
/**
 * Upload existing scan data to Supabase
 * Reads all files from memory/scans/ directory and uploads them
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const SCANS_DIR = '/Users/treelight/.openclaw/workspace/memory/scans';

// Load environment variables from .env.local
function loadEnvFromLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local file not found');
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};
  
  envContent.split('\n').forEach(line => {
    if (line.startsWith('#') || !line.trim()) return;
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });

  return env;
}

// Types
interface ScanItem {
  headline: string;
  category: string;
  regions: string[];
  tags: string[];
  patterns: string[];
  significance: "high" | "medium" | "low";
  connection: string;
}

interface PatternOfDay {
  title: string;
  description: string;
}

interface UploadScanData {
  scan_date: string;
  scan_time: string;
  human_summary: string | null;
  mood: string | null;
  top_theme: string | null;
  pattern_of_day: PatternOfDay | null;
  framing_watch: any | null;
  items: ScanItem[];
  raw_markdown: string;
}

// Parse scan file - based on existing scan-parser.ts logic
function extractSection(md: string, label: string): string | null {
  const boldRegex = new RegExp(
    `\\*\\*${label}:?\\*\\*\\s*(.+?)(?=\\n\\*\\*[A-Z]|\\n---|\\n##|\\n\`\`\`|$)`,
    "is"
  );
  const boldMatch = md.match(boldRegex);
  if (boldMatch) return boldMatch[1].trim();

  const plainRegex = new RegExp(
    `^${label}:\\s*(.+?)(?=\\n[A-Z]\\w+:|\\n---|\\n##|\\n\`\`\`|$)`,
    "ims"
  );
  const plainMatch = md.match(plainRegex);
  return plainMatch ? plainMatch[1].trim() : null;
}

function parsePatternOfDay(raw: string | null): PatternOfDay | null {
  if (!raw) return null;

  const italicMatch = raw.match(/^\*([^*]+)\*\s*([\s\S]*)/);
  if (italicMatch) {
    return { title: italicMatch[1].trim(), description: italicMatch[2].trim() };
  }

  const boldMatch = raw.match(/^\*\*([^*]+)\*\*\s*([\s\S]*)/);
  if (boldMatch) {
    return { title: boldMatch[1].trim(), description: boldMatch[2].trim() };
  }

  const sentenceMatch = raw.match(/^(.+?[.!?])\s+([\s\S]*)/);
  if (sentenceMatch) {
    return { title: sentenceMatch[1].trim(), description: sentenceMatch[2].trim() };
  }

  return { title: "", description: raw };
}

function extractJsonItems(md: string): ScanItem[] {
  const items: ScanItem[] = [];
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)```/g;

  let match;
  while ((match = jsonBlockRegex.exec(md)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.headline && item.category) {
            items.push({
              headline: item.headline,
              category: item.category,
              regions: item.regions || [],
              tags: item.tags || [],
              patterns: item.patterns || [],
              significance: item.significance || "medium",
              connection: item.connection || "",
            });
          }
        }
      }
    } catch (e) {
      console.warn(`  Warning: Failed to parse JSON block: ${(e as Error).message}`);
    }
  }

  return items;
}

function detectScanTime(md: string): string {
  // Check for specific time patterns in headers or content
  if (/##\s*AM\s+(Scan|Data)/i.test(md) || /##\s*(Morning)/i.test(md)) return "7am";
  if (/##\s*PM\s+(Scan|Data)/i.test(md) || /##\s*(Evening)/i.test(md)) return "7pm";
  if (/##\s*(?:Midday|Noon|Lunch)/i.test(md)) return "1pm";
  
  // Look for multiple scans in same file
  if (/##\s*AM\s+Data/i.test(md) && /##\s*PM\s+(Scan|Data)/i.test(md)) {
    // File has both AM and PM, we need to split this differently
    // For now, default to PM
    return "7pm";
  }
  
  // Default detection based on AM/PM mentions
  if (/AM/i.test(md) && !/PM/i.test(md)) return "7am";
  
  return "7pm"; // Default to PM
}

function parseScanFile(filePath: string): UploadScanData | null {
  const filename = path.basename(filePath, ".md");
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (!dateMatch) return null;

  const date = dateMatch[1];
  const content = fs.readFileSync(filePath, "utf-8");
  const scanTime = detectScanTime(content);
  
  const patternRaw = extractSection(content, "Pattern") || extractSection(content, "Patterns");

  return {
    scan_date: date,
    scan_time: scanTime,
    human_summary: extractSection(content, "Summary"),
    mood: extractSection(content, "Mood"),
    top_theme: extractSection(content, "Top theme") || extractSection(content, "Top Theme"),
    pattern_of_day: parsePatternOfDay(patternRaw),
    framing_watch: null, // Would need more parsing for complex framing data
    items: extractJsonItems(content),
    raw_markdown: content
  };
}

async function uploadScan(supabase: any, scanData: UploadScanData): Promise<boolean> {
  console.log(`  Uploading ${scanData.scan_date} (${scanData.scan_time}) - ${scanData.items.length} items`);
  
  try {
    // Try to upsert the scan
    const { data, error } = await supabase
      .from('scans')
      .upsert([scanData], { 
        onConflict: 'scan_date,scan_time',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error(`  Error uploading ${scanData.scan_date}:`, error.message);
      
      // If table doesn't exist, we need to create it first
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('  Table does not exist. Please create it first using the Supabase dashboard or SQL editor.');
        console.log('  Required table schema:');
        console.log(`
CREATE TABLE public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_date date NOT NULL,
  scan_time text NOT NULL,
  human_summary text,
  mood text,
  top_theme text,
  pattern_of_day jsonb,
  framing_watch jsonb,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_markdown text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scans_date_time_unique UNIQUE (scan_date, scan_time)
);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scans_public_read" ON public.scans FOR SELECT USING (true);
        `);
        return false;
      }
      
      return false;
    }

    console.log(`  ✓ Successfully uploaded ${scanData.scan_date}`);
    return true;
  } catch (e) {
    console.error(`  Unexpected error uploading ${scanData.scan_date}:`, (e as Error).message);
    return false;
  }
}

async function main(): Promise<void> {
  console.log('Loading environment variables...');
  const env = loadEnvFromLocal();
  
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required Supabase environment variables');
    console.error('Expected: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );

  console.log('Scanning for files in:', SCANS_DIR);
  
  if (!fs.existsSync(SCANS_DIR)) {
    console.error('Scans directory does not exist:', SCANS_DIR);
    process.exit(1);
  }

  const allFiles = fs.readdirSync(SCANS_DIR);
  console.log('All files in directory:', allFiles);
  
  const files = allFiles
    .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .sort();

  console.log(`Found ${files.length} matching scan files:`, files);
  console.log();

  let successful = 0;
  let failed = 0;

  // Prioritize today's data
  const today = new Date().toISOString().split('T')[0];
  const todayFile = `${today}.md`;
  
  if (files.includes(todayFile)) {
    console.log(`Processing today's scan first: ${todayFile}`);
    const filePath = path.join(SCANS_DIR, todayFile);
    const scanData = parseScanFile(filePath);
    
    if (scanData) {
      const success = await uploadScan(supabase, scanData);
      if (success) successful++;
      else failed++;
    }
  }

  // Process remaining files (limit to most recent to avoid overwhelming)
  const recentFiles = files.slice(-10); // Last 10 files
  
  for (const file of recentFiles) {
    if (file === todayFile) continue; // Already processed
    
    const filePath = path.join(SCANS_DIR, file);
    const scanData = parseScanFile(filePath);
    
    if (!scanData) {
      console.log(`  Skipping ${file} (could not parse)`);
      continue;
    }

    const success = await uploadScan(supabase, scanData);
    if (success) successful++;
    else failed++;
  }

  console.log(`\\nComplete: ${successful} successful, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\\nSome uploads failed. Check the logs above for details.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}