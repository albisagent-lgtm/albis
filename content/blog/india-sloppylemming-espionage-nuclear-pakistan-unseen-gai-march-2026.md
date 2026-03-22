---
title: "India-Linked Cyber Attack on Pakistan's Nuclear Systems"
description: "SloppyLemming spent a year inside Pakistan's nuclear regulators, navy, and telecoms. 112 domains. Custom malware. Here's the cyber attack on Pakistan that the world missed."
date: "2026-03-08"
image: "https://picsum.photos/seed/india-sloppylemming-espionage-nuclear-pakistan-unseen-gai-march-2026/1200/630"
author: "Harry Wenham"
tags: ["unseen", "gai", "cybersecurity", "south-asia", "india", "pakistan", "espionage"]
sources:
  - name: "Arctic Wolf"
    url: "https://arcticwolf.com/resources/blog/sloppylemming-deploys-burrowshell-and-rust-based-rat-to-target-pakistan-and-bangladesh/"
    region: "North America"
    quote: "The targeting of Pakistani nuclear regulatory bodies, defense logistics organizations, and telecommunications infrastructure aligns with intelligence collection priorities consistent with regional strategic competition in South Asia."
  - name: "The Record (Recorded Future)"
    url: "https://therecord.media/india-pakistan-cyber-campaign-apt"
    region: "North America"
    quote: "The campaign ran for a year beginning in January 2025 and featured two different types of attacks."
  - name: "TechJuice"
    url: "https://www.techjuice.pk/how-pakistan-bangladesh-and-sri-lanka-were-hit-by-india-linked-threat-actors/"
    region: "South Asia"
    quote: "APT36, a Pakistan-linked APT group, has been implicated in ongoing espionage campaigns against Indian government and strategic institutions."
  - name: "The Hacker News"
    url: "https://thehackernews.com/2026/03/sloppylemming-targets-pakistan-and.html"
    region: "International"
    quote: "The deployment of dual payloads suggests the threat actor maintains flexibility to deploy appropriate tools based on target value and operational requirements."
  - name: "Cyber Magazine"
    url: "https://cybermagazine.com/news/world-war-in-cyber-space"
    region: "International"
    quote: "South Asia had its share of conflicts, with the escalation of tensions between the nuclear armed India and Pakistan, after which covert cyber espionage operations followed."
confidence: "confirmed"
faqs:
  - q: "What is SloppyLemming?"
    a: "SloppyLemming (also tracked as Outrider Tiger and Fishing Elephant) is a suspected India-aligned cyber espionage group that has been active since at least 2021, primarily targeting government and military entities in Pakistan, Bangladesh, and Sri Lanka."
  - q: "Were Pakistan's nuclear facilities actually breached?"
    a: "Arctic Wolf's research confirmed that Pakistan's Nuclear Regulatory Authority (PNRA) was among the targeted organizations. The campaign used spear-phishing emails and custom malware. The extent of successful infiltration has not been publicly disclosed."
  - q: "Why hasn't this story received global attention?"
    a: "The Iran-Israel war and other conflicts have dominated international news cycles. Cyber espionage stories — especially between regional rivals in South Asia — rarely break through to Western media unless they involve Western targets directly."
---

An India-linked hacking group spent an entire year infiltrating Pakistan's nuclear regulators, navy, and telecom networks — and the story barely registered outside South Asia. An estimated 6.2 billion people have no idea it happened.

The group is called SloppyLemming. The name sounds ridiculous. The operation was not.

## A Year Inside Pakistan's Most Sensitive Networks

Between January 2025 and January 2026, SloppyLemming ran a sustained cyber espionage campaign across three countries: Pakistan, Bangladesh, and Sri Lanka. Cybersecurity firm Arctic Wolf published the findings on March 3, detailing what they called a "continuation and evolution" of activity first flagged by Cloudflare back in 2024.

The target list reads like a strategic intelligence wishlist.

Pakistan's Nuclear Regulatory Authority. The Pakistan Navy. The National Logistics Corporation — which handles military supply chains. Telecom providers including the Pakistan Telecommunication Company and the Special Communications Organization, which runs networks in disputed Kashmir.

In Bangladesh, the hackers went after energy utilities and financial institutions, including the Power Grid Company of Bangladesh.

These aren't random targets. They're the pressure points of two nuclear-armed nations.

## How They Got In

The playbook was textbook spear-phishing, but with custom tools that show real sophistication.

Victims received emails with PDF attachments. Open the PDF and you'd see blurred content with a message: "PDF reader is disabled." Click through the prompts, and you'd unknowingly install a backdoor called BurrowShell.

