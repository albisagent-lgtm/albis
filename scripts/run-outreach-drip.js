#!/usr/bin/env node
/*
 * Company Daily Scan outreach scheduler/drip.
 * - Weekdays only.
 * - Heavier Tue/Wed/Thu, lighter Mon/Fri.
 * - Region windows are checked in UTC so DST/local machine timezone matters less.
 * - Requires qc_status=send_now, email present, not already sent/failed/do_not_send.
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Resend } = require('resend');

const REPO_ROOT = path.resolve(__dirname, '..');
const WORKSPACE = '/Users/treelight/.openclaw/workspace';
const CSV_PATH = process.env.OUTREACH_CSV_PATH || `${WORKSPACE}/memory/outreach/company-daily-scan-first-50-ready-2026-05-08.csv`;
const LOG_DIR = `${WORKSPACE}/memory/outreach`;
const LOCK_PATH = `${LOG_DIR}/company-outreach-drip.lock`;
const FROM = 'Harry <harry@albis.news>';
const SITE = 'https://www.albis.news/company-daily-scan';
const BATCH_SIZE = Number(process.env.OUTREACH_BATCH_SIZE || 5);
const INTERVAL_MS = Number(process.env.OUTREACH_INTERVAL_MS || 5 * 60 * 1000);
const SEND_ENABLED = process.env.ALBIS_OUTREACH_SEND_ENABLED !== '0';

const REGION = process.env.OUTREACH_REGION || inferRegionFromUtc();
const LOG_PATH = `${LOG_DIR}/company-outreach-${REGION || 'none'}-${new Date().toISOString().replace(/[:.]/g, '')}.log`;

function log(line) {
  const msg = `[${new Date().toISOString()}] ${line}`;
  console.log(msg);
  fs.appendFileSync(LOG_PATH, msg + '\n');
}
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
function parseCsv(text) {
  const rows=[]; let row=[], field='', q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(q){ if(c==='"'&&n==='"'){field+='"';i++;} else if(c==='"')q=false; else field+=c; }
    else { if(c==='"')q=true; else if(c===','){row.push(field);field='';} else if(c==='\n'){row.push(field);rows.push(row);row=[];field='';} else if(c!=='\r')field+=c; }
  }
  if(field.length||row.length){row.push(field);rows.push(row);}
  const headers=rows.shift() || [];
  return { headers, data: rows.filter(r=>r.length&&r.some(Boolean)).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||'']))) };
}
function csvEscape(v){ v=String(v??''); return /[",\n\r]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; }
function writeCsv(headers,data){ fs.writeFileSync(CSV_PATH, headers.join(',')+'\n'+data.map(r=>headers.map(h=>csvEscape(r[h])).join(',')).join('\n')+'\n'); }
function utcWeekday(){ return new Date().getUTCDay(); } // Sun=0
function isWeekday(){ const d=utcWeekday(); return d>=1 && d<=5; }
function weekdayName(){ return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][utcWeekday()]; }
function dayMaxBatches(){
  const d=utcWeekday();
  if (d>=2 && d<=4) return Number(process.env.OUTREACH_HEAVY_MAX_BATCHES || 18); // 90 emails per region/day
  if (d===1 || d===5) return Number(process.env.OUTREACH_LIGHT_MAX_BATCHES || 6); // 30 emails per region/day
  return 0;
}
function inferRegionFromUtc(){
  const h = new Date().getUTCHours();
  if (h === Number(process.env.OUTREACH_UK_UTC_HOUR || 8)) return 'UK_EU';
  if (h === Number(process.env.OUTREACH_US_UTC_HOUR || 13)) return 'US';
  return '';
}
function isUs(r){ const c=clean(r.country).toLowerCase(), reg=clean(r.region).toLowerCase(); return c.includes('united states')||c==='us'||c==='usa'||['u.s','united states','america','texas','florida','georgia','new york','new jersey','massachusetts','chicago','midwest','miami','houston','california','washington dc','baltimore'].some(x=>reg.includes(x)); }
function isUkEu(r){ const c=clean(r.country).toLowerCase(), reg=clean(r.region).toLowerCase(); return ['uk','united kingdom','england','scotland','wales','ireland','europe','germany','france','netherlands','spain','italy','belgium','sweden','denmark','norway','finland','poland','portugal','austria','switzerland'].some(x=>c.includes(x)) || ['uk','united kingdom','england','scotland','wales','europe'].some(x=>reg.includes(x)); }
function isRegion(r){ return REGION === 'US' ? isUs(r) : REGION === 'UK_EU' ? isUkEu(r) : false; }
function isGenericEmail(email){ return /^(info|hello|office|sales|contact|enquiries|customs|imports|quoteimp|ord|altord|uk|urgent|connect)@/i.test(email||''); }
function firstName(name){ name=clean(name); if(!name||/team|leadership|company/i.test(name))return ''; return name.split(/\s+/)[0].replace(/[^A-Za-z'-]/g,''); }
function companyShort(company){ return clean(company).replace(/\b(Ltd|Limited|LLC|Inc\.?|Corp\.?|Corporation|Company|Co\.?|Services|Solutions|International)\b/gi,'').replace(/\s+/g,' ').trim() || clean(company); }
function naturalFirstLine(r){ let line=clean(r.personalized_first_line).replace(/^Saw\s+/i,'').replace(/^I noticed\s+/i,'').replace(/^I came across\s+/i,''); const company=clean(r.company); if(!line)return `I came across ${company} and thought this might be relevant.`; const out=line.toLowerCase().startsWith(company.toLowerCase().slice(0,Math.min(10,company.length))) ? `I came across ${line}` : `I came across ${company} and noticed ${line}`; return /[.!?]$/.test(out)?out:out+'.'; }
function benefitLine(r){ const sector=`${r.sector||''} ${r.subsector||''} ${r.pitch_angle||''}`.toLowerCase(); if(/reputation|public affairs|communications|media|strategic|pr\b/.test(sector)) return 'Given your work in communications and reputation, I thought it might be useful as a daily early-warning scan for policy shifts, narrative changes, regional risks, media attention, and client-relevant news.'; if(/customs|freight|logistics|shipping|broker|import|export|supply|forwarding|trade/.test(sector)) return 'Given your work around trade and logistics, I thought it might be useful as a daily early-warning scan for tariff changes, customs updates, port disruption, route risk, regulation, and client-relevant news.'; return 'Given your work, I thought it might be useful as a daily early-warning scan for the external signals, risks, regions, and opportunities that matter to your team.'; }
function subjectFor(r){ return `A quick Albis idea for ${companyShort(r.company)}`; }
function bodyFor(r){ const fn=firstName(r.recipient_name||r.decision_maker_name); const greeting=(!isGenericEmail(r.email)&&fn)?`Dear ${fn},`:`Dear ${companyShort(r.company)} team,`; return `${greeting}\n\n${naturalFirstLine(r)}\n\nI’m Harry, founder of Albis. We scan global news across regions and turn it into a short daily briefing.\n\nWe’ve just launched our Company Daily Scan — a tailored scan for companies, teams, researchers, projects, or anyone who needs to track something specific in the world.\n\nYou can use it to scan for whatever matters to you: policy, tariffs, regulation, competitors, supply chains, reputation, regions, risks, opportunities, or client-relevant news.\n\n${benefitLine(r)}\n\nYou can see it here:\n${SITE}\n\nNo pressure at all — just thought it might be relevant. If it’s not useful, I won’t follow up.\n\nKind regards,\nHarry Wenham\nFounder, Albis`; }
function activeOtherOutreachProcess(){
  try {
    const out = execSync("ps -axo pid,command | grep -E 'tmp-send-.*outreach.js|run-outreach-drip.js' | grep -v grep", { encoding:'utf8' });
    return out.split('\n').filter(Boolean).filter(line => !line.includes(String(process.pid))).join('\n');
  } catch { return ''; }
}
function acquireLock(){
  if (fs.existsSync(LOCK_PATH)) {
    const ageMs = Date.now() - fs.statSync(LOCK_PATH).mtimeMs;
    if (ageMs < 4 * 60 * 60 * 1000) throw new Error(`Lock exists: ${LOCK_PATH}`);
    fs.unlinkSync(LOCK_PATH);
  }
  fs.writeFileSync(LOCK_PATH, `${process.pid}\n${new Date().toISOString()}\n${REGION}\n`);
}
function releaseLock(){ try { if (fs.existsSync(LOCK_PATH)) fs.unlinkSync(LOCK_PATH); } catch {} }
async function sendBatch(batchNo){
  const parsed=parseCsv(fs.readFileSync(CSV_PATH,'utf8'));
  const headers=parsed.headers;
  const rows=parsed.data;
  for(const h of ['outreach_status','sent_at_utc','resend_id','send_error']) if(!headers.includes(h)) headers.push(h);
  const eligible=rows.filter(r=>isRegion(r)&&clean(r.email)&&r.outreach_status!=='sent'&&r.outreach_status!=='failed'&&r.outreach_status!=='do_not_send'&&r.qc_status==='send_now').slice(0,BATCH_SIZE);
  if(!eligible.length){ log(`No eligible ${REGION} rows left; stopping at batch ${batchNo}.`); return false; }
  const resend=new Resend(process.env.RESEND_API_KEY);
  log(`Starting batch ${batchNo}: ${eligible.map(r=>`${r.company}<${r.email}>`).join(' | ')}`);
  for(const r of eligible){
    try{
      if (!SEND_ENABLED) throw new Error('ALBIS_OUTREACH_SEND_ENABLED=0');
      const {data,error}=await resend.emails.send({from:FROM,to:clean(r.email),subject:subjectFor(r),text:bodyFor(r)});
      if(error)throw new Error(error.message||JSON.stringify(error));
      r.outreach_status='sent'; r.sent_at_utc=new Date().toISOString(); r.resend_id=data&&data.id||''; r.send_error='';
      log(`SENT ${r.company} ${r.email} ${r.resend_id}`);
    }catch(e){ r.outreach_status='failed'; r.send_error=e.message||String(e); log(`FAILED ${r.company} ${r.email} ${r.send_error}`); }
    await sleep(1000);
  }
  writeCsv(headers,rows);
  return true;
}
(async()=>{
  fs.mkdirSync(LOG_DIR,{recursive:true});
  if(!REGION){ log('No region for current UTC hour; no-op.'); return; }
  if(!isWeekday()){ log(`Weekend UTC day ${weekdayName()}; no outreach send.`); return; }
  const maxBatches=dayMaxBatches();
  if(maxBatches<=0){ log(`No batches allowed for UTC day ${weekdayName()}; no-op.`); return; }
  if(!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');
  const active=activeOtherOutreachProcess();
  if(active){ log(`Another outreach process is active; no-op.\n${active}`); return; }
  acquireLock();
  try{
    log(`Outreach drip starting region=${REGION} day=${weekdayName()} batches=${maxBatches} batch_size=${BATCH_SIZE}`);
    for(let batch=1; batch<=maxBatches; batch++){
      const more=await sendBatch(batch);
      if(!more)break;
      if(batch<maxBatches) await sleep(INTERVAL_MS);
    }
    log('Outreach drip complete.');
  } finally { releaseLock(); }
})().catch(err=>{ log(`FATAL ${err.stack||err.message||String(err)}`); releaseLock(); process.exit(1); });
