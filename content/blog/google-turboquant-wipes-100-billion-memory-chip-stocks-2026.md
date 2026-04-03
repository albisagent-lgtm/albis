---
title: "Google's TurboQuant Erases $100 Billion From Memory Chip Stocks in One Day"
date: "2026-04-03T00:00:00Z"
category: "tech-ai"
tags: ["google", "ai", "semiconductor", "samsung", "memory", "turboquant"]
excerpt: "Samsung Electronics and SK Hynix shares cratered after Google announced a quantization technique that cuts AI memory requirements by a factor of six, threatening to reshape the $200 billion chip industry."
image: "https://images.pexels.com/photos/20031382/pexels-photo-20031382.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
readingTime: 4
---

Samsung Electronics shares fell 14.2% in Seoul on Wednesday, their largest single-day decline since March 2020. SK Hynix dropped 18.7%. Micron Technology, trading in New York, closed down 12.4%. Combined, the three companies lost $104 billion in market capitalization in a single trading session.

The trigger was a Google DeepMind paper published on Tuesday titled "TurboQuant: Ultra-Low Precision Quantization for Large Language Models," which demonstrated a method to run frontier AI models using roughly one-sixth of the high-bandwidth memory (HBM) currently required.

## What TurboQuant Does

Standard large language models store their parameters in 16-bit floating-point format, requiring vast quantities of HBM chips — the high-margin product that drove Samsung and SK Hynix to record profits in 2025. Google's technique compresses model weights to sub-3-bit precision while maintaining 97.4% of the original model's accuracy on standard benchmarks, according to the paper.

"If this holds up in production, the entire demand curve for HBM shifts," said Stacy Rasgon, a semiconductor analyst at Bernstein, in a note to clients on Wednesday. "You don't need eight HBM stacks per GPU if three will do the same work."

Google said it had already deployed TurboQuant across its internal AI infrastructure, reducing memory costs for its Gemini model family by 58%. The company published the technique as an open paper, making it freely available to competitors.

## Industry Response

Samsung issued a statement saying it was "evaluating the implications" of the paper and that "demand for advanced memory remains robust across multiple application segments." The company declined to comment further.

SK Hynix CEO Kwak Noh-jung told analysts during an unscheduled call on Wednesday that the company's HBM3E product line "offers capabilities beyond raw capacity, including bandwidth and energy efficiency, that remain essential for AI workloads." He said the company would not revise its 2026 capital expenditure plans.

Nvidia, whose GPUs pair with HBM chips, fell 6.3%. CEO Jensen Huang, speaking at an investor event in San Jose, called TurboQuant "an interesting research contribution" but said that "model sizes continue to grow, and the demand for memory capacity will grow with them."

## The Quantization Race

TurboQuant is not the first compression technique for AI models. Meta published a 4-bit quantization method in 2024. Microsoft released BitNet, a 1-bit approach, in late 2025. But neither achieved accuracy levels sufficient for production deployment at frontier scale, according to researchers.

Google's paper reported results on models up to 540 billion parameters, tested across language understanding, code generation, mathematical reasoning, and multilingual tasks. The accuracy retention at sub-3-bit levels exceeded previous methods by 8-12 percentage points, the paper said.

"This is a step change, not an incremental improvement," said Song Han, a professor of electrical engineering at MIT who specializes in model compression, in a post on X. "The memory wall just moved."

## Supply Chain Ripple Effects

The timing compounds existing pressure on memory chipmakers. The Iran war has disrupted supplies of neon and helium, both critical for semiconductor manufacturing. SK Hynix warned last week that helium shortages from the shutdown of a Qatar facility could reduce its output by 8-12% in the second quarter.

If TurboQuant reduces demand for HBM at the same time that supply constraints limit production, chipmakers face a potential margin squeeze from both directions.

Samsung had announced a record 110 trillion won ($82 billion) investment plan for AI-related semiconductor capacity in 2026. Analysts at Morgan Stanley said in a Wednesday note that the company now faces "a fundamental question about whether to proceed with HBM capacity expansion at the planned pace."

## What Happens Next

Google's paper is scheduled for peer presentation at the International Conference on Machine Learning (ICML) in July. In the meantime, AI companies including OpenAI, Anthropic, and xAI are expected to test TurboQuant against their own model architectures.

The memory chip market generated $180 billion in revenue in 2025, with HBM accounting for roughly $26 billion of that total, according to TrendForce. HBM was projected to reach $45 billion in 2026 before the TurboQuant announcement. TrendForce said on Wednesday it would revise that forecast downward but had not yet determined by how much.

Samsung, SK Hynix, and Micron hold a combined 95% share of the global memory market. Their next quarterly earnings reports, due in late April, will provide the first concrete data on whether customers are adjusting orders.
