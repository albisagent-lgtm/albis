---
title: "Arm's First Chip in 35 Years Just Redrew the AI Map"
description: "Arm launched its first-ever in-house chip, a 136-core AI CPU with Meta as lead customer. Hours later, Alibaba unveiled a rival RISC-V chip. Two visions for AI's future — one day apart."
date: "2026-03-26"
author: "Rajan Mehta"
tags: ["ai-intelligence", "semiconductors", "arm", "meta", "alibaba", "chips", "agentic-ai"]
image: https://images.pexels.com/photos/3665442/pexels-photo-3665442.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940
sources:
  - name: "CNBC"
    url: "https://www.cnbc.com/2026/03/25/arm-stock-chip-revenue-agi-cpu.html"
    region: "North America"
    quote: "Arm's announcement is the most significant shift in the company's history"
  - name: "Arm Newsroom"
    url: "https://newsroom.arm.com/news/arm-agi-cpu-launch"
    region: "Europe"
    quote: "Up to 136 Arm Neoverse V3 cores per CPU, delivering more than 2x performance per rack compared with x86 platforms"
  - name: "CNBC (Alibaba)"
    url: "https://www.cnbc.com/2026/03/24/alibaba-ai-chip-cpu-agents.html"
    region: "Asia-Pacific"
    quote: "The XuanTie C950 is based on RISC-V architecture, which is a rival to the CPU blueprint created by British firm Arm"
  - name: "WIRED"
    url: "https://www.wired.com/story/chip-design-firm-arm-is-making-its-own-ai-cpu/"
    region: "North America"
    quote: "Let me be clear: We are now in a new business for ARM, and we are supplying CPUs"
  - name: "TechCrunch"
    url: "https://techcrunch.com/2026/03/24/arm-is-releasing-its-first-in-house-chip-in-its-35-year-history/"
    region: "North America"
    quote: "The company started developing the chips back in 2023 and the processors are already ready to order"
confidence: "confirmed"
faqs:
  - q: "What is the Arm AGI CPU?"
    a: "The Arm AGI CPU is Arm's first-ever in-house data center chip, a 136-core processor built on TSMC's 3nm process. It's designed for AI inference workloads — specifically the 'agentic AI' tasks where AI systems reason, plan, and act autonomously. Meta is the lead customer, with OpenAI, Cloudflare, and others also committed."
  - q: "Why is Arm making its own chips now?"
    a: "After 35 years of only licensing chip designs to other companies, Arm is entering manufacturing because agentic AI is creating massive new demand for CPUs. Data centers need 4x more CPU capacity per gigawatt as AI shifts from training models to running always-on agents. Arm says its chip delivers 2x better performance per rack than Intel and AMD's x86 processors."
  - q: "How does Alibaba's RISC-V chip compete with Arm's AGI CPU?"
    a: "Alibaba's XuanTie C950, announced the same day, uses open-source RISC-V architecture instead of Arm's proprietary designs. It doesn't require licensing fees, making it attractive for Chinese companies facing US export restrictions. The two chips represent competing visions: Arm's closed ecosystem backed by Western tech giants vs. China's open-source alternative built for self-sufficiency."
---

Arm just entered the chip-making business for the first time in its 35-year history, launching a 136-core data center CPU that claims to deliver twice the performance of Intel and AMD processors — and its stock jumped 16% in a single day. Hours later, Alibaba unveiled a competing chip built on entirely different architecture. Two visions for the future of AI hardware, announced within 24 hours of each other, each backed by billions of dollars and radically different ideas about who should control computing power.

## The Architect Becomes the Builder

For 35 years, Arm did one thing: design chip blueprints and license them to companies that actually manufactured processors. Apple uses Arm designs in every iPhone. Nvidia builds on Arm architecture. Amazon, Google, and Microsoft all build their own Arm-based server chips. The arrangement made Arm one of the most influential companies in computing without ever selling a physical product.

That model ended on Tuesday in San Francisco.

"Let me be clear: We are now in a new business for Arm, and we are supplying CPUs," CEO Rene Haas told a live audience, holding up the company's first chip. The Arm AGI CPU — named for artificial general intelligence, though it's a production chip, not a research project — is a 136-core processor built on TSMC's 3nm process, designed specifically for AI inference in data centers.

The numbers Arm is projecting startled even bullish analysts. The chip alone is expected to generate $15 billion in revenue by 2031, against total company revenue of $4 billion in 2025. Total annual revenue is projected to hit $25 billion. Citi called it "the most significant shift in the company's history." As we covered when the [$1 trillion Pax Silica chip alliance](/blog/us-india-pax-silica-ai-treaty-nobody-noticed-2026) launched this week, control over who makes chips is rapidly becoming the defining geopolitical question of the decade.

## Why CPUs Matter More Than You Think

Most AI coverage focuses on GPUs — the Nvidia-dominated processors that train large models. But Arm is betting on a different bottleneck.

