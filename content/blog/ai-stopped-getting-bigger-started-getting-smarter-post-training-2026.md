---
title: "AI Stopped Getting Bigger. Started Getting Smarter."
description: "The race to build enormous models just ended. Post-training lets smaller AI beat giants at a fraction of the cost. Here's what changed."
date: "2026-03-06"
image: "https://images.pexels.com/photos/5181148/pexels-photo-5181148.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
authors: ["harry-wenham"]
tags: ["AI", "post-training", "DeepSeek", "machine learning", "RLHF", "DPO", "open source"]
topics: ["ai-intelligence"]
faqs: [
  {
    q: "What's the difference between pre-training and post-training?",
    a: "Pre-training builds a general model by feeding it massive amounts of text (think: college degree). Post-training refines that model for specific tasks using targeted feedback (think: job training). Pre-training costs hundreds of millions. Post-training costs less than 1%."
  },
  {
    q: "How can a smaller model beat a larger one?",
    a: "Smarter post-training techniques. Anthropic used a bigger model to generate training data for a smaller one—Claude 3.5 Sonnet now outperforms the larger Claude 3.5 Opus that trained it. Size matters less when your training process is better."
  },
  {
    q: "Why does this matter for regular users?",
    a: "Two reasons: faster, cheaper AI apps (smaller models run on phones, not server farms), and open-source models can now compete with proprietary giants. DeepSeek matches GPT-4 performance at a fraction of the cost. More competition, better tools."
  }
]
---

OpenAI spent an estimated $100 million training GPT-4. Pre-training costs kept climbing. Bigger models, more compute, more money.

That race just ended.

Post-training—the process of refining a general model into a useful one—costs less than 1% of pre-training. A well-tuned smaller model can now beat a poorly-tuned giant. The entire AI industry is pivoting.

Here's what happened, why it matters, and what's next.

## Pre-Training vs Post-Training: The Difference That Changes Everything

Pre-training is like sending a model to college. You feed it trillions of words—Wikipedia, books, websites, Reddit threads—until it learns patterns in language. It knows grammar, facts, how sentences work. But it doesn't know how to be useful yet.

Post-training is job training. You teach the model to follow instructions, answer questions, avoid harmful outputs. This happens through techniques like reinforcement learning from human feedback (RLHF), direct preference optimization (DPO), and supervised fine-tuning.

The cost gap is massive. Training a frontier model costs $50-500 million. Post-training the same model? Under $500,000. Sometimes way under.

That changes who gets to play.

## DeepSeek Broke the Budget

DeepSeek, a Chinese AI lab, released models matching GPT-4. Cost? A fraction of OpenAI's spend. The trick: better post-training on smaller base models.

Their approach: start with a capable but not massive pre-trained model, then dump resources into post-training — reinforcement learning that teaches reasoning, instruction-following, and mistake avoidance.

Result: an open-source model rivaling closed-source giants. Download it, modify it, run it locally. No API fees. No data leaving your machine.

The implications hit fast. If smaller models compete through smarter training:
- Open-source catches up to proprietary
- More people can build AI tools
- Inference gets cheaper (smaller models run faster)
- On-device AI becomes realistic

Apple's betting on this with iPhone AI. Local models, post-trained for specific tasks, running on your phone. No cloud dependency.

## The Three Scaling Frontiers

Jensen Huang (NVIDIA CEO) laid it out clearly: AI scales in three dimensions now, not one.

**Pre-training:** Building the foundation. Still important, but no longer the only game. Returns are diminishing.

**Post-training:** Refining the model. This is where the action moved. RLHF, DPO, and reinforcement learning unlock massive gains without retraining from scratch.

**Test-time compute:** Letting the model "think" longer before answering. OpenAI's o1 does this — more compute during inference to reason step-by-step.

The shift matters because post-training is accessible. You don't need a billion-dollar data center. Startups, researchers, even hobbyists can do it.

AgileRL just raised $7.5 million to speed up reinforcement learning for post-training. Their pitch: make RL 10x faster, so anyone can customize models cheaply.

## How Smaller Models Beat Bigger Ones

Anthropic pulled off something wild with Claude 3.5. They trained a massive version (Opus) first, then used it to generate high-quality synthetic training data. That data trained a smaller model (Sonnet).

Sonnet now outperforms Opus on many tasks. Same company, smaller model, better results. The synthetic data was cleaner, more diverse, better aligned with what users actually need.

Google's Gemini Flash 8B beats models with 4x the parameters. Same principle. Better post-training makes up for smaller size.

This flips the old scaling law on its head. For years, the rule was "bigger is better." Now it's "better training beats bigger size."

## RLHF and DPO: The Tools That Changed the Game

Two techniques dominate post-training now:

**RLHF (Reinforcement Learning from Human Feedback):** Train a reward model on human preferences (thumbs-up/thumbs-down on AI outputs). Then use reinforcement learning to adjust the AI toward higher-reward responses. Complex, expensive, but powerful.

**DPO (Direct Preference Optimization):** Skip the reward model entirely. Directly optimize the AI to prefer human-chosen responses over rejected ones. Simpler, cheaper, almost as effective.

DPO unlocked post-training for smaller teams. You don't need RL infrastructure anymore—just a dataset of preference pairs (this answer good, that answer bad).

That's why open-source models caught up so fast. The barrier to competitive post-training collapsed.

## What Happens Next

Three paths forward:

**Path 1: Pre-training still scales.** New techniques, better data curation, smarter architectures. Companies keep building bigger base models. Post-training refines them.

**Path 2: Post-training becomes the bottleneck.** Base models plateau. The real competition shifts to who has the best post-training techniques, the cleanest data, the smartest reinforcement learning setups.

**Path 3: Test-time compute takes over.** Models stop getting better during training. Instead, they get better by "thinking" longer during inference. Reasoning becomes the new frontier.

Most likely? All three. Pre-training improves slowly, post-training improves fast, test-time compute unlocks reasoning tasks.

But the balance shifted. Post-training matters more than it used to. That means smaller teams can compete. Open-source can keep pace. Local AI becomes viable.

## The Part Nobody Wants to Say

Post-training is easier to govern than pre-training. You can track a $100 million training run. You can't track a million $500 fine-tuning jobs.

If AI safety depends on controlling who builds capable models, post-training makes that harder. Anyone with a base model and a GPU cluster can fine-tune toward dangerous capabilities.

That doesn't mean post-training is bad. It means the old control points — huge compute clusters, restricted datasets — don't work anymore.

The genie's out. Open-source base models exist. Post-training techniques are public. The question isn't "can we stop this?" It's "how do we make sure it goes well?"

---

AI stopped racing toward bigger. Started racing toward smarter. Post-training costs a fraction of pre-training. Smaller models beat giants. Open-source competes with proprietary.

The shift happened fast. The implications run deep. The next year of AI won't look like the last one.