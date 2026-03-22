---
title: "A Russian Hacking Gang Just Hit Britain's NHS. Most of the World Has No Idea."
description: "The Clop ransomware group breached the UK's National Health Service through an Oracle zero-day — part of a campaign that's hit 103 organizations. Yet 87% of the world's population saw nothing about it."
date: 2026-03-07
image: "https://images.unsplash.com/photo-1639503547276-90230c4a4198?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4OTExNTJ8MHwxfHNlYXJjaHwxfHx1bnNlZW4lMjBnYWklMjBjeWJlcnNlY3VyaXR5fGVufDB8MHx8fDE3NzMwNTA1MDB8MA&ixlib=rb-4.1.0&q=80&w=1080"
author: "Albis"
tags: ["unseen", "gai", "cybersecurity", "nhs", "ransomware", "healthcare", "clop", "oracle"]
faqs:
  - q: "What happened to the NHS in the Clop ransomware attack?"
    a: "The Clop (Cl0p) ransomware gang exploited zero-day vulnerabilities in Oracle E-Business Suite software to breach NHS systems. Barts Health NHS Trust — which runs five London hospitals — confirmed patient names, addresses, and invoice data were stolen and published on the dark web."
  - q: "How many organizations has Clop hit through the Oracle vulnerability?"
    a: "At least 103 organizations have been affected by Clop's Oracle E-Business Suite campaign, which began in August 2025. Victims include the NHS, The Washington Post, Harvard University, and Envoy Air."
  - q: "Why didn't most of the world hear about the NHS breach?"
    a: "The story was covered only in the UK and US, leaving 5.42 billion people (87% of the world's population) completely unaware — despite healthcare ransomware being a global crisis affecting hospitals on every continent."
sources:
  - name: "Computer Weekly"
    url: "https://www.computerweekly.com/news/366634578/Cl0p-claims-ransomware-hit-on-NHS"
    region: "Europe"
    quote: "NHS England is investigating the possibility that it has fallen victim to a prolific ransomware operation"
  - name: "BleepingComputer"
    url: "https://www.bleepingcomputer.com/news/security/barts-health-nhs-discloses-data-breach-after-oracle-zero-day-hack/"
    region: "North America"
    quote: "The stolen data are invoices spanning several years that expose the full names and addresses of individuals who paid for treatment"
  - name: "Bank Info Security"
    url: "https://www.bankinfosecurity.com/uk-nhs-named-in-clop-gangs-exploits-oracle-zero-days-a-30030"
    region: "International"
    quote: "Attackers threatening to leak stolen data unless they paid cryptocurrency ransoms worth up to $50 million"
  - name: "BBC News"
    url: "https://www.bbc.co.uk/news/articles/cp3ly4v2kp2o"
    region: "Europe"
    quote: "More than 10,000 appointments were cancelled at the two London NHS trusts that were worst affected"
  - name: "Comparitech"
    url: "https://www.comparitech.com/news/healthcare-ransomware-roundup-2025-stats-on-attacks-ransoms-and-data-breaches/"
    region: "International"
    quote: "Throughout 2025, we recorded 445 ransomware attacks on hospitals, clinics, and other direct care providers"
confidence: "confirmed"
---

A Russian-speaking criminal gang has stolen patient data from the UK's National Health Service. The breach — carried out through a previously unknown flaw in Oracle software — is part of a campaign that has hit at least 103 organizations worldwide. And 5.4 billion people never heard a word about it.

The Clop ransomware group (sometimes styled Cl0p) added the NHS to its dark web leak site in November 2025, alongside The Washington Post and Harvard University. By December, Barts Health NHS Trust — which operates five hospitals across London including the Royal London and St Bartholomew's — confirmed that patient names, home addresses, and years of invoice records had been stolen and published online.

## How They Got In

The attack vector wasn't an employee clicking a suspicious link. It was something worse: a zero-day vulnerability in Oracle's E-Business Suite, a software platform used by thousands of organizations worldwide to manage finances and operations.

