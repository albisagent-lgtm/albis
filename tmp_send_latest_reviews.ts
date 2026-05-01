import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateCompanyBriefingHtmlV2, generateBriefingSubjectV2 } from './src/lib/email-templates/company-briefing-v2';

dotenv.config({ path: '/Users/treelight/.openclaw/workspace/.env.credentials', override: false });
dotenv.config({ path: '/Users/treelight/.openclaw/workspace/albis-app/.env.local', override: false });

const ids = [
  '44a73e7d-e3b0-4f94-a8f4-796c91db71f3',
  '8870a3ef-94ef-45dc-a731-2a78b3220a6c',
  '29318f69-046a-4895-8d5e-d2734963cc69',
];
const to = 'hazzagazza6743@gmail.com';

function esc(s: any) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: rows, error } = await supabase
    .from('company_briefings')
    .select('id,company_profile_id,briefing_date,status,delivery_status,delivered_at,briefing_content')
    .in('id', ids);
  if (error) throw error;
  if (!rows || rows.length !== ids.length) throw new Error(`Expected ${ids.length} rows, found ${rows?.length || 0}`);

  const pids = [...new Set(rows.map((r: any) => r.company_profile_id))];
  const { data: profiles, error: pErr } = await supabase
    .from('company_profiles')
    .select('id,company_name,email_enabled,email_recipients')
    .in('id', pids);
  if (pErr) throw pErr;
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
  const ordered = ids.map((id) => rows.find((r: any) => r.id === id)!);

  const cards = ordered.map((row: any) => {
    const profile: any = profileMap.get(row.company_profile_id);
    const company = profile?.company_name || 'Unknown company';
    const subject = generateBriefingSubjectV2(company, row.briefing_date, row.briefing_content?.today_brief?.top_line?.text);
    const pgi = row.briefing_content?.understanding?.company_pgi_v2?.customer_read;
    const rendered = generateCompanyBriefingHtmlV2(row.briefing_content, company, row.briefing_date);
    return `
      <section style="margin:28px 0 40px;border:1px solid #d9d9d9;border-radius:14px;overflow:hidden;background:#ffffff;">
        <div style="padding:18px 20px;background:#f7f4ee;border-bottom:1px solid #e5e0d6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="font-size:18px;font-weight:750;color:#1a1a2e;margin-bottom:6px;">${esc(company)}</div>
          <div style="font-size:13px;color:#555;line-height:1.5;">
            <strong>Customer subject:</strong> ${esc(subject)}<br>
            <strong>Status:</strong> ${esc(row.status)} / ${esc(row.delivery_status)}${row.delivered_at ? ` / delivered ${esc(row.delivered_at)}` : ' / not delivered'}<br>
            <strong>QA blockers:</strong> ${esc(row.briefing_content?.qa_report?.blocking_failures?.length ?? 0)}<br>
            <strong>Structured PGI:</strong> ${pgi ? 'present' : 'missing'}
          </div>
        </div>
        <div style="padding:0;background:#fff;">${rendered}</div>
      </section>`;
  }).join('\n');

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#fbfaf7;color:#1f2937;">
    <div style="max-width:760px;margin:0 auto;padding:28px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="background:#ffffff;border:1px solid #e7e2d8;border-radius:16px;padding:24px 24px 18px;margin-bottom:24px;">
        <div style="font-size:13px;letter-spacing:1.8px;text-transform:uppercase;color:#c8922a;font-weight:800;margin-bottom:10px;">Albis review pack</div>
        <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;color:#1a1a2e;">Regenerated company scans — structured PGI review</h1>
        <p style="font-size:16px;line-height:1.6;margin:0 0 12px;">These are the latest review versions after the PGI presentation rebuild. Customer delivery is still off.</p>
        <p style="font-size:16px;line-height:1.6;margin:0;">Please review the Perception Gap sections in particular — they should now appear as labelled blocks rather than one large paragraph.</p>
      </div>
      ${cards}
    </div>
  </body></html>`;

  const resend = new Resend(process.env.RESEND_API_KEY!);
  const result = await resend.emails.send({
    from: 'Albis <harry@albis.news>',
    to,
    subject: 'Review pack: regenerated company scans with structured PGI',
    html,
  });
  if (result.error) throw new Error(result.error.message || JSON.stringify(result.error));
  console.log(JSON.stringify({ ok: true, to, id: result.data?.id, rows: ordered.length }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
