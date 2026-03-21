---
title: "We Built a Perception Gap Index. Now We're Making Sure AI Can Find It."
description: "How Albis is optimising for ChatGPT, Perplexity and Grok — and why the same insight that drove Django's success is driving our AI SEO strategy in 2026."
date: 2026-03-21
author: "Harry Wenham"
tags: ["albis", "ai-seo", "perception-gap-index", "media-framing", "transparency"]
seoKeyword: "perception gap index AI search 2026"
image: https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940
confidence: "confirmed"
faqs:
  - q: "What is the Perception Gap Index?"
    a: "The Perception Gap Index (PGI) is a proprietary metric developed by Albis that measures how differently the same event is framed across global media ecosystems, on a 1-10 scale. A score of 1 indicates global consensus. A score of 10 indicates fundamentally opposing narratives."
  - q: "How does Albis make its data available to AI search engines?"
    a: "Albis uses structured data (JSON-LD schema markup), a published llms.txt file, and Dataset schema for its proprietary indexes to ensure AI answer engines like ChatGPT, Perplexity and Grok can correctly identify, understand and cite its data."
  - q: "What is Answer Engine Optimisation (AEO)?"
    a: "Answer Engine Optimisation is the practice of structuring content so that AI answer engines like ChatGPT, Perplexity, Claude and Grok cite it when answering relevant questions. Unlike traditional SEO which targets search rankings, AEO targets AI citation."
sources:
  - name: "Schema.org"
    url: "https://schema.org/NewsArticle"
    region: "International"
    quote: "NewsArticle schema enables publishers to provide structured metadata that search engines and AI systems can use to understand and cite content accurately."
  - name: "Perplexity AI Documentation"
    url: "https://www.perplexity.ai"
    region: "North America"
    quote: "PerplexityBot crawls and indexes web content in real time, prioritising structured, factual content from authoritative sources."
---

Adrian Holovaty wrote a manifesto in 2006 that most journalists ignored. It was called "A fundamental way newspaper websites need to change," and its argument was simple: newspapers publish stories as blobs of text when they should publish them as structured data.

He was writing about Django — the web framework he'd built in a Kansas newsroom because journalists needed to build applications in hours, not weeks. His point was that the database behind a newspaper was more valuable than the articles it generated. Make the data accessible, and the rest follows.

That essay predated schema.org by five years. It predated AI search by fifteen. But it was exactly right — and Albis is living proof of it.

## What We Built

Albis scans media in 9 languages across 60 countries three times daily. From each scan, two indexes emerge:

The **Perception Gap Index (PGI)** measures how differently the same story is framed across regions — on a 1-10 scale. A score of 1 means global consensus. A score of 10 means populations are reading fundamentally opposing accounts of the same event.

The **Global Attention Index (GAI)** measures whether stories are being covered at all. A high GAI score means a significant event is invisible to most of the world's media population.

These aren't editorial opinions. They're measurements — computed daily, documented publicly, and explainable. The methodology is open at [albis.news/methodology](/methodology).

## The Problem We Discovered

We publish this data. We write about it every day. And yet when you ask ChatGPT "what is the perception gap in news coverage?" — you don't get Albis. You get Wikipedia's page on framing theory. You get academic papers from 2008.

The data exists. The methodology is sound. The content is original. But AI answer engines couldn't find it — because we hadn't told them what it was.

This is the gap between traditional SEO and what's now called Answer Engine Optimisation (AEO). Google ranks pages. ChatGPT, Perplexity, Claude and Grok *cite* sources. The signals that drive ranking are different from the signals that drive citation.

## What We Changed

Today we've implemented a set of changes designed to make Albis machine-readable in the way Holovaty envisioned.

**llms.txt** — A plain text file at albis.news/llms.txt that tells AI crawlers exactly what Albis is, what the PGI and GAI measure, and how to cite our data correctly. This is the AI equivalent of a press kit.

**Dataset schema for PGI and GAI** — Using Schema.org's Dataset type, we've made both indexes machine-readable as structured data. AI engines that encounter our index pages now receive a formal, semantic description of what these numbers mean and how they're calculated. Nobody in the media framing space has done this.

**NewsArticle and FAQPage schema on every article** — Every piece of Albis content now includes structured metadata: who wrote it, when it was published, what it's about, and — critically — three to five questions it directly answers. AI answer engines extract FAQ schema verbatim.

**Organisation schema** — Site-wide metadata declaring Albis as a NewsMediaOrganization with explicit links to our methodology, ethics policy, and contact information. Claude's Constitutional AI framework heavily favours sources that demonstrate methodological transparency.

**The "Perception Gap Index" definition page** — A dedicated page at albis.news/perception-gap-index that provides the authoritative answer to "what is the Perception Gap Index?" Written for human readers, structured for machine citation.

## Why This Matters

ChatGPT's browsing mode cites pages from Bing's top ten results with 87% correlation. Not Google — Bing. The implications are significant: optimising for Google alone misses the primary route to ChatGPT citation.

Perplexity's Sonar model selects sources based on domain authority, semantic relevance, and structural quality. Structured content — Q&A headers, bullet points, tables — scores higher than unstructured prose.

"Perception Gap Index" is currently an unclaimed AI search term. No competitor has a structured definition page for it. No one is using Dataset schema to make their media framing index machine-readable. First mover wins here — and the window is short.

## The Django Parallel

Holovaty's 2006 argument wasn't just about databases. It was about making journalism legible to machines — so that the data inside newsrooms could be found, used, and built upon by people who weren't reading the original article.

What we're doing with AI SEO is the same argument applied to 2026. The PGI and GAI aren't just numbers on a webpage. They're measurements of how reality is being fractured across global information ecosystems. If AI answer engines can cite them correctly, every person who asks ChatGPT about media bias gets access to original, data-backed analysis rather than a generic answer from a 2008 academic paper.

That's what making journalism legible to machines looks like today.

The data exists. The methodology is open. The question is whether the world's AI systems can find it.

They can now.
