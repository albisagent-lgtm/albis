const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wguydvzpxwsgrhvojpnk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndXlkdnpweHdzZ3Jodm9qcG5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzg1MiwiZXhwIjoyMDg3MDk5ODUyfQ.KuAP49LLd77I3dfM6PIwQ8u0qErrURYMvbq-Snw3gDU'
);

const article = {
  title: "When Wars Move Online: Information Becomes the Weapon",
  excerpt: "Iran's internet has been dark for seven days. Ninety million people cut off. Meanwhile, the White House posts propaganda videos mixing real strikes with Call of Duty footage. Information warfare in 2026 looks nothing like you'd expect.",
  content: `Information warfare isn't coming—it's already here. Nations now fight battles in digital spaces just as aggressively as they do on physical ground. The past week showed exactly how this works.

Iran's internet has been down for seven days. Ninety million people cut off from the world. At the same time, the White House released propaganda videos mixing real missile strikes with Call of Duty footage. Both are textbook examples of information warfare in 2026.

## The Iran Blackout

NetBlocks, an internet monitoring organization, reported that Iran's connectivity dropped to approximately 1% of normal levels. The shutdown started roughly four hours after the first US-Israel strikes hit Iranian targets on March 2nd.

"A full week has now passed since #Iran fell into digital darkness under a regime-imposed national internet blackout," NetBlocks said. "The measure remains in place at hour 168, leaving the public isolated without vital updates and alerts."

Most of the blackout appears intentional, not damage from strikes. Iran's government controls the kill switch.

Digital censorship experts working with Project Ainita described the motivation simply. "It's about control and it's about even possibly slowing down the demise," they said. When people can't communicate, they can't organize.

Mobile phones still work inside Iran. Everything else connecting to the outside world is gone. Families abroad can't reach relatives. Citizens can't document what's happening. News can't get out.

This isn't Iran's first total shutdown. A similar blackout lasted three weeks in January during anti-government protests. That one helped conceal a crackdown estimated to have killed tens of thousands.

The current blackout creates confusion by design. People don't know where's safe. They can't check on each other. Information becomes scarce exactly when it's most needed.

## The Propaganda Machine

On the other side, the White House launched a different kind of information campaign.

Over several days, official White House accounts posted short videos showing US strikes on Iran. But these weren't standard military announcements. They mixed real combat footage with clips from Braveheart, Gladiator, Iron Man, and Grand Theft Auto.

One video used Call of Duty style heads-up displays. Each destroyed target earned "100 points." Another showed a torpedo sinking an Iranian warship, then cut to Grand Theft Auto's "WASTED" screen.

The videos feature pulsing EDM music, rapid cuts, and video game aesthetics. They're designed for social media. Specifically, for young right-wing men who spend time online.

The strategy seems narrowly targeted. According to an NPR/PBS/Marist poll, only 36% of Americans approve of the Iran strikes. Rather than persuade the broader public, the videos aim at a specific slice of the base.

Comments on the videos were skeptical. Users mocked the "hype edits" and called the war "Operation Epstein Distraction." One former Heritage Foundation staffer wrote: "We want mass deportations, the legislative agenda you campaigned on, and no more wars."

Both tactics—shutting down information and flooding channels with curated content—serve the same function. They control the narrative.

## How Disinformation Campaigns Work

Modern information warfare follows predictable patterns.

It starts with a goal and a target audience. Operators craft narratives mixing partial truths with fabrications. This increases credibility. Pure lies are easier to debunk.

SK Usman, a former Nigerian Army spokesman, described a telltale sign. "Messages that assert that one side has completely destroyed the opponent's capabilities, achieved dramatic victories overnight or inflicted massive damage that is somehow being 'hidden from the world' are often characteristic of propaganda rather than factual reporting."

Campaigns deploy content across multiple platforms simultaneously. Bots and fake accounts artificially boost engagement. The content moves from smaller outlets to larger ones, gaining perceived legitimacy at each step.

The ultimate goal: getting mainstream media to amplify the narrative. Once that happens, it appears newsworthy simply because others are covering it.

Artificial intelligence has accelerated this process dramatically. Tools can now generate thousands of convincing fake articles, create deepfakes, and target specific demographics with tailored messaging. According to Gartner research, by 2028, 50% of enterprises will adopt products specifically to address disinformation security—up from less than 5% in 2024.

## Cyber as Strategic Weapon

Information warfare extends beyond narratives into infrastructure attacks.

Cybersecurity expert Triveni Singh described the shift: "Wars today aren't fought only on borders. Enemy nations can target power grids, banking systems, and communication networks through cyberattacks and cause massive damage without using conventional weapons."

During conflicts, a nation's systems are already stressed. Add simultaneous cyberattacks and the impact multiplies. Electricity grids fail. Banking networks freeze. Military communications break down.

CrowdStrike reported it's already seeing activity from Iranian-aligned threat actors. They're conducting reconnaissance and launching denial-of-service attacks.

These attacks don't need bombs. Malware, viruses, and coordinated traffic floods can cripple critical systems. The damage spreads fast and attribution stays murky.

Many countries now maintain dedicated cyber warfare units. Digital infrastructure has become as strategic as physical territory.

## The Fog Thickens

What makes modern information warfare effective is the combination.

Cut off actual information while flooding channels with curated narratives. Launch cyber attacks while controlling media. Mix truth with fabrication until distinguishing them becomes impossible.

Kathryn Raines, cyber threat intelligence lead at Flashpoint, noted about Iran's blackout: "While the actual cause is still unclear, it's almost certainly a combination of both state-ordered suppression and external cyber disruption."

Even experts can't always separate intentional censorship from infrastructure damage. That ambiguity is partly the point.

The internet blackout adds to what military strategists call the fog of war. Citizens can't communicate. Journalists can't document. Real-time updates disappear. What's actually happening becomes nearly impossible to verify.

Meanwhile, propaganda videos turn missile strikes into entertainment. War becomes content. Violence becomes gamified. The line between reality and performance blurs.

## What This Means

Information warfare works because it targets how people understand events, not just the events themselves.

Traditional warfare destroys physical assets. Information warfare shapes perception. Which story people believe matters as much as what actually happened.

That's why governments invest heavily in both offense and defense. Gartner predicts massive enterprise adoption of disinformation security tools within two years. Companies recognize the threat to reputation and operations.

For ordinary people, the challenge grows harder. When authorities control connectivity and flood channels with curated content, finding reliable information requires active effort.

The mechanisms are clear. Inflammatory language, emotional hooks, unverifiable claims presented as insider knowledge, gradual escalation from fringe outlets to mainstream coverage.

Verification becomes crucial. Can you trace the source? Are multiple independent outlets reporting similar facts? Do the claims match the tone of measured analysis or propaganda?

In an environment where nations weaponize information itself, discernment isn't optional anymore. It's survival.

The past week showed both sides of modern information warfare. Ninety million people in darkness. Propaganda videos gamifying combat. Cyber units launching reconnaissance. Narratives designed to manipulate rather than inform.

This is how wars are fought now. Not just with missiles and troops, but with blackouts and memes. The battlefield includes your screen. The weapon is information itself.`,
  slug: "when-wars-move-online-information-becomes-weapon",
  author: "Jacob Wilson",
  tags: ["information-warfare", "iran", "propaganda", "disinformation", "cyber-warfare"],
  published_at: new Date().toISOString()
};

async function pushArticle() {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(article)
      .select();
    
    if (error) {
      console.error('Error inserting article:', error);
      process.exit(1);
    }
    
    console.log('✅ Article published successfully');
    console.log('Title:', article.title);
    console.log('Slug:', article.slug);
    console.log('Word count:', article.content.split(/\s+/).length);
    console.log('Supabase ID:', data[0].id);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

pushArticle();
