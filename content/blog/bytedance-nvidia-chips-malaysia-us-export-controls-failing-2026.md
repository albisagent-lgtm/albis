---
title: "ByteDance Gets 36,000 Nvidia Chips Despite US Ban"
description: "ByteDance deployed $2.5 billion in Nvidia's most powerful AI chips through a Malaysian intermediary. Days earlier, a Super Micro exec was arrested for smuggling the same chips. Two methods, same result — and the wall is full of holes."
date: "2026-03-25"
author: "Harry Wenham"
category: "tech-ai"
tags: ["ai chips", "export controls", "ByteDance", "Nvidia", "sanctions", "Malaysia", "semiconductor"]
regions: ["Asia-Pacific", "North America", "Southeast Asia"]
image: "https://images.pexels.com/photos/5480781/pexels-photo-5480781.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=1200"
imageAlt: "Server room with rows of computing hardware representing AI chip infrastructure"
seoKeyword: "bytedance nvidia chips malaysia sanctions evasion 2026"
perception_gap: 7
regions_found: [us, eu, asia_pacific]
regions_absent: [middle_east, south_asia, latam, africa]
region_significance:
  us: 5
  eu: 3
  asia_pacific: 4
region_frames:
  us: "Framed as sanctions evasion threatening US national security"
  eu: "Framed through tech sovereignty and supply chain concerns"
  asia_pacific: "Chinese media frames as pragmatic adaptation to unfair restrictions"
confidence: "confirmed"
sources:
  - name: "Wall Street Journal (via Tom's Hardware)"
    url: "https://www.tomshardware.com/pc-components/gpus/chinas-bytedance-to-access-36-000-blackwell-gpu-cluster-through-malaysia-cloud-operator-nvidia-confirms-no-objections-deal-is-in-line-with-us-export-controls"
    region: "North America"
    quote: "Nvidia confirms no objections, deal is in line with US export controls"
  - name: "Reuters"
    url: "https://www.reuters.com/world/us-charges-three-people-with-conspiring-divert-ai-tech-china-2026-03-19/"
    region: "International"
    quote: "Charged with helping smuggle at least $2.5 billion of U.S. AI technology to China"
  - name: "Tom's Hardware"
    url: "https://www.tomshardware.com/tech-industry/artificial-intelligence/u-s-house-passes-bill-to-stop-chinese-companies-from-accessing-export-controlled-american-ai-chips-using-offshore-rental-loophole-remote-access-security-access-act-effectively-extends-export-controls-to-the-cloud"
    region: "North America"
    quote: "The bill extends export controls on potent AI chips to cloud computing, a loophole that companies in China have allegedly used previously"
  - name: "East Asia Forum"
    url: "https://eastasiaforum.org/2026/03/11/us-chip-export-controls-have-cooled-down/"
    region: "Asia-Pacific"
    quote: "The Department of Commerce is unlikely to proactively introduce new export control rules amid ongoing US-China trade negotiations"
  - name: "Fortune"
    url: "https://fortune.com/2026/03/19/supermicro-arrested-founder-smuggling-gpu-china/"
    region: "North America"
    quote: "Each of the three face up to 20 years in prison on the most serious charge"
faqs:
  - q: "How did ByteDance get Nvidia chips despite the US export ban?"
    a: "ByteDance worked with Aolani Cloud, a Malaysia-based intermediary and Nvidia Tier-1 partner, to deploy 36,000 B200 chips in Malaysian data centres. Malaysia isn't subject to the same export restrictions as China, so the deal falls into a legal grey zone that Nvidia says is compliant."
  - q: "Are US AI chip export controls on China working?"
    a: "The controls are leaking through multiple channels. ByteDance accessed 36,000 advanced chips legally through an offshore intermediary. Separately, Super Micro executives were arrested for allegedly smuggling $2.5 billion in chips directly. Congress has passed a bill to close the cloud loophole, but it hasn't become law."
  - q: "What is Aolani Cloud and who owns it?"
    a: "Aolani Cloud is a Southeast Asian cloud computing provider incorporated in the Cayman Islands. It was set up in late 2023 with investors including Singapore-based K3 Ventures. It holds Nvidia Tier-1 cloud partner status, giving it priority access to Nvidia's latest chips."
---

ByteDance, TikTok's parent company, has secured access to 36,000 of Nvidia's most powerful B200 AI chips through a $2.5 billion deal with Malaysian cloud provider Aolani Cloud. The arrangement exploits a gap in US export controls: the chips never enter China, so they don't technically violate the ban. The Albis Perception Gap Index scored this story 7.0, with US outlets framing it as a security threat while Chinese media calls it pragmatic adaptation to unfair restrictions.

Five days before ByteDance's deal made headlines, FBI agents arrested Super Micro Computer's co-founder Wally Liaw for allegedly [smuggling $2.5 billion in Nvidia AI servers to China](/blog/super-micro-nvidia-chip-smuggling-arrest-export-controls-failing-2026) using dummy shipments and hair dryers as decoys. Two stories. Same dollar figure. Same chips. One is a federal crime carrying 20 years in prison. The other? Nvidia says it's perfectly compliant.