Clop had been quietly exploiting the flaw (tracked as CVE-2025-61882) since August 2025, slipping into databases and siphoning data for weeks before anyone noticed. On September 29, they started sending extortion emails demanding cryptocurrency ransoms of up to $50 million per victim.

Oracle patched the vulnerabilities in October. But by then, Clop had already rifled through databases at over a hundred organizations.

"The theft occurred in August, but there was no indication that trust data was at risk until November when the files were posted on the dark web," Barts Health said in a statement. The trust is now seeking a High Court order to ban anyone from publishing or sharing the stolen data — an effort that, in practice, has limited teeth when the files are already circulating on encrypted networks.

## The NHS Has Been Here Before

This isn't Britain's first healthcare cyber crisis. In June 2024, a ransomware attack on pathology provider Synnovis paralyzed blood testing across London hospitals. More than 10,000 appointments were cancelled. One patient died because their blood test results were delayed.

Before that, the 2017 WannaCry attack forced 19,000 cancelled appointments across 60 NHS trusts and cost the health service £92 million.

Each attack exposes the same fragility: healthcare systems run on aging software, operate with tight budgets, and store exactly the kind of data — medical records, insurance details, personal addresses — that criminals can monetize.

In 2025 alone, researchers documented 445 ransomware attacks on hospitals and clinics globally. The average cost of a healthcare data breach now sits at $4.4 million. And forecasters predict that by the end of 2026, ransomware will hit 40% of health systems worldwide.

## The World's Blind Spot

Here's the part that should bother you: this story was covered in exactly two regions. The UK and the US.

Asia, the Middle East, South Asia, Africa, and Latin America — home to 5.42 billion people, 87% of the world's population — saw nothing. The Albis Global Attention Index scored this story a **6.58** out of 10 for invisibility, placing it firmly in the "Information Shadow" tier. That makes it the single most invisible story in today's PM news scan.

This isn't just a British problem getting ignored. Healthcare ransomware is a planetary crisis. In January 2026, hackers shut down all systems at AZ Monica, a Belgian hospital. In the US, the TriZetto breach — reported the same day as the NHS story — exposed 3.4 million health records. A few months earlier, the Change Healthcare attack compromised 192.7 million Americans' protected health information.

The pattern is clear: criminal gangs are systematically targeting hospitals because they know healthcare organizations will pay. Patients' lives depend on systems staying online. That pressure makes hospitals ideal victims.

Yet the countries where healthcare systems are most vulnerable — where hospitals have the oldest equipment, the smallest IT budgets, and the fewest cybersecurity staff — are the same countries where these stories never appear in the news.

## What Clop Wants

Clop doesn't encrypt data the way traditional ransomware does. Instead, they steal it and threaten to publish. Their message to the NHS was blunt: "The company doesn't care about its customers; it ignored their security."

It's a calculated statement designed to shame organizations into paying. And the campaign is massive — 103 confirmed victims from a single software vulnerability, with 77 stolen datasets already available via torrent links on the dark web.

The group's method is evolving. Previous waves targeted Cleo software (over 400 victims in early 2025) and MOVEit before that. Each time, Clop finds a single widely-used enterprise tool, exploits it at scale, and harvests data from hundreds of organizations simultaneously.

This isn't a lone hacker in a basement. It's an industrial operation.

## The Quiet Emergency

When a bomb goes off, it makes the news everywhere. When criminals steal millions of medical records through a software flaw, it barely registers outside the countries directly affected.

That gap matters. Hospitals in Lagos, São Paulo, Jakarta, and Delhi face the same Oracle software, the same tight budgets, the same criminal gangs. But their administrators, policymakers, and patients aren't seeing the warnings.

The average healthcare data breach now costs $4.4 million. But the real cost isn't measured in dollars — it's measured in cancelled surgeries, delayed diagnoses, and patients who die waiting for a system to come back online.

Today, one of the world's most prolific criminal gangs is systematically dismantling healthcare cybersecurity. And 87% of the planet doesn't know it's happening.

---
*This story was identified by the [Albis Global Attention Index](/indexes/gai) — measuring which stories the world isn't seeing. [Explore today's blind spots →](/indexes/gai)*
