---
title: "India Hacked Pakistan's Nuclear Agency for a Year"
description: "An India-linked cyber espionage campaign targeted Pakistan's nuclear regulator, navy, and telecom for 12 months. Indian media calls it counterterrorism. Pakistani media calls it state-sponsored aggression. The same operation, two completely different stories."
date: 2026-03-08
image: "https://images.pexels.com/photos/2036656/pexels-photo-2036656.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
author: "Albis"
tags: ["divided", "pgi", "cybersecurity", "india", "pakistan", "espionage", "south-asia"]
sources:
  - name: "The Record (Recorded Future)"
    url: "https://therecord.media/india-pakistan-cyber-campaign-apt"
    region: "International"
    quote: "The campaign targeted Pakistani nuclear regulatory bodies, defense logistics organizations, and telecommunications infrastructure"
  - name: "TechJuice (Pakistan)"
    url: "https://www.techjuice.pk/how-pakistan-bangladesh-and-sri-lanka-were-hit-by-india-linked-threat-actors/"
    region: "South Asia"
    quote: "A newly identified cyber espionage campaign attributed to an India-nexus threat actor has targeted government agencies and critical infrastructure operators"
  - name: "Stimson Center"
    url: "https://www.stimson.org/2025/india-pakistan-cyber-skirmishes-and-the-challenge-of-attribution/"
    region: "International"
    quote: "Neither India nor Pakistan currently have an official public attribution policy, making it difficult to assess their evidentiary standards"
  - name: "Arctic Wolf"
    url: "https://arcticwolf.com/resources/blog/sloppylemming-deploys-burrowshell-and-rust-based-rat-to-target-pakistan-and-bangladesh/"
    region: "International"
    quote: "112 unique domains identified and peak registration activity in July 2025 demonstrates dedicated operational commitment"
  - name: "Industrial Cyber"
    url: "https://industrialcyber.co/ransomware/sloppylemming-espionage-surge-hitting-defense-telecom-energy-and-finance-in-pakistan-and-bangladesh/"
    region: "International"
    quote: "Targeting aligns with intelligence collection priorities consistent with regional strategic competition in South Asia"
confidence: "confirmed"
faqs:
  - q: "Who is SloppyLemming?"
    a: "SloppyLemming is a threat actor tracked by Arctic Wolf and Cloudflare since 2021. CrowdStrike calls the same group 'Outrider Tiger' and describes it as an India-nexus adversary supporting Indian state intelligence collection. The group uses spear-phishing emails, malicious PDFs, and custom backdoors to target government and critical infrastructure in South Asia."
  - q: "Was Pakistan's nuclear program actually breached?"
    a: "The campaign targeted the Pakistan Nuclear Regulatory Authority (PNRA), which oversees nuclear safety and regulation — not the weapons program directly. Arctic Wolf confirmed targeting of the PNRA alongside the Pakistan Navy, National Logistics Corp, and telecom providers. Whether the attackers successfully extracted data hasn't been publicly disclosed."
  - q: "Does Pakistan conduct similar cyber operations against India?"
    a: "Yes. Pakistan-linked groups like APT36 (Transparent Tribe) run parallel espionage campaigns against Indian government and military targets. In March 2026 alone, researchers found APT36 using AI tools to mass-produce malware targeting India. Maharashtra Cyber reported that seven Pakistan-allied APT groups attempted 1.5 million attacks on Indian critical infrastructure following the 2025 India-Pakistan military conflict."
---

An India-linked hacking group spent 12 months inside the networks of Pakistan's nuclear regulator, navy, and telecom providers. Arctic Wolf published the findings this week. The operation targeted three countries — Pakistan, Bangladesh, and Sri Lanka — using 112 fake government-themed domains to trick officials into opening infected files.

What happened next depends on who's telling the story.

## Two Names for the Same Thing

The group behind the campaign goes by "SloppyLemming" in Arctic Wolf's research. CrowdStrike calls them "Outrider Tiger" and describes the operation as supporting "Indian state intelligence collection requirements."

Indian cybersecurity outlets barely covered the report. When they did, the framing centered on the broader category of "South Asian cyber threats" — a phrase that distributes blame evenly across borders. No Indian outlet named India as the aggressor.

Pakistani tech media covered it differently. TechJuice, one of Pakistan's largest tech publications, ran it as a lead story: India-linked threat actors hit Pakistan, Bangladesh, and Sri Lanka. The headline named India. The body named the targets. The tone treated the campaign as state-sponsored aggression against a neighbor's critical infrastructure.