That gap — between legal workaround and illegal smuggling, both achieving the same result — tells you everything about the state of America's AI chip containment strategy.

## The door, the window, and the tunnel

The US spent three years building what was supposed to be an airtight wall around China's AI ambitions. Starting in October 2022, export controls progressively tightened restrictions on advanced chips, targeting everything from Nvidia's A100 to the H100 and eventually the H200.

The wall had a fundamental design flaw. It controlled where chips could be *shipped*, not where they could be *used*.

ByteDance found the door. By partnering with Aolani Cloud — a company incorporated in the Cayman Islands, backed by Singapore's K3 Ventures, and operating data centres in Malaysia — it can access Nvidia's latest Blackwell architecture without a single chip crossing the Chinese border. Aolani holds Nvidia Tier-1 cloud partner status, giving it priority access to the company's newest accelerators. Malaysia, classified as a friendly nation under US export rules, doesn't require Bureau of Industry and Security licensing for chip imports.

The 500 Blackwell computing systems being deployed represent roughly 36,000 B200 GPUs — Nvidia's most powerful commercial processor. ByteDance engineers in China can train AI models remotely on hardware sitting in Johor Bahru.

Super Micro's people found the tunnel. According to the federal indictment, co-founder Liaw, manager Ruei-Tsang Chang, and contractor Ting-Wei Sun allegedly shipped Nvidia servers to intermediaries in Asia who rerouted them directly into China. The operation moved an estimated $2.5 billion in hardware between 2020 and 2025. Chang is now a fugitive.

## Congress knows. Congress is slow.

The US House of Representatives isn't blind to the loophole. On January 12, 2026, it passed the Remote Access Security Act by an overwhelming 369-22 vote. The bill would extend [export controls to cloud computing access](/blog/trump-ai-chip-export-controls-divided-world-march-2026), closing the exact gap ByteDance is exploiting.

It still hasn't passed the Senate.

The timing is uncomfortable. The same week Congress deliberates over closing a loophole, ByteDance drives a $2.5 billion truck through it. And according to the East Asia Forum, the Department of Commerce is "unlikely to proactively introduce new export control rules" in 2026 because the White House is prioritising stable trade talks ahead of Trump's planned visit to Beijing.

The Bureau of Industry and Security's January 2026 rule change actually *loosened* restrictions, shifting the review posture for H200-equivalent chips from "presumption of denial" to "case-by-case review." Exporters now need to submit certifications about end users, but the door swung wider, not narrower.

## Three frames, three realities

This is where the perception gap cracks open.

US outlets — CNBC, Fortune, Tom's Hardware — frame ByteDance's move as a threat. The word "circumvent" appears in nearly every headline. Congressional hawks cite it as proof the controls need teeth. Super Micro's arrest gets framed as vindication: see, the system catches cheaters.

But it doesn't catch the legal ones.

Chinese media tells a different story entirely. ByteDance isn't dodging anything — it's adapting to what Chinese commentators call discriminatory restrictions that [backfire on US chipmakers](/blog/deepseek-nvidia-export-controls-backfire-2026). Nvidia lost an estimated $12 billion in China revenue in 2024 alone due to export controls. From Beijing's perspective, the controls punish American companies more than Chinese ones. DeepSeek built a competitive model with older chips. Huawei's Ascend series is closing the gap. The containment is accelerating Chinese self-sufficiency, not preventing it.

European coverage sits somewhere between alarm and resignation. The story reinforces what EU policymakers already feared: America's chip strategy creates chaos in the supply chain without achieving its stated goal. Nobody in Brussels is celebrating.

What 5.4 billion people across the Middle East, South Asia, Latin America, and Africa don't see at all: this story. It didn't register in any major outlet in those regions. But it should — because whoever wins the AI chip race shapes the AI that shapes everything else.

## The math that breaks containment

Here's the number that should worry Washington more than any headline. The CNAS think tank estimated that 140,000 Nvidia chips were diverted to China through smuggling in 2024 alone. ByteDance just got legal access to 36,000 in a single deal. Together, those represent computing power that doesn't just train chatbots — it trains military targeting systems, surveillance networks, and autonomous weapons.

The wall isn't just leaking. It's structurally unsound. The US controls where chips are shipped but not where they're accessed remotely. It controls who buys them but not who rents them. It catches people who forge shipping documents but waves through companies that use a Cayman Islands intermediary.

At some point, the question shifts from "how do we plug the holes?" to "does the wall work at all?"

## What happens next

Three things to watch. First, the Senate vote on the Remote Access Security Act — if it passes, ByteDance's arrangement could retroactively become illegal. Second, whether the Department of Commerce classifies Aolani Cloud as a Chinese-adjacent entity, which would require BIS licensing. Third, whether other Chinese tech companies — Alibaba, Tencent, Baidu — replicate ByteDance's Malaysia playbook before the window closes.

The US built export controls to prevent China from reaching the AI frontier. ByteDance just deployed the most advanced AI chips on Earth, legally, for $2.5 billion, through a company that didn't exist three years ago.

The wall is still standing. The chips are on the other side.
