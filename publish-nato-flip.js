const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wguydvzpxwsgrhvojpnk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndXlkdnpweHdzZ3Jodm9qcG5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzg1MiwiZXhwIjoyMDg3MDk5ODUyfQ.KuAP49LLd77I3dfM6PIwQ8u0qErrURYMvbq-Snw3gDU'
);

const article = {
  title: "America's Oldest Allies All Said No. Here's What Each Side Thinks That Means.",
  content: `## From Washington

America asked its closest friends for help. They all said no.

The UK, Germany, France, Italy, Australia, Japan — every major NATO ally and Pacific partner refused to send warships to the Strait of Hormuz. The US Navy is fighting to keep global shipping lanes open, under constant Iranian drone attack, and the allies who've relied on American security guarantees for 77 years are sitting it out.

Trump didn't mince it. He called Starmer's refusal "terrible." He reminded Britain it was America's "oldest ally." He said the US had "spent a lot of money on NATO and all of these things to protect you." He warned that NATO faces "a very bad future" if members won't help.

The Guardian reported it as Starmer "distancing the UK from the Iran war." The New York Times ran Trump "disparaging allies" in its live blog. The War Zone covered it as a pushback against demands — allies "denying" the president's request.

In US coverage, the structure of the story is clear: America is doing the hard work of keeping the world's most critical oil chokepoint open. The world benefits. The allies won't help. They're free-riding on American sacrifice, as they always have.

German Defense Minister Boris Pistorius said "this is not our war." Trump heard that as an admission. The US started this? No. Iran started it by blocking the strait. By refusing to help, Germany isn't staying neutral — it's signaling that American leadership can't be counted on in a crisis.

The question US coverage asks: if the allies won't come when called, what exactly is NATO for?

---

## Now flip.

The same week. The same refusal. A completely different story.

Germany didn't abandon an ally. Germany said no to a war it was never consulted on, started without a UN mandate, in a region thousands of miles from its borders, for reasons its own government doesn't find credible.

Pistorius was blunt at the Berlin press conference: "We did not start this war." Then he asked the question that's been reverberating in European capitals: "What does Donald Trump expect from a handful of European frigates to achieve in the Strait of Hormuz that the powerful American Navy cannot manage?"

It's a real question. The US has the largest navy on earth. It has carrier strike groups in the region. Adding a few German frigates changes nothing militarily. What it changes is political — it makes Europe complicit in a war of choice.

German Foreign Minister Johann Wadephul put it differently: "NATO has made no decision in this direction." He pointed out that collective defense under NATO requires NATO consensus — which hasn't been sought. The alliance wasn't consulted. Trump asked bilaterally, after the war had started, and called it an obligation.

Le Monde framed it as a victory for European strategic autonomy. The Guardian noted Macron "insisted France would not send its navy." The Indian Express ran the headline: "Europe shares America's hostility towards Iran. But it wants no part in Trump's war." The Soufan Center called the refusals "a direct challenge — and a stress test — for European strategic autonomy."

In European coverage, the structure of the story is also clear: the US started a war without consulting its allies, then demanded their military assets to help fight it. Europe said no. That's not betrayal. That's sovereignty.

The question European coverage asks: if America can launch a war of choice and then call on allies to bail it out — does NATO mean collective defense, or does it mean collective compliance?

---

## What shifted

Both versions used real quotes from real officials. Both described the same refusal. One saw allies failing a test. The other saw allies passing one.

The facts that led each version aren't in dispute. Trump did say "you're our oldest ally." Pistorius did say "we did not start this war." The question is which one becomes the first sentence — and which one becomes the footnote.

Which version did you read first this week? And what does your answer tell you about where you get your news?`,
  slug: "nato-allies-hormuz-refusal-two-stories-flip-2026",
  author: "Light Tree",
  category: "geopolitics",
  tags: ["the-flip", "nato", "iran-war", "geopolitics", "media-framing", "europe", "hormuz"],
  published_at: new Date().toISOString(),
  status: "published",
  image: "https://picsum.photos/seed/nato-hormuz-flip/1200/630",
  seoKeyword: "NATO allies refuse Hormuz warships framing comparison",
  description: "The same refusal. Two entirely different stories about what it says about NATO, America, and who actually started this war.",
  sources: [
    {
      name: "The Guardian",
      url: "https://www.theguardian.com/world/2026/mar/16/starmer-distances-uk-from-iran-war-as-eu-leaders-rule-out-sending-warships",
      region: "Europe",
      quote: "Starmer distances UK from Iran war as EU leaders rule out sending warships"
    },
    {
      name: "The War Zone",
      url: "https://www.twz.com/news-features/allies-push-back-on-trumps-demand-they-send-warships-to-strait-of-hormuz",
      region: "North America",
      quote: "This is not our war; we did not start it"
    },
    {
      name: "Business Upturn",
      url: "https://www.businessupturn.com/trade-policy/this-is-not-europes-war-eu-rejects-trumps-hormuz-call/5534/",
      region: "International",
      quote: "German Chancellor Friedrich Merz reiterated that NATO has no formal mandate in the current situation"
    },
    {
      name: "Indian Express",
      url: "https://indianexpress.com/article/opinion/columns/europe-america-iran-trump-war-keir-starmer-nato-10586062/",
      region: "South Asia",
      quote: "Europe shares America's hostility towards Iran. But it wants no part in Trump's war."
    },
    {
      name: "The Soufan Center",
      url: "https://thesoufancenter.org/intelbrief-2026-march-10/",
      region: "International",
      quote: "A direct challenge to their ambition for greater strategic autonomy"
    }
  ],
  confidence: "confirmed",
  faqs: [
    {
      q: "Why did NATO allies refuse to send warships to the Strait of Hormuz?",
      a: "Germany, France, the UK, Italy, Australia and Japan all declined, citing various reasons: the war wasn't started by NATO consensus, sending ships would make them complicit in what they view as a US war of choice, and NATO has no formal mandate for the operation."
    },
    {
      q: "What did Trump say when allies refused?",
      a: "Trump called Starmer's refusal 'terrible,' warned NATO faces 'a very bad future,' and reminded allies that the US had spent enormous sums protecting them over decades."
    },
    {
      q: "What is The Flip?",
      a: "The Flip is an Albis series that takes one story and tells it from two opposing regional perspectives, using real headlines and real framing. The goal is to show how the same facts can produce completely different narratives depending on where you read the news."
    }
  ]
};

async function publishArticle() {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert(article);
  
  if (error) {
    console.error('Error:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
  
  console.log('SUCCESS: Article published');
  console.log('Title:', article.title);
  console.log('Slug:', article.slug);
  console.log('Word count:', article.content.split(/\s+/).length);
}

publishArticle();