BurrowShell gave attackers full access. Screenshots. File system control. Remote command execution. A built-in SOCKS proxy for tunneling deeper into networks. All of it disguised as Windows Update traffic.

The second attack method used Excel documents loaded with a Rust-based keylogger — a newer programming language choice that signals the group is evolving its toolkit. The keylogger came bundled with port scanning and network mapping capabilities, meaning once inside, the hackers could explore the entire internal network.

Arctic Wolf identified 112 Cloudflare domains registered over the year. That's an eight-fold expansion from the 13 domains Cloudflare documented in 2024. Peak registration hit 42 new domains in July 2025 alone — suggesting a surge in operational tempo during that period.

## The Bigger Picture: A Cyber Arms Race No One's Watching

Here's what makes this story matter beyond the technical details.

India and Pakistan are both nuclear powers. They've fought four wars. Their intelligence services have been probing each other's digital infrastructure for years — and the pace is accelerating.

This isn't a one-sided story. Pakistan's APT-36 (also known as Transparent Tribe) has been running its own espionage campaigns against Indian government institutions. After the 2025 India-Pakistan military tensions, Maharashtra Cyber reported that seven Pakistan-aligned hacking groups attempted over 1.5 million attacks on Indian critical infrastructure. Around 150 succeeded.

So both sides are doing this. Both sides know the other is doing this. And outside the cybersecurity trade press, almost nobody is paying attention.

The reason is simple: the Iran-Israel war has consumed every available headline. While the world watches missiles over Tehran and airstrikes on Beirut, two nuclear-armed neighbors are probing each other's most sensitive systems in near-total silence.

## Nuclear Oversight Under Digital Siege

The targeting of Pakistan's Nuclear Regulatory Authority deserves special attention.

PNRA oversees the safety and security of Pakistan's nuclear program. A 2023 analysis by South Asian Voices noted that Pakistan has not yet issued a legislative or regulatory framework for cybersecurity of nuclear facilities. PNRA itself hadn't published guidelines or standards for cyber protection of nuclear infrastructure.

That means the body responsible for nuclear safety was targeted by a foreign intelligence operation — and there may be no formal cybersecurity protocols defending it.

This isn't theoretical risk. Stuxnet proved in 2010 that cyber weapons can physically damage nuclear infrastructure. The convergence of nuclear oversight and cyber vulnerability in an active rivalry between nuclear states is exactly the kind of scenario that keeps arms control experts awake at night.

## The "Sloppy" Question

Arctic Wolf notes an interesting tension in the group's capabilities.

The multi-stage attack chains "demonstrate understanding of defense evasion techniques and familiarity with Windows internals." But operational security was inconsistent — open directory misconfigurations exposed staged malware, and some infrastructure was left visible to researchers.

The "Sloppy" in SloppyLemming refers to this pattern. Capable enough to build custom backdoors and infiltrate nuclear regulators. Careless enough to leave the back door to their own operations ajar.

That inconsistency raises its own questions. Is the sloppiness genuine? Or does it suggest a less centralized operation — perhaps contractors or freelancers operating with state-aligned objectives but without the discipline of a formal military cyber unit?

## Why This Story Disappeared

**GAI Score: 7.48 (Information Shadow)**

This story's Global Attention Index score of 7.48 puts it deep in shadow territory. The campaign was covered exclusively by cybersecurity trade publications and Pakistani tech media. No major Western outlet ran it. No cable news segment. No viral social media moment.

Three factors explain the blindness.

**War dominance.** The Iran-Israel conflict has monopolized international attention since March 1. Every other security story has been pushed to the margins.

**Geographic bias.** Cyber espionage between South Asian nations rarely registers in Western media unless Western systems are affected. When Russian or Chinese hackers target US infrastructure, it's front-page news. When India targets Pakistan's nuclear regulators, it's a trade publication footnote.

**Technical complexity.** Stories about BurrowShell backdoors and Rust-based keyloggers don't translate easily to general audiences. The implications are enormous — the details are niche.

The result: a year-long intelligence operation targeting nuclear infrastructure across three countries, disclosed during a period when two of those countries are in active conflict, and the global public response is effectively zero.

That gap between the story's importance and its visibility is exactly what the Global Attention Index measures. Some stories don't get ignored because they're unimportant. They get ignored because something louder is happening next door.

---

*This story was identified by the [Albis Global Attention Index](/indexes/gai) — measuring which stories the world isn't seeing. [Explore today's blind spots →](/indexes/gai)*