Same operation. Same research report. Two completely different framings.

## What Actually Happened

Arctic Wolf's investigation revealed a year-long campaign from January 2025 through January 2026. The attackers registered 112 Cloudflare domains with Pakistani and Bangladeshi government-themed names designed to look official. When targets opened the phishing emails, they saw blurred documents with a message claiming their "PDF reader is disabled" — a social engineering trick to get them to enable malicious code.

Two malware strains did the work. BurrowShell, a custom backdoor, captured screenshots and manipulated file systems. A second Rust-based trojan logged keystrokes and mapped networks.

The target list reads like a strategic intelligence shopping list: the Pakistan Nuclear Regulatory Authority. The Pakistan Navy. The National Logistics Corp. Telecom providers including PTCL and the Special Communications Organization. In Bangladesh, attackers went after the Power Grid Company and financial institutions.

Arctic Wolf assessed "with moderate confidence" that the operation aligns with "intelligence collection priorities consistent with regional strategic competition in South Asia." That's careful language. It means: these are the exact targets an Indian intelligence service would prioritize.

## The Mirror War Nobody Mentions

Here's the part that rarely makes either country's headlines: both sides run these operations simultaneously.

While SloppyLemming spent a year inside Pakistani systems, Pakistan's APT36 — also known as Transparent Tribe — ran parallel campaigns against Indian government and academic targets. Two days before the Arctic Wolf report dropped, researchers at Recorded Future documented APT36 using AI-powered coding tools to mass-produce malware implants targeting India.

Maharashtra Cyber in India reported that seven Pakistan-allied APT groups attempted more than 1.5 million cyber attacks on Indian critical infrastructure following the 2025 India-Pakistan military conflict. CloudSEK researchers later cautioned that many of those claimed breaches involved "minimal disruption and reused data or superficial defacements." The claimed number was inflated. But the operations were real.

Both countries hack each other's governments. Both countries spy on each other's military infrastructure. Both countries deny involvement. Neither country has an official public attribution policy — which, as the Stimson Center pointed out, means "it is difficult to assess their evidentiary standards and the validity of their threat intelligence."

## The Perception Gap: PGI 7.48

The Albis Perception Gap Index scored this story at 7.48 — firmly in "Different Realities" territory.

The gap breaks down across five dimensions. Actor portrayal scored highest at 8.0: Indian sources frame the operations (when they acknowledge them at all) as counterterrorism intelligence gathering. Pakistani and Bangladeshi sources frame the same activity as state-sponsored cyber aggression against sovereign nations. The actors are identical. The moral framing is inverted.

Causal attribution scored 7.0. In Indian media, cyber operations in South Asia exist in response to Pakistani provocations and Chinese interference. In Pakistani media, India conducts offensive espionage against neighbors to maintain regional dominance. Both framings contain truth. Neither captures the full picture.

The widest gap sits in who benefits from each narrative. Indian framing positions cyber defense as reactive and proportional — protecting national security from documented threats. Pakistani framing positions the same operations as proof that India operates as a regional cyber aggressor targeting civilian infrastructure, including nuclear safety bodies, in countries that aren't even adversaries (Bangladesh, Sri Lanka).

## The Part Worth Sitting With

Two nuclear-armed neighbors spend years hacking each other's military, government, and critical infrastructure. Neither admits it. Neither has a public attribution policy. Neither has signed a bilateral cyber agreement to establish rules of engagement.

The Stimson Center's assessment cuts through both national framings: "The deployment of cyber-attacks complementary to kinetic operations along with unverifiable and potentially premature public attribution could set a dangerous precedent for a strategic environment as hostile and fragile as South Asia."

The operation Arctic Wolf documented wasn't particularly sophisticated — their own researchers noted the group's "historically inconsistent operational security." SloppyLemming left open directories. They made mistakes. They got caught.

The question isn't whether India-linked hackers targeted Pakistan's nuclear regulator. That's confirmed. The question is what happens when one of these "moderate capability" operations accidentally triggers something neither side intended — in a region where both countries have nuclear weapons and no agreed framework for handling cyber incidents.

The framing war — counterterrorism vs. aggression, defensive intelligence vs. offensive espionage — matters less than the gap it creates. Because the gap means neither country's public can see the full picture. And you can't build safety protocols for risks your population doesn't know exist.

---

*This story was scored by the [Albis Perception Gap Index](/indexes/pgi) — measuring how differently the world frames the same events. [See today's most divided stories →](/indexes/pgi)*
