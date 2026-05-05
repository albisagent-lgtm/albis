import fs from 'fs';
import { generateCompanyBriefingHtmlV2, generateBriefingSubjectV2 } from '../src/lib/email-templates/company-briefing-v2';
const input = JSON.parse(fs.readFileSync('reports/v1-launch-system-test/lindell-media-2026-05-05.json','utf8'));
const content = input.briefing_content;
const html = generateCompanyBriefingHtmlV2(content, 'Lindell Media', '2026-05-05');
fs.writeFileSync('reports/v1-launch-system-test/lindell-media-2026-05-05-v1-polished.html', html);
console.log(JSON.stringify({subject: generateBriefingSubjectV2('Lindell Media','2026-05-05'), html_path:'reports/v1-launch-system-test/lindell-media-2026-05-05-v1-polished.html'}, null, 2));
