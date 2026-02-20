import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Types matching our table schema
interface IngestScanItem {
  headline: string;
  category: string;
  regions: string[];
  tags: string[];
  patterns: string[];
  significance: "high" | "medium" | "low";
  connection: string;
}

interface IngestScanData {
  scan_date: string; // YYYY-MM-DD format
  scan_time: string; // '7am', '1pm', '7pm', 'am', 'pm'
  human_summary?: string;
  mood?: string;
  top_theme?: string;
  pattern_of_day?: { title: string; description: string };
  framing_watch?: any; // flexible structure
  items: IngestScanItem[];
  raw_markdown: string;
}

function validateScanData(data: any): data is IngestScanData {
  if (!data || typeof data !== 'object') return false;
  
  // Required fields
  if (!data.scan_date || typeof data.scan_date !== 'string') return false;
  if (!data.scan_time || typeof data.scan_time !== 'string') return false;
  if (!Array.isArray(data.items)) return false;
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.scan_date)) return false;
  
  // Validate scan_time
  const validTimes = ['7am', '1pm', '7pm', 'am', 'pm'];
  if (!validTimes.includes(data.scan_time)) return false;
  
  // Validate items structure
  for (const item of data.items) {
    if (!item.headline || !item.category) return false;
    if (!Array.isArray(item.regions) || !Array.isArray(item.tags) || !Array.isArray(item.patterns)) return false;
  }
  
  return true;
}

function generateIngestKey(): string {
  // Generate a random key for scan ingestion API protection
  // In production, this should be set as an environment variable
  return process.env.SCAN_INGEST_KEY || 'albis-scan-ingest-2026';
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const expectedKey = generateIngestKey();
    
    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate the scan data
    if (!validateScanData(body)) {
      return NextResponse.json({ 
        error: 'Invalid scan data format',
        details: 'Expected fields: scan_date (YYYY-MM-DD), scan_time (7am/1pm/7pm), items (array), raw_markdown'
      }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // Upsert the scan data
    const { data, error } = await supabase
      .from('scans')
      .upsert([body], { 
        onConflict: 'scan_date,scan_time',
        ignoreDuplicates: false 
      })
      .select('id, scan_date, scan_time');
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Scan data ingested for ${body.scan_date} (${body.scan_time})`,
      data: data?.[0] || null
    });
    
  } catch (error) {
    console.error('Ingest API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle GET requests with API info
export async function GET() {
  return NextResponse.json({ 
    message: 'Albis Scan Ingest API',
    usage: 'POST with Bearer token authentication',
    required_fields: ['scan_date', 'scan_time', 'items', 'raw_markdown'],
    supported_times: ['7am', '1pm', '7pm', 'am', 'pm']
  });
}