As AI shifts from training (building models) to inference (running them), and from single-task chatbots to "agentic AI" — systems that reason, plan, and execute multi-step tasks autonomously — the humble CPU becomes the pacing element. CPUs handle scheduling, memory management, data movement, and the coordination of thousands of distributed tasks. Every AI agent running in a data center needs CPU cycles to think.

Arm's pitch: data centers will need 4x the current CPU capacity per gigawatt as agentic AI scales. That's not a small market adjustment — it's a structural transformation of how data centers are built.

The AGI CPU offers up to 136 Neoverse V3 cores per chip, drawing 300 watts, with 6GB/s memory bandwidth per core. In liquid-cooled racks, that translates to 45,000+ cores per rack. Arm claims more than 2x performance per rack versus comparable x86 platforms, which it says could save customers $10 billion in capital expenditure per gigawatt of data center capacity.

Meta is the lead customer, fitting the chip into its planned $135 billion AI infrastructure spend this year. OpenAI, Cerebras, Cloudflare, SAP, SK Telecom, and Korean AI chip firm Rebellions are also committed buyers.

## The China Counter: Alibaba's RISC-V Bet

Here's where it gets geopolitically interesting. On the same day Arm unveiled its chip in San Francisco, Alibaba announced the XuanTie C950 in China — a CPU also designed for agentic AI inference, also targeting data centers. But built on entirely different foundations.

Alibaba's chip uses RISC-V architecture, an open-source alternative to Arm's proprietary designs. Where companies pay Arm royalties for every chip manufactured using its blueprints, RISC-V is free to use and modify. Alibaba's DAMO Academy claims the C950 achieves 30% performance improvement over "mainstream products" thanks to customisation flexibility.

The timing wasn't coincidental. Chinese companies have been racing to build semiconductor independence since US export restrictions cut off access to high-end Nvidia chips. Alibaba's XuanTie C950 is designed to avoid any licensing dependency on Western firms — including Arm, which despite its UK headquarters is majority-owned by Japan's SoftBank and manufactures through Taiwan's TSMC.

As we've tracked in the [ByteDance chip procurement story](/blog/bytedance-nvidia-chips-malaysia-us-export-controls-failing-2026), the lines between chip architecture, geopolitics, and AI capability are blurring fast.

## A Company at War With Its Own Customers

The deeper tension in Arm's announcement isn't about x86 versus Arm architecture — it's about Arm versus Arm's own customers.

Amazon builds Graviton chips on Arm designs. Google has its own Arm-based processors. Apple's entire silicon strategy runs on Arm IP. Nvidia's Grace CPU is Arm-based. Every one of these companies now faces a supplier that has become a competitor.

The market doesn't seem worried yet. Arm stock jumped 16% on Wednesday. Nvidia, AMD, and Intel all climbed too, as analysts concluded the announcement validated surging CPU demand rather than signalling a zero-sum fight. Motley Fool and Citi both argued the CPU market is growing fast enough to absorb a new entrant.

But Arm's $15 billion revenue projection for one chip comes from somewhere. Every dollar Arm earns in direct chip sales is a dollar a licensee doesn't earn — or a royalty Arm doesn't collect from that licensee. The math eventually gets complicated.

## Two Architectures, Two Worlds

Zoom out and the picture sharpens. The same week that 13 nations formed the [Pax Silica chip alliance](/blog/us-india-pax-silica-ai-treaty-nobody-noticed-2026) to coordinate semiconductor supply chains without China, and Elon Musk proposed a [$25 billion "Terafab"](/blog/musk-terafab-chip-factory-ai-panic-signal-2026) chip factory, two competing visions for AI hardware crystallised:

**The Western model:** Arm-designed, TSMC-manufactured, deployed by Meta, OpenAI, and Cloudflare. Proprietary architecture, massive scale, embedded in the existing alliance structure. Performance advantage today, licensing dependency forever.

**The Chinese model:** RISC-V-based, domestically designed, deployed by Alibaba and eventually others. Open-source architecture, customisable, free from Western licensing. Performance gap today, sovereignty advantage tomorrow.

Neither model is objectively superior. They're optimising for different things. Arm optimises for peak performance within an integrated Western supply chain. RISC-V optimises for independence from that supply chain.

## What to Watch

Arm expects "full production availability" of the AGI CPU in the second half of 2026. The real test isn't performance benchmarks — it's whether Arm's existing licensees defect to building their own chips faster, or whether they accept the company's new dual role as both architect and builder.

For Alibaba, the test is whether RISC-V can close the performance gap fast enough to matter. A 30% improvement over "mainstream products" is vague — Arm is claiming 2x over Intel and AMD. If RISC-V can reach 80% of Arm performance at zero licensing cost, the economic calculus flips for any company outside the Western alliance.

In a world where [chip smuggling](/blog/bytedance-nvidia-chips-malaysia-us-export-controls-failing-2026) is a $2.5 billion criminal enterprise and nations are forming trillion-dollar alliances over semiconductor access, the question isn't just which chip is faster. It's which chip you're allowed to buy.

The CPU war just got a new front. Two chips, two architectures, two geopolitical blocs — and a $1 trillion market that only exists because AI agents need something to think with.
