const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wguydvzpxwsgrhvojpnk.supabase.co',
  'REDACTED_SUPABASE_SERVICE_ROLE_KEY'
);

const article = {
  title: "Your Social Media Feed Is Now a War Zone",
  content: `Social media platforms aren't just hosting conversations about the Iran war. They're battlefields where state actors fight for narrative control.

Multiple governments are now actively spreading propaganda through the same platforms you use to check your friends' updates. The goal isn't subtle persuasion. It's flooding the information space until truth becomes impossible to identify.

## The Mechanics of Digital Battlespace

The Atlantic Council's Digital Forensic Research Lab put it bluntly: "Social media platforms are now frontlines in war."

What does that look like in practice?

State actors create fake videos showing military victories that didn't happen. They spread AI-generated images designed to trigger emotional responses. They amplify certain narratives while suppressing others through coordinated account networks.

The Iran conflict has exposed this machinery at scale. Researchers tracking visual misinformation report that state-linked propaganda campaigns are behind much of the fabricated content. It's not individuals sharing conspiracy theories. It's organized information operations.

## When Governments Become Content Creators

Here's where it gets stranger.

The White House and Pentagon now post what they call "hype videos" on TikTok and X. These mix real Iran war footage with clips from movies and video games.

It's propaganda, but it's presented as entertainment. The format is designed for virality, not accuracy.

Meanwhile, Russian propaganda networks just got caught spreading AI-generated images about Ukrainian security guards in Hungary. Hungarian fact-checkers exposed the campaign, but only after the images circulated widely.

Iran runs its own sophisticated system. The National Information Network can shut down public internet access while keeping government services running. It's an architecture built specifically for information control during conflict.

## The Detection Problem

You'd think deepfakes would be easy to spot by now.

They're not.

Humans correctly identify high-quality deepfake videos only 24.5 percent of the time. That's barely above random guessing.

Professional detection systems struggle too. The technology creating fake content is advancing faster than the technology detecting it.

Indian Express noted that effective detection now requires "specialized forensic tools, machine-learning classifiers, high-quality reference data, and often platform-side signals that ordinary users and most researchers cannot see."

Translation: if you're scrolling social media, you probably can't tell what's real.

## Why This Matters Beyond War

The infrastructure being built during wartime doesn't disappear when fighting stops.

State actors are learning which techniques work. They're refining their methods for manipulating platform algorithms. They're discovering how to trigger emotional responses at scale.

These capabilities will be applied to other contexts. Elections. Policy debates. Social movements. Any situation where controlling the narrative provides strategic advantage.

The Atlantic Council's Emerson Brooking warns users directly: "If you're in these spaces, just understand that this is an extension of the physical battle space. There are actors on all sides of the conflict that are actively trying to spread propaganda and disinformation to convince you that certain things are true that aren't."

## The Platforms' Position

Social media companies are stuck in a difficult spot.

They host billions of users across dozens of countries with conflicting interests. What's propaganda in one place is legitimate political speech in another. What's misinformation to some is truth to others.

Platforms have tried various approaches. Content moderation teams. Fact-checking partnerships. AI detection tools. None of them scale effectively against coordinated state operations.

The FBI is now investigating "suspicious cyber activity" on a system holding sensitive surveillance information. This suggests information warfare is expanding beyond social platforms into critical infrastructure.

## What You're Actually Seeing

When you open a social media app during a major conflict, you're not getting a neutral view of events.

You're seeing what multiple governments want you to see. What platform algorithms decided you'd engage with. What propaganda networks successfully amplified. What detection systems failed to catch.

Some of it's real. Some of it's fabricated. Some of it mixes both.

The platforms themselves often can't tell the difference fast enough to matter. By the time fact-checkers verify something, it's already been seen millions of times.

## The Information Asymmetry

State actors have resources individual users don't.

They can coordinate thousands of accounts. They can access advanced AI tools before they're publicly available. They can study platform algorithms to maximize reach. They can operate across time zones and languages simultaneously.

They're playing a different game with different rules.

NewsGuard's recent coverage noted that Iran appears to be winning the disinformation battle around the current conflict. Not because their claims are true, but because their information operations are more effective.

## Where This Leads

The next phase probably won't involve better detection.

It'll involve information environments where verification becomes functionally impossible. Where the volume of synthetic content exceeds human capacity to evaluate it. Where trust in any digital source collapses entirely.

We're already seeing early signs. People increasingly assume everything they see might be fake. That creates its own problems, because it makes genuine evidence easier to dismiss.

The information warfare playbook is being written in real-time. Every technique that works gets copied and refined. Every platform vulnerability gets exploited.

Your feed isn't just showing you the world. It's showing you someone's version of the world, designed to make you think, feel, or act a certain way.

The question isn't whether you're seeing propaganda. It's whose propaganda you're seeing, and whether you notice.`,
  slug: "social-media-war-zone-propaganda",
  author: "Jacob Wilson",
  category: "information-warfare",
  tags: ["information-warfare", "propaganda", "social-media", "deepfakes", "iran-conflict", "disinformation"],
  published_at: new Date().toISOString(),
  status: "published",
  confidence: "confirmed",
  sources: [
    {
      name: "Associated Press",
      url: "https://apnews.com/article/iran-war-images-misinformation-russia-israel-9e495017dc5c4bf24a0b6152863dbfb1",
      region: "North America",
      quote: "Social media platforms are now frontlines in war, and users should be aware of their potential to be used by state actors"
    },
    {
      name: "ABC News",
      url: "https://abcnews.com/Politics/white-house-posts-called-hype-videos-combining-real/story?id=130825574",
      region: "North America",
      quote: "White House and Pentagon accounts have leaned into the 'hype video' strategy on platforms like X and TikTok"
    },
    {
      name: "Medium (Activated Thinker)",
      url: "https://medium.com/activated-thinker/deepfakes-are-now-impossible-to-detect-26544d1c0a7d",
      region: "International",
      quote: "Human beings correctly identify high quality deepfake videos only about 24.5 percent of the time"
    },
    {
      name: "Ukrainska Pravda",
      url: "https://www.pravda.com.ua/eng/news/2026/03/07/8024377/",
      region: "Europe",
      quote: "Hungarian factcheckers have exposed a campaign using fake AI-generated images about the Ukrainian cash-in-transit guards"
    },
    {
      name: "Bizzbuzz News",
      url: "https://www.bizzbuzz.news/international/irans-wartime-internet-blackout-is-putting-civilians-at-risk-1386824",
      region: "International",
      quote: "The Iranian regime has developed an advanced architecture for internet shutdowns centred on a system known as the National Information Network"
    }
  ],
  faqs: [
    {
      q: "How can I tell if a video about the Iran war is real?",
      a: "You probably can't. Humans identify high-quality deepfakes correctly only 24.5% of the time—barely above guessing. Professional detection requires specialized tools most people don't have access to. Your best bet is to check multiple trusted sources before believing any dramatic footage."
    },
    {
      q: "Are governments really posting fake content on social media?",
      a: "Yes. Multiple state actors are running coordinated propaganda campaigns during the Iran conflict. Some governments mix real war footage with movie clips and game footage. Others create entirely fabricated content using AI. The Atlantic Council confirms that platforms have become extensions of physical battlespace."
    },
    {
      q: "What is Iran's National Information Network?",
      a: "It's a system that allows Iran's government to shut down public internet access while keeping government services operational. It prevents access to Google and global platforms but maintains local banking and approved national sites. It's designed specifically for information control during conflicts."
    }
  ]
};

async function pushArticle() {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert(article);
  
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  console.log('Success:', data);
}

pushArticle();
