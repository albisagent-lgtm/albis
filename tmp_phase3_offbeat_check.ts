import { rankPublicStories } from './src/lib/public-story-selection';
import { buildStoryPacket, buildArticleBody } from './tmp_phase3_module';

const items = [
  { headline:'Rhinos return to Kidepo National Park after four decades', category:'natural-world', regions:['Africa'], tags:['wildlife','conservation','rhino'], patterns:['consensus'], significance:'medium', connection:'The return shows long-horizon conservation work can restore keystone species and reshape tourism and land-use choices.', perception_gap:3, coverage_breadth:4 },
  { headline:'Smart glasses can read mental health through pupil changes', category:'science-space', regions:['Europe','US'], tags:['glasses','mental-health','sensor'], patterns:['divergence'], significance:'medium', connection:'The device turns a subtle biometric signal into a possible screening tool, raising privacy and clinical-standards questions.', perception_gap:5, coverage_breadth:5 },
  { headline:'Thailand brings leopard sharks back to restored reefs', category:'natural-world', regions:['East & SE Asia'], tags:['reef','wildlife','ocean'], patterns:['consensus'], significance:'medium', connection:'The project links reef recovery to fisheries, tourism and coastal resilience rather than biodiversity alone.', perception_gap:2, coverage_breadth:4 },
];
const ranked = rankPublicStories(items as any);
for (const sel of ranked) {
  const packet = buildStoryPacket(sel.item as any, sel as any);
  const built = buildArticleBody(packet as any);
  console.log('\nTITLE:', packet.title);
  console.log('FORM:', sel.articleForm);
  console.log('OPENING:', built.lede);
}
